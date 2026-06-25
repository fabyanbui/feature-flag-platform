import {
  EVALUATION_REASONS,
  type BackendEvaluationResult,
  type EvaluationReason,
} from './contracts.js'

const evaluationReasonSet = new Set<string>(EVALUATION_REASONS)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isEvaluationReason(value: unknown): value is EvaluationReason {
  return typeof value === 'string' && evaluationReasonSet.has(value)
}

export function parseBackendEvaluationResult(
  value: unknown,
  expected: { projectKey: string; flagKey: string },
): BackendEvaluationResult | null {
  if (!isRecord(value) || 'errorSource' in value) {
    return null
  }

  const {
    projectKey,
    flagKey,
    enabled,
    variant,
    reason,
    matchedRuleId,
  } = value

  if (
    projectKey !== expected.projectKey ||
    flagKey !== expected.flagKey ||
    typeof enabled !== 'boolean' ||
    (variant !== 'on' && variant !== 'off') ||
    !isEvaluationReason(reason) ||
    (matchedRuleId !== null && typeof matchedRuleId !== 'string')
  ) {
    return null
  }

  if ((enabled && variant !== 'on') || (!enabled && variant !== 'off')) {
    return null
  }

  return {
    projectKey,
    flagKey,
    enabled,
    variant,
    reason,
    matchedRuleId,
  }
}
