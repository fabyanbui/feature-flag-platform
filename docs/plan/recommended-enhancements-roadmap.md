# Recommended Enhancements Roadmap

## Purpose

This roadmap extends the completed MVP with the **recommended-level**
requirements from `docs/requirement/requirement-init.md` while protecting the
required submission artifacts for **July 7, 2026** and the presentation on
**July 9, 2026**.

The required MVP remains the release baseline. Recommended work must be planned
as small, reversible, independently testable increments. If time becomes
constrained, stop after the latest passing gate and keep the MVP stable.

## Source Requirements

Recommended-level requirements:

1. Cache flag evaluation results using Redis or an in-memory cache.
2. A simple JavaScript SDK to make feature flag integration easier for clients.
3. Unit tests for rule evaluation.
4. Rule versioning or configuration change history.
5. Role-based access control: admin/developer/viewer.
6. Statistics dashboard showing the number of evaluations per flag.
7. Kill switch to quickly disable a group of flags.
8. Docker Compose to run the entire system.

## Current Source Model Names

The current source was inspected before updating this roadmap. The Prisma schema
currently defines these domain models:

- `Project`
- `Environment`
- `FeatureFlag`
- `FlagEnvironmentConfig`
- `FlagRule`
- `SampleUserContext`
- `AuditLogEntry`

Use these exact names when adding fields, relations, repositories, DTOs, tests,
and docs. Do not create a parallel `FlagConfig` model merely because planning
text uses the shorter phrase "flag config". In this roadmap, **flag config** is
a human-readable shorthand for the existing `FlagEnvironmentConfig` model.

Use one group name throughout the recommended work: `FlagGroup`.
Environment-specific group kill-switch state belongs in `FlagGroupConfig`.
Do not mix `FeatureFlagGroup`, `KillSwitchGroup`, and `FlagGroup` unless a later
design document introduces a deliberate distinction.

## Constraints to Preserve

Recommended work must not turn the mini project into a rewrite or a distributed
platform. Preserve these constraints:

- Do not replace Prisma.
- Do not replace NestJS.
- Do not split the application into microservices.
- Do not add production-scale authentication.
- Do not introduce Kafka, ClickHouse, Kubernetes, or other distributed
  infrastructure.
- Do not weaken deterministic evaluation.
- Do not change fail-closed/default-off behavior.
- Do not expose database URLs, secrets, actor credentials, or privileged tokens
  in committed frontend code.
- Do not implement recommended features as large rewrites.
- Every enhancement must be reversible and independently testable.

## Authoritative Evaluation Precedence

Use one precedence contract everywhere: domain documentation, evaluation engine,
reason codes, unit tests, demo scenarios, API examples, and acceptance criteria.

Recommended precedence:

1. `FLAG_ARCHIVED`
2. `FLAG_DISABLED`
3. `GROUP_KILL_SWITCH`
4. `KILL_SWITCH`
5. `GLOBAL_ON`
6. ordered enabled rules
7. `DEFAULT_OFF`

The first matching terminal condition determines both `enabled` and `reason`.
No later rule or switch may override an earlier terminal condition.

Required combination tests:

- archived and disabled returns `FLAG_ARCHIVED`, not `FLAG_DISABLED`,
- disabled and group kill switch returns `FLAG_DISABLED`, not
  `GROUP_KILL_SWITCH`,
- group kill switch and flag kill switch returns `GROUP_KILL_SWITCH`, not
  `KILL_SWITCH`,
- kill switch and global on returns `KILL_SWITCH`, not `GLOBAL_ON`.

Current implementation note: the existing MVP engine checks flag-level
`killSwitch` before disabled configuration. This roadmap intentionally locks the
new recommended-level precedence above before group kill switch, cache, stats,
or SDK work begins.

## Final Minimum Scope per Recommendation

- **Unit tests:** precedence, rule ordering, disabled rules, stable hashing,
  boundary percentages, missing context, variants, and fail-closed errors.
- **Docker Compose:** PostgreSQL, backend, admin, and demo; Redis optional.
- **JavaScript SDK:** `evaluate`, `isEnabled`, `getVariant`, timeout, and typed
  fail-closed fallback.
