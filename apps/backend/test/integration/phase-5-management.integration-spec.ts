import { TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/database/prisma.service';
import { ProjectsService } from '../../src/projects/projects.service';
import {
  createIntegrationTestingModule,
  createUniqueRunId,
  withRequestContext,
} from './integration-test-helpers';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { AuditLogService } from '../../src/audit/audit-log.service';
import { FeatureFlagsService } from '../../src/feature-flags/feature-flags.service';
import { FlagRulesService } from '../../src/flag-rules/flag-rules.service';

describe('Phase 5 management integration', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let projectsService: ProjectsService;
  let featureFlagsService: FeatureFlagsService;
  let flagRulesService: FlagRulesService;

  const actor = 'integration-test@example.local';

  beforeAll(async () => {
    moduleRef = await createIntegrationTestingModule();

    prisma = moduleRef.get(PrismaService);
    projectsService = moduleRef.get(ProjectsService);
    featureFlagsService = moduleRef.get(FeatureFlagsService);
    flagRulesService = moduleRef.get(FlagRulesService);
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

  it('creates a feature flag with safe default config and audit log', async () => {
    const runId = createUniqueRunId('ff');
    const projectKey = `${runId}-project`;
    const flagKey = `${runId}-flag`;
    const requestId = `${runId}-request`;

    await withRequestContext(moduleRef, { actor, requestId }, () =>
      projectsService.create({
        key: projectKey,
        name: 'Flag Integration Project',
      }),
    );

    const created = await withRequestContext(
      moduleRef,
      {
        actor,
        requestId: `${requestId}-flag`,
      },
      () =>
        featureFlagsService.create(projectKey, {
          key: flagKey,
          name: 'New Checkout',
          description: 'Checkout rollout test flag',
        }),
    );

    expect(created).toMatchObject({
      projectKey,
      key: flagKey,
      name: 'New Checkout',
      description: 'Checkout rollout test flag',
      lifecycleStatus: 'ACTIVE',
      status: 'DISABLED',
      servingMode: 'TARGETED',
      killSwitch: false,
      environmentKey: 'production',
    });

    const flag = await prisma.featureFlag.findFirst({
      where: {
        key: flagKey,
        project: {
          key: projectKey,
        },
      },
    });

    expect(flag).toBeTruthy();
    expect(flag).toMatchObject({
      key: flagKey,
      lifecycleStatus: 'ACTIVE',
    });

    const config = await prisma.flagEnvironmentConfig.findFirst({
      where: {
        flagId: flag?.id,
        environment: {
          key: 'production',
          isDefault: true,
        },
      },
    });

    expect(config).toBeTruthy();
    expect(config).toMatchObject({
      status: 'DISABLED',
      servingMode: 'TARGETED',
      killSwitch: false,
    });

    const audit = await prisma.auditLogEntry.findFirst({
      where: {
        projectKey,
        targetType: 'FEATURE_FLAG',
        targetKey: flagKey,
        action: 'FEATURE_FLAG_CREATED',
        actor,
        requestId: `${requestId}-flag`,
      },
    });

    expect(audit).toBeTruthy();
    expect(audit?.environmentKey).toBe('production');
    expect(audit?.before).toBeNull();
    expect(audit?.after).toMatchObject({
      projectKey,
      key: flagKey,
      name: 'New Checkout',
      lifecycleStatus: 'ACTIVE',
      status: 'DISABLED',
      servingMode: 'TARGETED',
      killSwitch: false,
      environmentKey: 'production',
    });
    expect(audit?.metadata).toMatchObject({
      source: 'api',
    });
  });

  it('replaces flag rules, removes old rules, and writes before/after audit snapshots', async () => {
    const runId = createUniqueRunId('rules');
    const projectKey = `${runId}-project`;
    const flagKey = `${runId}-flag`;
    const requestId = `${runId}-request`;

    await withRequestContext(moduleRef, { actor, requestId }, () =>
      projectsService.create({
        key: projectKey,
        name: 'Rule Integration Project',
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
          name: 'Rule Test Flag',
        }),
    );

    const firstRules = await withRequestContext(
      moduleRef,
      {
        actor,
        requestId: `${requestId}-rules-first`,
      },
      () =>
        flagRulesService.replace(projectKey, flagKey, {
          rules: [
            {
              type: 'ROLE_TARGETING',
              priority: 10,
              enabled: true,
              parameters: {
                roles: ['beta-tester'],
              },
            },
          ],
        }),
    );

    expect(firstRules).toHaveLength(1);
    expect(firstRules[0]).toMatchObject({
      type: 'ROLE_TARGETING',
      priority: 10,
      enabled: true,
      parameters: {
        roles: ['beta-tester'],
      },
    });

    const secondRules = await withRequestContext(
      moduleRef,
      {
        actor,
        requestId: `${requestId}-rules-second`,
      },
      () =>
        flagRulesService.replace(projectKey, flagKey, {
          rules: [
            {
              type: 'USER_ALLOWLIST',
              priority: 5,
              enabled: true,
              parameters: {
                userIds: [`${runId}-user-1`],
              },
            },
            {
              type: 'PERCENTAGE_ROLLOUT',
              priority: 20,
              enabled: true,
              parameters: {
                percentage: 25,
              },
            },
          ],
        }),
    );

    expect(secondRules).toHaveLength(2);
    expect(secondRules.map((rule) => rule.priority)).toEqual([5, 20]);
    expect(secondRules.map((rule) => rule.type)).toEqual([
      'USER_ALLOWLIST',
      'PERCENTAGE_ROLLOUT',
    ]);

    const persistedRules = await prisma.flagRule.findMany({
      where: {
        flagConfig: {
          flag: {
            key: flagKey,
            project: {
              key: projectKey,
            },
          },
        },
      },
      orderBy: {
        priority: 'asc',
      },
    });

    expect(persistedRules).toHaveLength(2);
    expect(persistedRules.map((rule) => rule.priority)).toEqual([5, 20]);
    expect(persistedRules.map((rule) => rule.type)).toEqual([
      'USER_ALLOWLIST',
      'PERCENTAGE_ROLLOUT',
    ]);

    expect(persistedRules.some((rule) => rule.type === 'ROLE_TARGETING')).toBe(
      false,
    );

    const audit = await prisma.auditLogEntry.findFirst({
      where: {
        projectKey,
        targetType: 'FEATURE_FLAG',
        targetKey: flagKey,
        action: 'FLAG_RULES_REPLACED',
        actor,
        requestId: `${requestId}-rules-second`,
      },
    });

    expect(audit).toBeTruthy();

    expect(audit?.before).toMatchObject({
      rules: [
        {
          type: 'ROLE_TARGETING',
          priority: 10,
          enabled: true,
          parameters: {
            roles: ['beta-tester'],
          },
        },
      ],
    });

    expect(audit?.after).toMatchObject({
      rules: [
        {
          type: 'USER_ALLOWLIST',
          priority: 5,
          enabled: true,
          parameters: {
            userIds: [`${runId}-user-1`],
          },
        },
        {
          type: 'PERCENTAGE_ROLLOUT',
          priority: 20,
          enabled: true,
          parameters: {
            percentage: 25,
          },
        },
      ],
    });

    expect(audit?.metadata).toMatchObject({
      source: 'api',
      replacedRuleCount: 2,
    });
  });
});

describe('Phase 5 management rollback integration', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let projectsService: ProjectsService;

  const actor = 'integration-test@example.local';

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuditLogService)
      .useValue({
        record: jest.fn().mockRejectedValue(new Error('forced audit failure')),
      })
      .compile();

    await moduleRef.init();

    prisma = moduleRef.get(PrismaService);
    projectsService = moduleRef.get(ProjectsService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('rolls back project creation when audit logging fails', async () => {
    const runId = createUniqueRunId('rb');
    const projectKey = `${runId}-project`;
    const requestId = `${runId}-request`;

    await expect(
      withRequestContext(moduleRef, { actor, requestId }, () =>
        projectsService.create({
          key: projectKey,
          name: 'Rollback Project',
        }),
      ),
    ).rejects.toThrow('forced audit failure');

    const projectCount = await prisma.project.count({
      where: {
        key: projectKey,
      },
    });

    const environmentCount = await prisma.environment.count({
      where: {
        project: {
          key: projectKey,
        },
      },
    });

    expect(projectCount).toBe(0);
    expect(environmentCount).toBe(0);
  });
});
