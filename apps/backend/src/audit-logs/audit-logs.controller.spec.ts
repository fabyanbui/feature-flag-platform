import { AuditLogsController } from './audit-logs.controller';

describe('AuditLogsController', () => {
  const auditLogsService = {
    list: jest.fn(),
  };

  let controller: AuditLogsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuditLogsController(auditLogsService as never);
  });

  it('delegates list to service', async () => {
    const params = { projectKey: 'demo-project' };
    const query = { limit: 20, offset: 0 };
    const response = {
      items: [],
      page: { limit: 20, offset: 0, total: 0, hasNext: false },
    };

    auditLogsService.list.mockResolvedValue(response);

    await expect(controller.list(params, query as never)).resolves.toBe(
      response,
    );
    expect(auditLogsService.list).toHaveBeenCalledWith('demo-project', query);
  });
});
