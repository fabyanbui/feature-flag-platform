import 'reflect-metadata';
import { SampleUsersController } from './sample-users.controller';

describe('SampleUsersController', () => {
    const sampleUsersService = {
        list: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
    };

    let controller: SampleUsersController;

    beforeEach(() => {
        jest.clearAllMocks();
        controller = new SampleUsersController(sampleUsersService as never);
    });

    it('delegates list to service', async () => {
        const params = { projectKey: 'demo-project' };
        const query = { limit: 20, offset: 0 };
        const response = { items: [], page: { limit: 20, offset: 0, total: 0, hasNext: false } };

        sampleUsersService.list.mockResolvedValue(response);

        await expect(controller.list(params, query as never)).resolves.toBe(response);
        expect(sampleUsersService.list).toHaveBeenCalledWith('demo-project', query);
    });

    it('delegates create to service', async () => {
        const params = { projectKey: 'demo-project' };
        const body = {
            displayName: 'Beta User',
            targetingKey: 'demo-user-beta',
        };
        const response = { id: 'sample-user-1', ...body };

        sampleUsersService.create.mockResolvedValue(response);

        await expect(controller.create(params, body)).resolves.toBe(response);
        expect(sampleUsersService.create).toHaveBeenCalledWith('demo-project', body);
    });

    it('delegates delete to service', async () => {
        const params = {
            projectKey: 'demo-project',
            targetingKey: 'demo-user-beta',
        };

        sampleUsersService.delete.mockResolvedValue(undefined);

        await expect(controller.delete(params)).resolves.toBeUndefined();
        expect(sampleUsersService.delete).toHaveBeenCalledWith(
            'demo-project',
            'demo-user-beta',
        );
    });
});