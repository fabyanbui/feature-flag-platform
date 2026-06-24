import {
  FeatureFlagLifecycleStatus,
  FlagConfigStatus,
  RuleType,
  ServingMode,
} from '@prisma/client';
import { evaluateFlag, errorResult, notFoundResult } from './evaluation-engine';
import {
  EvaluationInput,
  EvaluationReason,
  EvaluationRule,
  EvaluationSnapshot,
} from './evaluation.types';

const baseInput: EvaluationInput = {
  projectKey: 'demo-project',
  flagKey: 'new-checkout',
  context: {
    targetingKey: 'demo-user-regular',
    userId: 'demo-user-regular',
    roles: ['user'],
  },
};

function createRule(override: Partial<EvaluationRule> = {}): EvaluationRule {
  return {
    id: 'rule-1',
    type: RuleType.USER_ALLOWLIST,
    priority: 10,
    enabled: true,
    parameters: {
      userIds: ['demo-user-regular'],
    },
    ...override,
  };
}

function createSnapshot(
  override: Partial<EvaluationSnapshot> = {},
): EvaluationSnapshot {
  return {
    flag: {
      lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
    },
    config: {
      status: FlagConfigStatus.ENABLED,
      servingMode: ServingMode.TARGETED,
      killSwitch: false,
    },
    rules: [],
    ...override,
  };
}

function evaluatePercentageRule(
  percentage: number,
  targetingKey: string,
): ReturnType<typeof evaluateFlag> {
  return evaluateFlag(
    {
      ...baseInput,
      context: {
        ...baseInput.context,
        targetingKey,
      },
    },
    createSnapshot({
      rules: [
        createRule({
          id: 'percentage-rule',
          type: RuleType.PERCENTAGE_ROLLOUT,
          parameters: {
            percentage,
          },
        }),
      ],
    }),
  );
}

describe('evaluation engine result helpers', () => {
  it('builds NOT_FOUND result', () => {
    expect(notFoundResult(baseInput)).toEqual({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      enabled: false,
      variant: 'off',
      reason: EvaluationReason.NOT_FOUND,
      matchedRuleId: null,
    });
  });

  it('builds ERROR result', () => {
    expect(errorResult(baseInput)).toEqual({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      enabled: false,
      variant: 'off',
      reason: EvaluationReason.ERROR,
      matchedRuleId: null,
    });
  });
});

