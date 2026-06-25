import { describe, expect, jest, test } from '@jest/globals'
import {
  createFeatureFlagClient,
  isClientEvaluationError,
  type BackendEvaluationResult,
  type ClientEvaluationErrorResult,
  type EvaluationContext,
} from '../src/index.js'

const successfulResult: BackendEvaluationResult = {
  projectKey: 'demo-project',
  flagKey: 'new-checkout',
  enabled: true,
  variant: 'on',
  reason: 'ROLE_MATCH',
  matchedRuleId: 'rule-role',
}

function jsonResponse(
  body: unknown,
  init: ResponseInit = { status: 200 },
): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function expectClientError(
  result: unknown,
  message: string,
): asserts result is ClientEvaluationErrorResult {
  expect(result).toEqual({
    projectKey: 'demo-project',
    flagKey: 'new-checkout',
    enabled: false,
    variant: 'off',
    reason: 'ERROR',
    matchedRuleId: null,
    errorSource: 'CLIENT',
    errorMessage: message,
  })
}

describe('createFeatureFlagClient', () => {
  test('sends the stable evaluation request and preserves distinct identities', async () => {
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(successfulResult),
    )
    const client = createFeatureFlagClient({
      baseUrl: 'http://localhost:3000/v1/',
      projectKey: 'demo-project',
      environmentKey: 'production',
      timeoutMs: 500,
      fetch: fetchMock,
    })

    const result = await client.evaluate('new-checkout', {
      targetingKey: 'stable-rollout-key',
      userId: 'allowlist-user-id',
      roles: ['beta-tester'],
      attributes: { plan: 'pro' },
    })

    expect(result).toEqual(successfulResult)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/v1/evaluate',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: expect.any(AbortSignal),
      }),
    )

    const request = fetchMock.mock.calls[0]?.[1]
    expect(JSON.parse(String(request?.body))).toEqual({
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
      context: {
        targetingKey: 'stable-rollout-key',
        userId: 'allowlist-user-id',
        roles: ['beta-tester'],
        attributes: { plan: 'pro' },
      },
    })
  })

  test('omits environmentKey when it is not configured', async () => {
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(successfulResult),
    )
    const client = createFeatureFlagClient({
      baseUrl: 'http://localhost:3000/v1',
      projectKey: 'demo-project',
      fetch: fetchMock,
    })

    await client.evaluate('new-checkout')

    const request = fetchMock.mock.calls[0]?.[1]
    expect(JSON.parse(String(request?.body))).toEqual({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      context: {},
    })
  })

  test('passes a backend ERROR decision through without adding errorSource', async () => {
    const backendError: BackendEvaluationResult = {
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      enabled: false,
      variant: 'off',
      reason: 'ERROR',
      matchedRuleId: null,
    }
    const client = createFeatureFlagClient({
      baseUrl: 'http://localhost:3000/v1',
      projectKey: 'demo-project',
      fetch: jest.fn<typeof fetch>().mockResolvedValue(
        jsonResponse(backendError),
      ),
    })

    const result = await client.evaluate('new-checkout')

    expect(result).toEqual(backendError)
    expect(isClientEvaluationError(result)).toBe(false)
    expect(result).not.toHaveProperty('errorSource')
  })

  test('implements isEnabled and getVariant through the fail-closed result', async () => {
    const fetchMock = jest
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(successfulResult))
      .mockRejectedValueOnce(new Error('offline'))
    const client = createFeatureFlagClient({
      baseUrl: 'http://localhost:3000/v1',
      projectKey: 'demo-project',
      fetch: fetchMock,
    })

    await expect(client.isEnabled('new-checkout')).resolves.toBe(true)
    await expect(client.getVariant('new-checkout')).resolves.toBe('off')
  })

  test('fails closed when the request times out even if custom fetch ignores abort', async () => {
    const fetchMock = jest.fn<typeof fetch>(
      () => new Promise<Response>(() => undefined),
    )
    const client = createFeatureFlagClient({
      baseUrl: 'http://localhost:3000/v1',
      projectKey: 'demo-project',
      timeoutMs: 5,
      fetch: fetchMock,
    })

    const result = await client.evaluate('new-checkout')

    expectClientError(result, 'The evaluation request timed out.')
    const request = fetchMock.mock.calls[0]?.[1]
    expect(request?.signal?.aborted).toBe(true)
  })

  test('applies the timeout while reading the response body', async () => {
    const response = {
      ok: true,
      json: () => new Promise<unknown>(() => undefined),
    } as Response
    const client = createFeatureFlagClient({
      baseUrl: 'http://localhost:3000/v1',
      projectKey: 'demo-project',
      timeoutMs: 5,
      fetch: jest.fn<typeof fetch>().mockResolvedValue(response),
    })

    expectClientError(
      await client.evaluate('new-checkout'),
      'The evaluation request timed out.',
    )
  })

  test('fails closed on a network error', async () => {
    const client = createFeatureFlagClient({
      baseUrl: 'http://localhost:3000/v1',
      projectKey: 'demo-project',
      fetch: jest
        .fn<typeof fetch>()
        .mockRejectedValue(new TypeError('connection refused')),
    })

    expectClientError(
      await client.evaluate('new-checkout'),
      'The evaluation service could not be reached.',
    )
  })

  test('fails closed on a non-successful HTTP response', async () => {
    const client = createFeatureFlagClient({
      baseUrl: 'http://localhost:3000/v1',
      projectKey: 'demo-project',
      fetch: jest
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse({ code: 'VALIDATION_ERROR' }, { status: 400 })),
    })

    expectClientError(
      await client.evaluate('new-checkout'),
      'The evaluation service returned an unsuccessful response.',
    )
  })

  test('fails closed on invalid JSON', async () => {
    const client = createFeatureFlagClient({
      baseUrl: 'http://localhost:3000/v1',
      projectKey: 'demo-project',
      fetch: jest
        .fn<typeof fetch>()
        .mockResolvedValue(new Response('not-json', { status: 200 })),
    })

    expectClientError(
      await client.evaluate('new-checkout'),
      'The evaluation service returned invalid JSON.',
    )
  })

  test.each([
    ['missing fields', { projectKey: 'demo-project' }],
    ['unknown reason', { ...successfulResult, reason: 'SDK_TIMEOUT' }],
    ['wrong project', { ...successfulResult, projectKey: 'other-project' }],
    ['wrong flag', { ...successfulResult, flagKey: 'other-flag' }],
    ['invalid matched rule', { ...successfulResult, matchedRuleId: 42 }],
    ['inconsistent variant', { ...successfulResult, variant: 'off' }],
    ['SDK-only server field', { ...successfulResult, errorSource: 'CLIENT' }],
  ])('fails closed on an invalid response shape: %s', async (_name, body) => {
    const client = createFeatureFlagClient({
      baseUrl: 'http://localhost:3000/v1',
      projectKey: 'demo-project',
      fetch: jest.fn<typeof fetch>().mockResolvedValue(jsonResponse(body)),
    })

    expectClientError(
      await client.evaluate('new-checkout'),
      'The evaluation service returned an invalid response.',
    )
  })

  test('fails closed for a blank flag key without making a request', async () => {
    const fetchMock = jest.fn<typeof fetch>()
    const client = createFeatureFlagClient({
      baseUrl: 'http://localhost:3000/v1',
      projectKey: 'demo-project',
      fetch: fetchMock,
    })

    const result = await client.evaluate('   ')

    expect(result).toMatchObject({
      enabled: false,
      variant: 'off',
      reason: 'ERROR',
      errorSource: 'CLIENT',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('fails closed when context cannot be serialized', async () => {
    const fetchMock = jest.fn<typeof fetch>()
    const client = createFeatureFlagClient({
      baseUrl: 'http://localhost:3000/v1',
      projectKey: 'demo-project',
      fetch: fetchMock,
    })
    const context = {} as EvaluationContext & { self?: unknown }
    context.self = context

    expectClientError(
      await client.evaluate('new-checkout', context),
      'The SDK could not create a valid evaluation request.',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test.each([
    [{ baseUrl: '', projectKey: 'demo-project' }, 'baseUrl'],
    [{ baseUrl: 'http://localhost:3000/v1', projectKey: '' }, 'projectKey'],
    [
      {
        baseUrl: 'http://localhost:3000/v1',
        projectKey: 'demo-project',
        timeoutMs: 0,
      },
      'timeoutMs',
    ],
  ])('rejects invalid static client configuration', (options, fieldName) => {
    expect(() => createFeatureFlagClient(options)).toThrow(fieldName)
  })
})
