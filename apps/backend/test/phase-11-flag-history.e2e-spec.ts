import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/database/prisma.service';
import { cleanDatabase } from './database-test-utils';
import { createE2eApp } from './create-e2e-app';

describe('Phase 11 flag configuration history (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let sequence = 0;
  let projectKey: string;
  let flagKey: string;

  const actor = 'phase11-admin@example.local';

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    sequence += 1;
    projectKey = `e2e-phase11-${Date.now()}-${sequence}`;
    flagKey = `history-flag-${sequence}`;

    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  it('returns flag creation, configuration update, and rule replacement history', async () => {
    await createProject(app, actor, projectKey);

    await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/flags`)
      .set('X-Actor', actor)
      .set('X-Request-Id', 'req-phase11-create')
      .send({
        key: flagKey,
        name: 'History Flag',
        description: 'Phase 11 history test flag',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/flags`)
      .set('X-Actor', actor)
      .set('X-Request-Id', 'req-phase11-other-flag')
      .send({
        key: `other-${sequence}`,
        name: 'Unrelated Flag',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/v1/projects/${projectKey}/flags/${flagKey}`)
      .set('X-Actor', actor)
      .set('X-Request-Id', 'req-phase11-update')
      .send({
        status: 'ENABLED',
        servingMode: 'TARGETED',
        killSwitch: false,
      })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/v1/projects/${projectKey}/flags/${flagKey}/rules`)
      .set('X-Actor', actor)
      .set('X-Request-Id', 'req-phase11-rules')
      .send({
        rules: [
          {
            type: 'ROLE_TARGETING',
            priority: 10,
            enabled: true,
            parameters: {
              roles: ['beta-tester'],
            },
          },
        ],
      })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get(`/v1/projects/${projectKey}/flags/${flagKey}/history`)
      .query({
        limit: 20,
        offset: 0,
        sort: 'createdAt',
        order: 'desc',
      })
      .expect(200);

    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('page');
    expect(response.body.page).toMatchObject({
      limit: 20,
      offset: 0,
      hasNext: false,
    });

    const entries = response.body.items as Array<{
      action: string;
      actor: string;
      targetType: string;
      targetKey: string | null;
      before: unknown;
      after: unknown;
      requestId: string;
      createdAt: string;
    }>;
    const actions = entries.map((entry) => entry.action);

    expect(actions).toEqual(
      expect.arrayContaining([
        'FEATURE_FLAG_CREATED',
        'FEATURE_FLAG_UPDATED',
        'FLAG_RULES_REPLACED',
      ]),
    );
    expect(actions).not.toContain('PROJECT_CREATED');
    expect(
      entries.every(
        (entry) =>
          entry.targetType === 'FEATURE_FLAG' &&
          entry.targetKey === flagKey &&
          entry.actor === actor,
      ),
    ).toBe(true);
    expect(entries.map((entry) => entry.requestId)).toEqual(
      expect.arrayContaining([
        'req-phase11-create',
        'req-phase11-update',
        'req-phase11-rules',
      ]),
    );

    const createdEntry = entries.find(
      (entry) => entry.action === 'FEATURE_FLAG_CREATED',
    );

    expect(createdEntry).toMatchObject({
      before: null,
      requestId: 'req-phase11-create',
    });
    expect(createdEntry?.after).toBeTruthy();

    const updatedEntry = entries.find(
      (entry) => entry.action === 'FEATURE_FLAG_UPDATED',
    );

    expect(updatedEntry?.before).toBeTruthy();
    expect(updatedEntry?.after).toBeTruthy();

    const rulesEntry = entries.find(
      (entry) => entry.action === 'FLAG_RULES_REPLACED',
    );

    expect(rulesEntry).toMatchObject({
      requestId: 'req-phase11-rules',
    });
    expect(rulesEntry?.before).toBeTruthy();
    expect(rulesEntry?.after).toBeTruthy();

    for (let index = 1; index < entries.length; index += 1) {
      const previous = new Date(entries[index - 1].createdAt).getTime();
      const current = new Date(entries[index].createdAt).getTime();

      expect(previous).toBeGreaterThanOrEqual(current);
    }
  });

  it('supports flag-history pagination', async () => {
    await createProject(app, actor, projectKey);
    await createFlag(app, actor, projectKey, flagKey);

    await request(app.getHttpServer())
      .patch(`/v1/projects/${projectKey}/flags/${flagKey}`)
      .set('X-Actor', actor)
      .send({
        status: 'ENABLED',
      })
      .expect(200);

    const firstPage = await request(app.getHttpServer())
      .get(`/v1/projects/${projectKey}/flags/${flagKey}/history`)
      .query({
        limit: 1,
        offset: 0,
      })
      .expect(200);

    expect(firstPage.body.items).toHaveLength(1);
    expect(firstPage.body.page).toMatchObject({
      limit: 1,
      offset: 0,
      hasNext: true,
    });

    const secondPage = await request(app.getHttpServer())
      .get(`/v1/projects/${projectKey}/flags/${flagKey}/history`)
      .query({
        limit: 1,
        offset: 1,
      })
      .expect(200);

    expect(secondPage.body.items).toHaveLength(1);
    expect(secondPage.body.page).toMatchObject({
      limit: 1,
      offset: 1,
      hasNext: false,
    });
    expect(secondPage.body.items[0].id).not.toBe(firstPage.body.items[0].id);
  });

  it('returns NOT_FOUND for missing projects and flags', async () => {
    const missingProjectResponse = await request(app.getHttpServer())
      .get('/v1/projects/missing-project/flags/missing-flag/history')
      .expect(404);

    expect(missingProjectResponse.body).toMatchObject({
      code: 'NOT_FOUND',
    });

    await createProject(app, actor, projectKey);

    const missingFlagResponse = await request(app.getHttpServer())
      .get(`/v1/projects/${projectKey}/flags/missing-flag/history`)
      .expect(404);

    expect(missingFlagResponse.body).toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('validates history pagination and sorting', async () => {
    await createProject(app, actor, projectKey);
    await createFlag(app, actor, projectKey, flagKey);

    const invalidSort = await request(app.getHttpServer())
      .get(`/v1/projects/${projectKey}/flags/${flagKey}/history`)
      .query({
        sort: 'actor',
      })
      .expect(400);

    expect(invalidSort.body).toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    const invalidLimit = await request(app.getHttpServer())
      .get(`/v1/projects/${projectKey}/flags/${flagKey}/history`)
      .query({
        limit: 101,
      })
      .expect(400);

    expect(invalidLimit.body).toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });
});

async function createProject(
  app: INestApplication<App>,
  actor: string,
  projectKey: string,
) {
  return request(app.getHttpServer())
    .post('/v1/projects')
    .set('X-Actor', actor)
    .send({
      key: projectKey,
      name: 'Phase 11 Project',
    })
    .expect(201);
}

async function createFlag(
  app: INestApplication<App>,
  actor: string,
  projectKey: string,
  flagKey: string,
) {
  return request(app.getHttpServer())
    .post(`/v1/projects/${projectKey}/flags`)
    .set('X-Actor', actor)
    .send({
      key: flagKey,
      name: 'History Flag',
    })
    .expect(201);
}
