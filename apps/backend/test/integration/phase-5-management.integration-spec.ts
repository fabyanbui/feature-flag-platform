import { TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/database/prisma.service';
import { ProjectsService } from '../../src/projects/projects.service';
import {
    createIntegrationTestingModule,
    createUniqueRunId,
    withRequestContext,
} from './integration-test-helpers';

describe('Phase 5 management integration', () => {
    let moduleRef: TestingModule;
    let prisma: PrismaService;
    let projectsService: ProjectsService;

    const actor = 'integration-test@example.local';

    beforeAll(async () => {
        moduleRef = await createIntegrationTestingModule();

        prisma = moduleRef.get(PrismaService);
        projectsService = moduleRef.get(ProjectsService);
    });

    afterAll(async () => {
        await moduleRef.close();
    });

    it('creates a project with default production environment and audit log', async () => {
        const runId = createUniqueRunId('p5');
        const projectKey = `${runId}-project`;
        const requestId = `${runId}-request`;

        const created = await withRequestContext(
            moduleRef,
            {
                actor,
                requestId,
            },
            () =>
                projectsService.create({
                    key: projectKey,
                    name: 'Integration Project',
                    description: 'Created by integration test',
                }),
        );

        expect(created).toMatchObject({
            key: projectKey,
            name: 'Integration Project',
            description: 'Created by integration test',
        });

        const project = await prisma.project.findUnique({
            where: {
                key: projectKey,
            },
        });

        expect(project).toBeTruthy();

        const environment = await prisma.environment.findFirst({
            where: {
                projectId: project?.id,
                key: 'production',
                isDefault: true,
            },
        });

        expect(environment).toBeTruthy();
        expect(environment).toMatchObject({
            key: 'production',
            name: 'Production',
            isDefault: true,
            sortOrder: 0,
        });

        const audit = await prisma.auditLogEntry.findFirst({
            where: {
                projectKey,
                action: 'PROJECT_CREATED',
                actor,
                requestId,
            },
        });

        expect(audit).toBeTruthy();
        expect(audit?.targetType).toBe('PROJECT');
        expect(audit?.targetKey).toBe(projectKey);
        expect(audit?.before).toBeNull();
        expect(audit?.after).toMatchObject({
            key: projectKey,
            name: 'Integration Project',
            description: 'Created by integration test',
        });
        expect(audit?.metadata).toMatchObject({
            source: 'api',
            defaultEnvironmentKey: 'production',
        });
    });
});