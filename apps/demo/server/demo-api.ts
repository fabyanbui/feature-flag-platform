import {
  createFeatureFlagClient,
  isClientEvaluationError,
  type EvaluationContext,
  type SdkEvaluationResult,
} from '@ffp/js-sdk'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  demoProjectKey,
  findDemoAccount,
  getFeatureDemoPayload,
  type DemoBackendAccount,
  type DemoFeatureKey,
} from './demo-data.js'

type DemoApiOptions = {
  apiBaseUrl?: string
  environmentKey?: string
  timeoutMs?: number
}

type RolloutUnit = 'user' | 'organization'

type GuardedFeature = {
  flagKey: DemoFeatureKey
  label: string
  context: EvaluationContext
}

const defaultApiBaseUrl = 'http://localhost:3000/v1'

const featureLabels: Record<DemoFeatureKey, string> = {
  'beta-dashboard': 'Priority dashboard',
  'new-checkout': 'One-page checkout',
  'express-payment': 'Express payment',
  'shipping-progress-meter': 'Shipping progress meter',
  'coupon-engine': 'Coupon engine',
  'personalized-recommendations': 'Personalized recommendations',
  'trending-products': 'Trending products',
  'holiday-promo-banner': 'Holiday promo banner',
  'live-support-widget': 'Live support widget',
}

const featureRolloutUnits: Record<DemoFeatureKey, RolloutUnit> = {
  'beta-dashboard': 'user',
  'new-checkout': 'user',
  'express-payment': 'user',
  'shipping-progress-meter': 'user',
  'coupon-engine': 'user',
  'personalized-recommendations': 'user',
  'trending-products': 'user',
  'holiday-promo-banner': 'user',
  'live-support-widget': 'organization',
}

function resolveRequiredText(value: string | undefined, fallback: string): string {
  const normalized = value?.trim()
  return normalized ? normalized : fallback
}

function writeJson(
  res: ServerResponse,
  statusCode: number,
  body: Record<string, unknown>,
) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(JSON.stringify(body, null, 2))
}

function methodNotAllowed(res: ServerResponse, allowedMethods: string[]) {
  res.writeHead(405, {
    Allow: allowedMethods.join(', '),
    'Content-Type': 'application/json; charset=utf-8',
  })
  res.end(
    JSON.stringify({
      code: 'METHOD_NOT_ALLOWED',
      message: `Use ${allowedMethods.join(' or ')} for this demo API endpoint.`,
    }),
  )
}

function getAccountId(url: URL): string | null {
  const accountId = url.searchParams.get('accountId')?.trim()
  return accountId || null
}

function parseFeatureEndpoint(pathname: string): DemoFeatureKey | null {
  const prefix = '/api/demo/features/'

  if (!pathname.startsWith(prefix)) {
    return null
  }

  const featureKey = pathname.slice(prefix.length)

  return featureKey in featureLabels ? (featureKey as DemoFeatureKey) : null
}

function getFeatureContext(
  account: DemoBackendAccount,
  featureKey: DemoFeatureKey,
): EvaluationContext {
  const rolloutUnit = featureRolloutUnits[featureKey]

  return {
    ...account.context,
    targetingKey:
      rolloutUnit === 'organization' ? account.organizationId : account.targetingId,
    attributes: {
      ...account.context.attributes,
      organizationId: account.organizationId,
      organizationName: account.organizationName,
    },
  }
}

function accountPayload(account: DemoBackendAccount) {
  return {
    id: account.id,
    userLabel: account.userLabel,
    role: account.role,
    organizationId: account.organizationId,
    organizationName: account.organizationName,
  }
}

async function evaluateFeature(
  options: Required<DemoApiOptions>,
  feature: GuardedFeature,
): Promise<SdkEvaluationResult> {
  const client = createFeatureFlagClient({
    baseUrl: options.apiBaseUrl,
    projectKey: demoProjectKey,
    environmentKey: options.environmentKey,
    timeoutMs: options.timeoutMs,
  })

  return client.evaluate(feature.flagKey, feature.context)
}

function disabledResponse(
  res: ServerResponse,
  feature: GuardedFeature,
  account: DemoBackendAccount,
  evaluation: SdkEvaluationResult,
) {
  const isClientFailure = isClientEvaluationError(evaluation)

  writeJson(res, 403, {
    code: 'FEATURE_DISABLED',
    message: isClientFailure
      ? `The demo backend failed closed because it could not verify ${
          feature.label
        } is enabled.`
      : `${feature.label} is disabled by the feature flag platform, so the backend API refuses to serve this feature.`,
    endpointGuard: {
      projectKey: demoProjectKey,
      flagKey: feature.flagKey,
      enforcedAt: 'demo-backend',
    },
    account: accountPayload(account),
    evaluation,
  })
}

async function handleFeatureEndpoint(
  res: ServerResponse,
  options: Required<DemoApiOptions>,
  account: DemoBackendAccount,
  featureKey: DemoFeatureKey,
) {
  const feature: GuardedFeature = {
    flagKey: featureKey,
    label: featureLabels[featureKey],
    context: getFeatureContext(account, featureKey),
  }
  const evaluation = await evaluateFeature(options, feature)

  if (!evaluation.enabled) {
    disabledResponse(res, feature, account, evaluation)
    return
  }

  writeJson(res, 200, {
    code: 'OK',
    message: `${feature.label} API is enabled by the backend feature guard.`,
    endpointGuard: {
      projectKey: demoProjectKey,
      flagKey: feature.flagKey,
      enforcedAt: 'demo-backend',
    },
    account: accountPayload(account),
    evaluation,
    data: getFeatureDemoPayload(featureKey, account),
  })
}

export function createDemoApiHandler(options: DemoApiOptions = {}) {
  const resolvedOptions: Required<DemoApiOptions> = {
    apiBaseUrl: resolveRequiredText(options.apiBaseUrl, defaultApiBaseUrl),
    environmentKey: resolveRequiredText(options.environmentKey, 'production'),
    timeoutMs: options.timeoutMs ?? 1500,
  }

  return async function handleDemoApiRequest(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<boolean> {
    const url = new URL(req.url ?? '/', 'http://demo.local')

    if (!url.pathname.startsWith('/api/demo/')) {
      return false
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        Allow: 'GET, OPTIONS',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      })
      res.end()
      return true
    }

    if (url.pathname === '/api/demo/health') {
      if (req.method !== 'GET') {
        methodNotAllowed(res, ['GET'])
        return true
      }

      writeJson(res, 200, {
        status: 'ok',
        service: 'demo-backend',
        apiBaseUrl: resolvedOptions.apiBaseUrl,
        environmentKey: resolvedOptions.environmentKey,
      })
      return true
    }

    const featureKey = parseFeatureEndpoint(url.pathname)

    if (!featureKey) {
      writeJson(res, 404, {
        code: 'NOT_FOUND',
        message: 'Unknown demo backend endpoint.',
      })
      return true
    }

    if (req.method !== 'GET') {
      methodNotAllowed(res, ['GET'])
      return true
    }

    const accountId = getAccountId(url)

    if (!accountId) {
      writeJson(res, 400, {
        code: 'VALIDATION_ERROR',
        message:
          'Query parameter accountId is required for guarded demo backend endpoints.',
      })
      return true
    }

    const account = findDemoAccount(accountId)

    if (!account) {
      writeJson(res, 404, {
        code: 'ACCOUNT_NOT_FOUND',
        message: 'The selected demo account does not exist on the demo backend.',
      })
      return true
    }

    await handleFeatureEndpoint(res, resolvedOptions, account, featureKey)
    return true
  }
}
