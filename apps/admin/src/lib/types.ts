export type PageResponse<T> = {
  items: T[];
  page: {
    limit: number;
    offset: number;
    total: number;
    hasNext: boolean;
  };
};

export type Project = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FeatureFlagLifecycleStatus = "ACTIVE" | "ARCHIVED";

export type FlagConfigStatus = "ENABLED" | "DISABLED";

export type ServingMode = "GLOBAL_ON" | "TARGETED";

export type FeatureFlag = {
  id: string;
  projectKey: string;
  key: string;
  name: string;
  description: string | null;
  lifecycleStatus: FeatureFlagLifecycleStatus;
  status: FlagConfigStatus;
  servingMode: ServingMode;
  killSwitch: boolean;
  environmentKey: string;
  group: {
    key: string;
    name: string;
    killSwitch: boolean;
  } | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RuleType =
  | "USER_ALLOWLIST"
  | "ROLE_TARGETING"
  | "PERCENTAGE_ROLLOUT";

export type FlagRule = {
  id: string;
  type: RuleType;
  priority: number;
  enabled: boolean;
  parameters: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type RuleInput = {
  type: RuleType;
  priority: number;
  enabled: boolean;
  parameters: Record<string, unknown>;
};

export type AuditLog = {
  id: string;
  projectKey: string;
  environmentKey: string | null;
  targetType: string;
  targetId: string;
  targetKey: string | null;
  action: string;
  actor: string;
  before: unknown;
  after: unknown;
  metadata: unknown;
  requestId: string;
  createdAt: string;
};

export type EvaluationContext = {
  targetingKey?: string;
  userId?: string;
  roles?: string[];
  attributes?: Record<string, unknown>;
};

export type EvaluationResult = {
  projectKey: string;
  flagKey: string;
  enabled: boolean;
  variant: "on" | "off";
  reason:
    | "GLOBAL_ON"
    | "FLAG_DISABLED"
    | "FLAG_ARCHIVED"
    | "GROUP_KILL_SWITCH"
    | "KILL_SWITCH"
    | "USER_ALLOWLIST"
    | "ROLE_MATCH"
    | "PERCENTAGE_ROLLOUT"
    | "DEFAULT_OFF"
    | "NOT_FOUND"
    | "INVALID_CONTEXT"
    | "ERROR";
  matchedRuleId: string | null;
};

export type ApiError = {
  code: string;
  message: string;
  details?: Array<{
    field?: string;
    message: string;
  }>;
  requestId?: string;
};
