import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/database/prisma.service';
import {
  EVALUATION_SNAPSHOT_CACHE,
  type EvaluationSnapshotCache,
} from '../src/evaluation/cache/evaluation-snapshot-cache';
import { EvaluationRepository } from '../src/evaluation/evaluation.repository';
import { EvaluationMetricsRepository } from '../src/repositories/evaluation-metrics.repository';
import { cleanDatabase } from './database-test-utils';
import { createE2eApp } from './create-e2e-app';

const actor = 'phase14-admin@example.local';

describe('Phase 14 evaluation statistics routes (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let snapshotCache: EvaluationSnapshotCache;
  let evaluationRepository: EvaluationRepository;
  let metricsRepository: EvaluationMetricsRepository;
  let sequence = 0;
  let projectKey: string;

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
    snapshotCache = app.get<EvaluationSnapshotCache>(EVALUATION_SNAPSHOT_CACHE);
    evaluationRepository = app.get(EvaluationRepository);
    metricsRepository = app.get(EvaluationMetricsRepository);
  });

  beforeEach(async () => {
    sequence += 1;
    projectKey = `e2e-phase14-${Date.now()}-${sequence}`;

    await snapshotCache.clear();
  });

  afterAll(async () => {
    await snapshotCache.clear();
    await cleanDatabase(prisma);
    await app.close();
  });

  it('counts cached and uncached evaluations exactly once', async () => {
    const flagKey = 'cached-statistics-feature';

    await createStatisticsFixture(app, projectKey, flagKey);
    await snapshotCache.clear();

    const repositorySpy = jest.spyOn(evaluationRepository, 'findSnapshot');

    try {
      await evaluate(app, projectKey, flagKey, {
        enabled: true,
        reason: 'GLOBAL_ON',
      });
      await evaluate(app, projectKey, flagKey, {
        enabled: true,
        reason: 'GLOBAL_ON',
      });

      expect(repositorySpy).toHaveBeenCalledTimes(1);

      const stats = await waitForFlagStats(
        app,
        projectKey,
        flagKey,
        'production',
        2,
      );

      expect(stats).toMatchObject({
        projectKey,
        flagKey,
        environmentKey: 'production',
        totalEvaluations: 2,
        enabledCount: 2,
        disabledCount: 0,
        enabledPercentage: 100,
        reasons: [
          {
            reason: 'GLOBAL_ON',
            enabled: true,
            count: 2,
          },
        ],
      });
    } finally {
      repositorySpy.mockRestore();
    }
  });

  it('aggregates enabled and disabled outcomes by reason and hour', async () => {
    const flagKey = 'outcome-statistics-feature';

    await createStatisticsFixture(app, projectKey, flagKey);

    await evaluate(app, projectKey, flagKey, {
      enabled: true,
      reason: 'GLOBAL_ON',
    });
    await evaluate(app, projectKey, flagKey, {
      enabled: true,
      reason: 'GLOBAL_ON',
    });

    await request(app.getHttpServer())
      .patch(`/v1/projects/${projectKey}/flags/${flagKey}`)
      .set('X-Actor', actor)
      .send({
        killSwitch: true,
      })
      .expect(200);

    await evaluate(app, projectKey, flagKey, {
      enabled: false,
      reason: 'KILL_SWITCH',
    });

    const stats = await waitForFlagStats(
      app,
      projectKey,
      flagKey,
      'production',
      3,
    );

    expect(stats).toMatchObject({
      totalEvaluations: 3,
      enabledCount: 2,
      disabledCount: 1,
      enabledPercentage: 66.67,
    });
    expect(stats.reasons).toEqual(
      expect.arrayContaining([
        {
          reason: 'GLOBAL_ON',
          enabled: true,
          count: 2,
        },
        {
          reason: 'KILL_SWITCH',
          enabled: false,
          count: 1,
        },
      ]),
    );
    expect(stats.buckets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          totalEvaluations: 3,
          enabledCount: 2,
          disabledCount: 1,
        }),
      ]),
    );
  });

  it('returns paginated per-flag project statistics', async () => {
    const firstFlagKey = 'project-stats-first';
    const secondFlagKey = 'project-stats-second';

    await createStatisticsFixture(app, projectKey, firstFlagKey);
    await createFlag(app, projectKey, secondFlagKey, 'Second Statistics Flag');
    await updateFlag(app, projectKey, secondFlagKey, {
      status: 'ENABLED',
      servingMode: 'GLOBAL_ON',
      killSwitch: false,
    });

    await evaluate(app, projectKey, firstFlagKey, {
      enabled: true,
      reason: 'GLOBAL_ON',
    });
    await evaluate(app, projectKey, firstFlagKey, {
      enabled: true,
      reason: 'GLOBAL_ON',
    });
    await evaluate(app, projectKey, secondFlagKey, {
      enabled: true,
      reason: 'GLOBAL_ON',
    });

    await waitForFlagStats(app, projectKey, firstFlagKey, 'production', 2);
    await waitForFlagStats(app, projectKey, secondFlagKey, 'production', 1);

    await request(app.getHttpServer())
      .get(`/v1/projects/${projectKey}/stats/flags`)
      .query({
        environmentKey: 'production',
        sort: 'totalEvaluations',
        order: 'desc',
        limit: 1,
        offset: 0,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          items: [
            expect.objectContaining({
              flagKey: firstFlagKey,
              totalEvaluations: 2,
              enabledCount: 2,
              disabledCount: 0,
            }),
          ],
          page: {
            limit: 1,
            offset: 0,
            total: 2,
            hasNext: true,
          },
        });
      });
  });

  it('keeps environment aggregates separate', async () => {
    const flagKey = 'environment-statistics-feature';

    await createStatisticsFixture(app, projectKey, flagKey);
    await createStagingFlagConfig(prisma, projectKey, flagKey);

    await evaluate(app, projectKey, flagKey, {
      enabled: true,
      reason: 'GLOBAL_ON',
    });
    await evaluate(
      app,
      projectKey,
      flagKey,
      {
        enabled: true,
        reason: 'GLOBAL_ON',
      },
      'staging',
    );
    await evaluate(
      app,
      projectKey,
      flagKey,
      {
        enabled: true,
        reason: 'GLOBAL_ON',
      },
      'staging',
    );

    const productionStats = await waitForFlagStats(
      app,
      projectKey,
      flagKey,
      'production',
      1,
    );
    const stagingStats = await waitForFlagStats(
      app,
      projectKey,
      flagKey,
      'staging',
      2,
    );

    expect(productionStats).toMatchObject({
      environmentKey: 'production',
      totalEvaluations: 1,
    });
    expect(stagingStats).toMatchObject({
      environmentKey: 'staging',
      totalEvaluations: 2,
    });
  });

  it('preserves evaluation behavior when metric persistence fails', async () => {
    const flagKey = 'metric-failure-feature';

    await createStatisticsFixture(app, projectKey, flagKey);

    const incrementSpy = jest
      .spyOn(metricsRepository, 'increment')
      .mockRejectedValueOnce(new Error('simulated metric failure'));

    try {
      await evaluate(app, projectKey, flagKey, {
        enabled: true,
        reason: 'GLOBAL_ON',
      });

      await waitForCondition(() => incrementSpy.mock.calls.length === 1);

      expect(incrementSpy).toHaveBeenCalledTimes(1);
      await expect(
        prisma.flagEvaluationMetric.count({
          where: {
            projectKey,
            flagKey,
          },
        }),
      ).resolves.toBe(0);
    } finally {
      incrementSpy.mockRestore();
    }
  });

  it('persists aggregate dimensions without evaluation context', async () => {
    const flagKey = 'privacy-statistics-feature';

    await createStatisticsFixture(app, projectKey, flagKey);
    await evaluate(app, projectKey, flagKey, {
      enabled: true,
      reason: 'GLOBAL_ON',
    });
    await waitForFlagStats(app, projectKey, flagKey, 'production', 1);

    const rows = await prisma.flagEvaluationMetric.findMany({
      where: {
        projectKey,
        flagKey,
      },
    });
    const serializedRows = JSON.stringify(rows);

    expect(rows).toHaveLength(1);
    expect(serializedRows).not.toContain('private-stable-key');
    expect(serializedRows).not.toContain('private-user-id');
    expect(serializedRows).not.toContain('private-role');
    expect(serializedRows).not.toContain('"country"');
    expect(serializedRows).not.toContain('"context"');
    expect(serializedRows).not.toContain('matchedRuleId');
    expect(rows[0]).toMatchObject({
      projectKey,
      environmentKey: 'production',
      flagKey,
      reason: 'GLOBAL_ON',
      enabled: true,
      count: 1,
    });
  });

  it('returns NOT_FOUND for statistics of a missing project', async () => {
    const missingProjectKey = `missing-stats-${Date.now()}`;

    await request(app.getHttpServer())
      .get(`/v1/projects/${missingProjectKey}/stats/flags`)
      .expect(404)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          code: 'NOT_FOUND',
        });
      });
  });

  it('returns NOT_FOUND for statistics of a missing flag', async () => {
    await createProject(app, projectKey);

    await request(app.getHttpServer())
      .get(`/v1/projects/${projectKey}/flags/missing-flag/stats`)
      .expect(404)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          code: 'NOT_FOUND',
        });
      });
  });

  it('validates statistics query parameters', async () => {
    await request(app.getHttpServer())
      .get('/v1/projects/demo-project/stats/flags')
      .query({
        environmentKey: 'Invalid_Environment',
        limit: 101,
        sort: 'createdAt',
      })
      .expect(400)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          code: 'VALIDATION_ERROR',
        });
      });
  });
});

