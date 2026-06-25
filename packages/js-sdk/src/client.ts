import type {
  BackendEvaluationResult,
  ClientEvaluationErrorResult,
  EvaluationContext,
  FeatureFlagClient,
  FeatureFlagClientOptions,
  SdkEvaluationResult,
} from './contracts.js'
import { parseBackendEvaluationResult } from './response-validator.js'

const DEFAULT_TIMEOUT_MS = 1500

type ClientFailureKind =
  | 'INVALID_REQUEST'
  | 'TIMEOUT'
  | 'NETWORK'
  | 'HTTP'
  | 'INVALID_JSON'
  | 'INVALID_RESPONSE'

class ClientFailure extends Error {
  constructor(readonly kind: ClientFailureKind) {
    super(kind)
  }
}

function normalizeRequiredText(value: string, fieldName: string): string {
  const normalized = value.trim()

  if (!normalized) {
    throw new TypeError(`${fieldName} must be a non-empty string.`)
  }

  return normalized
}

function normalizeBaseUrl(baseUrl: string): string {
  return normalizeRequiredText(baseUrl, 'baseUrl').replace(/\/+$/, '')
}

function resolveFetch(
  configuredFetch: FeatureFlagClientOptions['fetch'],
): typeof globalThis.fetch {
  const fetchImplementation = configuredFetch ?? globalThis.fetch

  if (typeof fetchImplementation !== 'function') {
    throw new TypeError(
      'A fetch implementation is required in this JavaScript runtime.',
    )
  }

  return fetchImplementation
}

function resolveTimeoutMs(timeoutMs: number | undefined): number {
  const resolved = timeoutMs ?? DEFAULT_TIMEOUT_MS

  if (!Number.isFinite(resolved) || resolved <= 0) {
    throw new TypeError('timeoutMs must be a finite number greater than zero.')
  }

  return resolved
}

function clientError(
  projectKey: string,
  flagKey: string,
  failure: ClientFailure,
): ClientEvaluationErrorResult {
  const messages: Record<ClientFailureKind, string> = {
    INVALID_REQUEST: 'The SDK could not create a valid evaluation request.',
    TIMEOUT: 'The evaluation request timed out.',
    NETWORK: 'The evaluation service could not be reached.',
    HTTP: 'The evaluation service returned an unsuccessful response.',
    INVALID_JSON: 'The evaluation service returned invalid JSON.',
    INVALID_RESPONSE: 'The evaluation service returned an invalid response.',
  }

  return {
    projectKey,
    flagKey,
    enabled: false,
    variant: 'off',
    reason: 'ERROR',
    matchedRuleId: null,
    errorSource: 'CLIENT',
    errorMessage: messages[failure.kind],
  }
}

async function evaluateWithTimeout(
  fetchImplementation: typeof globalThis.fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
  controller: AbortController,
  expected: { projectKey: string; flagKey: string },
): Promise<BackendEvaluationResult> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort()
      reject(new ClientFailure('TIMEOUT'))
    }, timeoutMs)
  })

  const evaluationPromise = (async () => {
    const response = await fetchImplementation(url, init)

    if (!response.ok) {
      throw new ClientFailure('HTTP')
    }

    let body: unknown

    try {
      body = await response.json()
    } catch {
      throw new ClientFailure('INVALID_JSON')
    }

    const result = parseBackendEvaluationResult(body, expected)

    if (!result) {
      throw new ClientFailure('INVALID_RESPONSE')
    }

    return result
  })()

  try {
    return await Promise.race([evaluationPromise, timeoutPromise])
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
  }
}

export function createFeatureFlagClient(
  options: FeatureFlagClientOptions,
): FeatureFlagClient {
  const baseUrl = normalizeBaseUrl(options.baseUrl)
  const projectKey = normalizeRequiredText(options.projectKey, 'projectKey')
  const environmentKey = options.environmentKey?.trim() || undefined
  const timeoutMs = resolveTimeoutMs(options.timeoutMs)
  const fetchImplementation = resolveFetch(options.fetch)

  async function evaluate(
    requestedFlagKey: string,
    context: EvaluationContext = {},
  ): Promise<SdkEvaluationResult> {
    const flagKey =
      typeof requestedFlagKey === 'string' ? requestedFlagKey.trim() : ''

    if (
      !flagKey ||
      typeof context !== 'object' ||
      context === null ||
      Array.isArray(context)
    ) {
      return clientError(
        projectKey,
        flagKey,
        new ClientFailure('INVALID_REQUEST'),
      )
    }

    const controller = new AbortController()

    try {
      let requestBody: string

      try {
        requestBody = JSON.stringify({
          projectKey,
          ...(environmentKey ? { environmentKey } : {}),
          flagKey,
          context,
        })
      } catch {
        throw new ClientFailure('INVALID_REQUEST')
      }

      return await evaluateWithTimeout(
        fetchImplementation,
        `${baseUrl}/evaluate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody,
          signal: controller.signal,
        },
        timeoutMs,
        controller,
        { projectKey, flagKey },
      )
    } catch (error) {
      if (error instanceof ClientFailure) {
        return clientError(projectKey, flagKey, error)
      }

      return clientError(
        projectKey,
        flagKey,
        new ClientFailure(
          controller.signal.aborted ? 'TIMEOUT' : 'NETWORK',
        ),
      )
    }
  }

  return {
    evaluate,
    async isEnabled(flagKey, context) {
      return (await evaluate(flagKey, context)).enabled
    },
    async getVariant(flagKey, context) {
      return (await evaluate(flagKey, context)).variant
    },
  }
}
