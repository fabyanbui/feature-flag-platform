import {
  AuditAction,
  AuditTargetType,
  FeatureFlagLifecycleStatus,
  FlagConfigStatus,
  RuleType,
  ServingMode,
} from '@prisma/client';
import { ApiErrorCode } from '../common/errors/api-error-code';
import { FlagRulesService } from './flag-rules.service';

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

function createDefaultConfig(overrides = {}) {
  return {
    id: 'config-1',
    projectId: 'project-1',
    flagId: 'flag-1',
    environmentId: 'environment-1',
    status: FlagConfigStatus.ENABLED,
    servingMode: ServingMode.TARGETED,
    killSwitch: false,
    environment: {
      key: 'production',
      isDefault: true,
    },
    ...overrides,
  };
}

function createFlagWithDefaultConfig(overrides = {}) {
  return {
    id: 'flag-1',
    projectId: 'project-1',
    key: 'new-checkout',
    name: 'New Checkout',
    description: null,
    lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
    archivedAt: null,
    createdAt: fixedDate,
    updatedAt: fixedDate,
    environmentConfigs: [createDefaultConfig()],
    ...overrides,
  };
}

function createRule(overrides = {}) {
  return {
    id: 'rule-1',
    flagConfigId: 'config-1',
    type: RuleType.ROLE_TARGETING,
    priority: 10,
    enabled: true,
    parameters: {
      roles: ['beta-tester'],
    },
    createdAt: fixedDate,
    updatedAt: fixedDate,
    ...overrides,
  };
}

