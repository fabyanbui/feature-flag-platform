import { StatsController } from './stats.controller';

describe('StatsController', () => {
  const statsService = {
    listFlagStats: jest.fn(),
    getFlagStats: jest.fn(),
  };

  let controller: StatsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new StatsController(statsService as never);
  });

  it('delegates project flag statistics to StatsService', async () => {
    const params = {
      projectKey: 'demo-project',
    };
    const query = {
      environmentKey: 'production',
      from: '2026-06-24T08:00:00.000Z',
      to: '2026-06-25T08:00:00.000Z',
      limit: 20,
      offset: 0,
      sort: 'totalEvaluations' as const,
      order: 'desc' as const,
    };
    const response = {
      items: [],
      page: {
        limit: 20,
        offset: 0,
        total: 0,
        hasNext: false,
      },
    };

    statsService.listFlagStats.mockResolvedValue(response);

    await expect(controller.listFlags(params, query)).resolves.toBe(response);

    expect(statsService.listFlagStats).toHaveBeenCalledTimes(1);
    expect(statsService.listFlagStats).toHaveBeenCalledWith(
      'demo-project',
      query,
    );
  });

  it('delegates individual flag statistics to StatsService', async () => {
    const params = {
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
    };
    const query = {
      environmentKey: 'production',
      from: '2026-06-24T08:00:00.000Z',
      to: '2026-06-25T08:00:00.000Z',
    };
    const response = {
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      environmentKey: 'production',
      from: new Date('2026-06-24T08:00:00.000Z'),
      to: new Date('2026-06-25T08:00:00.000Z'),
      totalEvaluations: 0,
      enabledCount: 0,
      disabledCount: 0,
      enabledPercentage: 0,
      reasons: [],
      buckets: [],
    };

    statsService.getFlagStats.mockResolvedValue(response);

    await expect(controller.getFlag(params, query)).resolves.toBe(response);

    expect(statsService.getFlagStats).toHaveBeenCalledTimes(1);
    expect(statsService.getFlagStats).toHaveBeenCalledWith(
      'demo-project',
      'new-checkout',
      query,
    );
  });
});
