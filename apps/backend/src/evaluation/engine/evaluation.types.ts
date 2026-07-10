import {
  FeatureFlagLifecycleStatus,
  FlagConfigStatus,
  RuleType,
  ServingMode,
} from '@prisma/client';

export enum EvaluationReason {
  GLOBAL_ON = 'GLOBAL_ON',
  FLAG_DISABLED = 'FLAG_DISABLED',
  FLAG_ARCHIVED = 'FLAG_ARCHIVED',
  GROUP_KILL_SWITCH = 'GROUP_KILL_SWITCH',
  KILL_SWITCH = 'KILL_SWITCH',
  USER_ALLOWLIST = 'USER_ALLOWLIST',
  ROLE_MATCH = 'ROLE_MATCH',
  PERCENTAGE_ROLLOUT = 'PERCENTAGE_ROLLOUT',
  DEFAULT_OFF = 'DEFAULT_OFF',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_CONTEXT = 'INVALID_CONTEXT',
  ERROR = 'ERROR',
}

export type EvaluationVariant = 'on' | 'off';

export interface EvaluationContext {
  targetingKey?: string;
  userId?: string;
  roles?: string[];
  attributes?: Record<string, unknown>;
}

export interface EvaluationInput {
  projectKey: string;
  flagKey: string;
  context: EvaluationContext;
}

export interface EvaluationRule {
  id: string;
  type: RuleType;
  priority: number;
  enabled: boolean;
  parameters: unknown;
}

export interface EvaluationSnapshotResolution {
  projectId: string;
  environmentId: string;
  flagId: string;
  environmentKey: string;
}

export interface EvaluationSnapshot {
  resolution?: EvaluationSnapshotResolution;
  flag: {
    lifecycleStatus: FeatureFlagLifecycleStatus;
  };
  group: {
    killSwitch: boolean;
  } | null;
  config: {
    status: FlagConfigStatus;
    servingMode: ServingMode;
    killSwitch: boolean;
  };
  rules: EvaluationRule[];
}

export interface EvaluationResult {
  projectKey: string;
  flagKey: string;
  enabled: boolean;
  variant: EvaluationVariant;
  reason: EvaluationReason;
  matchedRuleId: string | null;
}
