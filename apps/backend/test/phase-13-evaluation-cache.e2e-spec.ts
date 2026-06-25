import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  EVALUATION_SNAPSHOT_CACHE,
  type EvaluationSnapshotCache,
} from '../src/evaluation/cache/evaluation-snapshot-cache';
import { PrismaService } from '../src/database/prisma.service';
import { cleanDatabase } from './database-test-utils';
import { createE2eApp } from './create-e2e-app';

describe('Phase 13 evaluation snapshot cache (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let snapshotCache: EvaluationSnapshotCache;
  let sequence = 0;
  let projectKey: string;

  const actor = 'demo-admin';

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
    snapshotCache = app.get<EvaluationSnapshotCache>(EVALUATION_SNAPSHOT_CACHE);
  });

  beforeEach(async () => {
    sequence += 1;
    projectKey = `e2e-phase13-${Date.now()}-${sequence}`;

    await snapshotCache.clear();
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await snapshotCache.clear();
    await cleanDatabase(prisma);
    await app.close();
  });

  it('refreshes a warmed snapshot after flag configuration changes', async () => {
    const flagKey = 'cached-global-feature';

    await createProject(app, actor, projectKey);
    await createFlag(app, actor, projectKey, flagKey);
    await updateFlag(app, actor, projectKey, flagKey, {
      status: 'ENABLED',
      servingMode: 'GLOBAL_ON',
      killSwitch: false,
    });

    await expectEvaluation(app, projectKey, flagKey, {
      enabled: true,
      reason: 'GLOBAL_ON',
    });
    await expectEvaluation(app, projectKey, flagKey, {
      enabled: true,
      reason: 'GLOBAL_ON',
    });

    await updateFlag(app, actor, projectKey, flagKey, {
      killSwitch: true,
    });

    await expectEvaluation(app, projectKey, flagKey, {
      enabled: false,
      reason: 'KILL_SWITCH',
    });

    await updateFlag(app, actor, projectKey, flagKey, {
      killSwitch: false,
    });

    await expectEvaluation(app, projectKey, flagKey, {
      enabled: true,
      reason: 'GLOBAL_ON',
    });
  });

  it('refreshes a warmed snapshot after rules are replaced', async () => {
    const flagKey = 'cached-targeted-feature';

    await createProject(app, actor, projectKey);
    await createFlag(app, actor, projectKey, flagKey);
    await updateFlag(app, actor, projectKey, flagKey, {
      status: 'ENABLED',
      servingMode: 'TARGETED',
      killSwitch: false,
    });
    await replaceRoleRule(app, actor, projectKey, flagKey, 'beta-tester');

    await expectEvaluation(app, projectKey, flagKey, {
      enabled: true,
      reason: 'ROLE_MATCH',
      roles: ['beta-tester'],
    });

    await replaceRoleRule(app, actor, projectKey, flagKey, 'internal-user');

    await expectEvaluation(app, projectKey, flagKey, {
      enabled: false,
      reason: 'DEFAULT_OFF',
      roles: ['beta-tester'],
    });
    await expectEvaluation(app, projectKey, flagKey, {
      enabled: true,
      reason: 'ROLE_MATCH',
      roles: ['internal-user'],
    });
  });

  it('refreshes a warmed snapshot after group assignment and unassignment', async () => {
    const flagKey = 'cached-group-feature';
    const groupKey = 'emergency-switches';

    await createProject(app, actor, projectKey);
    await createFlag(app, actor, projectKey, flagKey);
    await updateFlag(app, actor, projectKey, flagKey, {
      status: 'ENABLED',
      servingMode: 'GLOBAL_ON',
      killSwitch: false,
    });

    await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/groups`)
      .set('X-Actor', actor)
      .send({
        key: groupKey,
        name: 'Emergency switches',
      })
      .expect(201);

    await request(app.getHttpServer())
      .put(`/v1/projects/${projectKey}/groups/${groupKey}/config`)
      .set('X-Actor', actor)
      .send({
        environmentKey: 'production',
        killSwitch: true,
      })
      .expect(200);

    await expectEvaluation(app, projectKey, flagKey, {
      enabled: true,
      reason: 'GLOBAL_ON',
    });

    await request(app.getHttpServer())
      .put(`/v1/projects/${projectKey}/flags/${flagKey}/group`)
      .set('X-Actor', actor)
      .send({
        groupKey,
      })
      .expect(200);

    await expectEvaluation(app, projectKey, flagKey, {
      enabled: false,
      reason: 'GROUP_KILL_SWITCH',
    });

    await request(app.getHttpServer())
      .delete(`/v1/projects/${projectKey}/flags/${flagKey}/group`)
      .set('X-Actor', actor)
      .expect(200);

    await expectEvaluation(app, projectKey, flagKey, {
      enabled: true,
      reason: 'GLOBAL_ON',
    });
  });

  it('refreshes a warmed snapshot after archive and restore', async () => {
    const flagKey = 'cached-lifecycle-feature';

    await createProject(app, actor, projectKey);
    await createFlag(app, actor, projectKey, flagKey);
    await updateFlag(app, actor, projectKey, flagKey, {
      status: 'ENABLED',
      servingMode: 'GLOBAL_ON',
      killSwitch: false,
    });

    await expectEvaluation(app, projectKey, flagKey, {
      enabled: true,
      reason: 'GLOBAL_ON',
    });

    await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/flags/${flagKey}/archive`)
      .set('X-Actor', actor)
      .expect(200);

    await expectEvaluation(app, projectKey, flagKey, {
      enabled: false,
      reason: 'FLAG_ARCHIVED',
    });

    await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/flags/${flagKey}/restore`)
      .set('X-Actor', actor)
      .expect(200);

    await expectEvaluation(app, projectKey, flagKey, {
      enabled: true,
      reason: 'GLOBAL_ON',
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
      name: 'Phase 13 Cache Project',
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
      name: 'Phase 13 Feature',
    })
    .expect(201);
}

async function updateFlag(
  app: INestApplication<App>,
  actor: string,
  projectKey: string,
  flagKey: string,
  body: Record<string, unknown>,
) {
  return request(app.getHttpServer())
    .patch(`/v1/projects/${projectKey}/flags/${flagKey}`)
    .set('X-Actor', actor)
    .send(body)
    .expect(200);
}

async function replaceRoleRule(
  app: INestApplication<App>,
  actor: string,
  projectKey: string,
  flagKey: string,
  role: string,
) {
  return request(app.getHttpServer())
    .put(`/v1/projects/${projectKey}/flags/${flagKey}/rules`)
    .set('X-Actor', actor)
    .send({
      rules: [
        {
          type: 'ROLE_TARGETING',
          priority: 10,
          enabled: true,
          parameters: {
            roles: [role],
          },
        },
      ],
    })
    .expect(200);
}

async function expectEvaluation(
  app: INestApplication<App>,
  projectKey: string,
  flagKey: string,
  expected: {
    enabled: boolean;
    reason: string;
    roles?: string[];
  },
) {
  return request(app.getHttpServer())
    .post('/v1/evaluate')
    .send({
      projectKey,
      environmentKey: 'production',
      flagKey,
      context: {
        targetingKey: 'phase13-stable-user',
        userId: 'phase13-user',
        roles: expected.roles ?? ['user'],
      },
    })
    .expect(200)
    .expect(({ body }) => {
      expect(body).toMatchObject({
        projectKey,
        flagKey,
        enabled: expected.enabled,
        variant: expected.enabled ? 'on' : 'off',
        reason: expected.reason,
      });
    });
}
