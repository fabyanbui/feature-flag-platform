import { FlagHistoryController } from './flag-history.controller';

describe('FlagHistoryController', () => {
  const auditLogsService = {
    listFlagHistory: jest.fn(),
  };

  let controller: FlagHistoryController;

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new FlagHistoryController(auditLogsService as never);
  });

  it('delegates flag history listing to the audit log service', async () => {
    const params = {
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
    };

    const query = {
      limit: 20,
      offset: 0,
      sort: 'createdAt',
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

    auditLogsService.listFlagHistory.mockResolvedValue(response);

    await expect(controller.list(params, query)).resolves.toBe(response);

    expect(auditLogsService.listFlagHistory).toHaveBeenCalledTimes(1);
    expect(auditLogsService.listFlagHistory).toHaveBeenCalledWith(
      'demo-project',
      'new-checkout',
      query,
    );
  });
});
