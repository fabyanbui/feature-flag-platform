import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/database/prisma.service';
import { cleanDatabase } from './database-test-utils';
import { createE2eApp } from './create-e2e-app';

describe('Phase 12 group kill switch (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let sequence = 0;
  let projectKey: string;
  let firstFlagKey: string;
  let secondFlagKey: string;
  let groupKey: string;

  const actor = 'demo-admin';

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    sequence += 1;
    const suffix = `${Date.now()}-${sequence}`;
    projectKey = `e2e-phase12-${suffix}`;
    firstFlagKey = `checkout-ui-${sequence}`;
    secondFlagKey = `checkout-api-${sequence}`;
    groupKey = `checkout-${sequence}`;

    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  it('disables assigned flags, restores normal evaluation, and audits real mutations only', async () => {
    await createProject(app, actor, projectKey);
    await createGlobalFlag(app, actor, projectKey, firstFlagKey);
    await createGlobalFlag(app, actor, projectKey, secondFlagKey);

    const createGroupResponse = await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/groups`)
      .set('X-Actor', actor)
      .set('X-Request-Id', 'req-phase12-group-create')
      .send({
        key: groupKey,
        name: 'Checkout flags',
      })
      .expect(201);

    expect(createGroupResponse.body).toMatchObject({
      projectKey,
      key: groupKey,
      name: 'Checkout flags',
      environmentKey: 'production',
      killSwitch: false,
      assignedFlagCount: 0,
    });

    await assignFlag(app, actor, projectKey, firstFlagKey, groupKey);
    await assignFlag(app, actor, projectKey, secondFlagKey, groupKey);

    const groupListResponse = await request(app.getHttpServer())
      .get(`/v1/projects/${projectKey}/groups`)
      .query({
        environmentKey: 'production',
        limit: 20,
        offset: 0,
      })
      .expect(200);

    expect(groupListResponse.body).toMatchObject({
      items: [
        expect.objectContaining({
          projectKey,
          key: groupKey,
          killSwitch: false,
          assignedFlagCount: 2,
        }),
      ],
      page: {
        limit: 20,
        offset: 0,
        total: 1,
        hasNext: false,
      },
    });

    await expectEvaluation(app, projectKey, firstFlagKey, {
      enabled: true,
      reason: 'GLOBAL_ON',
    });
    await expectEvaluation(app, projectKey, secondFlagKey, {
      enabled: true,
      reason: 'GLOBAL_ON',
    });

    const activateResponse = await updateGroupSwitch(
      app,
      actor,
      projectKey,
      groupKey,
      true,
      'req-phase12-activate',
    );

    expect(activateResponse.body).toMatchObject({
      projectKey,
      key: groupKey,
      environmentKey: 'production',
      killSwitch: true,
      assignedFlagCount: 2,
    });

    await expectEvaluation(app, projectKey, firstFlagKey, {
      enabled: false,
      reason: 'GROUP_KILL_SWITCH',
    });
    await expectEvaluation(app, projectKey, secondFlagKey, {
      enabled: false,
      reason: 'GROUP_KILL_SWITCH',
    });

    await updateGroupSwitch(
      app,
      actor,
      projectKey,
      groupKey,
      true,
      'req-phase12-idempotent-activate',
    );

    let switchAuditEntries = await listAuditEntries(
      app,
      projectKey,
      'FLAG_GROUP_KILL_SWITCH_UPDATED',
    );

    expect(switchAuditEntries).toHaveLength(1);
    expect(switchAuditEntries[0]).toMatchObject({
      targetType: 'FLAG_GROUP',
      targetKey: groupKey,
      action: 'FLAG_GROUP_KILL_SWITCH_UPDATED',
      actor,
      requestId: 'req-phase12-activate',
      before: {
        groupKey,
        environmentKey: 'production',
        killSwitch: false,
      },
      after: {
        groupKey,
        environmentKey: 'production',
        killSwitch: true,
      },
      metadata: {
        source: 'api',
        affectedFlagCount: 2,
      },
    });

    await updateGroupSwitch(
      app,
      actor,
      projectKey,
      groupKey,
      false,
      'req-phase12-deactivate',
    );

    await expectEvaluation(app, projectKey, firstFlagKey, {
      enabled: true,
      reason: 'GLOBAL_ON',
    });
    await expectEvaluation(app, projectKey, secondFlagKey, {
      enabled: true,
      reason: 'GLOBAL_ON',
    });

    await request(app.getHttpServer())
      .delete(`/v1/projects/${projectKey}/flags/${secondFlagKey}/group`)
      .set('X-Actor', actor)
      .set('X-Request-Id', 'req-phase12-unassign')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          projectKey,
          key: secondFlagKey,
          group: null,
        });
      });

    await updateGroupSwitch(
      app,
      actor,
      projectKey,
      groupKey,
      true,
      'req-phase12-reactivate',
    );

    await expectEvaluation(app, projectKey, firstFlagKey, {
      enabled: false,
      reason: 'GROUP_KILL_SWITCH',
    });
    await expectEvaluation(app, projectKey, secondFlagKey, {
      enabled: true,
      reason: 'GLOBAL_ON',
    });

    const assignmentEntries = await listAuditEntries(
      app,
      projectKey,
      'FEATURE_FLAG_GROUP_ASSIGNED',
    );
    const unassignmentEntries = await listAuditEntries(
      app,
      projectKey,
      'FEATURE_FLAG_GROUP_UNASSIGNED',
    );

    expect(assignmentEntries).toHaveLength(2);
    expect(
      assignmentEntries.every(
        (entry: { targetType: string }) => entry.targetType === 'FEATURE_FLAG',
      ),
    ).toBe(true);
    expect(unassignmentEntries).toEqual([
      expect.objectContaining({
        targetType: 'FEATURE_FLAG',
        targetKey: secondFlagKey,
        before: {
          flagKey: secondFlagKey,
          groupKey,
        },
        after: {
          flagKey: secondFlagKey,
          groupKey: null,
        },
      }),
    ]);

    switchAuditEntries = await listAuditEntries(
      app,
      projectKey,
      'FLAG_GROUP_KILL_SWITCH_UPDATED',
    );
    expect(switchAuditEntries).toHaveLength(3);
  });

  it('validates duplicate keys, project scope, and request bodies', async () => {
    await createProject(app, actor, projectKey);
    await createGlobalFlag(app, actor, projectKey, firstFlagKey);

    const authenticatedResponse = await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/groups`)
      .send({
        key: groupKey,
        name: 'Checkout flags',
      })
      .expect(201);

    expect(authenticatedResponse.body).toMatchObject({
      key: groupKey,
    });

    const duplicateResponse = await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/groups`)
      .set('X-Actor', actor)
      .send({
        key: groupKey,
        name: 'Duplicate group',
      })
      .expect(409);

    expect(duplicateResponse.body).toMatchObject({
      code: 'CONFLICT',
    });

    const invalidConfigResponse = await request(app.getHttpServer())
      .put(`/v1/projects/${projectKey}/groups/${groupKey}/config`)
      .set('X-Actor', actor)
      .send({
        environmentKey: 'production',
        killSwitch: 'yes',
      })
      .expect(400);

    expect(invalidConfigResponse.body).toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    const missingGroupResponse = await request(app.getHttpServer())
      .put(`/v1/projects/${projectKey}/flags/${firstFlagKey}/group`)
      .set('X-Actor', actor)
      .send({
        groupKey: 'missing-group',
      })
      .expect(404);

    expect(missingGroupResponse.body).toMatchObject({
      code: 'NOT_FOUND',
    });

    const secondProjectKey = `other-${projectKey}`;
    await createProject(app, actor, secondProjectKey);

    const crossProjectResponse = await request(app.getHttpServer())
      .put(`/v1/projects/${secondProjectKey}/flags/missing-flag/group`)
      .set('X-Actor', actor)
      .send({
        groupKey,
      })
      .expect(404);

    expect(crossProjectResponse.body).toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('initializes safe inactive group configs for every existing environment', async () => {
    await createProject(app, actor, projectKey);
    await createGlobalFlag(app, actor, projectKey, firstFlagKey);

    const project = await prisma.project.findUniqueOrThrow({
      where: { key: projectKey },
    });
    const flag = await prisma.featureFlag.findUniqueOrThrow({
      where: {
        projectId_key: {
          projectId: project.id,
          key: firstFlagKey,
        },
      },
    });
    const staging = await prisma.environment.create({
      data: {
        projectId: project.id,
        key: 'staging',
        name: 'Staging',
        isDefault: false,
        sortOrder: 1,
      },
    });

    await prisma.flagEnvironmentConfig.create({
      data: {
        projectId: project.id,
        flagId: flag.id,
        environmentId: staging.id,
        status: 'ENABLED',
        servingMode: 'GLOBAL_ON',
        killSwitch: false,
      },
    });

    await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/groups`)
      .set('X-Actor', actor)
      .set('X-Request-Id', 'req-phase12-multi-environment-create')
      .send({
        key: groupKey,
        name: 'Checkout flags',
      })
      .expect(201);

    const group = await prisma.flagGroup.findUniqueOrThrow({
      where: {
        projectId_key: {
          projectId: project.id,
          key: groupKey,
        },
      },
      include: {
        configs: {
          include: {
            environment: true,
          },
          orderBy: {
            environment: {
              sortOrder: 'asc',
            },
          },
        },
      },
    });

    expect(group.configs).toHaveLength(2);
    expect(
      group.configs.map((config) => ({
        environmentKey: config.environment.key,
        killSwitch: config.killSwitch,
      })),
    ).toEqual([
      { environmentKey: 'production', killSwitch: false },
      { environmentKey: 'staging', killSwitch: false },
    ]);

    await assignFlag(app, actor, projectKey, firstFlagKey, groupKey);
    await expectEvaluation(app, projectKey, firstFlagKey, {
      enabled: true,
      reason: 'GLOBAL_ON',
      environmentKey: 'staging',
    });

    await updateGroupSwitch(
      app,
      actor,
      projectKey,
      groupKey,
      true,
      'req-phase12-staging-activate',
      'staging',
    );

    await expectEvaluation(app, projectKey, firstFlagKey, {
      enabled: false,
      reason: 'GROUP_KILL_SWITCH',
      environmentKey: 'staging',
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
      name: 'Phase 12 Project',
    })
    .expect(201);
}

