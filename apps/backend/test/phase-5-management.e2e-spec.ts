import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/database/prisma.service';
import { cleanDatabase } from './database-test-utils';
import { createE2eApp } from './create-e2e-app';

describe('Phase 5 management APIs (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let sequence = 0;
  let projectKey: string;
  let flagKey: string;
  let requestId: string;

  const actor = 'admin@example.local';

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    sequence += 1;
    projectKey = `e2e-phase5-${Date.now()}-${sequence}`;
    flagKey = `flag-${sequence}`;
    requestId = `req_phase5_e2e_${sequence}`;

    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  it('creates a project with default environment and audit log', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/projects')
      .set('X-Actor', actor)
      .set('X-Request-Id', requestId)
      .send({
        key: projectKey,
        name: 'Demo Project',
        description: 'E2E project',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      key: projectKey,
      name: 'Demo Project',
      description: 'E2E project',
    });

    const environment = await prisma.environment.findFirst({
      where: {
        project: {
          key: projectKey,
        },
        key: 'production',
        isDefault: true,
      },
    });

    expect(environment).toBeTruthy();

    const audit = await prisma.auditLogEntry.findFirst({
      where: {
        projectKey,
        action: 'PROJECT_CREATED',
        actor,
        requestId,
      },
    });

    expect(audit).toBeTruthy();
    expect(audit?.before).toBeNull();
    expect(audit?.after).toBeTruthy();
  });

  it('rejects project creation without X-Actor', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/projects')
      .send({
        key: projectKey,
        name: 'Demo Project',
      })
      .expect(400);

    expect(response.body).toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  it('returns conflict for duplicate project key', async () => {
    await request(app.getHttpServer())
      .post('/v1/projects')
      .set('X-Actor', actor)
      .send({
        key: projectKey,
        name: 'Demo Project',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/v1/projects')
      .set('X-Actor', actor)
      .send({
        key: projectKey,
        name: 'Duplicate Demo Project',
      })
      .expect(409);

    expect(response.body).toMatchObject({
      code: 'CONFLICT',
    });
  });

  it('creates, updates, archives, and restores a feature flag with audit logs', async () => {
    await createProject(app, actor, projectKey);

    const created = await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/flags`)
      .set('X-Actor', actor)
      .send({
        key: flagKey,
        name: 'New Checkout',
        description: 'Checkout rollout',
      })
      .expect(201);

    expect(created.body).toMatchObject({
      projectKey,
      key: flagKey,
      lifecycleStatus: 'ACTIVE',
      status: 'DISABLED',
      servingMode: 'TARGETED',
      killSwitch: false,
      environmentKey: 'production',
    });

    const updated = await request(app.getHttpServer())
      .patch(`/v1/projects/${projectKey}/flags/${flagKey}`)
      .set('X-Actor', actor)
      .send({
        status: 'ENABLED',
        servingMode: 'GLOBAL_ON',
        killSwitch: false,
      })
      .expect(200);

    expect(updated.body).toMatchObject({
      status: 'ENABLED',
      servingMode: 'GLOBAL_ON',
    });

    await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/flags/${flagKey}/archive`)
      .set('X-Actor', actor)
      .expect(200)
      .expect(({ body }) => {
        expect(body.lifecycleStatus).toBe('ARCHIVED');
      });

    await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/flags/${flagKey}/restore`)
      .set('X-Actor', actor)
      .expect(200)
      .expect(({ body }) => {
        expect(body.lifecycleStatus).toBe('ACTIVE');
      });

    const auditCount = await prisma.auditLogEntry.count({
      where: {
        projectKey,
        targetKey: flagKey,
        targetType: 'FEATURE_FLAG',
      },
    });

    expect(auditCount).toBeGreaterThanOrEqual(4);
  });

  it('replaces rules and changes evaluation result', async () => {
    await createProject(app, actor, projectKey);
    await createFlag(app, actor, projectKey, flagKey);

    await request(app.getHttpServer())
      .put(`/v1/projects/${projectKey}/flags/${flagKey}/rules`)
      .set('X-Actor', actor)
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
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({
          type: 'ROLE_TARGETING',
          priority: 10,
          enabled: true,
        });
      });

    await request(app.getHttpServer())
      .patch(`/v1/projects/${projectKey}/flags/${flagKey}`)
      .set('X-Actor', actor)
      .send({
        status: 'ENABLED',
        servingMode: 'TARGETED',
      })
      .expect(200);

    const evaluation = await request(app.getHttpServer())
      .post('/v1/evaluate')
      .send({
        projectKey,
        flagKey,
        context: {
          targetingKey: 'demo-user-beta',
          userId: 'demo-user-beta',
          roles: ['beta-tester'],
        },
      })
      .expect(200);

    expect(evaluation.body).toMatchObject({
      projectKey,
      flagKey,
      enabled: true,
      reason: 'ROLE_MATCH',
    });

    const audit = await prisma.auditLogEntry.findFirst({
      where: {
        projectKey,
        targetKey: flagKey,
        action: 'FLAG_RULES_REPLACED',
      },
    });

    expect(audit).toBeTruthy();
    expect(audit?.before).toBeTruthy();
    expect(audit?.after).toBeTruthy();
  });

  it('rejects duplicate rule priorities', async () => {
    await createProject(app, actor, projectKey);
    await createFlag(app, actor, projectKey, flagKey);

    const response = await request(app.getHttpServer())
      .put(`/v1/projects/${projectKey}/flags/${flagKey}/rules`)
      .set('X-Actor', actor)
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
          {
            type: 'PERCENTAGE_ROLLOUT',
            priority: 10,
            enabled: true,
            parameters: {
              percentage: 25,
            },
          },
        ],
      })
      .expect(400);

    expect(response.body).toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  it('creates normalized sample users', async () => {
    await createProject(app, actor, projectKey);

    const response = await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/sample-users`)
      .set('X-Actor', actor)
      .send({
        displayName: '  Beta User  ',
        targetingKey: '  demo-user-beta  ',
        userId: '  demo-user-beta  ',
        roles: ['admin', ' admin ', ''],
        attributes: {
          plan: 'pro',
        },
      })
      .expect(201);

    expect(response.body).toMatchObject({
      displayName: 'Beta User',
      targetingKey: 'demo-user-beta',
      userId: 'demo-user-beta',
      roles: ['admin'],
    });

    const audit = await prisma.auditLogEntry.findFirst({
      where: {
        projectKey,
        targetType: 'SAMPLE_USER',
        targetKey: 'demo-user-beta',
        action: 'SAMPLE_USER_CREATED',
      },
    });

    expect(audit).toBeTruthy();
  });

  it('queries audit logs with filters and pagination', async () => {
    await createProject(app, actor, projectKey);
    await createFlag(app, actor, projectKey, flagKey);

    const response = await request(app.getHttpServer())
      .get(`/v1/projects/${projectKey}/audit-logs`)
      .query({
        targetType: 'FEATURE_FLAG',
        targetKey: flagKey,
        actor,
        limit: 10,
        offset: 0,
      })
      .expect(200);

    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('page');
    expect(response.body.page).toMatchObject({
      limit: 10,
      offset: 0,
    });

    expect(response.body.items.length).toBeGreaterThanOrEqual(1);
    expect(response.body.items[0]).toMatchObject({
      projectKey,
      targetType: 'FEATURE_FLAG',
      targetKey: flagKey,
      actor,
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
      name: 'Demo Project',
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
      name: 'New Checkout',
    })
    .expect(201);
}
