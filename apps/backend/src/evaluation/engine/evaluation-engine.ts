import { RuleType } from '@prisma/client';
import {
  EvaluationInput,
  EvaluationReason,
  EvaluationResult,
  EvaluationRule,
  EvaluationSnapshot,
} from './evaluation.types';
import {
  getStableRolloutBucketPercentage,
  isValidRolloutPercentage,
} from './stable-rollout-hash';

function buildResult(
  input: EvaluationInput,
  enabled: boolean,
  reason: EvaluationReason,
  matchedRuleId: string | null = null,
): EvaluationResult {
  return {
    projectKey: input.projectKey,
    flagKey: input.flagKey,
    enabled,
    variant: enabled ? 'on' : 'off',
    reason,
    matchedRuleId,
  };
}

export function notFoundResult(input: EvaluationInput): EvaluationResult {
  return buildResult(input, false, EvaluationReason.NOT_FOUND);
}

export function errorResult(input: EvaluationInput): EvaluationResult {
  return buildResult(input, false, EvaluationReason.ERROR);
}

export function evaluateFlag(
  input: EvaluationInput,
  snapshot: EvaluationSnapshot,
): EvaluationResult {
  const { flag, config, rules } = snapshot;

  if (flag.lifecycleStatus === 'ARCHIVED') {
    return buildResult(input, false, EvaluationReason.FLAG_ARCHIVED);
  }

  if (config.status === 'DISABLED') {
    return buildResult(input, false, EvaluationReason.FLAG_DISABLED);
  }

  if (config.killSwitch) {
    return buildResult(input, false, EvaluationReason.KILL_SWITCH);
  }

  if (config.servingMode === 'GLOBAL_ON') {
    return buildResult(input, true, EvaluationReason.GLOBAL_ON);
  }

  const enabledRules = rules
    .filter((rule) => rule.enabled)
    .sort((a, b) => a.priority - b.priority);

  const userAllowlistResult = evaluateUserAllowlistRules(input, enabledRules);

  if (userAllowlistResult) {
    return userAllowlistResult;
  }

  const roleTargetingResult = evaluateRoleTargetingRules(input, enabledRules);

  if (roleTargetingResult) {
    return roleTargetingResult;
  }

  const percentageRolloutResult = evaluatePercentageRolloutRules(
    input,
    enabledRules,
  );

  if (percentageRolloutResult) {
    return percentageRolloutResult;
  }

  return buildResult(input, false, EvaluationReason.DEFAULT_OFF);
}

function evaluateUserAllowlistRules(
  input: EvaluationInput,
  rules: EvaluationRule[],
): EvaluationResult | null {
  if (!input.context.userId) {
    return null;
  }

  const userAllowlistRules = rules.filter(
    (rule) => rule.type === RuleType.USER_ALLOWLIST,
  );

  for (const rule of userAllowlistRules) {
    const parameters = rule.parameters as { userIds?: unknown };

    if (!isStringArray(parameters.userIds)) {
      continue;
    }

    if (parameters.userIds.includes(input.context.userId)) {
      return buildResult(input, true, EvaluationReason.USER_ALLOWLIST, rule.id);
    }
  }

  return null;
}

function evaluateRoleTargetingRules(
  input: EvaluationInput,
  rules: EvaluationRule[],
): EvaluationResult | null {
  const contextRoles = input.context.roles ?? [];

  if (contextRoles.length === 0) {
    return null;
  }

  const roleTargetingRules = rules.filter(
    (rule) => rule.type === RuleType.ROLE_TARGETING,
  );

  for (const rule of roleTargetingRules) {
    const parameters = rule.parameters as { roles?: unknown };

    if (!isStringArray(parameters.roles)) {
      continue;
    }

    const matched = parameters.roles.some((role) =>
      contextRoles.includes(role),
    );

    if (matched) {
      return buildResult(input, true, EvaluationReason.ROLE_MATCH, rule.id);
    }
  }

  return null;
}

function evaluatePercentageRolloutRules(
  input: EvaluationInput,
  rules: EvaluationRule[],
): EvaluationResult | null {
  const percentageRolloutRules = rules.filter(
    (rule) => rule.type === RuleType.PERCENTAGE_ROLLOUT,
  );

  if (percentageRolloutRules.length === 0) {
    return null;
  }

  const targetingKey = input.context.targetingKey?.trim();

  if (!targetingKey) {
    return buildResult(input, false, EvaluationReason.INVALID_CONTEXT);
  }

  for (const rule of percentageRolloutRules) {
    const parameters = rule.parameters as { percentage?: unknown };

    if (!isValidRolloutPercentage(parameters.percentage)) {
      continue;
    }

    const bucketPercentage = getStableRolloutBucketPercentage({
      projectKey: input.projectKey,
      flagKey: input.flagKey,
      targetingKey,
    });

    if (bucketPercentage < parameters.percentage) {
      return buildResult(
        input,
        true,
        EvaluationReason.PERCENTAGE_ROLLOUT,
        rule.id,
      );
    }
  }

  return null;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}
