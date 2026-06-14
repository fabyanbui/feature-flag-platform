import { ProjectsController } from './projects.controller';

describe('ProjectsController', () => {
    const projectsService = {
        list: jest.fn(),
        create: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
    };

    let controller: ProjectsController;

    beforeEach(() => {
        jest.clearAllMocks();
        controller = new ProjectsController(projectsService as never);
    });

    it('delegates list to service', async () => {
        const query = { limit: 20, offset: 0 };
        const response = { items: [], page: { limit: 20, offset: 0, total: 0, hasNext: false } };

        projectsService.list.mockResolvedValue(response);

        await expect(controller.list(query as never)).resolves.toBe(response);
        expect(projectsService.list).toHaveBeenCalledWith(query);
    });

    it('delegates create to service', async () => {
        const body = { key: 'demo-project', name: 'Demo Project' };
        const response = { id: 'project-1', ...body };

        projectsService.create.mockResolvedValue(response);

        await expect(controller.create(body)).resolves.toBe(response);
        expect(projectsService.create).toHaveBeenCalledWith(body);
    });

    it('delegates get to service with projectKey', async () => {
        const response = { id: 'project-1', key: 'demo-project' };

        projectsService.get.mockResolvedValue(response);

        await expect(
            controller.get({ projectKey: 'demo-project' }),
        ).resolves.toBe(response);

        expect(projectsService.get).toHaveBeenCalledWith('demo-project');
    });

    it('delegates update to service with projectKey and body', async () => {
        const body = { name: 'Updated Project' };
        const response = { id: 'project-1', key: 'demo-project', ...body };

        projectsService.update.mockResolvedValue(response);

        await expect(
            controller.update({ projectKey: 'demo-project' }, body),
        ).resolves.toBe(response);

        expect(projectsService.update).toHaveBeenCalledWith('demo-project', body);
    });
});