import { AuditAction, AuditTargetType, Prisma } from '@prisma/client';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
    const auditLogEntryCreate = jest.fn();

    const tx = {
        auditLogEntry: {
            create: auditLogEntryCreate,
        },
    } as never;

    let service: AuditLogService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new AuditLogService();
    });

    it('writes all required audit fields', async () => {
        auditLogEntryCreate.mockResolvedValue({ id: 'audit-1' });

        await service.record(tx, {
            projectId: 'project-1',
            projectKey: 'demo-project',
            environmentId: 'environment-1',
            environmentKey: 'production',
            targetType: AuditTargetType.PROJECT,
            targetId: 'project-1',
            targetKey: 'demo-project',
            action: AuditAction.PROJECT_CREATED,
            actor: 'mentor@example.local',
            before: null,
            after: {
                id: 'project-1',
                key: 'demo-project',
            },
            metadata: {
                source: 'api',
                defaultEnvironmentKey: 'production',
            },
            requestId: 'req-test',
        });

        expect(auditLogEntryCreate).toHaveBeenCalledWith({
            data: {
                projectId: 'project-1',
                projectKey: 'demo-project',

                environmentId: 'environment-1',
                environmentKey: 'production',

                targetType: AuditTargetType.PROJECT,
                targetId: 'project-1',
                targetKey: 'demo-project',

                action: AuditAction.PROJECT_CREATED,
                actor: 'mentor@example.local',

                before: Prisma.DbNull,
                after: {
                    id: 'project-1',
                    key: 'demo-project',
                },
                metadata: {
                    source: 'api',
                    defaultEnvironmentKey: 'production',
                },

                requestId: 'req-test',
            },
        });
    });

    it('defaults optional environment fields and targetKey to null', async () => {
        await service.record(tx, {
            projectId: 'project-1',
            projectKey: 'demo-project',
            targetType: AuditTargetType.PROJECT,
            targetId: 'project-1',
            action: AuditAction.PROJECT_UPDATED,
            actor: 'mentor@example.local',
            requestId: 'req-test',
        });

        expect(auditLogEntryCreate).toHaveBeenCalledWith({
            data: expect.objectContaining({
                environmentId: null,
                environmentKey: null,
                targetKey: null,
            }),
        });
    });

    it('maps missing before and after snapshots to Prisma DbNull', async () => {
        await service.record(tx, {
            projectId: 'project-1',
            projectKey: 'demo-project',
            targetType: AuditTargetType.PROJECT,
            targetId: 'project-1',
            action: AuditAction.PROJECT_UPDATED,
            actor: 'mentor@example.local',
            requestId: 'req-test',
        });

        expect(auditLogEntryCreate).toHaveBeenCalledWith({
            data: expect.objectContaining({
                before: Prisma.DbNull,
                after: Prisma.DbNull,
            }),
        });
    });

    it('defaults missing metadata to source api', async () => {
        await service.record(tx, {
            projectId: 'project-1',
            projectKey: 'demo-project',
            targetType: AuditTargetType.PROJECT,
            targetId: 'project-1',
            action: AuditAction.PROJECT_UPDATED,
            actor: 'mentor@example.local',
            requestId: 'req-test',
        });

        expect(auditLogEntryCreate).toHaveBeenCalledWith({
            data: expect.objectContaining({
                metadata: {
                    source: 'api',
                },
            }),
        });
    });

    it('returns the created audit log entry', async () => {
        const created = {
            id: 'audit-1',
        };

        auditLogEntryCreate.mockResolvedValue(created);

        await expect(
            service.record(tx, {
                projectId: 'project-1',
                projectKey: 'demo-project',
                targetType: AuditTargetType.PROJECT,
                targetId: 'project-1',
                action: AuditAction.PROJECT_UPDATED,
                actor: 'mentor@example.local',
                requestId: 'req-test',
            }),
        ).resolves.toBe(created);
    });
});