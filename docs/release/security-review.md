# Security Review — Release Readiness

## Purpose

This review documents the MVP security posture for the feature flag platform
before submission and presentation. It focuses on safe defaults, privacy-aware
targeting, CORS, browser exposure, and control-plane/data-plane separation.

This is not a production security certification. It is release-readiness
evidence for the required mini-project MVP.

## Scope

Reviewed surfaces:

- Backend API under `/v1`.
- Admin dashboard control-plane behavior.
- Demo app data-plane behavior.
- JavaScript SDK transport and fallback behavior.
- Evaluation engine defaults and reason codes.
- Evaluation snapshot cache behavior and invalidation.
- Aggregate evaluation metric persistence and read APIs.
- Statistics dashboard outcome semantics.
- Audit logging behavior for configuration mutations.
- Local environment configuration examples.

Out of scope for the current release:

- Production authentication, external identity providers, and session
  management.
- Secret rotation.
- Production rate limiting and abuse protection.
- Multi-tenant isolation beyond project-scoped data modeling.

## Safe Defaults

The system favors disabled/off behavior when evaluation cannot safely enable a
feature.

Evidence:

- Missing project or flag returns `enabled=false` with `reason=NOT_FOUND`.
- Evaluation service returns `enabled=false` with `reason=ERROR` when the
  repository path throws.
- Archived flags return off.
- Disabled configs return off.
- Kill switch returns off before targeting rules can enable the flag.
- No matching rule returns `enabled=false` with `reason=DEFAULT_OFF`.

Test evidence:

- `apps/backend/src/evaluation/engine/evaluation-engine.spec.ts`
- `apps/backend/src/evaluation/evaluation.service.spec.ts`
- `apps/backend/test/integration/phase-4-evaluation.integration-spec.ts`
- `apps/backend/test/phase-9-demo-flow.e2e-spec.ts`

## Privacy-Aware Targeting and Rollout Keys

The MVP uses stable non-PII identifiers for targeting and percentage rollout.

Accepted examples:

- `demo-user-beta`
- `demo-user-regular`
- `demo-rollout-on`
- `phase9-rollout-1`

Avoid using these values as rollout keys:

- email addresses,
- phone numbers,
- legal names,
- national identifiers,
- raw database IDs from unrelated systems,
- session tokens or credentials.

The percentage rollout hash uses `projectKey`, `flagKey`, and `targetingKey`.
The targeting key should therefore be stable but non-sensitive.

Test evidence:

- `apps/backend/src/evaluation/engine/stable-rollout-hash.spec.ts`
- `apps/backend/test/phase-9-demo-flow.e2e-spec.ts`

## Browser Exposure

The demo app is a data-plane consumer. It only needs the public API base URL.

Allowed in the demo app:

```env
VITE_API_BASE_URL=http://localhost:3000/v1
VITE_ENVIRONMENT_KEY=production
```

Not allowed in the demo app:

- `DATABASE_URL`
- `POSTGRES_MCP_DATABASE_URL`
- database passwords,
- backend API secrets,
- admin tokens,
- JWT secrets,
- private service credentials,
- write-capable control-plane credentials.

Evidence:

- `apps/demo/src/App.tsx` delegates evaluation to `@ffp/js-sdk`.
- `packages/js-sdk/src/client.ts` calls only `POST /v1/evaluate`.
- The SDK sends project, environment, flag, and caller-provided evaluation
  context only; it adds no control-plane credential.
- `apps/demo/.env.example` contains only browser-safe routing configuration.
- The demo app sends no bearer token; identity is only required on the control
  plane.

## JavaScript SDK Failure Isolation

The SDK preserves the backend reason-code contract and fails closed locally.

Evidence:

- timeout, network, unsuccessful HTTP, invalid JSON, and invalid response shape
  return `enabled=false`, `variant=off`, and `reason=ERROR`,
- SDK-local failures add `errorSource=CLIENT`; valid backend responses never do,
- response validation verifies project key, flag key, enabled state, variant,
  reason, and matched-rule shape,