- **Cache:** in-memory evaluation-snapshot cache, TTL, explicit invalidation,
  and safe fallback.
- **Configuration history:** audit-backed API and UI history panel; optional
  `FlagEnvironmentConfig` revision field.
- **RBAC:** bearer demo tokens resolved by the backend to actor and role.
- **Statistics:** aggregate count by flag, environment, reason, enabled result,
  and time bucket.
- **Group kill switch:** one optional group per flag, environment-specific group
  kill-switch state, audit, tests, and cache invalidation.

## Implementation Waves

### Wave 1 — Correctness and domain stability

1. Expand evaluation-engine tests.
2. Lock precedence and reason-code contracts.
3. Add configuration history based on audit logs.
4. Implement group kill switch.

### Wave 2 — Runtime enhancements

5. Add in-memory evaluation-snapshot cache.
6. Add evaluation statistics.
7. Add the JavaScript SDK and migrate the demo app to it.

### Wave 3 — Cross-cutting concerns

8. Add RBAC using server-resolved demo identities.
9. Add Redis provider only if the in-memory provider is stable and time remains.
10. Stabilize the final Docker Compose workflow.

### Wave 4 — Release preparation

11. Run full regression tests.
12. Test Docker startup from a clean environment.
13. Update the requirement traceability matrix.
14. Update README, design documentation, report, slides, and demo script.

## Stop Gates

### Gate A — Domain gate

Do not start cache implementation until:

- group kill-switch schema is stable,
- evaluation precedence is documented,
- group evaluation tests pass,
- group mutations are audited,
- the group feature works end-to-end.

### Gate B — Runtime gate

Do not start RBAC until:

- cache hit/miss/invalidation tests pass,
- statistics failure cannot break evaluation,
- the SDK and demo app use the stable API contract,
- no evaluation-contract changes are pending.

### Gate C — Redis gate

Do not add Redis unless:

- all eight recommended requirements have at least a minimal working
  implementation,
- the full test suite passes,
- Docker baseline works,
- there are no unfinished schema migrations,
- the in-memory cache behavior is stable.

Redis is an optional provider for the caching recommendation, not a separate
ninth recommended requirement.

## Phase 10 — Evaluation Tests and Precedence Contract

### Goal

Lock deterministic evaluation behavior before changing schema, group semantics,
caching, metrics, or SDK behavior.

### Backend tasks

- Expand unit tests around existing `EvaluationReason`, `EvaluationSnapshot`,
  stable rollout hashing, and rule evaluation.
- Add `GROUP_KILL_SWITCH` to the planned reason-code contract when the group
  kill-switch phase begins; do not expose it before backend behavior supports
  it.
- Align the evaluation engine to the authoritative precedence:
  1. `FLAG_ARCHIVED`
  2. `FLAG_DISABLED`
  3. `GROUP_KILL_SWITCH`
  4. `KILL_SWITCH`
  5. `GLOBAL_ON`
  6. ordered enabled rules
  7. `DEFAULT_OFF`
- Test:
  - multiple rules of the same type,
  - disabled rules being ignored,
  - percentage boundaries at `0`, `1`, `50`, and `100`,
  - missing `targetingKey` with percentage rollout,
  - stable bucket behavior across repeated calls,
  - variants remaining deterministic,
  - fail-closed `ERROR` behavior.

### Documentation tasks

- Update evaluation/domain documentation with the single precedence contract.
- Update the recommended coverage map if a separate file is created.

### Acceptance criteria

- Unit tests prove deterministic rule evaluation and the exact precedence.
- No cache, statistics, SDK, or RBAC work starts before this phase passes.
- `npm run test --workspace=@ffp/backend` passes.

### Likely changed files

- `apps/backend/src/evaluation/engine/evaluation-engine.ts`
- `apps/backend/src/evaluation/engine/evaluation-engine.spec.ts`
- `apps/backend/src/evaluation/engine/evaluation.types.ts`
- `docs/learning/data-plane-api-and-evaluation-engine.md`
- `docs/design/mvp-api-and-contracts.md`
- `docs/plan/phase-9-test-coverage-map.md` or a new recommended coverage map

## Phase 11 — Audit-Backed Configuration History

### Goal

Satisfy "rule versioning or configuration change history" without creating a
second independent history system.

