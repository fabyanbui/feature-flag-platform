import { TestingModule } from '@nestjs/testing';
import { EvaluationService } from '../../src/evaluation/evaluation.service';
import { ProjectsService } from '../../src/projects/projects.service';
import {
  createIntegrationTestingModule,
  createUniqueRunId,
  withRequestContext,
} from './integration-test-helpers';
import { PrismaService } from '../../src/database/prisma.service';
import { FeatureFlagsService } from '../../src/feature-flags/feature-flags.service';
import { FlagRulesService } from '../../src/flag-rules/flag-rules.service';

describe('Phase 4 evaluation integration', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let evaluationService: EvaluationService;
  let projectsService: ProjectsService;
  let featureFlagsService: FeatureFlagsService;
  let flagRulesService: FlagRulesService;

  const actor = 'integration-test@example.local';

  beforeAll(async () => {
    moduleRef = await createIntegrationTestingModule();

    prisma = moduleRef.get(PrismaService);
    evaluationService = moduleRef.get(EvaluationService);
    projectsService = moduleRef.get(ProjectsService);
    featureFlagsService = moduleRef.get(FeatureFlagsService);
    flagRulesService = moduleRef.get(FlagRulesService);
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

  it('evaluates a persisted role-targeting rule as ROLE_MATCH', async () => {
    const runId = createUniqueRunId('eval');
    const projectKey = `${runId}-project`;
    const flagKey = `${runId}-flag`;
    const requestId = `${runId}-request`;
    const betaRole = `${runId}-beta`;
    const targetingKey = `${runId}-user`;

    await withRequestContext(moduleRef, { actor, requestId }, () =>
      projectsService.create({
        key: projectKey,
        name: 'Persisted Evaluation Project',
      }),
    );

    await withRequestContext(
      moduleRef,
      {
        actor,
        requestId: `${requestId}-flag`,
      },
      () =>
        featureFlagsService.create(projectKey, {
          key: flagKey,
          name: 'Persisted Evaluation Flag',
        }),
    );

    await withRequestContext(
      moduleRef,
      {
        actor,
        requestId: `${requestId}-rules`,
      },
      () =>
        flagRulesService.replace(projectKey, flagKey, {
          rules: [
            {
              type: 'ROLE_TARGETING',
              priority: 10,
              enabled: true,
              parameters: {
                roles: [betaRole],
              },
            },
          ],
        }),
    );

    await withRequestContext(
      moduleRef,
      {
        actor,
        requestId: `${requestId}-enable`,
      },
      () =>
        featureFlagsService.update(projectKey, flagKey, {
          status: 'ENABLED',
          servingMode: 'TARGETED',
          killSwitch: false,
        }),
    );

    const auditCountBefore = await prisma.auditLogEntry.count({
      where: {
        projectKey,
      },
    });

    const result = await evaluationService.evaluate({
      projectKey,
      flagKey,
      context: {
        targetingKey,
        userId: targetingKey,
        roles: [betaRole],
      },
    });

    expect(result).toMatchObject({
      projectKey,
      flagKey,
      enabled: true,
      variant: 'on',
      reason: 'ROLE_MATCH',
    });

    expect(result.matchedRuleId).toEqual(expect.any(String));

    const auditCountAfter = await prisma.auditLogEntry.count({
      where: {
        projectKey,
      },
    });

    expect(auditCountAfter).toBe(auditCountBefore);
  });

  it('evaluates persisted percentage rollout deterministically for the same targeting key', async () => {
    const runId = createUniqueRunId('rollout');
    const projectKey = `${runId}-project`;
    const flagKey = `${runId}-flag`;
    const requestId = `${runId}-request`;
    const targetingKey = `${runId}-stable-user`;

    await withRequestContext(moduleRef, { actor, requestId }, () =>
      projectsService.create({
        key: projectKey,
        name: 'Percentage Rollout Project',
      }),
    );

    await withRequestContext(
      moduleRef,
      {
        actor,
        requestId: `${requestId}-flag`,
      },
      () =>
        featureFlagsService.create(projectKey, {
          key: flagKey,
          name: 'Percentage Rollout Flag',
        }),
    );

    await withRequestContext(
      moduleRef,
      {
        actor,
        requestId: `${requestId}-rules`,
      },
      () =>
        flagRulesService.replace(projectKey, flagKey, {
          rules: [
            {
              type: 'PERCENTAGE_ROLLOUT',
              priority: 10,
              enabled: true,
              parameters: {
                percentage: 100,
              },
            },
          ],
        }),
    );

    await withRequestContext(
      moduleRef,
      {
        actor,
        requestId: `${requestId}-enable`,
      },
      () =>
        featureFlagsService.update(projectKey, flagKey, {
          status: 'ENABLED',
          servingMode: 'TARGETED',
          killSwitch: false,
        }),
    );

    const firstResult = await evaluationService.evaluate({
      projectKey,
      flagKey,
      context: {
        targetingKey,
        userId: targetingKey,
        roles: [],
      },
    });

    const secondResult = await evaluationService.evaluate({
      projectKey,
      flagKey,
      context: {
        targetingKey,
        userId: targetingKey,
        roles: [],
      },
    });

    expect(firstResult).toMatchObject({
      projectKey,
      flagKey,
      enabled: true,
      variant: 'on',
      reason: 'PERCENTAGE_ROLLOUT',
    });

    expect(secondResult).toEqual(firstResult);
    expect(firstResult.matchedRuleId).toEqual(expect.any(String));
  });
});
