import { EvaluationMetricsRepository } from './evaluation-metrics.repository';

describe('EvaluationMetricsRepository', () => {
  const prisma = {
    flagEvaluationMetric: {
      upsert: jest.fn(),
    },
  };

  let repository: EvaluationMetricsRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new EvaluationMetricsRepository(prisma as never);
  });

  it('atomically creates or increments one aggregate metric bucket', async () => {
    const bucketStart = new Date('2026-06-25T08:00:00.000Z');

    prisma.flagEvaluationMetric.upsert.mockResolvedValue({
      id: 'metric-1',
      count: 2,
    });

    await repository.increment({
      projectId: 'project-1',
      environmentId: 'environment-1',
      flagId: 'flag-1',
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
      bucketStart,
      reason: 'GLOBAL_ON',
      enabled: true,
    });

    expect(prisma.flagEvaluationMetric.upsert).toHaveBeenCalledWith({
      where: {
        metricBucket: {
          projectKey: 'demo-project',
          environmentKey: 'production',
          flagKey: 'new-checkout',
          bucketStart,
          reason: 'GLOBAL_ON',
          enabled: true,
        },
      },
      create: {
        projectId: 'project-1',
        environmentId: 'environment-1',
        flagId: 'flag-1',
        projectKey: 'demo-project',
        environmentKey: 'production',
        flagKey: 'new-checkout',
        bucketStart,
        reason: 'GLOBAL_ON',
        enabled: true,
        count: 1,
      },
      update: {
        count: {
          increment: 1,
        },
      },
    });
  });

  it('supports unresolved evaluations without database IDs', async () => {
    const bucketStart = new Date('2026-06-25T08:00:00.000Z');

    prisma.flagEvaluationMetric.upsert.mockResolvedValue({
      id: 'metric-2',
      count: 1,
    });

    await repository.increment({
      projectId: null,
      environmentId: null,
      flagId: null,
      projectKey: 'missing-project',
      environmentKey: '__unresolved__',
      flagKey: 'missing-flag',
      bucketStart,
      reason: 'NOT_FOUND',
      enabled: false,
    });

    expect(prisma.flagEvaluationMetric.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          projectId: null,
          environmentId: null,
          flagId: null,
          environmentKey: '__unresolved__',
          reason: 'NOT_FOUND',
          enabled: false,
        }),
      }),
    );
  });

  it('does not persist raw evaluation context', async () => {
    const bucketStart = new Date('2026-06-25T08:00:00.000Z');

    prisma.flagEvaluationMetric.upsert.mockResolvedValue({
      id: 'metric-3',
      count: 1,
    });

    await repository.increment({
      projectId: null,
      environmentId: null,
      flagId: null,
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
      bucketStart,
      reason: 'ROLE_MATCH',
      enabled: true,
    });

    const call = prisma.flagEvaluationMetric.upsert.mock.calls[0][0];
    const serializedCall = JSON.stringify(call);

    expect(serializedCall).not.toContain('targetingKey');
    expect(serializedCall).not.toContain('userId');
    expect(serializedCall).not.toContain('roles');
    expect(serializedCall).not.toContain('attributes');
    expect(serializedCall).not.toContain('context');
    expect(serializedCall).not.toContain('matchedRuleId');
  });
});