### Preferred implementation

Use existing append-only `AuditLogEntry` records as the source of flag
configuration history. The existing audit log already stores actor, action,
target, before state, after state, request ID, and timestamp.

Do **not** add a separate `FlagConfigVersion` table in the initial recommended
implementation. Treat a dedicated version table as optional future work only if
a later need appears.

### Backend tasks

- Add an audit-backed endpoint:
  - `GET /v1/projects/:projectKey/flags/:flagKey/history`
- Query existing `AuditLogEntry` rows for the selected `FeatureFlag`, related
  `FlagEnvironmentConfig`, and related `FlagRule` mutations.
- Return actor, action, target type, target key, timestamp, before, after,
  request ID, and pagination metadata.
- Optionally add a numeric `revision` field to `FlagEnvironmentConfig` if it is
  useful for observability or snapshot-cache invalidation. If added, it must be
  incremented in the same transaction as config/rule mutations.

### Frontend tasks

- Add a flag history panel in the admin dashboard, preferably near the rule
  editor or flag detail area.
- Show actor, action, timestamp, request ID, and concise before/after summaries.
- Link or filter from the existing audit log screen where useful.

### Tests

- Unit test history query filtering and shape.
- E2E/API test that flag creation, flag config updates, and rule replacement are
  visible in the flag history endpoint.

### Acceptance criteria

- Configuration history is readable per flag without duplicating audit data.
- Audit logs remain the source of accountability.
- Any optional revision field does not replace audit history.

### Completion evidence

- Added the paginated audit-backed flag history endpoint.
- History resolves immutable feature-flag and configuration IDs.
- Unit and E2E coverage verifies filtering, ordering, pagination, validation,
  flag creation, configuration updates, and rule replacement.
- Added a responsive flag history panel near the rule editor.
- Successful rule replacement refreshes history without affecting mutation
  success if the secondary history read fails.
- No separate configuration-version table or revision field was introduced.

### Likely changed files

- `apps/backend/src/audit-logs/*`
- `apps/backend/src/feature-flags/*` or a new `flag-history` module
- `apps/backend/test/*history*.e2e-spec.ts`
- `apps/admin/src/App.tsx`
- `apps/admin/src/pages/*`
- `apps/admin/src/App.css`
- `docs/design/mvp-api-and-contracts.md`
- `docs/release/demo-script.md`

## Phase 12 — Group Kill Switch

### Goal

Allow fast rollback for a group of flags without editing each flag one by one.

### Data model

Do not combine group identity and environment-specific state in one model.
Use:

`FlagGroup`

- `id`
- `projectId`
- `key`
- `name`
- `createdAt`
- `updatedAt`

`FlagGroupConfig`

- `id`
- `groupId`
- `environmentId`
- `killSwitch`
- `createdAt`
- `updatedAt`

Recommended-level membership scope:

- one `FeatureFlag` may belong to at most one `FlagGroup`,
- one `FlagGroup` belongs to one `Project`,
- `FlagGroupConfig.killSwitch` is environment-specific,
- avoid many-to-many membership,
- group assignment may be stored on `FeatureFlag` if membership is project-wide,
  or on `FlagEnvironmentConfig` if membership should vary by environment.
  Choose one before implementation and document it.

Evaluation resolution:

```text
FlagEnvironmentConfig
-> associated FeatureFlag
-> optional FlagGroup
-> FlagGroupConfig for evaluated Environment
-> group kill-switch state
```

### Backend tasks

- Add `FlagGroup` and `FlagGroupConfig` Prisma models and migration.
- Add group management APIs, for example:
  - `GET /v1/projects/:projectKey/groups`
  - `POST /v1/projects/:projectKey/groups`
  - `PATCH /v1/projects/:projectKey/groups/:groupKey`
  - `PUT /v1/projects/:projectKey/groups/:groupKey/config`
  - `PUT /v1/projects/:projectKey/flags/:flagKey/group`
  - `DELETE /v1/projects/:projectKey/flags/:flagKey/group`
- Include group state in `EvaluationSnapshot`.
- Add `GROUP_KILL_SWITCH` reason and apply the authoritative precedence.
- Audit:
  - group creation/update,
  - flag assignment/unassignment,
  - group kill-switch activation/deactivation.
