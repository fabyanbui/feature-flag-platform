export const EVALUATION_REASONS = [
  'GLOBAL_ON',
  'FLAG_DISABLED',
  'FLAG_ARCHIVED',
  'GROUP_KILL_SWITCH',
  'KILL_SWITCH',
  'USER_ALLOWLIST',
  'ROLE_MATCH',
  'PERCENTAGE_ROLLOUT',
  'DEFAULT_OFF',
  'NOT_FOUND',
  'INVALID_CONTEXT',
  'ERROR',
] as const

export type EvaluationReason = (typeof EVALUATION_REASONS)[number]
export type EvaluationVariant = 'on' | 'off'

export interface EvaluationContext {
  targetingKey?: string
  userId?: string
  roles?: string[]
  attributes?: Record<string, unknown>
}

export interface BackendEvaluationResult {
  projectKey: string
  flagKey: string
  enabled: boolean
  variant: EvaluationVariant
  reason: EvaluationReason
  matchedRuleId: string | null
}

export interface ClientEvaluationErrorResult {
  projectKey: string
  flagKey: string
  enabled: false
  variant: 'off'
  reason: 'ERROR'
  matchedRuleId: null
  errorSource: 'CLIENT'
  errorMessage?: string
}

export type SdkEvaluationResult =
  | BackendEvaluationResult
  | ClientEvaluationErrorResult

export interface FeatureFlagClientOptions {
  baseUrl: string
  projectKey: string
  environmentKey?: string
  timeoutMs?: number
  fetch?: typeof globalThis.fetch
}

export interface FeatureFlagClient {
  evaluate(
    flagKey: string,
    context?: EvaluationContext,
  ): Promise<SdkEvaluationResult>
  isEnabled(flagKey: string, context?: EvaluationContext): Promise<boolean>
  getVariant(
    flagKey: string,
    context?: EvaluationContext,
  ): Promise<EvaluationVariant>
}

export function isClientEvaluationError(
  result: SdkEvaluationResult,
): result is ClientEvaluationErrorResult {
  return 'errorSource' in result && result.errorSource === 'CLIENT'
}
