import { ApiErrorCode } from '../common/errors/api-error-code';
import { EvaluationReason } from '../evaluation/engine/evaluation.types';
import { StatsService } from './stats.service';

const from = '2026-06-24T08:00:00.000Z';
const to = '2026-06-25T08:00:00.000Z';

describe('StatsService', () => {
  const projectsRepository = {
    findByKey: jest.fn(),
  };
  const environmentsRepository = {
    findDefaultByProjectId: jest.fn(),
    findByProjectIdAndKey: jest.fn(),
  };
  const featureFlagsRepository = {
    findByProjectIdAndKey: jest.fn(),
  };
  const evaluationMetricsRepository = {
    findProjectReasonBreakdown: jest.fn(),
    findFlagReasonBreakdown: jest.fn(),
    findFlagBucketBreakdown: jest.fn(),
  };

  let service: StatsService;

  beforeEach(() => {
    jest.clearAllMocks();

    projectsRepository.findByKey.mockResolvedValue({
      id: 'project-1',
      key: 'demo-project',
    });
    environmentsRepository.findDefaultByProjectId.mockResolvedValue({
      id: 'environment-1',
      key: 'production',
    });
    environmentsRepository.findByProjectIdAndKey.mockResolvedValue({
      id: 'environment-1',
      key: 'production',
    });
    featureFlagsRepository.findByProjectIdAndKey.mockResolvedValue({
      id: 'flag-1',
      key: 'new-checkout',
    });
    evaluationMetricsRepository.findProjectReasonBreakdown.mockResolvedValue(
      [],
    );
    evaluationMetricsRepository.findFlagReasonBreakdown.mockResolvedValue([]);
    evaluationMetricsRepository.findFlagBucketBreakdown.mockResolvedValue([]);

    service = new StatsService(
      projectsRepository as never,
      environmentsRepository as never,
      featureFlagsRepository as never,
      evaluationMetricsRepository as never,
    );
  });

  it('rejects project statistics when the project is missing', async () => {
    projectsRepository.findByKey.mockResolvedValue(null);

    await expect(
      service.listFlagStats('missing-project', projectQuery()),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: ApiErrorCode.NOT_FOUND,
      }),
    });
    expect(
      evaluationMetricsRepository.findProjectReasonBreakdown,
    ).not.toHaveBeenCalled();
  });

  it('uses the project default environment when none is requested', async () => {
    await service.listFlagStats('demo-project', projectQuery());

    expect(environmentsRepository.findDefaultByProjectId).toHaveBeenCalledWith(
      'project-1',
    );
    expect(
      evaluationMetricsRepository.findProjectReasonBreakdown,
    ).toHaveBeenCalledWith({
      projectKey: 'demo-project',
      environmentKey: 'production',
      from: new Date(from),
      to: new Date(to),
    });
  });

  it('resolves an explicitly requested environment', async () => {
    environmentsRepository.findByProjectIdAndKey.mockResolvedValue({
      id: 'environment-2',
      key: 'staging',
    });

    await service.listFlagStats(
      'demo-project',
      projectQuery({ environmentKey: 'staging' }),
    );

    expect(environmentsRepository.findByProjectIdAndKey).toHaveBeenCalledWith(
      'project-1',
      'staging',
    );
    expect(
      environmentsRepository.findDefaultByProjectId,
    ).not.toHaveBeenCalled();
  });

  it('rejects statistics when the requested environment is missing', async () => {
    environmentsRepository.findByProjectIdAndKey.mockResolvedValue(null);

    await expect(
      service.listFlagStats(
        'demo-project',
        projectQuery({ environmentKey: 'missing-env' }),
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: ApiErrorCode.NOT_FOUND,
      }),
    });
  });

  it('returns totals and top reasons for each flag', async () => {
    evaluationMetricsRepository.findProjectReasonBreakdown.mockResolvedValue([
      {
        flagKey: 'new-checkout',
        reason: EvaluationReason.GLOBAL_ON,
        enabled: true,
        _sum: { count: 7 },
      },
      {
        flagKey: 'new-checkout',
        reason: EvaluationReason.KILL_SWITCH,
        enabled: false,
        _sum: { count: 3 },
      },
      {
        flagKey: 'search-v2',
        reason: EvaluationReason.DEFAULT_OFF,
        enabled: false,
        _sum: { count: 4 },
      },
    ]);

    await expect(
      service.listFlagStats('demo-project', projectQuery()),
    ).resolves.toEqual({
      items: [
        {
          flagKey: 'new-checkout',
          totalEvaluations: 10,
          enabledCount: 7,
          disabledCount: 3,
          topReasons: [
            {
              reason: EvaluationReason.GLOBAL_ON,
              enabled: true,
              count: 7,
            },
            {
              reason: EvaluationReason.KILL_SWITCH,
              enabled: false,
              count: 3,
            },
          ],
        },
        {
          flagKey: 'search-v2',
          totalEvaluations: 4,
          enabledCount: 0,
          disabledCount: 4,
          topReasons: [
            {
              reason: EvaluationReason.DEFAULT_OFF,
              enabled: false,
              count: 4,
            },
          ],
        },
      ],
      page: {
        limit: 20,
        offset: 0,
        total: 2,
        hasNext: false,
      },
    });
  });

  it('limits project summaries to the three most common reasons', async () => {
    evaluationMetricsRepository.findProjectReasonBreakdown.mockResolvedValue([
      metricRow('flag-a', EvaluationReason.GLOBAL_ON, true, 1),
      metricRow('flag-a', EvaluationReason.DEFAULT_OFF, false, 2),
      metricRow('flag-a', EvaluationReason.KILL_SWITCH, false, 3),
      metricRow('flag-a', EvaluationReason.FLAG_DISABLED, false, 4),
    ]);

    const result = await service.listFlagStats('demo-project', projectQuery());

    expect(result.items[0].topReasons.map((reason) => reason.count)).toEqual([
      4, 3, 2,
    ]);
  });

  it('sorts summaries deterministically and applies pagination', async () => {
    evaluationMetricsRepository.findProjectReasonBreakdown.mockResolvedValue([
      metricRow('flag-b', EvaluationReason.GLOBAL_ON, true, 5),
      metricRow('flag-a', EvaluationReason.GLOBAL_ON, true, 5),
      metricRow('flag-c', EvaluationReason.DEFAULT_OFF, false, 2),
    ]);

    const result = await service.listFlagStats(
      'demo-project',
      projectQuery({ limit: 1, offset: 1 }),
    );

    expect(result.items.map((item) => item.flagKey)).toEqual(['flag-b']);
    expect(result.page).toEqual({
      limit: 1,
      offset: 1,
      total: 3,
      hasNext: true,
    });
  });

  it('supports sorting by flag key', async () => {
    evaluationMetricsRepository.findProjectReasonBreakdown.mockResolvedValue([
      metricRow('flag-b', EvaluationReason.DEFAULT_OFF, false, 1),
      metricRow('flag-a', EvaluationReason.GLOBAL_ON, true, 1),
    ]);

    const result = await service.listFlagStats(
      'demo-project',
      projectQuery({ sort: 'flagKey', order: 'asc' }),
    );

    expect(result.items.map((item) => item.flagKey)).toEqual([
      'flag-a',
      'flag-b',
    ]);
  });

  it('returns one flag summary with reasons and hourly buckets', async () => {
    evaluationMetricsRepository.findFlagReasonBreakdown.mockResolvedValue([
      {
        reason: EvaluationReason.GLOBAL_ON,
        enabled: true,
        _sum: { count: 7 },
      },
      {
        reason: EvaluationReason.KILL_SWITCH,
        enabled: false,
        _sum: { count: 3 },
      },
    ]);
    evaluationMetricsRepository.findFlagBucketBreakdown.mockResolvedValue([
      bucketRow('2026-06-24T08:00:00.000Z', true, 4),
      bucketRow('2026-06-24T08:00:00.000Z', false, 1),
      bucketRow('2026-06-24T09:00:00.000Z', true, 3),
      bucketRow('2026-06-24T09:00:00.000Z', false, 2),
    ]);

    await expect(
      service.getFlagStats('demo-project', 'new-checkout', {
        environmentKey: 'production',
        from,
        to,
      }),
    ).resolves.toEqual({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      environmentKey: 'production',
      from: new Date(from),
      to: new Date(to),
      totalEvaluations: 10,
      enabledCount: 7,
      disabledCount: 3,
      enabledPercentage: 70,
      reasons: [
        {
          reason: EvaluationReason.GLOBAL_ON,
          enabled: true,
          count: 7,
        },
        {
          reason: EvaluationReason.KILL_SWITCH,
          enabled: false,
          count: 3,
        },
      ],
      buckets: [
        {
          bucketStart: new Date('2026-06-24T08:00:00.000Z'),
          totalEvaluations: 5,
          enabledCount: 4,
          disabledCount: 1,
        },
        {
          bucketStart: new Date('2026-06-24T09:00:00.000Z'),
          totalEvaluations: 5,
          enabledCount: 3,
          disabledCount: 2,
        },
      ],
    });
  });

  it('returns zero totals for an existing flag without metrics', async () => {
    await expect(
      service.getFlagStats('demo-project', 'new-checkout', {
        environmentKey: 'production',
        from,
        to,
      }),
    ).resolves.toEqual({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      environmentKey: 'production',
      from: new Date(from),
      to: new Date(to),
      totalEvaluations: 0,
      enabledCount: 0,
      disabledCount: 0,
      enabledPercentage: 0,
      reasons: [],
      buckets: [],
    });
  });

  it('rounds enabled percentage to two decimal places', async () => {
    evaluationMetricsRepository.findFlagReasonBreakdown.mockResolvedValue([
      {
        reason: EvaluationReason.GLOBAL_ON,
        enabled: true,
        _sum: { count: 2 },
      },
      {
        reason: EvaluationReason.DEFAULT_OFF,
        enabled: false,
        _sum: { count: 1 },
      },
    ]);

    const result = await service.getFlagStats('demo-project', 'new-checkout', {
      from,
      to,
    });

    expect(result.enabledPercentage).toBe(66.67);
  });

  it('rejects flag statistics when the flag is missing', async () => {
    featureFlagsRepository.findByProjectIdAndKey.mockResolvedValue(null);

    await expect(
      service.getFlagStats('demo-project', 'missing-flag', {
        environmentKey: 'production',
        from,
        to,
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: ApiErrorCode.NOT_FOUND,
      }),
    });
    expect(
      evaluationMetricsRepository.findFlagReasonBreakdown,
    ).not.toHaveBeenCalled();
    expect(
      evaluationMetricsRepository.findFlagBucketBreakdown,
    ).not.toHaveBeenCalled();
  });
});

function projectQuery(
  overrides: Partial<{
    environmentKey: string;
    from: string;
    to: string;
    limit: number;
    offset: number;
    sort: 'totalEvaluations' | 'enabledCount' | 'disabledCount' | 'flagKey';
    order: 'asc' | 'desc';
  }> = {},
) {
  return {
    from,
    to,
    limit: 20,
    offset: 0,
    sort: 'totalEvaluations' as const,
    order: 'desc' as const,
    ...overrides,
  };
}

function metricRow(
  flagKey: string,
  reason: EvaluationReason,
  enabled: boolean,
  count: number,
) {
  return {
    flagKey,
    reason,
    enabled,
    _sum: { count },
  };
}

function bucketRow(bucketStart: string, enabled: boolean, count: number) {
  return {
    bucketStart: new Date(bucketStart),
    enabled,
    _sum: { count },
  };
}