- Activating a group switch creates an audit entry for the group mutation. It
  must not pretend every assigned flag was individually mutated.
- Prepare cache invalidation hooks for all flags assigned to the affected group.

### Frontend tasks

- Add group management to the admin dashboard.
- Add flag group assignment controls.
- Add a clear confirmation before activating a group kill switch.
- Display runtime `Off` due to `GROUP_KILL_SWITCH` separately from flag lifecycle
  status.

### Tests

- Prisma/model tests or integration tests for uniqueness and relationships.
- Evaluation tests for all group precedence combinations.
- E2E/API tests for group creation, assignment, activation, audit entries, and
  evaluation result.

### Acceptance criteria

- Activating a group switch disables assigned flags in the evaluated
  environment with reason `GROUP_KILL_SWITCH`.
- Deactivating it restores normal per-flag evaluation.
- Group mutations and assignments are audited.
- Cache invalidation requirements for group mutations are documented before Gate
  A is passed.

### Completion evidence

Phase 12 is complete:

- project-wide, optional one-group-per-flag membership is persisted separately
  from environment-specific `FlagGroupConfig.killSwitch` state,
- group creation initializes an inactive configuration for every existing
  project environment, preventing project-wide assignment from introducing
  missing runtime state,
- management APIs and the admin dashboard support group creation, update,
  assignment, unassignment, and confirmed switch activation,
- evaluation returns `GROUP_KILL_SWITCH` using the documented precedence,
- all group and membership mutations write append-only audit records in the
  mutation transaction,
- the seeded `customer-experience` group provides a repeatable presentation
  scenario with both demo flags assigned and every group switch initially
  inactive,
- cache invalidation requirements for group changes are documented in the
  architecture and API contract documents.

### Likely changed files

- `apps/backend/prisma/schema.prisma`
- `apps/backend/prisma/migrations/*`
- `apps/backend/src/evaluation/*`
- `apps/backend/src/repositories/*`
- `apps/backend/src/audit/*`
- `apps/backend/src/app.module.ts`
- `apps/backend/src/flag-groups/*` or equivalent new module
- `apps/backend/test/*group*.e2e-spec.ts`
- `apps/admin/src/App.tsx`
- `apps/admin/src/pages/*`
- `apps/admin/src/App.css`
- `docs/design/software-architecture-document.md`
- `docs/design/mvp-api-and-contracts.md`

## Gate A — Domain Review

Pass this gate before Phase 13 begins.

Required evidence:

- [x] Group kill-switch schema is stable.
- [x] Evaluation precedence is documented.
- [x] Group evaluation tests pass.
- [x] Group mutations are audited.
- [x] Group feature works through API and admin UI.
- [x] No pending reason-code or evaluation-contract changes are known.

Gate A passed on June 24, 2026. Evidence includes the Phase 12 evaluation-engine
unit tests, service/repository tests, `phase-12-group-kill-switch.e2e-spec.ts`,
admin build and lint checks, idempotent seed verification, and the documented
API, evaluation, audit, and cache-invalidation contracts.

## Phase 13 — In-Memory Evaluation-Snapshot Cache

### Goal

Improve evaluation performance and demonstrate caching/consistency tradeoffs
without caching user/context-specific final decisions.

### Cache design

Cache reusable evaluation snapshots, not final evaluation results.

Flow:

```text
request
-> look up snapshot by project/environment/flag
-> on cache hit, run the evaluation engine using the request context
-> on cache miss, load the snapshot from PostgreSQL, cache it, then evaluate
```

Recommended cache key:

```text
evaluation-snapshot:{projectKey}:{environmentKey}:{flagKey}
```

Cached value contains only configuration required by the engine:

- `FeatureFlag.lifecycleStatus`,
- `FlagEnvironmentConfig.status`,
- `FlagEnvironmentConfig.servingMode`,
- `FlagEnvironmentConfig.killSwitch`,
- optional `FlagGroupConfig.killSwitch` state,
- ordered enabled `FlagRule` rows and parameters,
- revision/version metadata if available.

Do not include raw `userId`, `targetingKey`, roles, attributes, or final
`enabled` decisions in the cache key or cached snapshot.

