import {
  FeatureFlagLifecycleStatus,
  FlagConfigStatus,
  RuleType,
  ServingMode,
} from '@prisma/client';
import { EvaluationRepository } from './evaluation.repository';

describe('EvaluationRepository', () => {
  const prisma = {
    project: {
      findFirst: jest.fn(),
    },
    environment: {
      findFirst: jest.fn(),
    },
    featureFlag: {
      findFirst: jest.fn(),
    },
    flagEnvironmentConfig: {
      findUnique: jest.fn(),
    },
    flagGroupConfig: {
      findUnique: jest.fn(),
    },
  };

  let repository: EvaluationRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    repository = new EvaluationRepository(prisma as never);
  });

  it('returns null when project is missing', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      repository.findSnapshot({
        projectKey: 'missing-project',
        flagKey: 'new-checkout',
      }),
    ).resolves.toBeNull();

    expect(prisma.environment.findFirst).not.toHaveBeenCalled();
    expect(prisma.featureFlag.findFirst).not.toHaveBeenCalled();
    expect(prisma.flagEnvironmentConfig.findUnique).not.toHaveBeenCalled();
    expect(prisma.flagGroupConfig.findUnique).not.toHaveBeenCalled();
  });

  it('returns null when default environment is missing', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'project-1',
    });
    prisma.environment.findFirst.mockResolvedValue(null);

    await expect(
      repository.findSnapshot({
        projectKey: 'demo-project',
        flagKey: 'new-checkout',
      }),
    ).resolves.toBeNull();

    expect(prisma.environment.findFirst).toHaveBeenCalledWith({
      where: {
        projectId: 'project-1',
        isDefault: true,
      },
      select: {
        id: true,
        key: true,
      },
    });

    expect(prisma.featureFlag.findFirst).not.toHaveBeenCalled();
  });

  it('returns null when explicit environment is missing', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'project-1',
    });
    prisma.environment.findFirst.mockResolvedValue(null);

    await expect(
      repository.findSnapshot({
        projectKey: 'demo-project',
        environmentKey: 'staging',
        flagKey: 'new-checkout',
      }),
    ).resolves.toBeNull();

    expect(prisma.environment.findFirst).toHaveBeenCalledWith({
      where: {
        projectId: 'project-1',
        key: 'staging',
      },
      select: {
        id: true,
        key: true,
      },
    });

    expect(prisma.featureFlag.findFirst).not.toHaveBeenCalled();
  });

  it('returns null when flag is missing', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'project-1',
    });
    prisma.environment.findFirst.mockResolvedValue({
      id: 'environment-1',
      key: 'production',
    });
    prisma.featureFlag.findFirst.mockResolvedValue(null);

    await expect(
      repository.findSnapshot({
        projectKey: 'demo-project',
        flagKey: 'missing-flag',
      }),
    ).resolves.toBeNull();

    expect(prisma.featureFlag.findFirst).toHaveBeenCalledWith({
      where: {
        projectId: 'project-1',
        key: 'missing-flag',
        deletedAt: null,
      },
      select: {
        id: true,
        groupId: true,
        lifecycleStatus: true,
      },
    });

    expect(prisma.flagEnvironmentConfig.findUnique).not.toHaveBeenCalled();
  });

  it('returns null when config is missing', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'project-1',
    });
    prisma.environment.findFirst.mockResolvedValue({
      id: 'environment-1',
      key: 'production',
    });
    prisma.featureFlag.findFirst.mockResolvedValue({
      id: 'flag-1',
      groupId: null,
      lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
    });
    prisma.flagEnvironmentConfig.findUnique.mockResolvedValue(null);

    await expect(
      repository.findSnapshot({
        projectKey: 'demo-project',
        flagKey: 'new-checkout',
      }),
    ).resolves.toBeNull();

    expect(prisma.flagEnvironmentConfig.findUnique).toHaveBeenCalledWith({
      where: {
        flagId_environmentId: {
          flagId: 'flag-1',
          environmentId: 'environment-1',
        },
      },
      select: {
        status: true,
        servingMode: true,
        killSwitch: true,
        rules: {
          select: {
            id: true,
            type: true,
            priority: true,
            enabled: true,
            parameters: true,
          },
          orderBy: {
            priority: 'asc',
          },
        },
      },
    });
    expect(prisma.flagGroupConfig.findUnique).not.toHaveBeenCalled();
  });

  it('returns complete evaluation snapshot', async () => {
    const rules = [
      {
        id: 'rule-1',
        type: RuleType.ROLE_TARGETING,
        priority: 10,
        enabled: true,
        parameters: {
          roles: ['beta-tester'],
        },
      },
    ];

    prisma.project.findFirst.mockResolvedValue({
      id: 'project-1',
    });
    prisma.environment.findFirst.mockResolvedValue({
      id: 'environment-1',
      key: 'production',
    });
    prisma.featureFlag.findFirst.mockResolvedValue({
      id: 'flag-1',
      groupId: null,
      lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
    });
    prisma.flagEnvironmentConfig.findUnique.mockResolvedValue({
      status: FlagConfigStatus.ENABLED,
      servingMode: ServingMode.TARGETED,
      killSwitch: false,
      rules,
    });

    await expect(
      repository.findSnapshot({
        projectKey: 'demo-project',
        flagKey: 'new-checkout',
      }),
    ).resolves.toEqual({
      resolution: {
        projectId: 'project-1',
        environmentId: 'environment-1',
        flagId: 'flag-1',
        environmentKey: 'production',
      },
      flag: {
        lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
      },
      group: null,
      config: {
        status: FlagConfigStatus.ENABLED,
        servingMode: ServingMode.TARGETED,
        killSwitch: false,
      },
      rules,
    });
  });

  it('returns the actual default environment identity for metric recording', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'project-1',
    });
    prisma.environment.findFirst.mockResolvedValue({
      id: 'environment-1',
      key: 'production',
    });
    prisma.featureFlag.findFirst.mockResolvedValue({
      id: 'flag-1',
      groupId: null,
      lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
    });
    prisma.flagEnvironmentConfig.findUnique.mockResolvedValue({
      status: FlagConfigStatus.ENABLED,
      servingMode: ServingMode.GLOBAL_ON,
      killSwitch: false,
      rules: [],
    });

    const result = await repository.findSnapshot({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
    });

    expect(result?.resolution).toEqual({
      projectId: 'project-1',
      environmentId: 'environment-1',
      flagId: 'flag-1',
      environmentKey: 'production',
    });
  });

  it('orders selected rules by priority ascending', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'project-1',
    });
    prisma.environment.findFirst.mockResolvedValue({
      id: 'environment-1',
      key: 'production',
    });
    prisma.featureFlag.findFirst.mockResolvedValue({
      id: 'flag-1',
      groupId: null,
      lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
    });
    prisma.flagEnvironmentConfig.findUnique.mockResolvedValue({
      status: FlagConfigStatus.ENABLED,
      servingMode: ServingMode.TARGETED,
      killSwitch: false,
      rules: [],
    });

    await repository.findSnapshot({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
    });

    expect(prisma.flagEnvironmentConfig.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          rules: expect.objectContaining({
            orderBy: {
              priority: 'asc',
            },
          }),
        }),
      }),
    );
  });

  it('returns active group state for the evaluated environment', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'project-1',
    });
    prisma.environment.findFirst.mockResolvedValue({
      id: 'environment-1',
      key: 'production',
    });
    prisma.featureFlag.findFirst.mockResolvedValue({
      id: 'flag-1',
      groupId: 'group-1',
      lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
    });
    prisma.flagEnvironmentConfig.findUnique.mockResolvedValue({
      status: FlagConfigStatus.ENABLED,
      servingMode: ServingMode.GLOBAL_ON,
      killSwitch: false,
      rules: [],
    });
    prisma.flagGroupConfig.findUnique.mockResolvedValue({
      killSwitch: true,
    });

    await expect(
      repository.findSnapshot({
        projectKey: 'demo-project',
        environmentKey: 'production',
        flagKey: 'new-checkout',
      }),
    ).resolves.toEqual({
      resolution: {
        projectId: 'project-1',
        environmentId: 'environment-1',
        flagId: 'flag-1',
        environmentKey: 'production',
      },
      flag: {
        lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
      },
      group: {
        killSwitch: true,
      },
      config: {
        status: FlagConfigStatus.ENABLED,
        servingMode: ServingMode.GLOBAL_ON,
        killSwitch: false,
      },
      rules: [],
    });

    expect(prisma.flagGroupConfig.findUnique).toHaveBeenCalledWith({
      where: {
        groupId_environmentId: {
          groupId: 'group-1',
          environmentId: 'environment-1',
        },
      },
      select: {
        killSwitch: true,
      },
    });
  });

  it('throws when an assigned group is missing its environment config', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'project-1',
    });
    prisma.environment.findFirst.mockResolvedValue({
      id: 'environment-1',
      key: 'production',
    });
    prisma.featureFlag.findFirst.mockResolvedValue({
      id: 'flag-1',
      groupId: 'group-1',
      lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
    });
    prisma.flagEnvironmentConfig.findUnique.mockResolvedValue({
      status: FlagConfigStatus.ENABLED,
      servingMode: ServingMode.GLOBAL_ON,
      killSwitch: false,
      rules: [],
    });
    prisma.flagGroupConfig.findUnique.mockResolvedValue(null);

    await expect(
      repository.findSnapshot({
        projectKey: 'demo-project',
        flagKey: 'new-checkout',
      }),
    ).rejects.toThrow('Missing flag group config');
  });

  it('does not require group state when the flag is archived', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'project-1',
    });
    prisma.environment.findFirst.mockResolvedValue({
      id: 'environment-1',
      key: 'production',
    });
    prisma.featureFlag.findFirst.mockResolvedValue({
      id: 'flag-1',
      groupId: 'group-1',
      lifecycleStatus: FeatureFlagLifecycleStatus.ARCHIVED,
    });
    prisma.flagEnvironmentConfig.findUnique.mockResolvedValue({
      status: FlagConfigStatus.ENABLED,
      servingMode: ServingMode.GLOBAL_ON,
      killSwitch: false,
      rules: [],
    });

    await expect(
      repository.findSnapshot({
        projectKey: 'demo-project',
        flagKey: 'new-checkout',
      }),
    ).resolves.toMatchObject({
      flag: {
        lifecycleStatus: FeatureFlagLifecycleStatus.ARCHIVED,
      },
      group: null,
    });

    expect(prisma.flagGroupConfig.findUnique).not.toHaveBeenCalled();
  });

  it('does not require group state when the flag config is disabled', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'project-1',
    });
    prisma.environment.findFirst.mockResolvedValue({
      id: 'environment-1',
      key: 'production',
    });
    prisma.featureFlag.findFirst.mockResolvedValue({
      id: 'flag-1',
      groupId: 'group-1',
      lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
    });
    prisma.flagEnvironmentConfig.findUnique.mockResolvedValue({
      status: FlagConfigStatus.DISABLED,
      servingMode: ServingMode.GLOBAL_ON,
      killSwitch: true,
      rules: [],
    });

    await expect(
      repository.findSnapshot({
        projectKey: 'demo-project',
        flagKey: 'new-checkout',
      }),
    ).resolves.toMatchObject({
      group: null,
      config: {
        status: FlagConfigStatus.DISABLED,
      },
    });

    expect(prisma.flagGroupConfig.findUnique).not.toHaveBeenCalled();
  });
});
