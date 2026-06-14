import { RuleType } from '@prisma/client';
import { FlagRulesController } from './flag-rules.controller';

describe('FlagRulesController', () => {
  const flagRulesService = {
    list: jest.fn(),
    replace: jest.fn(),
  };

  let controller: FlagRulesController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new FlagRulesController(flagRulesService as never);
  });

  it('delegates list to service', async () => {
    const params = { projectKey: 'demo-project', flagKey: 'new-checkout' };
    const query = { type: RuleType.ROLE_TARGETING, limit: 20, offset: 0 };
    const response = {
      items: [],
      page: { limit: 20, offset: 0, total: 0, hasNext: false },
    };

    flagRulesService.list.mockResolvedValue(response);

    await expect(controller.list(params, query as never)).resolves.toBe(
      response,
    );
    expect(flagRulesService.list).toHaveBeenCalledWith(
      'demo-project',
      'new-checkout',
      query,
    );
  });

  it('delegates replace to service', async () => {
    const params = { projectKey: 'demo-project', flagKey: 'new-checkout' };
    const body = { rules: [] };
    const response: unknown[] = [];

    flagRulesService.replace.mockResolvedValue(response);

    await expect(controller.replace(params, body)).resolves.toBe(response);
    expect(flagRulesService.replace).toHaveBeenCalledWith(
      'demo-project',
      'new-checkout',
      body,
    );
  });
});