### Backend tasks

- Add an `EvaluationSnapshotCache` abstraction.
- Add an in-memory provider with TTL.
- Do not cache validation failures or evaluation errors.
- On cache failure, safely fall back to repository access.
- Explicitly invalidate snapshots after relevant mutations:
  - flag lifecycle changes,
  - `FlagEnvironmentConfig` status/serving mode/kill switch changes,
  - `FlagRule` changes,
  - flag group assignment/unassignment,
  - `FlagGroupConfig.killSwitch` changes.
- For group kill-switch changes, invalidate all flags assigned to the affected
  `FlagGroup` in that environment.
- Keep cache hit/miss metadata in logs or tests; do not add public response
  fields unless the API contract is explicitly updated.

### Tests

- Cache hit uses the cached snapshot and still evaluates against the current
  request context.
- Cache miss loads from repository and stores a snapshot.
- TTL expiry reloads from repository.
- Explicit invalidation removes stale snapshots.
- Cache provider failure falls back to repository access.
- Final decisions remain deterministic and fail closed.

### Acceptance criteria

- Repeated evaluations can reuse the same cached snapshot for different
  contexts.
- Mutations invalidate affected snapshots.
- Cache failures do not change safe evaluation behavior.
- Gate A evidence remains valid after cache integration.

### Likely changed files

- `apps/backend/src/evaluation/*`
- `apps/backend/src/repositories/*`
- `apps/backend/src/feature-flags/*`
- `apps/backend/src/flag-rules/*`
- `apps/backend/src/flag-groups/*`
- `apps/backend/src/common/*` if shared cache utilities are added
- `apps/backend/test/*cache*.spec.ts`
- `docs/design/software-architecture-document.md`
- `docs/release/security-review.md`

## Phase 14 — Evaluation Statistics and Dashboard

### Goal

Show operational value by counting evaluation requests by flag and outcome while
preserving privacy and availability.

### Relationship with caching

Every evaluation API request must count as an evaluation, regardless of cache
behavior.

Required flow:

```text
request
-> snapshot cache/repository lookup
-> evaluation decision
-> best-effort metric increment
-> response
```

Metric persistence failure must not fail or alter the evaluation response.

### Data model

Use aggregate metrics rather than storing every evaluation event.
Suggested model: `FlagEvaluationMetric`.

Recommended dimensions:

- project,
- environment,
- flag,
- time bucket,
- reason,
- enabled,
- count.

Do not store:

- user ID,
- targeting key,
- roles,
- attributes,
- raw evaluation context.

### Backend tasks

- Add aggregate metric model and migration.
- Increment aggregate metrics after evaluation decision.
- Keep metric writes best-effort and non-blocking for response safety.
- Add read APIs:
  - `GET /v1/projects/:projectKey/stats/flags`
  - `GET /v1/projects/:projectKey/flags/:flagKey/stats`
- Support environment and time-range filters where practical.

### Frontend tasks

- Add a statistics dashboard or flag-detail section.
- Show total evaluations, enabled count, disabled count, and top reasons.
- Simple tables or summary cards are enough; charts are optional.

### Tests

- Cached evaluations are still counted.
- Metric-write failure does not change the evaluation response.
- Aggregation increments the correct bucket.
- Metrics contain no raw evaluation context.

### Acceptance criteria

- Dashboard shows evaluation counts per flag.
- Evaluation behavior is unchanged if metric persistence fails.
- Metrics remain aggregate and privacy-preserving.

### Likely changed files

- `apps/backend/prisma/schema.prisma`
- `apps/backend/prisma/migrations/*`
- `apps/backend/src/evaluation/*`
- `apps/backend/src/stats/*` or equivalent new module
- `apps/backend/src/repositories/*`
- `apps/backend/test/*stats*.spec.ts`
- `apps/admin/src/App.tsx`
- `apps/admin/src/pages/*`
- `apps/admin/src/App.css`
- `docs/design/mvp-api-and-contracts.md`
- `docs/release/demo-script.md`

## Phase 15 — JavaScript SDK and Demo App Migration

### Goal

Make feature-flag integration easier for clients after the evaluation API,
reason codes, cache behavior, and metrics behavior are stable.

