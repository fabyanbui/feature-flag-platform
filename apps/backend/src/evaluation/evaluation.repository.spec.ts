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
            findUnique: jest.fn(),
        },
        environment: {
            findFirst: jest.fn(),
        },
        featureFlag: {
            findUnique: jest.fn(),
        },
        flagEnvironmentConfig: {
            findUnique: jest.fn(),
        },
    };

    let repository: EvaluationRepository;

    beforeEach(() => {
        jest.clearAllMocks();

        repository = new EvaluationRepository(prisma as never);
    });

    it('returns null when project is missing', async () => {
        prisma.project.findUnique.mockResolvedValue(null);

        await expect(
            repository.findSnapshot({
                projectKey: 'missing-project',
                flagKey: 'new-checkout',
            }),
        ).resolves.toBeNull();

        expect(prisma.environment.findFirst).not.toHaveBeenCalled();
        expect(prisma.featureFlag.findUnique).not.toHaveBeenCalled();
        expect(prisma.flagEnvironmentConfig.findUnique).not.toHaveBeenCalled();
    });

    it('returns null when default environment is missing', async () => {
        prisma.project.findUnique.mockResolvedValue({
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
            },
        });

        expect(prisma.featureFlag.findUnique).not.toHaveBeenCalled();
    });

    it('returns null when explicit environment is missing', async () => {
        prisma.project.findUnique.mockResolvedValue({
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
            },
        });

        expect(prisma.featureFlag.findUnique).not.toHaveBeenCalled();
    });

    it('returns null when flag is missing', async () => {
        prisma.project.findUnique.mockResolvedValue({
            id: 'project-1',
        });
        prisma.environment.findFirst.mockResolvedValue({
            id: 'environment-1',
        });
        prisma.featureFlag.findUnique.mockResolvedValue(null);

        await expect(
            repository.findSnapshot({
                projectKey: 'demo-project',
                flagKey: 'missing-flag',
            }),
        ).resolves.toBeNull();

        expect(prisma.featureFlag.findUnique).toHaveBeenCalledWith({
            where: {
                projectId_key: {
                    projectId: 'project-1',
                    key: 'missing-flag',
                },
            },
            select: {
                id: true,
                lifecycleStatus: true,
            },
        });

        expect(prisma.flagEnvironmentConfig.findUnique).not.toHaveBeenCalled();
    });

    it('returns null when config is missing', async () => {
        prisma.project.findUnique.mockResolvedValue({
            id: 'project-1',
        });
        prisma.environment.findFirst.mockResolvedValue({
            id: 'environment-1',
        });
        prisma.featureFlag.findUnique.mockResolvedValue({
            id: 'flag-1',
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

        prisma.project.findUnique.mockResolvedValue({
            id: 'project-1',
        });
        prisma.environment.findFirst.mockResolvedValue({
            id: 'environment-1',
        });
        prisma.featureFlag.findUnique.mockResolvedValue({
            id: 'flag-1',
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
            flag: {
                lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
            },
            config: {
                status: FlagConfigStatus.ENABLED,
                servingMode: ServingMode.TARGETED,
                killSwitch: false,
            },
            rules,
        });
    });

    it('orders selected rules by priority ascending', async () => {
        prisma.project.findUnique.mockResolvedValue({
            id: 'project-1',
        });
        prisma.environment.findFirst.mockResolvedValue({
            id: 'environment-1',
        });
        prisma.featureFlag.findUnique.mockResolvedValue({
            id: 'flag-1',
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
});