- `targetingKey` remains independent from optional `userId`,
- error messages do not expose response bodies, stack traces, or secrets,
- `packages/js-sdk/test/client.spec.ts` covers the failure paths and custom
  fetch injection.

## CORS

The backend enables CORS only for configured origins.

Implementation:

- `ADMIN_ORIGIN` controls admin dashboard origin.
- `DEMO_ORIGIN` controls demo app origin.
- If neither is configured, CORS origin is set to `false`.

Local expected values:

```env
ADMIN_ORIGIN=http://localhost:5173
DEMO_ORIGIN=http://localhost:5174
```

Evidence:

- `apps/backend/src/main.ts`
- `.env.example`

## Control Plane vs Data Plane

The MVP keeps configuration changes separate from runtime evaluation.

Control plane:

- Admin dashboard.
- Project creation and updates.
- Feature flag creation and updates.
- Rule replacement.
- Audit log inspection.
- Requires a server-resolved demo identity and permission.

Data plane:

- Demo app.
- JavaScript SDK.
- `POST /v1/evaluate`.
- No mutation behavior.
- No control-plane bearer credential.
- No database or backend secrets in browser configuration.

Evidence:

- `apps/demo/src/App.tsx`
- `apps/backend/test/phase-9-demo-flow.e2e-spec.ts`
- `apps/backend/test/phase-9-api-hardening.e2e-spec.ts`

## Audit and Accountability

Mutation flows require an authorized server-resolved identity and write audit
records with before/after snapshots in the same transaction as the mutation.
This supports accountability for control-plane changes.

Evidence:

- `apps/backend/src/audit/audit-log.service.ts`
- `apps/backend/src/projects/projects.service.ts`
- `apps/backend/src/feature-flags/feature-flags.service.ts`
- `apps/backend/src/flag-rules/flag-rules.service.ts`
- `apps/backend/test/integration/phase-5-management.integration-spec.ts`
- `apps/backend/test/phase-9-api-hardening.e2e-spec.ts`

## Phase 13 Evaluation Snapshot Cache

Phase 13 adds a process-local in-memory cache for reusable evaluation
configuration snapshots.

Cached data is limited to:

- feature flag lifecycle status,
- environment configuration status, serving mode, and kill-switch state,
- optional group kill-switch state,
- ordered rules and their parameters.

The cache does not store:

- user IDs,
- targeting keys,
- roles,
- attributes,
- final evaluation decisions,
- validation failures,
- `NOT_FOUND` responses,
- evaluation errors.

Cache keys contain only stable project, environment, and flag keys. Cache logs
also exclude evaluation context and user-provided targeting data.

Cache reads and writes are optional optimizations. Read failures fall back to
PostgreSQL, while write failures continue without caching. Repository or
evaluation-engine failures retain fail-closed behavior.

Configuration mutations commit their database and append-only audit changes
before invalidating affected snapshots. An invalidation failure is logged but
does not incorrectly report an already committed mutation as failed.

Phase 18 adds provider selection with `memory`, `none`, and optional `redis`
modes. Memory remains the safe default for local development. The no-cache mode
always misses so repository-backed evaluation remains available for debugging
and validation. The Redis provider uses the same snapshot shape, TTL contract,
and invalidation contract as the in-memory provider. Redis keys contain only
project, environment-scope, and flag keys; Redis values contain reusable
configuration snapshots only.

Redis is configured through environment variables and is optional in Docker
Compose. Redis connection strings are not logged by the provider. Redis read,
write, scan, or invalidation failures surface to the existing safe cache
fallback path: evaluation falls back to PostgreSQL/no-cache behavior, and
committed control-plane mutations remain successful even if invalidation logs a
warning. Redis unavailability does not change deterministic evaluation or
public response fields.

Test evidence:

