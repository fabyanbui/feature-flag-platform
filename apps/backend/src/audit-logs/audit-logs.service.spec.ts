import { AuditAction, AuditTargetType } from '@prisma/client';
import { ApiErrorCode } from '../common/errors/api-error-code';
import { AuditLogsService } from './audit-logs.service';

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

function createAuditLogEntry(overrides = {}) {
    return {
        id: 'audit-1',
        projectId: 'project-1',
        projectKey: 'demo-project',
        environmentId: 'environment-1',
        environmentKey: 'production',
        targetType: AuditTargetType.FEATURE_FLAG,
        targetId: 'flag-1',
        targetKey: 'new-checkout',
        action: AuditAction.FEATURE_FLAG_UPDATED,
        actor: 'mentor@example.local',
        before: {
            status: 'DISABLED',
        },
        after: {
            status: 'ENABLED',
        },
        metadata: {
            source: 'api',
        },
        requestId: 'req-test',
        createdAt: fixedDate,
        ...overrides,
    };
}

describe('AuditLogsService', () => {
    const projectsRepository = {
        findByKey: jest.fn(),
    };

    const auditLogsRepository = {
        findMany: jest.fn(),
        count: jest.fn(),
    };

    let service: AuditLogsService;

    beforeEach(() => {
        jest.clearAllMocks();

        service = new AuditLogsService(
            projectsRepository as never,
            auditLogsRepository as never,
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

            expect(auditLogsRepository.findMany).not.toHaveBeenCalled();
            expect(auditLogsRepository.count).not.toHaveBeenCalled();
        });

        it('filters by targetType, targetKey, actor, action, and time range', async () => {
            const entry = createAuditLogEntry();

            projectsRepository.findByKey.mockResolvedValue(createProject());
            auditLogsRepository.findMany.mockResolvedValue([entry]);
            auditLogsRepository.count.mockResolvedValue(1);

            const result = await service.list('demo-project', {
                targetType: AuditTargetType.FEATURE_FLAG,
                targetKey: 'new-checkout',
                actor: 'mentor@example.local',
                action: AuditAction.FEATURE_FLAG_UPDATED,
                from: '2026-06-01T00:00:00.000Z',
                to: '2026-06-02T00:00:00.000Z',
                limit: 20,
                offset: 0,
                sort: 'actor',
                order: 'asc',
            });

            const expectedWhere = {
                projectId: 'project-1',
                targetType: AuditTargetType.FEATURE_FLAG,
                targetKey: 'new-checkout',
                actor: 'mentor@example.local',
                action: AuditAction.FEATURE_FLAG_UPDATED,
                createdAt: {
                    gte: new Date('2026-06-01T00:00:00.000Z'),
                    lte: new Date('2026-06-02T00:00:00.000Z'),
                },
            };

            expect(auditLogsRepository.findMany).toHaveBeenCalledWith(
                expectedWhere,
                {
                    actor: 'asc',
                },
                20,
                0,
            );
            expect(auditLogsRepository.count).toHaveBeenCalledWith(expectedWhere);

            expect(result).toEqual({
                items: [
                    {
                        id: 'audit-1',
                        projectKey: 'demo-project',
                        environmentKey: 'production',
                        targetType: AuditTargetType.FEATURE_FLAG,
                        targetId: 'flag-1',
                        targetKey: 'new-checkout',
                        action: AuditAction.FEATURE_FLAG_UPDATED,
                        actor: 'mentor@example.local',
                        before: {
                            status: 'DISABLED',
                        },
                        after: {
                            status: 'ENABLED',
                        },
                        metadata: {
                            source: 'api',
                        },
                        requestId: 'req-test',
                        createdAt: fixedDate,
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

        it('supports from-only time range', async () => {
            projectsRepository.findByKey.mockResolvedValue(createProject());
            auditLogsRepository.findMany.mockResolvedValue([]);
            auditLogsRepository.count.mockResolvedValue(0);

            await service.list('demo-project', {
                from: '2026-06-01T00:00:00.000Z',
                limit: 20,
                offset: 0,
            });

            expect(auditLogsRepository.findMany).toHaveBeenCalledWith(
                {
                    projectId: 'project-1',
                    targetType: undefined,
                    targetKey: undefined,
                    actor: undefined,
                    action: undefined,
                    createdAt: {
                        gte: new Date('2026-06-01T00:00:00.000Z'),
                    },
                },
                {
                    createdAt: 'desc',
                },
                20,
                0,
            );
        });

        it('supports to-only time range', async () => {
            projectsRepository.findByKey.mockResolvedValue(createProject());
            auditLogsRepository.findMany.mockResolvedValue([]);
            auditLogsRepository.count.mockResolvedValue(0);

            await service.list('demo-project', {
                to: '2026-06-02T00:00:00.000Z',
                limit: 20,
                offset: 0,
            });

            expect(auditLogsRepository.findMany).toHaveBeenCalledWith(
                {
                    projectId: 'project-1',
                    targetType: undefined,
                    targetKey: undefined,
                    actor: undefined,
                    action: undefined,
                    createdAt: {
                        lte: new Date('2026-06-02T00:00:00.000Z'),
                    },
                },
                {
                    createdAt: 'desc',
                },
                20,
                0,
            );
        });

        it('rejects time range when from is after to', async () => {
            projectsRepository.findByKey.mockResolvedValue(createProject());

            await expect(
                service.list('demo-project', {
                    from: '2026-06-03T00:00:00.000Z',
                    to: '2026-06-02T00:00:00.000Z',
                    limit: 20,
                    offset: 0,
                }),
            ).rejects.toMatchObject({
                response: expect.objectContaining({
                    code: ApiErrorCode.VALIDATION_ERROR,
                }),
            });

            expect(auditLogsRepository.findMany).not.toHaveBeenCalled();
            expect(auditLogsRepository.count).not.toHaveBeenCalled();
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

            expect(auditLogsRepository.findMany).not.toHaveBeenCalled();
            expect(auditLogsRepository.count).not.toHaveBeenCalled();
        });

        it('defaults sort to createdAt desc and returns hasNext=true when more entries exist', async () => {
            projectsRepository.findByKey.mockResolvedValue(createProject());
            auditLogsRepository.findMany.mockResolvedValue([createAuditLogEntry()]);
            auditLogsRepository.count.mockResolvedValue(21);

            const result = await service.list('demo-project', {
                limit: 20,
                offset: 0,
            });

            expect(auditLogsRepository.findMany).toHaveBeenCalledWith(
                {
                    projectId: 'project-1',
                    targetType: undefined,
                    targetKey: undefined,
                    actor: undefined,
                    action: undefined,
                },
                {
                    createdAt: 'desc',
                },
                20,
                0,
            );

            expect(result.page).toEqual({
                limit: 20,
                offset: 0,
                total: 21,
                hasNext: true,
            });
        });

        it('preserves before, after, metadata, and requestId in response', async () => {
            const entry = createAuditLogEntry({
                before: {
                    name: 'Old Flag',
                },
                after: {
                    name: 'New Flag',
                },
                metadata: {
                    source: 'api',
                    reason: 'test',
                },
                requestId: 'req-preserved',
            });

            projectsRepository.findByKey.mockResolvedValue(createProject());
            auditLogsRepository.findMany.mockResolvedValue([entry]);
            auditLogsRepository.count.mockResolvedValue(1);

            const result = await service.list('demo-project', {
                limit: 20,
                offset: 0,
            });

            expect(result.items[0]).toEqual(
                expect.objectContaining({
                    before: {
                        name: 'Old Flag',
                    },
                    after: {
                        name: 'New Flag',
                    },
                    metadata: {
                        source: 'api',
                        reason: 'test',
                    },
                    requestId: 'req-preserved',
                }),
            );
        });
    });
});