### Proposed package

Create a workspace package:

- `packages/js-sdk/`
- package name: `@ffp/js-sdk`

### SDK API

Minimum API:

```ts
const client = createFeatureFlagClient({
  baseUrl: 'http://localhost:3000/v1',
  projectKey: 'demo-project',
  environmentKey: 'production',
  timeoutMs: 1500,
});

const result = await client.evaluate('new-checkout', {
  targetingKey: 'stable-rollout-key-123',
  userId: 'optional-user-id',
  roles: ['beta-tester'],
});

const enabled = await client.isEnabled('new-checkout', {
  targetingKey: 'stable-rollout-key-123',
});

const variant = await client.getVariant('new-checkout', {
  targetingKey: 'stable-rollout-key-123',
});
```

Do not require `userId` and `targetingKey` to be the same. `targetingKey` is the
stable rollout identity; `userId` remains optional.

### SDK response contract

Do not silently add SDK-only reasons to the backend `EvaluationReason` enum.
Use an explicit SDK contract for local failures.

Recommended shape:

```ts
type SdkEvaluationResult = BackendEvaluationResult | {
  projectKey: string;
  flagKey: string;
  enabled: false;
  variant: 'off';
  reason: 'ERROR';
  matchedRuleId: null;
  errorSource: 'CLIENT';
  errorMessage?: string;
};
```

Backend responses have no `errorSource`. SDK-local timeout, network, or invalid
response failures return fail-closed results with `errorSource: 'CLIENT'`.

### SDK behavior

- Accept `baseUrl`, `projectKey`, optional `environmentKey`, optional `fetch`,
  and `timeoutMs`.
- Provide `evaluate()`, `isEnabled()`, and `getVariant()`.
- Send evaluation requests only to `POST /v1/evaluate`.
- Fail closed on timeout, network errors, invalid JSON, or invalid response
  shape.
- Avoid storing secrets or PII.

### Demo app tasks

- Replace direct `fetch` in `apps/demo` with the SDK.
- Keep result fields visible for presentation.
- Show SDK-local failures distinctly from backend decisions where useful.

### Acceptance criteria

- SDK unit tests pass.
- Demo app proves the same scenarios through the SDK.
- SDK fallback does not change backend reason-code contracts.
- No control-plane permissions are introduced into the SDK.

### Likely changed files

- `package.json`
- `package-lock.json`
- `packages/js-sdk/*`
- `apps/demo/src/App.tsx`
- `apps/demo/src/App.css`
- `apps/demo/package.json`
- `apps/demo/README.md`
- `docs/release/demo-script.md`
- `docs/presentation/slide-outline.md`

## Gate B — Runtime Review

Pass this gate before Phase 16 begins.

Required evidence:

- cache hit/miss/invalidation tests pass,
- statistics failure cannot break evaluation,
- cached evaluations are still counted,
- SDK and demo app use the stable API contract,
- no evaluation-contract changes are pending.

## Phase 16 — RBAC with Server-Resolved Demo Identities

### Goal

Restrict control-plane operations by role while keeping the mini project scope
educational and presentation-friendly.

### Trust boundary

Do not trust a client-provided `X-Actor-Role` header. A browser or API caller
could change it and bypass policy.

Use minimal server-resolved demo identities:

```text
Authorization: Bearer <demo-token>
-> backend resolves token
-> actor identity
-> actor role
-> request context
-> authorization guard
```

Seed a small set of demo identities:

- admin token -> admin actor -> `ADMIN`,
- developer token -> developer actor -> `DEVELOPER`,
- viewer token -> viewer actor -> `VIEWER`.

A frontend role selector may switch between provisioned demo identities, but it
must be documented as presentation/demo behavior. Do not add OAuth, refresh
tokens, password reset, MFA, or production session management.

### Roles

- `ADMIN`: full access, including project settings, RBAC demo identity
  management if included, group kill switch, and archive/restore actions.
- `DEVELOPER`: manage feature flags, rules, group assignments if allowed by the
  policy, and view stats/audit/history.
- `VIEWER`: read-only access to projects, flags, groups, history, stats, and
  audit logs.

### Backend tasks

- Add demo identity model or static server-side token mapping sourced from
  environment/seed data.
