import { FlagGroupAssignmentsController } from './flag-group-assignments.controller';

describe('FlagGroupAssignmentsController', () => {
  const flagGroupsService = {
    assignFlag: jest.fn(),
    unassignFlag: jest.fn(),
  };

  let controller: FlagGroupAssignmentsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new FlagGroupAssignmentsController(flagGroupsService as never);
  });

  it('delegates assignment to the service', async () => {
    const params = {
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
    };
    const body = {
      groupKey: 'checkout',
    };
    const response = {
      id: 'flag-1',
      key: 'new-checkout',
    };
    flagGroupsService.assignFlag.mockResolvedValue(response);

    await expect(controller.assign(params, body)).resolves.toBe(response);

    expect(flagGroupsService.assignFlag).toHaveBeenCalledWith(
      'demo-project',
      'new-checkout',
      body,
    );
  });

  it('delegates unassignment to the service', async () => {
    const params = {
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
    };
    const response = {
      id: 'flag-1',
      key: 'new-checkout',
    };
    flagGroupsService.unassignFlag.mockResolvedValue(response);

    await expect(controller.unassign(params)).resolves.toBe(response);

    expect(flagGroupsService.unassignFlag).toHaveBeenCalledWith(
      'demo-project',
      'new-checkout',
    );
  });
});
