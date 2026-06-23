# Recommended Enhancements Roadmap

## Purpose

This roadmap extends the completed MVP with the **recommended-level**
requirements from `docs/requirement/requirement-init.md` while protecting the
required submission artifacts for **July 7, 2026** and the presentation on
**July 9, 2026**.

The required MVP remains the release baseline. Each recommended enhancement must
be implemented as a small, reversible increment with tests, documentation, and a
clear demo value. If time becomes constrained, stop after the latest passing
phase and keep the MVP stable.

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

## Guiding Principles

- Preserve deterministic evaluation and safe default-off behavior.
- Keep management APIs and dashboard as the control plane.
- Keep runtime evaluation and SDK calls as the data plane.
- Do not expose database URLs, secrets, or actor credentials in browser apps.
- Use stable non-PII targeting keys for rollout and statistics.
- Audit every control-plane mutation, including RBAC, kill-switch, and rule
  versioning changes.
- Prefer in-memory/local options first; add Redis only if it improves demo or
  evaluation value without risking delivery.

## Recommended Scope Priority

### Tier 1 — Highest value and lowest risk

These are the safest recommended additions for submission and presentation:

1. Rule evaluation unit-test expansion.
2. Docker Compose local workflow.
3. Simple JavaScript SDK.
4. In-memory evaluation cache with safe invalidation.

### Tier 2 — Strong demo value with moderate backend work

5. Evaluation statistics API and dashboard.
6. Rule versioning using configuration revisions and audit-log history.
7. Group kill switch for fast rollback.

### Tier 3 — Higher complexity and highest security risk

8. Role-based access control for admin/developer/viewer.

RBAC is valuable, but it changes many mutation paths. Implement it only after
all Tier 1 and Tier 2 changes pass tests.

## Phase 10 — Recommended Baseline and Test Expansion

### Goal

Lock the current MVP as the stable base and expand rule-evaluation tests so the
recommended work starts from a reliable safety net.

### Backend tasks

- Review existing unit tests for:
  - global disable / kill switch precedence,
  - user allowlist,
  - role targeting,
  - percentage rollout,
  - invalid context,
  - archived flags,
  - disabled configs,
  - missing project/flag `NOT_FOUND`,
  - evaluation errors failing closed.
- Add missing edge cases for:
  - multiple rules of the same type,
  - disabled rules being ignored,
  - percentage values at `0`, `1`, `50`, and `100`,
  - missing `targetingKey` with percentage rollout,
  - stable bucket behavior across repeated calls.

### Documentation tasks

- Update `docs/plan/phase-9-test-coverage-map.md` or create a recommended
  coverage map if new tests are added.
- Add a short release note explaining that rule evaluation tests are a
  recommended-level deliverable.

### Acceptance criteria

- `npm run test --workspace=@ffp/backend` passes.
- Unit tests clearly prove deterministic rule evaluation.
- No API, database, or UI behavior changes are introduced in this phase.

## Phase 11 — Docker Compose One-Command Local Setup

### Goal

Make the full platform easier to run for mentors and demos.

### Deliverables

- Root `docker-compose.yml` for:
  - PostgreSQL,
  - backend API,
  - admin dashboard,
  - demo app.
- Optional `docker-compose.dev.yml` if local development needs bind mounts.
- Root `.dockerignore` files where needed.
- README section for Docker setup.

### Backend/database tasks

- Ensure backend service reads environment from compose variables.
- Run Prisma migration and seed as documented commands, not as hidden side
  effects unless explicitly scripted.
- Keep connection strings in `.env.example`; do not commit secrets.

### Frontend tasks

- Ensure admin and demo apps can receive the backend API base URL through Vite
  environment variables.
- Verify admin and demo origins are included in backend CORS configuration.

### Acceptance criteria

- A reviewer can run the system with documented Docker commands.
- Seed data can be loaded after containers start.
- README includes both npm-local and Docker workflows.
- Existing local npm workflow still works.

## Phase 12 — Simple JavaScript SDK

### Goal

Make client integration easier and demonstrate practical value beyond direct
`fetch` calls.

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
});

const result = await client.evaluate('new-checkout', {
  targetingKey: 'demo-user-beta',
  userId: 'demo-user-beta',
  roles: ['beta-tester'],
});

