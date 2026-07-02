import { FlagGroupsController } from './flag-groups.controller';

describe('FlagGroupsController', () => {
  const flagGroupsService = {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateConfig: jest.fn(),
  };

  let controller: FlagGroupsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new FlagGroupsController(flagGroupsService as never);
  });

  it('delegates list to the service', async () => {
    const query = {
      environmentKey: 'production',
      limit: 20,
      offset: 0,
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
    flagGroupsService.list.mockResolvedValue(response);

    await expect(
      controller.list({ projectKey: 'demo-project' }, query as never),
    ).resolves.toBe(response);

    expect(flagGroupsService.list).toHaveBeenCalledWith('demo-project', query);
  });

  it('delegates create to the service', async () => {
    const body = {
      key: 'checkout',
      name: 'Checkout flags',
    };
    const response = {
      id: 'group-1',
      ...body,
    };
    flagGroupsService.create.mockResolvedValue(response);

    await expect(
      controller.create({ projectKey: 'demo-project' }, body),
    ).resolves.toBe(response);

    expect(flagGroupsService.create).toHaveBeenCalledWith('demo-project', body);
  });

  it('delegates update to the service', async () => {
    const params = {
      projectKey: 'demo-project',
      groupKey: 'checkout',
    };
    const body = {
      name: 'Checkout experience',
    };
    const response = {
      id: 'group-1',
      key: 'checkout',
      ...body,
    };
    flagGroupsService.update.mockResolvedValue(response);

    await expect(controller.update(params, body)).resolves.toBe(response);

    expect(flagGroupsService.update).toHaveBeenCalledWith(
      'demo-project',
      'checkout',
      body,
    );
  });

  it('delegates config update to the service', async () => {
    const params = {
      projectKey: 'demo-project',
      groupKey: 'checkout',
    };
    const body = {
      environmentKey: 'production',
      killSwitch: true,
    };
    const response = {
      id: 'group-1',
      key: 'checkout',
      ...body,
    };
    flagGroupsService.updateConfig.mockResolvedValue(response);

    await expect(controller.updateConfig(params, body)).resolves.toBe(response);

    expect(flagGroupsService.updateConfig).toHaveBeenCalledWith(
      'demo-project',
      'checkout',
      body,
    );
  });

  it('delegates delete to the service', async () => {
    const params = {
      projectKey: 'demo-project',
      groupKey: 'checkout',
    };
    flagGroupsService.delete.mockResolvedValue(undefined);

    await expect(controller.delete(params)).resolves.toBeUndefined();

    expect(flagGroupsService.delete).toHaveBeenCalledWith(
      'demo-project',
      'checkout',
    );
  });
});
