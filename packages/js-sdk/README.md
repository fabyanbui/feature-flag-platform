# `@ffp/js-sdk`

Typed, fail-closed JavaScript client for the Feature Flag Platform data-plane
evaluation API.

## Scope

The SDK calls only:

```http
POST /v1/evaluate
```

It does not expose management APIs, store credentials, evaluate rules locally,
or cache final decisions.

## Usage

```ts
import { createFeatureFlagClient } from '@ffp/js-sdk'

const client = createFeatureFlagClient({
  baseUrl: 'http://localhost:3000/v1',
  projectKey: 'demo-project',
  environmentKey: 'production',
  timeoutMs: 1500,
})

const result = await client.evaluate('new-checkout', {
  targetingKey: 'stable-rollout-key-123',
  userId: 'optional-user-id',
  roles: ['beta-tester'],
})

const enabled = await client.isEnabled('new-checkout', {
  targetingKey: 'stable-rollout-key-123',
})

const variant = await client.getVariant('new-checkout', {
  targetingKey: 'stable-rollout-key-123',
})
```

`targetingKey` is the stable, non-PII rollout identity. It is intentionally
independent from optional `userId`, which is used by allowlist rules.

## Failure behavior

Timeouts, network failures, unsuccessful HTTP responses, invalid JSON, and
invalid response shapes return:

```ts
{
  projectKey: string
  flagKey: string
  enabled: false
  variant: 'off'
  reason: 'ERROR'
  matchedRuleId: null
  errorSource: 'CLIENT'
  errorMessage?: string
}
```

Backend responses do not include `errorSource`. A backend decision with
`reason: 'ERROR'` remains distinguishable from an SDK-local failure.

## Validation

From the repository root:

```bash
npm run test --workspace=@ffp/js-sdk
npm run build --workspace=@ffp/js-sdk
npm run lint --workspace=@ffp/js-sdk
```