async function createGlobalFlag(
  app: INestApplication<App>,
  actor: string,
  projectKey: string,
  flagKey: string,
) {
  await request(app.getHttpServer())
    .post(`/v1/projects/${projectKey}/flags`)
    .set('X-Actor', actor)
    .send({
      key: flagKey,
      name: flagKey,
    })
    .expect(201);

  return request(app.getHttpServer())
    .patch(`/v1/projects/${projectKey}/flags/${flagKey}`)
    .set('X-Actor', actor)
    .send({
      status: 'ENABLED',
      servingMode: 'GLOBAL_ON',
      killSwitch: false,
    })
    .expect(200);
}

async function assignFlag(
  app: INestApplication<App>,
  actor: string,
  projectKey: string,
  flagKey: string,
  groupKey: string,
) {
  return request(app.getHttpServer())
    .put(`/v1/projects/${projectKey}/flags/${flagKey}/group`)
    .set('X-Actor', actor)
    .send({
      groupKey,
    })
    .expect(200)
    .expect(({ body }) => {
      expect(body).toMatchObject({
        projectKey,
        key: flagKey,
        group: {
          key: groupKey,
          name: 'Checkout flags',
          killSwitch: false,
        },
      });
    });
}

async function updateGroupSwitch(
  app: INestApplication<App>,
  actor: string,
  projectKey: string,
  groupKey: string,
  killSwitch: boolean,
  requestId: string,
  environmentKey = 'production',
) {
  return request(app.getHttpServer())
    .put(`/v1/projects/${projectKey}/groups/${groupKey}/config`)
    .set('X-Actor', actor)
    .set('X-Request-Id', requestId)
    .send({
      environmentKey,
      killSwitch,
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
    environmentKey?: string;
  },
) {
  return request(app.getHttpServer())
    .post('/v1/evaluate')
    .send({
      projectKey,
      flagKey,
      environmentKey: expected.environmentKey ?? 'production',
      context: {
        targetingKey: `phase12-${flagKey}`,
        userId: `phase12-${flagKey}`,
        roles: ['user'],
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
        matchedRuleId: null,
      });
    });
}

async function listAuditEntries(
  app: INestApplication<App>,
  projectKey: string,
  action: string,
) {
  const response = await request(app.getHttpServer())
    .get(`/v1/projects/${projectKey}/audit-logs`)
    .query({
      action,
      limit: 100,
      offset: 0,
      order: 'desc',
    })
    .expect(200);

  return response.body.items;
}