- Resolve bearer token before guards run.
- Preserve `X-Actor` only as a correlation/display fallback if explicitly kept;
  audited actor identity should come from the resolved token.
- Define route permissions centrally.
- Enforce role checks on all control-plane mutations.
- Keep the evaluation API usable for demo clients without privileged control-
  plane credentials.
- Return consistent `FORBIDDEN` or `UNAUTHORIZED` errors.
- Audit successful control-plane mutations with the resolved actor.

### Frontend tasks

- Add a demo identity selector that switches among provisioned demo tokens at
  runtime.
- Do not commit privileged real tokens.
- Hide or disable controls the resolved role cannot use.
- Explain disabled controls accessibly.

### Tests

- Unit test permission matrix.
- E2E/API tests for admin, developer, viewer, missing token, and invalid token.
- Regression tests that audited mutations use the resolved actor identity.

### Acceptance criteria

- Client cannot become admin by changing a role header.
- Viewer cannot mutate projects, flags, rules, groups, kill switches, RBAC state,
  or settings.
- Developer permissions match the documented matrix.
- Admin can perform all intended control-plane operations.
- Evaluation API behavior remains unchanged.
- Documentation clearly states this is a minimal demo identity model, not a
  production identity provider.

### Likely changed files

- `apps/backend/src/common/guards/*`
- `apps/backend/src/common/request-context/*`
- `apps/backend/src/audit/*`
- `apps/backend/src/*/*.controller.ts`
- `apps/backend/prisma/schema.prisma` if demo identities are persisted
- `apps/backend/prisma/seed.ts`
- `apps/backend/test/*rbac*.spec.ts`
- `apps/admin/src/App.tsx`
- `apps/admin/src/pages/*`
- `apps/admin/src/App.css`
- `.env.example`
- `README.md`
- `docs/release/security-review.md`

## Phase 17 — Docker Compose Baseline

### Goal

Provide a working containerized baseline early enough to validate environment
variables, CORS, ports, and service health before final stabilization.

### Baseline services

- PostgreSQL,
- backend API,
- admin dashboard,
- demo app.

### Tasks

- Add root `docker-compose.yml` with health checks.
- Document environment variables for all services.
- Ensure backend CORS uses configured admin and demo origins.
- Keep normal local npm workflow available.
- Decide whether the baseline uses manual migration/seed commands or a demo
  profile. Do not call it a one-command demo workflow until migration and seed
  are automated.

### Acceptance criteria

- Containers can build and start with documented commands.
- PostgreSQL health check works.
- Backend health endpoint works.
- Admin and demo apps can reach the backend when configured.
- README distinguishes baseline compose from final one-command demo startup.

### Likely changed files

- `docker-compose.yml`
- `.dockerignore`
- `apps/backend/Dockerfile`
- `apps/admin/Dockerfile`
- `apps/demo/Dockerfile`
- `.env.example`
- `README.md`
- `docs/release/troubleshooting.md`

## Phase 18 — Optional Redis Cache Provider

### Goal

Offer a production-style cache provider only after the in-memory
snapshot-cache provider is stable.

### Gate C applies

Do not start this phase unless Gate C passes.

### Tasks

- Add Redis service to Docker Compose.
- Add cache provider abstraction if not already present:
  - in-memory provider for local/simple mode,
  - Redis provider for optional compose/demo mode.
- Keep TTL and invalidation semantics identical across providers.
- Add environment variable such as `EVALUATION_CACHE_PROVIDER=memory|redis`.
- Redis outage must fall back to repository access/no-cache behavior.

### Acceptance criteria

- Platform works with cache disabled, in-memory cache, or Redis cache.
- Redis failure does not break evaluation.
- Redis remains optional and does not become a ninth requirement.
- Tests cover provider selection and Redis-failure fallback through mocks or an
  integration profile.

### Likely changed files

- `apps/backend/src/evaluation/*cache*`
- `apps/backend/package.json`
- `package-lock.json`
- `docker-compose.yml`
- `.env.example`
- `README.md`
- `docs/release/security-review.md`

## Phase 19 — Docker Compose Stabilization

### Goal

Make the final Docker workflow reliable from a clean environment after schema,
RBAC, SDK, cache, and optional Redis changes are known.

