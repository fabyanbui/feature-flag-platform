# Phase 13 In-Memory Evaluation Snapshot Cache — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a
reference, not a transcript.

## Scope

The session taught and completed Phase 13 from
`docs/plan/recommended-enhancements-roadmap.md`: add a process-local in-memory
cache for reusable evaluation configuration snapshots without caching
user-specific decisions.

The work covered the cache contract, implementation, NestJS wiring, evaluation
read path, post-commit invalidation, unit and E2E coverage, security review, and
release documentation.

## High-signal outcomes

- Added an `EvaluationSnapshotCache` abstraction with an asynchronous,
  provider-neutral interface suitable for a future Redis implementation.
- Added a `Map`-backed provider with configurable TTL through
  `EVALUATION_CACHE_TTL_MS`; the default is 30 seconds.
- Cache keys use project, environment scope, and flag keys. Requests without an
  explicit environment use the private `__default__` scope.
- Cached values contain lifecycle state, environment configuration, optional
  group kill-switch state, and ordered rules. User context and final evaluation
  decisions are never cached.
- Cache hits continue to run the deterministic evaluation engine with the
  current request context. Cache misses load PostgreSQL and cache only a
  successful snapshot.
- `NOT_FOUND`, validation failures, and evaluation errors are not cached.
- Cache read failures fall back to PostgreSQL; cache write failures continue
  without caching. Repository and engine failures retain fail-closed `ERROR`
  behavior.
- Added a fault-tolerant `EvaluationCacheInvalidator`. Invalidation failures are
  logged but do not report an already committed mutation as failed.
- Relevant configuration changes invalidate only after the database mutation
  and append-only audit record commit.
- Phase 13 introduced no Prisma migration and did not change the public
  evaluation response.
- Phase 13 is marked complete in the recommended enhancements roadmap.

## Files and artifacts

Core cache implementation:

- `apps/backend/src/evaluation/cache/evaluation-snapshot-cache.ts`
- `apps/backend/src/evaluation/cache/in-memory-evaluation-snapshot-cache.ts`
- `apps/backend/src/evaluation/cache/evaluation-cache-invalidator.ts`
- `apps/backend/src/evaluation/cache/evaluation-cache.module.ts`

Evaluation and mutation integration:

- `apps/backend/src/evaluation/evaluation.module.ts`
- `apps/backend/src/evaluation/evaluation.service.ts`
- `apps/backend/src/feature-flags/feature-flags.module.ts`
- `apps/backend/src/feature-flags/feature-flags.service.ts`
- `apps/backend/src/flag-rules/flag-rules.module.ts`
- `apps/backend/src/flag-rules/flag-rules.service.ts`
- `apps/backend/src/flag-groups/flag-groups.module.ts`
- `apps/backend/src/flag-groups/flag-groups.service.ts`

Test evidence:

- `apps/backend/src/evaluation/cache/evaluation-snapshot-cache.spec.ts`
- `apps/backend/src/evaluation/cache/in-memory-evaluation-snapshot-cache.spec.ts`
- `apps/backend/src/evaluation/cache/evaluation-cache-invalidator.spec.ts`
- `apps/backend/src/evaluation/cache/evaluation-cache.module.spec.ts`
- `apps/backend/src/evaluation/evaluation.service.spec.ts`
- `apps/backend/src/feature-flags/feature-flags.service.spec.ts`
- `apps/backend/src/flag-rules/flag-rules.service.spec.ts`
- `apps/backend/src/flag-groups/flag-groups.service.spec.ts`
- `apps/backend/test/phase-13-evaluation-cache.e2e-spec.ts`

Configuration and durable documentation:

- `.env.example`
- `README.md`
- `docs/design/software-architecture-document.md`
- `docs/design/mvp-api-and-contracts.md`
- `docs/plan/recommended-enhancements-roadmap.md`
- `docs/release/security-review.md`
- `docs/research/feature-flag-platform-research-report.md`
- `docs/presentation/slide-outline.md`

The Phase 13 branch culminated in commit `ebaf543`, with the implementation
developed incrementally across commits `40436a5` through `317926a`.

## Decisions and guardrails

- Cache `EvaluationSnapshot`, never `EvaluationResult`.
- Do not put `userId`, `targetingKey`, roles, attributes, or other request
  context into cache keys or values.
- Keep the cache process-local and single-instance for this phase. A
  horizontally scaled backend requires a shared provider such as Redis with
  equivalent TTL and invalidation semantics.
- Use one shared NestJS cache provider through `EvaluationCacheModule` and
  `useExisting`; do not create separate `Map` instances in consuming modules.
- Missing environment input uses `__default__` rather than assuming the default
  environment is named `production`.
- Flag lifecycle, evaluated configuration, and rule changes invalidate the flag
  across all cached environment scopes.
- Group assignment, reassignment, and unassignment invalidate the affected flag
  across all environment scopes because membership is project-wide.
- A group kill-switch change invalidates every assigned flag only in the
  affected environment, including the provider's default-environment alias.
- Group creation, group rename, metadata-only flag updates, and idempotent
  mutations do not require invalidation.
- Mutation order remains: change configuration, write audit record, commit,
  invalidate cache, return response.
- Preserve deterministic evaluation, safe defaults, stable non-PII rollout
  keys, append-only auditing, and control-plane/data-plane separation.

## Validation and caveats

Final validation passed:

- workspace lint,
- 311 backend unit tests across 41 suites,
- 11 integration tests across 3 suites,
- 28 E2E tests across 8 suites,
- all workspace production builds,
- Prisma schema validation,
- `git diff --check`.

The Phase 12 group-switch and Phase 13 cache E2E suites specifically proved
that warmed snapshots refresh after flag configuration changes, rule
replacement, lifecycle changes, group assignment or unassignment, and group
kill-switch changes.

Database-backed integration and E2E tests require local PostgreSQL access and
test server sockets. In a restricted sandbox they can fail with `EPERM`; rerun
them with the approved elevated test commands rather than treating that as a
product failure.

The PostgreSQL driver currently emits a non-blocking warning about calling
`client.query()` while a query is already executing. Track this before upgrading
to `pg@9`, where the behavior is expected to be removed.

## Best reusable next prompt

Review Phase 14 in `docs/plan/recommended-enhancements-roadmap.md` and teach me
step by step to implement evaluation statistics and the dashboard. Start by
verifying Phase 13 remains green, then freeze a privacy-preserving aggregation
contract. Preserve deterministic evaluation, ensure statistics failures cannot
break evaluation, count cache hits as evaluations, avoid raw user context in
metrics, and keep all work aligned with `AGENTS.md`.

## Source notes

- Source conversation: the current Codex session, which implemented Phase 13
  through ten guided steps and completed final repository validation.
- Primary scope source:
  `docs/plan/recommended-enhancements-roadmap.md`.
- Repository guardrails: `AGENTS.md`.
- Product and delivery sources:
  `docs/requirement/requirement-init.md`,
  `docs/requirement/info-init.md`, and `docs/plan/project-goal.md`.
