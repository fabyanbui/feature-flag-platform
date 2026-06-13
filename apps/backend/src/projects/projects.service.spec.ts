import { ApiErrorCode } from '../common/errors/api-error-code';
import { ProjectsService } from './projects.service';

const fixedDate = new Date('2026-06-01T00:00:00.000Z');

function createProject(overrides = {}) {
    return {
        id: 'project-1',
        key: 'demo-project',
        name: 'Demo Project',
        description: 'Demo project description.',
        createdAt: fixedDate,
        updatedAt: fixedDate,
        ...overrides,
    };
}

describe('ProjectsService', () => {
    const projectsRepository = {
        findByKey: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        updateByKey: jest.fn(),
    };

    const environmentsRepository = {
        create: jest.fn(),
    };

    const transactionService = {
        run: jest.fn(),
    };

    const auditLogService = {
        record: jest.fn(),
    };

    const requestContext = {
        getActor: jest.fn(),
        getRequestId: jest.fn(),
    };

    let service: ProjectsService;

    beforeEach(() => {
        jest.clearAllMocks();

        requestContext.getActor.mockReturnValue('mentor@example.local');
        requestContext.getRequestId.mockReturnValue('req-test');

        service = new ProjectsService(
            projectsRepository as never,
            environmentsRepository as never,
            transactionService as never,
            auditLogService as never,
            requestContext as never,
        );
    });

    describe('list', () => {
        it('builds search filter across key and name', async () => {
            const project = createProject();

            projectsRepository.findMany.mockResolvedValue([project]);
            projectsRepository.count.mockResolvedValue(1);

            const result = await service.list({
                search: 'demo',
                limit: 20,
                offset: 0,
                sort: 'name',
                order: 'asc',
            });

            const expectedWhere = {
                OR: [
                    {
                        key: {
                            contains: 'demo',
                            mode: 'insensitive',
                        },
                    },
                    {
                        name: {
                            contains: 'demo',
                            mode: 'insensitive',
                        },
                    },
                ],
            };

            expect(projectsRepository.findMany).toHaveBeenCalledWith(
                expectedWhere,
                {
                    name: 'asc',
                },
                20,
                0,
            );

            expect(projectsRepository.count).toHaveBeenCalledWith(expectedWhere);

            expect(result).toEqual({
                items: [
                    {
                        id: 'project-1',
                        key: 'demo-project',
                        name: 'Demo Project',
                        description: 'Demo project description.',
                        createdAt: fixedDate,
                        updatedAt: fixedDate,
                    },
                ],
                page: {
                    limit: 20,
                    offset: 0,
                    total: 1,
                    hasNext: false,
                },
            });
        });

        it('returns page response with hasNext=true when more projects exist', async () => {
            projectsRepository.findMany.mockResolvedValue([createProject()]);
            projectsRepository.count.mockResolvedValue(25);

            const result = await service.list({
                limit: 20,
                offset: 0,
                order: 'desc',
            });

            expect(projectsRepository.findMany).toHaveBeenCalledWith(
                {},
                {
                    createdAt: 'desc',
                },
                20,
                0,
            );

            expect(result.page).toEqual({
                limit: 20,
                offset: 0,
                total: 25,
                hasNext: true,
            });
        });

        it('rejects unsupported sort field', async () => {
            await expect(
                service.list({
                    limit: 20,
                    offset: 0,
                    sort: 'unsupported',
                    order: 'desc',
                }),
            ).rejects.toMatchObject({
                response: expect.objectContaining({
                    code: ApiErrorCode.VALIDATION_ERROR,
                }),
            });

            expect(projectsRepository.findMany).not.toHaveBeenCalled();
            expect(projectsRepository.count).not.toHaveBeenCalled();
        });
    });

    describe('get', () => {
        it('returns project response when project exists', async () => {
            const project = createProject();

            projectsRepository.findByKey.mockResolvedValue(project);

            await expect(service.get('demo-project')).resolves.toEqual({
                id: 'project-1',
                key: 'demo-project',
                name: 'Demo Project',
                description: 'Demo project description.',
                createdAt: fixedDate,
                updatedAt: fixedDate,
            });

            expect(projectsRepository.findByKey).toHaveBeenCalledWith('demo-project');
        });

        it('throws NOT_FOUND when project does not exist', async () => {
            projectsRepository.findByKey.mockResolvedValue(null);

            await expect(service.get('missing-project')).rejects.toMatchObject({
                response: expect.objectContaining({
                    code: ApiErrorCode.NOT_FOUND,
                }),
            });
        });
    });
});