### Final workflow

Prefer a documented one-command demo workflow using one-shot services or an
idempotent initialization process:

```text
postgres becomes healthy
-> migration service completes
-> demo seed completes
-> backend starts
-> admin and demo start
```

A Docker profile is acceptable:

```bash
docker compose --profile demo up --build
```

Seed behavior must be idempotent and must not destroy existing data on every
restart.

### Tasks

- Add one-shot migration and demo-seed services or an equivalent idempotent
  initialization process.
- Finalize optional Redis service/profile only if Phase 18 completed.
- Verify final CORS and API URLs.
- Verify frontend environment variables in container builds.
- Add clean-environment startup instructions.
- Add final health checks and troubleshooting notes.

### Acceptance criteria

- Docker Compose works from a clean environment.
- One documented demo command starts the complete demo path or clearly explains
  any required one-shot init commands.
- Migration and seed behavior are safe to rerun.
- Normal npm-local workflow still works.

### Likely changed files

- `docker-compose.yml`
- `apps/backend/Dockerfile`
- `apps/admin/Dockerfile`
- `apps/demo/Dockerfile`
- `apps/backend/prisma/seed.ts`
- `.env.example`
- `README.md`
- `docs/release/troubleshooting.md`
- `docs/release/demo-script.md`

## Phase 20 — Final Recommended Release Review

### Goal

Make recommended-level work presentation-ready without weakening MVP evidence.

### Validation commands

Run the strongest available validation sequence:

```bash
npm run lint
npm run test
npm run test:integration --workspace=@ffp/backend
npm run test:e2e --workspace=@ffp/backend
npm run build
npm run diff:check
npm run prisma:validate --workspace=@ffp/backend
```

If available:

```bash
markdownlint docs/**/*.md README.md AGENTS.md
```

Also test Docker from a clean environment:

```bash
docker compose --profile demo up --build
```

or the final documented equivalent.

### Documentation tasks

- Update the requirement traceability matrix or create one if absent.
- Update `README.md` for new commands and Docker workflow.
- Update API/design docs for history, group kill switch, cache, stats, SDK,
  RBAC, and Docker behavior.
- Update research report with implementation tradeoffs.
- Update slide outline with recommended-level proof points.
- Update demo script with the safest recommended features to present live.
- Mark incomplete optional extensions, especially Redis, as future work rather
  than mixing them into the stable demo path.

### Final acceptance criteria

- All original MVP acceptance criteria still pass.
- Each recommended requirement maps to source code, API/UI behavior, tests,
  documentation, and a demo scenario.
- Evaluation remains deterministic.
- Cache and metrics failures do not change safe evaluation behavior.
- Control-plane mutations are authorized and audited.
- Docker Compose works from a clean environment.
- At least three recommended features are safe to demonstrate live.
- Incomplete optional extensions such as Redis are clearly marked as future work
  and are not part of the stable demo path.

### Likely changed files

- `README.md`
- `docs/design/*`
- `docs/research/feature-flag-platform-research-report.md`
- `docs/presentation/slide-outline.md`
- `docs/release/demo-script.md`
- `docs/release/security-review.md`
- `docs/release/troubleshooting.md`
- `docs/plan/*traceability*` if created

## Revised Implementation Order

1. Phase 10 — Evaluation tests and precedence contract.
2. Phase 11 — Audit-backed configuration history.
3. Phase 12 — Group kill switch.
4. Gate A — Domain review.
5. Phase 13 — In-memory evaluation-snapshot cache.
6. Phase 14 — Evaluation statistics and dashboard.
7. Phase 15 — JavaScript SDK and demo app migration.
8. Gate B — Runtime review.
9. Phase 16 — RBAC with server-resolved demo identities.
10. Phase 17 — Docker Compose baseline.
11. Gate C — Redis decision.
12. Phase 18 — Optional Redis cache provider.
13. Phase 19 — Docker Compose stabilization.
14. Phase 20 — Final recommended release review.

If only a small amount of time is available before submission, prioritize Phase
10 through Gate A plus the lowest-risk runtime enhancement from Phase 13 or
Phase 15. Do not begin a high-risk phase if its gate prerequisites are not met.