describe('evaluateFlag', () => {
  describe('terminal-condition precedence', () => {
    it('returns FLAG_ARCHIVED before FLAG_DISABLED', () => {
      const result = evaluateFlag(
        baseInput,
        createSnapshot({
          flag: {
            lifecycleStatus: FeatureFlagLifecycleStatus.ARCHIVED,
          },
          config: {
            status: FlagConfigStatus.DISABLED,
            servingMode: ServingMode.GLOBAL_ON,
            killSwitch: true,
          },
        }),
      );

      expect(result).toMatchObject({
        enabled: false,
        variant: 'off',
        reason: EvaluationReason.FLAG_ARCHIVED,
        matchedRuleId: null,
      });
    });

    it('returns FLAG_DISABLED before KILL_SWITCH', () => {
      const result = evaluateFlag(
        baseInput,
        createSnapshot({
          config: {
            status: FlagConfigStatus.DISABLED,
            servingMode: ServingMode.GLOBAL_ON,
            killSwitch: true,
          },
        }),
      );

      expect(result).toMatchObject({
        enabled: false,
        variant: 'off',
        reason: EvaluationReason.FLAG_DISABLED,
        matchedRuleId: null,
      });
    });

    it('returns KILL_SWITCH before GLOBAL_ON', () => {
      const result = evaluateFlag(
        baseInput,
        createSnapshot({
          config: {
            status: FlagConfigStatus.ENABLED,
            servingMode: ServingMode.GLOBAL_ON,
            killSwitch: true,
          },
        }),
      );

      expect(result).toMatchObject({
        enabled: false,
        variant: 'off',
        reason: EvaluationReason.KILL_SWITCH,
        matchedRuleId: null,
      });
    });
  });

  it('returns FLAG_ARCHIVED when flag is archived', () => {
    const result = evaluateFlag(
      baseInput,
      createSnapshot({
        flag: {
          lifecycleStatus: FeatureFlagLifecycleStatus.ARCHIVED,
        },
      }),
    );

    expect(result.enabled).toBe(false);
    expect(result.reason).toBe(EvaluationReason.FLAG_ARCHIVED);
    expect(result.matchedRuleId).toBeNull();
  });

  it('returns KILL_SWITCH when kill switch is enabled', () => {
    const result = evaluateFlag(
      baseInput,
      createSnapshot({
        config: {
          status: FlagConfigStatus.ENABLED,
          servingMode: ServingMode.TARGETED,
          killSwitch: true,
        },
      }),
    );

    expect(result.enabled).toBe(false);
    expect(result.reason).toBe(EvaluationReason.KILL_SWITCH);
  });

  it('returns KILL_SWITCH before evaluating matching targeting rules', () => {
    const result = evaluateFlag(
      baseInput,
      createSnapshot({
        config: {
          status: FlagConfigStatus.ENABLED,
          servingMode: ServingMode.TARGETED,
          killSwitch: true,
        },
        rules: [
          createRule({
            id: 'allowlist-rule',
            type: RuleType.USER_ALLOWLIST,
            parameters: {
              userIds: ['demo-user-regular'],
            },
          }),
          createRule({
            id: 'percentage-rule',
            type: RuleType.PERCENTAGE_ROLLOUT,
            parameters: {
              percentage: 100,
            },
          }),
        ],
      }),
    );

    expect(result.enabled).toBe(false);
    expect(result.reason).toBe(EvaluationReason.KILL_SWITCH);
    expect(result.matchedRuleId).toBeNull();
  });

  it('returns FLAG_DISABLED when config is disabled', () => {
    const result = evaluateFlag(
      baseInput,
      createSnapshot({
        config: {
          status: FlagConfigStatus.DISABLED,
          servingMode: ServingMode.TARGETED,
          killSwitch: false,
        },
      }),
    );

    expect(result.enabled).toBe(false);
    expect(result.reason).toBe(EvaluationReason.FLAG_DISABLED);
  });

  it('returns GLOBAL_ON when serving mode is global on', () => {
    const result = evaluateFlag(
      baseInput,
      createSnapshot({
        config: {
          status: FlagConfigStatus.ENABLED,
          servingMode: ServingMode.GLOBAL_ON,
          killSwitch: false,
        },
      }),
    );

    expect(result.enabled).toBe(true);
    expect(result.variant).toBe('on');
    expect(result.reason).toBe(EvaluationReason.GLOBAL_ON);
    expect(result.matchedRuleId).toBeNull();
  });

  it('returns USER_ALLOWLIST when userId matches allowlist rule', () => {
    const result = evaluateFlag(
      baseInput,
      createSnapshot({
        rules: [
          createRule({
            id: 'allowlist-rule',
            type: RuleType.USER_ALLOWLIST,
            parameters: {
              userIds: ['demo-user-regular'],
            },
          }),
        ],
      }),
    );

    expect(result.enabled).toBe(true);
    expect(result.reason).toBe(EvaluationReason.USER_ALLOWLIST);
    expect(result.matchedRuleId).toBe('allowlist-rule');
  });

  it('skips user allowlist when context has no userId', () => {
    const result = evaluateFlag(
      {
        ...baseInput,
        context: {
          targetingKey: 'demo-user-regular',
          roles: ['user'],
        },
      },
      createSnapshot({
        rules: [
          createRule({
            id: 'allowlist-rule',
            type: RuleType.USER_ALLOWLIST,
            parameters: {
              userIds: ['demo-user-regular'],
            },
          }),
        ],
      }),
    );

    expect(result.enabled).toBe(false);
    expect(result.reason).toBe(EvaluationReason.DEFAULT_OFF);
  });

  it('returns ROLE_MATCH when context role matches role rule', () => {
    const result = evaluateFlag(
      {
        ...baseInput,
        context: {
          targetingKey: 'demo-user-beta',
          userId: 'demo-user-beta',
          roles: ['beta-tester'],
        },
      },
      createSnapshot({
        rules: [
          createRule({
            id: 'role-rule',
            type: RuleType.ROLE_TARGETING,
            parameters: {
              roles: ['beta-tester'],
            },
          }),
        ],
      }),
    );

    expect(result.enabled).toBe(true);
    expect(result.reason).toBe(EvaluationReason.ROLE_MATCH);
    expect(result.matchedRuleId).toBe('role-rule');
  });

  it('returns INVALID_CONTEXT when percentage rule is reached without targetingKey', () => {
    const result = evaluateFlag(
      {
        ...baseInput,
        context: {
          userId: 'demo-user-regular',
          roles: ['user'],
        },
      },
      createSnapshot({
        rules: [
          createRule({
            id: 'percentage-rule',
            type: RuleType.PERCENTAGE_ROLLOUT,
            parameters: {
              percentage: 50,
            },
          }),
        ],
      }),
    );

    expect(result.enabled).toBe(false);
    expect(result.reason).toBe(EvaluationReason.INVALID_CONTEXT);
    expect(result.matchedRuleId).toBeNull();
  });

  it.each([
    {
      percentage: 0,
      targetingKey: 'phase-10-user-141',
      expectedEnabled: false,
      expectedReason: EvaluationReason.DEFAULT_OFF,
      expectedRuleId: null,
    },
    {
      percentage: 1,
      targetingKey: 'phase-10-user-141',
      expectedEnabled: true,
      expectedReason: EvaluationReason.PERCENTAGE_ROLLOUT,
      expectedRuleId: 'percentage-rule',
    },
    {
      percentage: 1,
      targetingKey: 'phase-10-user-230',
      expectedEnabled: false,
      expectedReason: EvaluationReason.DEFAULT_OFF,
      expectedRuleId: null,
    },
    {
      percentage: 50,
      targetingKey: 'phase-10-user-232',
      expectedEnabled: true,
      expectedReason: EvaluationReason.PERCENTAGE_ROLLOUT,
      expectedRuleId: 'percentage-rule',
    },
    {
      percentage: 50,
      targetingKey: 'phase-10-user-402',
      expectedEnabled: false,
      expectedReason: EvaluationReason.DEFAULT_OFF,
      expectedRuleId: null,
    },
    {
      percentage: 100,
      targetingKey: 'phase-10-user-798',
      expectedEnabled: true,
      expectedReason: EvaluationReason.PERCENTAGE_ROLLOUT,
      expectedRuleId: 'percentage-rule',
    },
  ])(
    'evaluates $targetingKey correctly at $percentage percent',
    ({
      percentage,
      targetingKey,
      expectedEnabled,
      expectedReason,
      expectedRuleId,
    }) => {
      const result = evaluatePercentageRule(percentage, targetingKey);

      expect(result).toMatchObject({
        enabled: expectedEnabled,
        variant: expectedEnabled ? 'on' : 'off',
        reason: expectedReason,
        matchedRuleId: expectedRuleId,
      });
    },
  );

  it('returns deterministic percentage rollout result for same input', () => {
    const snapshot = createSnapshot({
      rules: [
        createRule({
          id: 'percentage-rule',
          type: RuleType.PERCENTAGE_ROLLOUT,
          parameters: {
            percentage: 50,
          },
        }),
      ],
    });

    const first = evaluateFlag(baseInput, snapshot);
    const second = evaluateFlag(baseInput, snapshot);

    expect(second).toEqual(first);
  });

  it('skips disabled rules', () => {
    const result = evaluateFlag(
      baseInput,
      createSnapshot({
        rules: [
          createRule({
            id: 'disabled-allowlist-rule',
            type: RuleType.USER_ALLOWLIST,
            enabled: false,
            parameters: {
              userIds: ['demo-user-regular'],
            },
          }),
        ],
      }),
    );

    expect(result.enabled).toBe(false);
    expect(result.reason).toBe(EvaluationReason.DEFAULT_OFF);
  });

  it('continues to the next user allowlist rule when an earlier rule does not match', () => {
    const result = evaluateFlag(
      baseInput,
      createSnapshot({
        rules: [
          createRule({
            id: 'non-matching-allowlist',
            type: RuleType.USER_ALLOWLIST,
            priority: 10,
            parameters: {
              userIds: ['another-user'],
            },
          }),
          createRule({
            id: 'matching-allowlist',
            type: RuleType.USER_ALLOWLIST,
            priority: 20,
            parameters: {
              userIds: ['demo-user-regular'],
            },
          }),
        ],
      }),
    );

    expect(result).toMatchObject({
      enabled: true,
      reason: EvaluationReason.USER_ALLOWLIST,
      matchedRuleId: 'matching-allowlist',
    });
  });

  it('ignores a disabled matching rule and uses the next enabled rule', () => {
    const result = evaluateFlag(
      baseInput,
      createSnapshot({
        rules: [
          createRule({
            id: 'disabled-matching-allowlist',
            type: RuleType.USER_ALLOWLIST,
            priority: 10,
            enabled: false,
            parameters: {
              userIds: ['demo-user-regular'],
            },
          }),
          createRule({
            id: 'enabled-matching-allowlist',
            type: RuleType.USER_ALLOWLIST,
            priority: 20,
            enabled: true,
            parameters: {
              userIds: ['demo-user-regular'],
            },
          }),
        ],
      }),
    );

    expect(result).toMatchObject({
      enabled: true,
      reason: EvaluationReason.USER_ALLOWLIST,
      matchedRuleId: 'enabled-matching-allowlist',
    });
  });

  it('continues to a later percentage rule when an earlier rule does not match', () => {
    const result = evaluateFlag(
      baseInput,
      createSnapshot({
        rules: [
          createRule({
            id: 'zero-percent-rule',
            type: RuleType.PERCENTAGE_ROLLOUT,
            priority: 10,
            parameters: {
              percentage: 0,
            },
          }),
          createRule({
            id: 'full-rollout-rule',
            type: RuleType.PERCENTAGE_ROLLOUT,
            priority: 20,
            parameters: {
              percentage: 100,
            },
          }),
        ],
      }),
    );

    expect(result).toMatchObject({
      enabled: true,
      reason: EvaluationReason.PERCENTAGE_ROLLOUT,
      matchedRuleId: 'full-rollout-rule',
    });
  });

  it('uses type precedence before priority across different rule types', () => {
    const result = evaluateFlag(
      {
        ...baseInput,
        context: {
          targetingKey: 'demo-user-beta',
          userId: 'demo-user-beta',
          roles: ['beta-tester'],
        },
      },
      createSnapshot({
        rules: [
          createRule({
            id: 'role-rule',
            type: RuleType.ROLE_TARGETING,
            priority: 1,
            parameters: {
              roles: ['beta-tester'],
            },
          }),
          createRule({
            id: 'allowlist-rule',
            type: RuleType.USER_ALLOWLIST,
            priority: 99,
            parameters: {
              userIds: ['demo-user-beta'],
            },
          }),
        ],
      }),
    );

    expect(result.reason).toBe(EvaluationReason.USER_ALLOWLIST);
    expect(result.matchedRuleId).toBe('allowlist-rule');
  });

  it('uses lower priority first within the same rule type', () => {
    const result = evaluateFlag(
      {
        ...baseInput,
        context: {
          targetingKey: 'demo-user-beta',
          userId: 'demo-user-beta',
          roles: ['beta-tester', 'internal'],
        },
      },
      createSnapshot({
        rules: [
          createRule({
            id: 'later-role-rule',
            type: RuleType.ROLE_TARGETING,
            priority: 20,
            parameters: {
              roles: ['beta-tester'],
            },
          }),
          createRule({
            id: 'earlier-role-rule',
            type: RuleType.ROLE_TARGETING,
            priority: 10,
            parameters: {
              roles: ['internal'],
            },
          }),
        ],
      }),
    );

    expect(result.reason).toBe(EvaluationReason.ROLE_MATCH);
    expect(result.matchedRuleId).toBe('earlier-role-rule');
  });

  it('returns DEFAULT_OFF when no rule matches', () => {
    const result = evaluateFlag(
      baseInput,
      createSnapshot({
        rules: [
          createRule({
            id: 'role-rule',
            type: RuleType.ROLE_TARGETING,
            parameters: {
              roles: ['beta-tester'],
            },
          }),
        ],
      }),
    );

    expect(result.enabled).toBe(false);
    expect(result.variant).toBe('off');
    expect(result.reason).toBe(EvaluationReason.DEFAULT_OFF);
    expect(result.matchedRuleId).toBeNull();
  });
});
