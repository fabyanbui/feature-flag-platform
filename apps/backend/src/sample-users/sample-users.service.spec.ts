import { AuditAction, AuditTargetType } from '@prisma/client';
import { ApiErrorCode } from '../common/errors/api-error-code';
import { SampleUsersService } from './sample-users.service';

const fixedDate = new Date('2026-06-01T00:00:00.000Z');

function createProject(overrides = {}) {
    return {
        id: 'project-1',
        key: 'demo-project',
        name: 'Demo Project',
        description: null,
        createdAt: fixedDate,
        updatedAt: fixedDate,
        ...overrides,
    };
}

function createSampleUser(overrides = {}) {
    return {
        id: 'sample-user-1',
        projectId: 'project-1',
        displayName: 'Beta User',
        targetingKey: 'demo-user-beta',
        userId: 'demo-user-beta',
        roles: ['beta-tester'],
        attributes: {
            plan: 'pro',
            country: 'VN',
        },
        createdAt: fixedDate,
        updatedAt: fixedDate,
        ...overrides,
    };
}

describe('SampleUsersService', () => {
    const tx = {
        kind: 'transaction-client',
    } as never;

    const projectsRepository = {
        findByKey: jest.fn(),
    };

    const sampleUsersRepository = {
        findMany: jest.fn(),
        count: jest.fn(),
        findByProjectIdAndTargetingKey: jest.fn(),
        create: jest.fn(),
        deleteByProjectIdAndTargetingKey: jest.fn(),
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

    let service: SampleUsersService;

    beforeEach(() => {
        jest.clearAllMocks();

        transactionService.run.mockImplementation(async (callback) => callback(tx));
        requestContext.getActor.mockReturnValue('mentor@example.local');
        requestContext.getRequestId.mockReturnValue('req-test');

        service = new SampleUsersService(
            projectsRepository as never,
            sampleUsersRepository as never,
            transactionService as never,
            auditLogService as never,
            requestContext as never,
        );
    });

    describe('list', () => {
        it('throws NOT_FOUND when project is missing', async () => {
            projectsRepository.findByKey.mockResolvedValue(null);

            await expect(
                service.list('missing-project', {
                    limit: 20,
                    offset: 0,
                    order: 'desc',
                }),
            ).rejects.toMatchObject({
                response: expect.objectContaining({
                    code: ApiErrorCode.NOT_FOUND,
                }),
            });

            expect(sampleUsersRepository.findMany).not.toHaveBeenCalled();
        });

        it('builds search and trimmed role filters', async () => {
            const sampleUser = createSampleUser();

            projectsRepository.findByKey.mockResolvedValue(createProject());
            sampleUsersRepository.findMany.mockResolvedValue([sampleUser]);
            sampleUsersRepository.count.mockResolvedValue(1);

            const result = await service.list('demo-project', {
                search: 'beta',
                role: ' beta-tester ',
                limit: 20,
                offset: 0,
                sort: 'displayName',
                order: 'asc',
            });

            const expectedWhere = {
                projectId: 'project-1',
                OR: [
                    {
                        displayName: {
                            contains: 'beta',
                            mode: 'insensitive',
                        },
                    },
                    {
                        targetingKey: {
                            contains: 'beta',
                            mode: 'insensitive',
                        },
                    },
                    {
                        userId: {
                            contains: 'beta',
                            mode: 'insensitive',
                        },
                    },
                ],
                roles: {
                    array_contains: 'beta-tester',
                },
            };

            expect(sampleUsersRepository.findMany).toHaveBeenCalledWith(
                expectedWhere,
                {
                    displayName: 'asc',
                },
                20,
                0,
            );
            expect(sampleUsersRepository.count).toHaveBeenCalledWith(expectedWhere);

            expect(result).toEqual({
                items: [
                    {
                        id: 'sample-user-1',
                        projectKey: 'demo-project',
                        displayName: 'Beta User',
                        targetingKey: 'demo-user-beta',
                        userId: 'demo-user-beta',
                        roles: ['beta-tester'],
                        attributes: {
                            plan: 'pro',
                            country: 'VN',
                        },
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

        it('rejects unsupported sort field', async () => {
            projectsRepository.findByKey.mockResolvedValue(createProject());

            await expect(
                service.list('demo-project', {
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

            expect(sampleUsersRepository.findMany).not.toHaveBeenCalled();
        });
    });

    describe('create validation', () => {
        it('rejects whitespace-only displayName', async () => {
            await expect(
                service.create('demo-project', {
                    displayName: '   ',
                    targetingKey: 'demo-user-beta',
                }),
            ).rejects.toMatchObject({
                response: expect.objectContaining({
                    code: ApiErrorCode.VALIDATION_ERROR,
                }),
            });

            expect(projectsRepository.findByKey).not.toHaveBeenCalled();
        });

        it('rejects whitespace-only targetingKey', async () => {
            await expect(
                service.create('demo-project', {
                    displayName: 'Beta User',
                    targetingKey: '   ',
                }),
            ).rejects.toMatchObject({
                response: expect.objectContaining({
                    code: ApiErrorCode.VALIDATION_ERROR,
                }),
            });

            expect(projectsRepository.findByKey).not.toHaveBeenCalled();
        });

        it('rejects whitespace-only userId when provided', async () => {
            await expect(
                service.create('demo-project', {
                    displayName: 'Beta User',
                    targetingKey: 'demo-user-beta',
                    userId: '   ',
                }),
            ).rejects.toMatchObject({
                response: expect.objectContaining({
                    code: ApiErrorCode.VALIDATION_ERROR,
                }),
            });

            expect(projectsRepository.findByKey).not.toHaveBeenCalled();
        });

        it('requires actor before project lookup', async () => {
            requestContext.getActor.mockReturnValue(undefined);

            await expect(
                service.create('demo-project', {
                    displayName: 'Beta User',
                    targetingKey: 'demo-user-beta',
                }),
            ).rejects.toMatchObject({
                response: expect.objectContaining({
                    code: ApiErrorCode.VALIDATION_ERROR,
                }),
            });

            expect(projectsRepository.findByKey).not.toHaveBeenCalled();
            expect(transactionService.run).not.toHaveBeenCalled();
        });

        it('throws NOT_FOUND when project is missing', async () => {
            projectsRepository.findByKey.mockResolvedValue(null);

            await expect(
                service.create('missing-project', {
                    displayName: 'Beta User',
                    targetingKey: 'demo-user-beta',
                }),
            ).rejects.toMatchObject({
                response: expect.objectContaining({
                    code: ApiErrorCode.NOT_FOUND,
                }),
            });

            expect(transactionService.run).not.toHaveBeenCalled();
        });

        it('rejects duplicate targeting key with CONFLICT', async () => {
            projectsRepository.findByKey.mockResolvedValue(createProject());
            sampleUsersRepository.findByProjectIdAndTargetingKey.mockResolvedValue(
                createSampleUser(),
            );

            await expect(
                service.create('demo-project', {
                    displayName: 'Beta User',
                    targetingKey: 'demo-user-beta',
                }),
            ).rejects.toMatchObject({
                response: expect.objectContaining({
                    code: ApiErrorCode.CONFLICT,
                }),
            });

            expect(transactionService.run).not.toHaveBeenCalled();
        });
    });

    describe('create transaction and audit', () => {
        it('normalizes input, creates sample user, and writes audit log in same transaction', async () => {
            const created = createSampleUser({
                displayName: 'Beta User',
                targetingKey: 'demo-user-beta',
                userId: 'demo-user-beta',
                roles: ['beta-tester', 'staff'],
                attributes: {
                    plan: 'pro',
                },
            });

            projectsRepository.findByKey.mockResolvedValue(createProject());
            sampleUsersRepository.findByProjectIdAndTargetingKey.mockResolvedValue(
                null,
            );
            sampleUsersRepository.create.mockResolvedValue(created);

            const result = await service.create('demo-project', {
                displayName: ' Beta User ',
                targetingKey: ' demo-user-beta ',
                userId: ' demo-user-beta ',
                roles: [' beta-tester ', 'staff', 'beta-tester', '   '],
                attributes: {
                    plan: 'pro',
                },
            });

            expect(sampleUsersRepository.findByProjectIdAndTargetingKey).toHaveBeenCalledWith(
                'project-1',
                'demo-user-beta',
            );

            expect(sampleUsersRepository.create).toHaveBeenCalledWith(
                {
                    project: {
                        connect: {
                            id: 'project-1',
                        },
                    },
                    displayName: 'Beta User',
                    targetingKey: 'demo-user-beta',
                    userId: 'demo-user-beta',
                    roles: ['beta-tester', 'staff'],
                    attributes: {
                        plan: 'pro',
                    },
                },
                tx,
            );

            expect(auditLogService.record).toHaveBeenCalledWith(
                tx,
                expect.objectContaining({
                    projectId: 'project-1',
                    projectKey: 'demo-project',
                    targetType: AuditTargetType.SAMPLE_USER,
                    targetId: 'sample-user-1',
                    targetKey: 'demo-user-beta',
                    action: AuditAction.SAMPLE_USER_CREATED,
                    actor: 'mentor@example.local',
                    before: null,
                    after: {
                        id: 'sample-user-1',
                        displayName: 'Beta User',
                        targetingKey: 'demo-user-beta',
                        userId: 'demo-user-beta',
                        roles: ['beta-tester', 'staff'],
                        attributes: {
                            plan: 'pro',
                        },
                    },
                    metadata: {
                        source: 'api',
                    },
                    requestId: 'req-test',
                }),
            );

            expect(result).toEqual({
                id: 'sample-user-1',
                projectKey: 'demo-project',
                displayName: 'Beta User',
                targetingKey: 'demo-user-beta',
                userId: 'demo-user-beta',
                roles: ['beta-tester', 'staff'],
                attributes: {
                    plan: 'pro',
                },
                createdAt: fixedDate,
                updatedAt: fixedDate,
            });
        });

        it('defaults roles to empty array and attributes to empty object', async () => {
            const created = createSampleUser({
                roles: [],
                attributes: {},
                userId: null,
            });

            projectsRepository.findByKey.mockResolvedValue(createProject());
            sampleUsersRepository.findByProjectIdAndTargetingKey.mockResolvedValue(
                null,
            );
            sampleUsersRepository.create.mockResolvedValue(created);

            await service.create('demo-project', {
                displayName: 'Beta User',
                targetingKey: 'demo-user-beta',
            });

            expect(sampleUsersRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: null,
                    roles: [],
                    attributes: {},
                }),
                tx,
            );
        });
    });

    describe('delete', () => {
        it('requires actor before transaction', async () => {
            requestContext.getActor.mockReturnValue(undefined);

            await expect(
                service.delete('demo-project', ' demo-user-beta '),
            ).rejects.toMatchObject({
                response: expect.objectContaining({
                    code: ApiErrorCode.VALIDATION_ERROR,
                }),
            });

            expect(transactionService.run).not.toHaveBeenCalled();
        });

        it('throws NOT_FOUND when project is missing inside transaction', async () => {
            projectsRepository.findByKey.mockResolvedValue(null);

            await expect(
                service.delete('missing-project', 'demo-user-beta'),
            ).rejects.toMatchObject({
                response: expect.objectContaining({
                    code: ApiErrorCode.NOT_FOUND,
                }),
            });

            expect(projectsRepository.findByKey).toHaveBeenCalledWith(
                'missing-project',
                tx,
            );
            expect(
                sampleUsersRepository.findByProjectIdAndTargetingKey,
            ).not.toHaveBeenCalled();
        });

        it('throws NOT_FOUND when sample user is missing inside transaction', async () => {
            projectsRepository.findByKey.mockResolvedValue(createProject());
            sampleUsersRepository.findByProjectIdAndTargetingKey.mockResolvedValue(
                null,
            );

            await expect(
                service.delete('demo-project', ' demo-user-beta '),
            ).rejects.toMatchObject({
                response: expect.objectContaining({
                    code: ApiErrorCode.NOT_FOUND,
                }),
            });

            expect(sampleUsersRepository.findByProjectIdAndTargetingKey).toHaveBeenCalledWith(
                'project-1',
                'demo-user-beta',
                tx,
            );
            expect(
                sampleUsersRepository.deleteByProjectIdAndTargetingKey,
            ).not.toHaveBeenCalled();
            expect(auditLogService.record).not.toHaveBeenCalled();
        });

        it('deletes sample user and writes audit log in same transaction', async () => {
            const existing = createSampleUser();

            projectsRepository.findByKey.mockResolvedValue(createProject());
            sampleUsersRepository.findByProjectIdAndTargetingKey.mockResolvedValue(
                existing,
            );

            await service.delete('demo-project', ' demo-user-beta ');

            expect(sampleUsersRepository.deleteByProjectIdAndTargetingKey).toHaveBeenCalledWith(
                'project-1',
                'demo-user-beta',
                tx,
            );

            expect(auditLogService.record).toHaveBeenCalledWith(
                tx,
                expect.objectContaining({
                    projectId: 'project-1',
                    projectKey: 'demo-project',
                    targetType: AuditTargetType.SAMPLE_USER,
                    targetId: 'sample-user-1',
                    targetKey: 'demo-user-beta',
                    action: AuditAction.SAMPLE_USER_DELETED,
                    actor: 'mentor@example.local',
                    before: {
                        id: 'sample-user-1',
                        displayName: 'Beta User',
                        targetingKey: 'demo-user-beta',
                        userId: 'demo-user-beta',
                        roles: ['beta-tester'],
                        attributes: {
                            plan: 'pro',
                            country: 'VN',
                        },
                    },
                    after: null,
                    metadata: {
                        source: 'api',
                    },
                    requestId: 'req-test',
                }),
            );
        });
    });
});