describe('FlagRulesService', () => {
  const tx = {
    kind: 'transaction-client',
  } as never;

  const projectsRepository = {
    findByKey: jest.fn(),
  };

  const featureFlagsRepository = {
    findByProjectIdAndKeyWithConfigs: jest.fn(),
  };

  const flagRulesRepository = {
    findMany: jest.fn(),
    count: jest.fn(),
    findByConfigId: jest.fn(),
    deleteByConfigId: jest.fn(),
    createMany: jest.fn(),
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

  let service: FlagRulesService;

  beforeEach(() => {
    jest.clearAllMocks();

    transactionService.run.mockImplementation(async (callback) => callback(tx));
    requestContext.getActor.mockReturnValue('mentor@example.local');
    requestContext.getRequestId.mockReturnValue('req-test');

    service = new FlagRulesService(
      projectsRepository as never,
      featureFlagsRepository as never,
      flagRulesRepository as never,
      transactionService as never,
      auditLogService,
      requestContext as never,
    );
  });

  async function expectValidationError(rules: unknown[]) {
    await expect(
      service.replace('demo-project', 'new-checkout', {
        rules,
      } as never),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: ApiErrorCode.VALIDATION_ERROR,
      }),
    });

    expect(transactionService.run).not.toHaveBeenCalled();
    expect(auditLogService.record).not.toHaveBeenCalled();
  }

  describe('list', () => {
    it('throws NOT_FOUND when project is missing', async () => {
      projectsRepository.findByKey.mockResolvedValue(null);

      await expect(
        service.list('missing-project', 'new-checkout', {
          limit: 20,
          offset: 0,
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ApiErrorCode.NOT_FOUND,
        }),
      });

      expect(projectsRepository.findByKey).toHaveBeenCalledWith(
        'missing-project',
      );
      expect(
        featureFlagsRepository.findByProjectIdAndKeyWithConfigs,
      ).not.toHaveBeenCalled();
      expect(flagRulesRepository.findMany).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND when flag is missing', async () => {
      projectsRepository.findByKey.mockResolvedValue(createProject());
      featureFlagsRepository.findByProjectIdAndKeyWithConfigs.mockResolvedValue(
        null,
      );

      await expect(
        service.list('demo-project', 'missing-flag', {
          limit: 20,
          offset: 0,
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ApiErrorCode.NOT_FOUND,
        }),
      });

      expect(
        featureFlagsRepository.findByProjectIdAndKeyWithConfigs,
      ).toHaveBeenCalledWith('project-1', 'missing-flag');
      expect(flagRulesRepository.findMany).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND when default config is missing', async () => {
      projectsRepository.findByKey.mockResolvedValue(createProject());
      featureFlagsRepository.findByProjectIdAndKeyWithConfigs.mockResolvedValue(
        createFlagWithDefaultConfig({
          environmentConfigs: [],
        }),
      );

      await expect(
        service.list('demo-project', 'new-checkout', {
          limit: 20,
          offset: 0,
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ApiErrorCode.NOT_FOUND,
        }),
      });

      expect(flagRulesRepository.findMany).not.toHaveBeenCalled();
    });

    it('filters by rule type and defaults sort to priority ascending', async () => {
      const rule = createRule();

      projectsRepository.findByKey.mockResolvedValue(createProject());
      featureFlagsRepository.findByProjectIdAndKeyWithConfigs.mockResolvedValue(
        createFlagWithDefaultConfig(),
      );
      flagRulesRepository.findMany.mockResolvedValue([rule]);
      flagRulesRepository.count.mockResolvedValue(1);

      const result = await service.list('demo-project', 'new-checkout', {
        type: RuleType.ROLE_TARGETING,
        limit: 20,
        offset: 0,
      });

      const expectedWhere = {
        flagConfigId: 'config-1',
        type: RuleType.ROLE_TARGETING,
      };

      expect(flagRulesRepository.findMany).toHaveBeenCalledWith(
        expectedWhere,
        {
          priority: 'asc',
        },
        20,
        0,
      );
      expect(flagRulesRepository.count).toHaveBeenCalledWith(expectedWhere);

      expect(result).toEqual({
        items: [
          {
            id: 'rule-1',
            type: RuleType.ROLE_TARGETING,
            priority: 10,
            enabled: true,
            parameters: {
              roles: ['beta-tester'],
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

    it('supports explicit sort and order', async () => {
      projectsRepository.findByKey.mockResolvedValue(createProject());
      featureFlagsRepository.findByProjectIdAndKeyWithConfigs.mockResolvedValue(
        createFlagWithDefaultConfig(),
      );
      flagRulesRepository.findMany.mockResolvedValue([]);
      flagRulesRepository.count.mockResolvedValue(0);

      await service.list('demo-project', 'new-checkout', {
        limit: 10,
        offset: 20,
        sort: 'createdAt',
        order: 'desc',
      });

      expect(flagRulesRepository.findMany).toHaveBeenCalledWith(
        {
          flagConfigId: 'config-1',
          type: undefined,
        },
        {
          createdAt: 'desc',
        },
        10,
        20,
      );
    });

    it('rejects unsupported sort field', async () => {
      projectsRepository.findByKey.mockResolvedValue(createProject());
      featureFlagsRepository.findByProjectIdAndKeyWithConfigs.mockResolvedValue(
        createFlagWithDefaultConfig(),
      );

      await expect(
        service.list('demo-project', 'new-checkout', {
          limit: 20,
          offset: 0,
          sort: 'unsupported',
          order: 'asc',
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ApiErrorCode.VALIDATION_ERROR,
        }),
      });

      expect(flagRulesRepository.findMany).not.toHaveBeenCalled();
      expect(flagRulesRepository.count).not.toHaveBeenCalled();
    });
  });

  describe('replace validation', () => {
    it('rejects duplicate priorities', async () => {
      await expectValidationError([
        {
          type: RuleType.USER_ALLOWLIST,
          priority: 10,
          enabled: true,
          parameters: {
            userIds: ['demo-user-beta'],
          },
        },
        {
          type: RuleType.ROLE_TARGETING,
          priority: 10,
          enabled: true,
          parameters: {
            roles: ['beta-tester'],
          },
        },
      ]);
    });

    it('rejects user allowlist with missing userIds', async () => {
      await expectValidationError([
        {
          type: RuleType.USER_ALLOWLIST,
          priority: 10,
          enabled: true,
          parameters: {},
        },
      ]);
    });

    it('rejects user allowlist with empty userIds', async () => {
      await expectValidationError([
        {
          type: RuleType.USER_ALLOWLIST,
          priority: 10,
          enabled: true,
          parameters: {
            userIds: [],
          },
        },
      ]);
    });

    it('rejects user allowlist with whitespace-only userIds', async () => {
      await expectValidationError([
        {
          type: RuleType.USER_ALLOWLIST,
          priority: 10,
          enabled: true,
          parameters: {
            userIds: ['   '],
          },
        },
      ]);
    });

    it('rejects role targeting with missing roles', async () => {
      await expectValidationError([
        {
          type: RuleType.ROLE_TARGETING,
          priority: 10,
          enabled: true,
          parameters: {},
        },
      ]);
    });

    it('rejects role targeting with empty roles', async () => {
      await expectValidationError([
        {
          type: RuleType.ROLE_TARGETING,
          priority: 10,
          enabled: true,
          parameters: {
            roles: [],
          },
        },
      ]);
    });

    it('rejects role targeting with whitespace-only roles', async () => {
      await expectValidationError([
        {
          type: RuleType.ROLE_TARGETING,
          priority: 10,
          enabled: true,
          parameters: {
            roles: ['   '],
          },
        },
      ]);
    });

    it('rejects percentage rollout below 0', async () => {
      await expectValidationError([
        {
          type: RuleType.PERCENTAGE_ROLLOUT,
          priority: 10,
          enabled: true,
          parameters: {
            percentage: -1,
          },
        },
      ]);
    });

    it('rejects percentage rollout above 100', async () => {
      await expectValidationError([
        {
          type: RuleType.PERCENTAGE_ROLLOUT,
          priority: 10,
          enabled: true,
          parameters: {
            percentage: 101,
          },
        },
      ]);
    });

    it('rejects percentage rollout with more than two decimals', async () => {
      await expectValidationError([
        {
          type: RuleType.PERCENTAGE_ROLLOUT,
          priority: 10,
          enabled: true,
          parameters: {
            percentage: 10.123,
          },
        },
      ]);
    });

    it('rejects percentage rollout supplied as a string', async () => {
      await expectValidationError([
        {
          type: RuleType.PERCENTAGE_ROLLOUT,
          priority: 10,
          enabled: true,
          parameters: {
            percentage: '50',
          },
        },
      ]);
    });

    it('rejects unsupported rule type', async () => {
      await expectValidationError([
        {
          type: 'UNKNOWN_RULE_TYPE',
          priority: 10,
          enabled: true,
          parameters: {},
        },
      ]);
    });
  });

  describe('replace transaction and audit', () => {
    it('requires actor before starting transaction', async () => {
      requestContext.getActor.mockReturnValue(undefined);

      await expect(
        service.replace('demo-project', 'new-checkout', {
          rules: [],
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ApiErrorCode.VALIDATION_ERROR,
        }),
      });

      expect(transactionService.run).not.toHaveBeenCalled();
      expect(flagRulesRepository.deleteByConfigId).not.toHaveBeenCalled();
      expect(auditLogService.record).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND when project does not exist inside transaction', async () => {
      projectsRepository.findByKey.mockResolvedValue(null);

      await expect(
        service.replace('missing-project', 'new-checkout', {
          rules: [],
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ApiErrorCode.NOT_FOUND,
        }),
      });

      expect(transactionService.run).toHaveBeenCalledTimes(1);
      expect(projectsRepository.findByKey).toHaveBeenCalledWith(
        'missing-project',
        tx,
      );
      expect(
        featureFlagsRepository.findByProjectIdAndKeyWithConfigs,
      ).not.toHaveBeenCalled();
      expect(auditLogService.record).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND when flag does not exist inside transaction', async () => {
      projectsRepository.findByKey.mockResolvedValue(createProject());
      featureFlagsRepository.findByProjectIdAndKeyWithConfigs.mockResolvedValue(
        null,
      );

      await expect(
        service.replace('demo-project', 'missing-flag', {
          rules: [],
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ApiErrorCode.NOT_FOUND,
        }),
      });

      expect(
        featureFlagsRepository.findByProjectIdAndKeyWithConfigs,
      ).toHaveBeenCalledWith('project-1', 'missing-flag', tx);
      expect(flagRulesRepository.deleteByConfigId).not.toHaveBeenCalled();
      expect(auditLogService.record).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND when default config is missing inside transaction', async () => {
      projectsRepository.findByKey.mockResolvedValue(createProject());
      featureFlagsRepository.findByProjectIdAndKeyWithConfigs.mockResolvedValue(
        createFlagWithDefaultConfig({
          environmentConfigs: [],
        }),
      );

      await expect(
        service.replace('demo-project', 'new-checkout', {
          rules: [],
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ApiErrorCode.NOT_FOUND,
        }),
      });

      expect(flagRulesRepository.deleteByConfigId).not.toHaveBeenCalled();
      expect(auditLogService.record).not.toHaveBeenCalled();
    });

    it('clears existing rules without calling createMany when rules array is empty', async () => {
      const beforeRule = createRule({
        id: 'old-rule',
        priority: 10,
      });

      projectsRepository.findByKey.mockResolvedValue(createProject());
      featureFlagsRepository.findByProjectIdAndKeyWithConfigs.mockResolvedValue(
        createFlagWithDefaultConfig(),
      );
      flagRulesRepository.findByConfigId
        .mockResolvedValueOnce([beforeRule])
        .mockResolvedValueOnce([]);

      const result = await service.replace('demo-project', 'new-checkout', {
        rules: [],
      });

      expect(flagRulesRepository.findByConfigId).toHaveBeenNthCalledWith(
        1,
        'config-1',
        tx,
      );
      expect(flagRulesRepository.deleteByConfigId).toHaveBeenCalledWith(
        'config-1',
        tx,
      );
      expect(flagRulesRepository.createMany).not.toHaveBeenCalled();
      expect(flagRulesRepository.findByConfigId).toHaveBeenNthCalledWith(
        2,
        'config-1',
        tx,
      );

      expect(result).toEqual([]);
    });

    it('creates replacement rules and returns persisted rules', async () => {
      const beforeRule = createRule({
        id: 'old-rule',
        priority: 10,
        parameters: {
          roles: ['old-role'],
        },
      });

      const afterRule = createRule({
        id: 'new-rule',
        priority: 20,
        parameters: {
          roles: ['beta-tester'],
        },
      });

      projectsRepository.findByKey.mockResolvedValue(createProject());
      featureFlagsRepository.findByProjectIdAndKeyWithConfigs.mockResolvedValue(
        createFlagWithDefaultConfig(),
      );
      flagRulesRepository.findByConfigId
        .mockResolvedValueOnce([beforeRule])
        .mockResolvedValueOnce([afterRule]);

      const result = await service.replace('demo-project', 'new-checkout', {
        rules: [
          {
            type: RuleType.ROLE_TARGETING,
            priority: 20,
            enabled: true,
            parameters: {
              roles: ['beta-tester'],
            },
          },
        ],
      });

      expect(flagRulesRepository.deleteByConfigId).toHaveBeenCalledWith(
        'config-1',
        tx,
      );

      expect(flagRulesRepository.createMany).toHaveBeenCalledWith(
        [
          {
            flagConfigId: 'config-1',
            type: RuleType.ROLE_TARGETING,
            priority: 20,
            enabled: true,
            parameters: {
              roles: ['beta-tester'],
            },
          },
        ],
        tx,
      );

      expect(result).toEqual([
        {
          id: 'new-rule',
          type: RuleType.ROLE_TARGETING,
          priority: 20,
          enabled: true,
          parameters: {
            roles: ['beta-tester'],
          },
          createdAt: fixedDate,
          updatedAt: fixedDate,
        },
      ]);
    });

    it('writes FLAG_RULES_REPLACED audit entry in the same transaction', async () => {
      const beforeRule = createRule({
        id: 'old-rule',
        priority: 10,
        parameters: {
          roles: ['old-role'],
        },
      });

      const afterRule = createRule({
        id: 'new-rule',
        priority: 20,
        parameters: {
          roles: ['beta-tester'],
        },
      });

      projectsRepository.findByKey.mockResolvedValue(createProject());
      featureFlagsRepository.findByProjectIdAndKeyWithConfigs.mockResolvedValue(
        createFlagWithDefaultConfig(),
      );
      flagRulesRepository.findByConfigId
        .mockResolvedValueOnce([beforeRule])
        .mockResolvedValueOnce([afterRule]);

      await service.replace('demo-project', 'new-checkout', {
        rules: [
          {
            type: RuleType.ROLE_TARGETING,
            priority: 20,
            enabled: true,
            parameters: {
              roles: ['beta-tester'],
            },
          },
        ],
      });

      expect(auditLogService.record).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          projectId: 'project-1',
          projectKey: 'demo-project',
          environmentId: 'environment-1',
          environmentKey: 'production',
          targetType: AuditTargetType.FEATURE_FLAG,
          targetId: 'flag-1',
          targetKey: 'new-checkout',
          action: AuditAction.FLAG_RULES_REPLACED,
          actor: 'mentor@example.local',
          before: {
            rules: [
              {
                id: 'old-rule',
                type: RuleType.ROLE_TARGETING,
                priority: 10,
                enabled: true,
                parameters: {
                  roles: ['old-role'],
                },
              },
            ],
          },
          after: {
            rules: [
              {
                id: 'new-rule',
                type: RuleType.ROLE_TARGETING,
                priority: 20,
                enabled: true,
                parameters: {
                  roles: ['beta-tester'],
                },
              },
            ],
          },
          metadata: {
            source: 'api',
            replacedRuleCount: 1,
          },
          requestId: 'req-test',
        }),
      );
    });
  });
});