- `apps/backend/src/evaluation/cache/in-memory-evaluation-snapshot-cache.spec.ts`
- `apps/backend/src/evaluation/cache/noop-evaluation-snapshot-cache.spec.ts`
- `apps/backend/src/evaluation/cache/redis-evaluation-snapshot-cache.spec.ts`
- `apps/backend/src/evaluation/cache/evaluation-cache.module.spec.ts`
- `apps/backend/src/evaluation/cache/evaluation-cache-invalidator.spec.ts`
- `apps/backend/src/evaluation/evaluation.service.spec.ts`
- `apps/backend/test/phase-12-group-kill-switch.e2e-spec.ts`
- `apps/backend/test/phase-13-evaluation-cache.e2e-spec.ts`

## Phase 14 Aggregate Evaluation Statistics

Phase 14 records aggregate operational outcomes without creating a user-event
store.

Stored fields are limited to:

- stable project, environment, and flag identity,
- UTC-hour bucket,
- reason,
- enabled result,
- aggregate count.

The statistics subsystem does not store targeting keys, user IDs, roles,
attributes, raw request bodies, matched rule IDs, IP addresses, actors, or
credentials.

Metric writes are best-effort and occur after the evaluation decision. Database
or metric-service failure cannot change the evaluation result. This prioritizes
data-plane availability over complete telemetry delivery.

The public statistics read APIs resolve real project environments and therefore
do not expose the private `__unresolved__` dimension through normal dashboard
queries.

Known limitations:

- the read APIs use presentation-only demo RBAC rather than production
  authentication,
- the evaluation endpoint requires rate limiting before internet-facing use,
- direct best-effort writes may be lost during process termination,
- aggregate key cardinality requires abuse protection in a production system.

Test evidence:

- `apps/backend/src/repositories/evaluation-metrics.repository.spec.ts`
- `apps/backend/src/stats/evaluation-metrics.service.spec.ts`
- `apps/backend/src/stats/stats.service.spec.ts`
- `apps/backend/src/evaluation/evaluation.service.spec.ts`
- `apps/backend/test/phase-14-evaluation-stats.e2e-spec.ts`

## Known MVP Limitations and Mitigations

| Limitation | MVP mitigation |
| --- | --- |
| No production identity provider | Static local demo bearer tokens resolve to fixed roles on the backend; do not deploy or reuse them as production credentials. |
| Evaluation endpoint is browser-callable for the demo | Demo only exposes non-sensitive demo flags and non-PII targeting keys. |
| No production rate limiting | Keep deployment local/demo scoped; add rate limiting before production use. |
| No server-side SDK | REST evaluation API is enough for the MVP demo; SDK is a recommended enhancement only after MVP stability. |
| Vite environment variables are browser-visible | Only browser-safe values are allowed in demo `.env` files. |
| Memory cache is process-local | Keep memory mode for local/simple deployments; use the optional Redis provider before horizontal scaling. |
| Redis outage can reduce cache effectiveness | Cache failures fall back to repository/no-cache behavior and do not alter evaluation responses. |
| Best-effort metrics can lose in-flight increments | Treat statistics as eventually consistent observability and add durable delivery before production use. |

## Release Decision

The MVP is acceptable for local demonstration when:

1. Safe-default evaluation tests pass.
2. Demo app remains data-plane only.
3. Control-plane reads and mutations require server-resolved demo identity and
   permissions.
4. CORS origins are configured for local admin and demo apps.
5. No browser app contains database URLs or production secrets; admin demo
   tokens are explicitly local and presentation-only.
6. Aggregate metrics remain free of evaluation context and cannot affect
   evaluation responses.

## Phase 16 Demo RBAC Review

- Bearer tokens are loaded from backend environment configuration and are never
  persisted in the database, audit snapshots, metrics, or logs.
- The backend—not the browser—maps tokens to actors and roles.
- `X-Actor` and `X-Actor-Role` are ignored for authorization and audit
  attribution.
- `UNAUTHORIZED` distinguishes missing or invalid identity from `FORBIDDEN`
  permission failures.
- The admin selector exposes only local presentation credentials and disables
  unavailable actions accessibly; backend guards remain authoritative.
- The evaluation endpoint stays public and unchanged, preserving SDK and demo
  data-plane behavior.
- This model intentionally excludes passwords, OAuth, refresh tokens, MFA,
  password reset, sessions, and identity administration.