if (result.enabled) {
  // show feature
}
```

### SDK behavior

- Accept `baseUrl`, `projectKey`, optional `fetch`, and optional timeout.
- Send evaluation requests only to `POST /v1/evaluate`.
- Return the backend response shape: `projectKey`, `flagKey`, `enabled`,
  `reason`, `variant`, and `matchedRuleId`.
- Fail closed on network or validation errors with `enabled=false` and a local
  reason such as `CLIENT_ERROR` or `ERROR`.
- Avoid storing secrets or PII.

### Demo app tasks

- Replace direct `fetch` in `apps/demo` with the SDK.
- Keep the request/response fields visible for presentation.

### Documentation tasks

- Add SDK README with install/use examples.
- Add a short section to the research report or slides showing easier client
  integration.

### Acceptance criteria

- SDK unit tests pass.
- Demo app still proves the same scenarios.
- The SDK does not add server-side control-plane permissions.

## Phase 13 — Evaluation Cache

### Goal

Improve evaluation performance and demonstrate caching/consistency tradeoffs.

### Recommended implementation

Start with an **in-memory cache** in the backend. Add Redis later only if there
is time and Docker Compose is already stable.

### Cache key

Use non-PII stable values:

```text
projectKey:environmentKey:flagKey:targetingKey:contextHash:configVersion
```

Where:

- `projectKey`, `environmentKey`, and `flagKey` identify the flag.
- `targetingKey` is a stable non-PII rollout key.
- `contextHash` is derived from normalized roles/attributes needed by rules.
- `configVersion` changes whenever flag config or rules change.

### Backend tasks

- Add an `EvaluationCacheService` behind an interface.
- Cache successful evaluation results for a short TTL, for example 30 seconds.
- Do not cache validation failures.
- Cache `NOT_FOUND` only with a very short TTL, or skip it for simplicity.
- Invalidate cache on flag config and rule mutations.
- Return optional debug metadata only in server logs, not public API responses,
  unless a safe response field is intentionally documented.

### Data consistency tasks

- Add or reuse a configuration version field so cache entries naturally expire
  after mutations.
- Ensure kill-switch and rule changes are visible immediately after mutation by
  invalidating affected flag entries.

### Acceptance criteria

- Repeated identical evaluations can be served from cache.
- Mutating a flag config or rules invalidates stale evaluations.
- Safe defaults remain unchanged when the cache fails.
- Tests cover cache hit, cache miss, TTL expiry, and invalidation.

## Phase 14 — Rule Versioning and Configuration History

### Goal

Make flag configuration changes easier to inspect and explain beyond raw audit
logs.

### Data model options

Preferred MVP-compatible option:

- Add `version` to `FlagEnvironmentConfig`.
- Increment `version` whenever config or rules are changed.
- Store snapshots in a new append-only `FlagConfigVersion` table.

Suggested table fields:

- `id`
- `projectId`
- `flagId`
- `environmentId`
- `flagConfigId`
- `version`
- `snapshot`
- `actor`
- `requestId`
- `createdAt`

### Backend tasks

- Create version snapshots in the same transaction as config/rule mutations.
- Add read API:
  - `GET /v1/projects/:projectKey/flags/:flagKey/versions`
  - `GET /v1/projects/:projectKey/flags/:flagKey/versions/:version`
- Keep audit logs as the source of mutation accountability.
- Use versions as a cache invalidation primitive.

### Frontend tasks

- Add a simple history panel on the rule editor or flag detail screen.
- Show version number, actor, timestamp, and summary of changes.

### Acceptance criteria

- Rule/config changes create immutable version snapshots.
- Audit logs and version history agree on actor, target, and timestamp.
- Evaluation uses the latest active configuration only.

## Phase 15 — Evaluation Statistics and Dashboard

### Goal

Show practical operational value by displaying how often each flag is evaluated
and what outcomes are returned.

### Data model

Add a compact aggregate table instead of storing every evaluation event:

- `FlagEvaluationMetric`
  - `projectId`
  - `environmentId`
  - `flagId`
  - `flagKey`
  - `reason`
  - `enabled`
  - `dateBucket` or `hourBucket`
  - `count`
  - timestamps

### Backend tasks

- Increment aggregate metrics after evaluation.
- Keep metric writes best-effort so evaluation availability is not blocked by
  statistics failures.
- Avoid storing raw user IDs, targeting keys, or attributes in metrics.
- Add read APIs:
  - `GET /v1/projects/:projectKey/stats/flags`
  - `GET /v1/projects/:projectKey/flags/:flagKey/stats`

### Frontend tasks

- Add a statistics dashboard or section on flag list/detail.
- Show total evaluations, enabled count, disabled count, and top reasons.
- Keep charts simple; tables or summary cards are sufficient.

### Tests

- Unit test metric aggregation logic.
- Integration test evaluation still returns even if metric write fails.
- E2E/API test stats query shape and pagination/filtering.

### Acceptance criteria

- Dashboard shows evaluation counts per flag.
- Metrics contain no PII.
- Evaluation remains fast and safe if statistics persistence fails.

## Phase 16 — Group Kill Switch

### Goal

Allow fast rollback for a group of flags without editing each flag one by one.

### Scope options

Recommended implementation:

- Add a project/environment-level kill-switch group concept.
- Associate flags with one optional kill-switch group.
- When a group is active, all associated flags evaluate as off with reason
  `GROUP_KILL_SWITCH`.

### Data model

Add:

- `KillSwitchGroup`
  - `projectId`
  - `environmentId`
  - `key`
  - `name`
  - `enabled`
  - timestamps
- Nullable group reference on `FlagEnvironmentConfig` or a join table if flags
  can belong to multiple groups.

### Backend tasks

- Add CRUD or minimal create/update/list APIs for groups.
- Add endpoint to activate/deactivate a group kill switch.
- Include group state in evaluation snapshot.
- Precedence should be:
  1. archived flag,
  2. flag-level kill switch,
  3. group kill switch,
  4. disabled config,
  5. global on,
  6. targeting rules,
  7. default off.
- Audit all group mutations and assignments.
- Invalidate evaluation cache for affected flags.

### Frontend tasks

- Add group kill-switch management to the admin dashboard.
- Display clear warning/confirmation before activating a group kill switch.
- Show runtime semantics as `Off` because of group kill switch, separate from
  flag lifecycle status.

### Acceptance criteria

- Activating a group switch disables all assigned flags immediately.
- Deactivating it restores normal per-flag evaluation.
- Audit logs identify actor, group, affected flags, and before/after state.

## Phase 17 — Role-Based Access Control

### Goal

Restrict control-plane operations by user role while keeping the demo simple.

### Roles

- `admin`: full access, including project settings, RBAC, group kill switch,
  and destructive/archive actions.
- `developer`: create/edit flags and rules, view stats and audit logs.
- `viewer`: read-only access to projects, flags, rules, stats, and audit logs.

### MVP-friendly identity model

Use request headers for the educational project unless a real auth provider is
explicitly added:

- `X-Actor`: stable actor identity.
- `X-Actor-Role`: `admin`, `developer`, or `viewer`.

This keeps RBAC demonstrable without adding login/session scope.

### Backend tasks

- Add `ActorRole` enum and authorization guard.
- Define route permissions centrally.
- Enforce role checks on all control-plane mutations.
- Keep evaluation API public for demo usage, but rate-limit/security notes can
  remain documented rather than implemented.
- Return consistent `FORBIDDEN` errors.
- Audit denied mutation attempts only if intentionally documented; otherwise
  log server-side without creating audit entries for failed changes.

### Frontend tasks

- Add a simple role selector for demo/presentation mode.
- Hide or disable actions the selected role cannot perform.
- Keep accessible explanations for disabled controls.

### Tests

- Unit test permission matrix.
- E2E/API tests for admin, developer, viewer, missing actor, and invalid role.
- Regression tests that all audited mutations still require actor identity.

### Acceptance criteria

- Viewer cannot mutate projects, flags, rules, kill switches, or RBAC state.
- Developer can manage flags/rules but cannot manage admin-only settings.
- Admin can perform all control-plane operations.
- Evaluation API behavior remains unchanged.

## Phase 18 — Redis Cache Option

### Goal

Offer a production-style cache option after the in-memory cache is stable.

### Tasks

- Add Redis service to Docker Compose.
- Add cache provider abstraction:
  - in-memory provider for local/simple mode,
  - Redis provider for compose/demo mode.
- Keep TTL and invalidation semantics identical across providers.
- Add environment variable such as `EVALUATION_CACHE_PROVIDER=memory|redis`.

### Acceptance criteria

- Platform works with cache disabled, in-memory cache, or Redis cache.
- Redis outage does not break evaluation; it falls back to no-cache behavior.
- Tests cover provider selection and Redis-failure fallback through mocks.

## Phase 19 — Final Recommended Release Review

### Goal

Make the recommended-level work presentation-ready without weakening the MVP.

### Required checks

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

### Documentation updates

- Update `README.md` for new commands and Docker workflow.
- Update API/design docs for SDK, cache, stats, versioning, RBAC, and group
  kill switch endpoints.
- Update research report with implementation tradeoffs.
- Update slide outline with recommended-level proof points.
- Update demo script with the safest recommended features to present live.

### Final acceptance criteria

- Required MVP still passes all original acceptance criteria.
- Every recommended enhancement has tests or documented evidence.
- Demo can show at least three recommended-level improvements without manual
  database edits.
- Presenter can explain why each enhancement improves practical value.
- If a recommended enhancement is incomplete, it is clearly marked as future
  work and not mixed into the stable demo path.

## Suggested Implementation Order

For the best balance of value and delivery safety:

1. Phase 10 — test expansion.
2. Phase 11 — Docker Compose.
3. Phase 12 — JavaScript SDK.
4. Phase 13 — in-memory evaluation cache.
5. Phase 15 — statistics dashboard.
6. Phase 14 — rule versioning/history.
7. Phase 16 — group kill switch.
8. Phase 17 — RBAC.
9. Phase 18 — Redis cache option.
10. Phase 19 — final recommended release review.

If only a small amount of time is available before submission, stop after
Phases 10-13. Those phases demonstrate recommended-level ambition while keeping
implementation risk low.
