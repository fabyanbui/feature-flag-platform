import { FeatureFlagsController } from './feature-flags.controller';

describe('FeatureFlagsController', () => {
  const featureFlagsService = {
    list: jest.fn(),
    create: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
    restore: jest.fn(),
  };

  let controller: FeatureFlagsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new FeatureFlagsController(featureFlagsService as never);
  });

  it('delegates list to service', async () => {
    const params = { projectKey: 'demo-project' };
    const query = { limit: 20, offset: 0 };
    const response = {
      items: [],
      page: { limit: 20, offset: 0, total: 0, hasNext: false },
    };

    featureFlagsService.list.mockResolvedValue(response);

    await expect(controller.list(params, query as never)).resolves.toBe(
      response,
    );
    expect(featureFlagsService.list).toHaveBeenCalledWith(
      'demo-project',
      query,
    );
  });

  it('delegates create to service', async () => {
    const params = { projectKey: 'demo-project' };
    const body = { key: 'new-checkout', name: 'New Checkout' };
    const response = { id: 'flag-1', ...body };

    featureFlagsService.create.mockResolvedValue(response);

    await expect(controller.create(params, body)).resolves.toBe(response);
    expect(featureFlagsService.create).toHaveBeenCalledWith(
      'demo-project',
      body,
    );
  });

  it('delegates get to service', async () => {
    const params = { projectKey: 'demo-project', flagKey: 'new-checkout' };
    const response = { id: 'flag-1', key: 'new-checkout' };

    featureFlagsService.get.mockResolvedValue(response);

    await expect(controller.get(params)).resolves.toBe(response);
    expect(featureFlagsService.get).toHaveBeenCalledWith(
      'demo-project',
      'new-checkout',
    );
  });

  it('delegates update to service', async () => {
    const params = { projectKey: 'demo-project', flagKey: 'new-checkout' };
    const body = { name: 'Updated Checkout' };
    const response = { id: 'flag-1', key: 'new-checkout', ...body };

    featureFlagsService.update.mockResolvedValue(response);

    await expect(controller.update(params, body)).resolves.toBe(response);
    expect(featureFlagsService.update).toHaveBeenCalledWith(
      'demo-project',
      'new-checkout',
      body,
    );
  });

  it('delegates archive to service', async () => {
    const params = { projectKey: 'demo-project', flagKey: 'new-checkout' };
    const response = { id: 'flag-1', key: 'new-checkout' };

    featureFlagsService.archive.mockResolvedValue(response);

    await expect(controller.archive(params)).resolves.toBe(response);
    expect(featureFlagsService.archive).toHaveBeenCalledWith(
      'demo-project',
      'new-checkout',
    );
  });

  it('delegates restore to service', async () => {
    const params = { projectKey: 'demo-project', flagKey: 'new-checkout' };
    const response = { id: 'flag-1', key: 'new-checkout' };

    featureFlagsService.restore.mockResolvedValue(response);

    await expect(controller.restore(params)).resolves.toBe(response);
    expect(featureFlagsService.restore).toHaveBeenCalledWith(
      'demo-project',
      'new-checkout',
    );
  });
});