async function createStatisticsFixture(
  app: INestApplication<App>,
  projectKey: string,
  flagKey: string,
) {
  await createProject(app, projectKey);
  await createFlag(app, projectKey, flagKey, 'Phase 14 Feature');
  await updateFlag(app, projectKey, flagKey, {
    status: 'ENABLED',
    servingMode: 'GLOBAL_ON',
    killSwitch: false,
  });
}

async function createProject(app: INestApplication<App>, projectKey: string) {
  return request(app.getHttpServer())
    .post('/v1/projects')
    .set('X-Actor', actor)
    .send({
      key: projectKey,
      name: 'Phase 14 Statistics Project',
    })
    .expect(201);
}

async function createFlag(
  app: INestApplication<App>,
  projectKey: string,
  flagKey: string,
  name: string,
) {
  return request(app.getHttpServer())
    .post(`/v1/projects/${projectKey}/flags`)
    .set('X-Actor', actor)
    .send({
      key: flagKey,
      name,
    })
    .expect(201);
}

async function updateFlag(
  app: INestApplication<App>,
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

async function createStagingFlagConfig(
  prisma: PrismaService,
  projectKey: string,
  flagKey: string,
) {
  const project = await prisma.project.findUniqueOrThrow({
    where: {
      key: projectKey,
    },
  });
  const flag = await prisma.featureFlag.findUniqueOrThrow({
    where: {
      projectId_key: {
        projectId: project.id,
        key: flagKey,
      },
    },
  });
  const environment = await prisma.environment.create({
    data: {
      projectId: project.id,
      key: 'staging',
      name: 'Staging',
      description: 'Phase 14 E2E environment.',
      isDefault: false,
      sortOrder: 10,
    },
  });

  await prisma.flagEnvironmentConfig.create({
    data: {
      projectId: project.id,
      flagId: flag.id,
      environmentId: environment.id,
      status: 'ENABLED',
      servingMode: 'GLOBAL_ON',
      killSwitch: false,
    },
  });
}

async function evaluate(
  app: INestApplication<App>,
  projectKey: string,
  flagKey: string,
  expected: {
    enabled: boolean;
    reason: string;
  },
  environmentKey = 'production',
) {
  return request(app.getHttpServer())
    .post('/v1/evaluate')
    .send({
      projectKey,
      environmentKey,
      flagKey,
      context: {
        targetingKey: 'private-stable-key',
        userId: 'private-user-id',
        roles: ['private-role'],
        attributes: {
          country: 'VN',
        },
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

async function waitForFlagStats(
  app: INestApplication<App>,
  projectKey: string,
  flagKey: string,
  environmentKey: string,
  expectedTotal: number,
) {
  const deadline = Date.now() + 5_000;
  let latestBody: Record<string, unknown> | undefined;

  while (Date.now() < deadline) {
    const response = await request(app.getHttpServer())
      .get(`/v1/projects/${projectKey}/flags/${flagKey}/stats`)
      .query({
        environmentKey,
      })
      .expect(200);

    latestBody = response.body as Record<string, unknown>;

    if (latestBody.totalEvaluations === expectedTotal) {
      return response.body;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(
    `Expected ${expectedTotal} evaluations, latest statistics were ${JSON.stringify(
      latestBody,
    )}.`,
  );
}

async function waitForCondition(predicate: () => boolean, timeoutMs = 2_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (predicate()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  throw new Error('Timed out waiting for asynchronous condition.');
}
