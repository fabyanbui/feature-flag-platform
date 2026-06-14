import { TestingModule } from '@nestjs/testing';
import { EvaluationService } from '../../src/evaluation/evaluation.service';
import { ProjectsService } from '../../src/projects/projects.service';
import {
    createIntegrationTestingModule,
    createUniqueRunId,
    withRequestContext,
} from './integration-test-helpers';

describe('Phase 4 evaluation integration', () => {
    let moduleRef: TestingModule;
    let evaluationService: EvaluationService;
    let projectsService: ProjectsService;

    const actor = 'integration-test@example.local';

    beforeAll(async () => {
        moduleRef = await createIntegrationTestingModule();

        evaluationService = moduleRef.get(EvaluationService);
        projectsService = moduleRef.get(ProjectsService);
    });

    afterAll(async () => {
        await moduleRef.close();
    });

    it('returns NOT_FOUND when evaluating a missing project', async () => {
        const runId = createUniqueRunId('eval');
        const projectKey = `${runId}-missing-project`;
        const flagKey = `${runId}-flag`;

        const result = await evaluationService.evaluate({
            projectKey,
            flagKey,
            context: {
                targetingKey: `${runId}-user`,
                userId: `${runId}-user`,
                roles: ['beta-tester'],
            },
        });

        expect(result).toMatchObject({
            projectKey,
            flagKey,
            enabled: false,
            variant: 'off',
            reason: 'NOT_FOUND',
            matchedRuleId: null,
        });
    });

    it('returns NOT_FOUND when evaluating a missing flag in an existing project', async () => {
        const runId = createUniqueRunId('eval');
        const projectKey = `${runId}-project`;
        const flagKey = `${runId}-missing-flag`;
        const requestId = `${runId}-request`;

        await withRequestContext(moduleRef, { actor, requestId }, () =>
            projectsService.create({
                key: projectKey,
                name: 'Evaluation Integration Project',
            }),
        );

        const result = await evaluationService.evaluate({
            projectKey,
            flagKey,
            context: {
                targetingKey: `${runId}-user`,
                userId: `${runId}-user`,
                roles: ['beta-tester'],
            },
        });

        expect(result).toMatchObject({
            projectKey,
            flagKey,
            enabled: false,
            variant: 'off',
            reason: 'NOT_FOUND',
            matchedRuleId: null,
        });
    });
});