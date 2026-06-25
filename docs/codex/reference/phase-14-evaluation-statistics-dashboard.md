# Phase 14 Evaluation Statistics Dashboard — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a
reference, not a transcript.

## Scope

The session taught and completed Phase 14 from
`docs/plan/recommended-enhancements-roadmap.md`: privacy-preserving aggregate
evaluation statistics, read APIs, an admin dashboard, tests, documentation, and
the final quality gate.

The completed MVP and Phases 10–13 remained the protected regression baseline.
Phase 15, the JavaScript SDK and demo migration, is the next active phase. Gate
B remains pending until Phase 15 also passes.

## High-signal outcomes

- Every validated evaluation request produces exactly one best-effort metric
  increment attempt after its deterministic result is known.
- Cache hits and cache misses are both counted; cached values remain reusable
  configuration snapshots rather than context-specific decisions.
- PostgreSQL stores UTC-hour aggregates by project, environment, flag, reason,
  and enabled result.
- Atomic Prisma upsert increments prevent read-modify-write races.
- Metric persistence failures cannot change `enabled`, `reason`, `variant`, or
  `matchedRuleId`.
- Public statistics queries support project or flag scope, environment
  selection, normalized time ranges, sorting, and pagination where applicable.
- The admin dashboard shows total evaluations, On outcomes, Off outcomes, On
  percentage, and top reasons.
- Statistics consistently describe evaluation requests and outcomes, not
  unique users.

## Files and artifacts

### Persistence and evaluation integration

- `apps/backend/prisma/schema.prisma`
  - Adds `FlagEvaluationMetric`.
- `apps/backend/prisma/migrations/20260625052509_add_flag_evaluation_metrics/migration.sql`
  - Creates the aggregate table, indexes, optional historical relations, and
    the composite metric-bucket uniqueness constraint.
- `apps/backend/src/repositories/evaluation-metrics.repository.ts`
  - Atomic increment and aggregate read queries.
- `apps/backend/src/evaluation/evaluation.repository.ts`
  - Returns stable snapshot resolution metadata for metric attribution.
- `apps/backend/src/evaluation/evaluation.service.ts`
  - Produces one final evaluation result, then records its metric safely.

### Statistics backend

- `apps/backend/src/stats/evaluation-metrics.service.ts`
- `apps/backend/src/stats/stats-time-range.ts`
- `apps/backend/src/stats/stats.service.ts`
- `apps/backend/src/stats/stats.controller.ts`
- `apps/backend/src/stats/stats.module.ts`
- `apps/backend/src/stats/dto/`

Public endpoints:

```http
GET /v1/projects/{projectKey}/stats/flags
GET /v1/projects/{projectKey}/flags/{flagKey}/stats
```

### Admin dashboard

- `apps/admin/src/pages/StatisticsPage.tsx`
- `apps/admin/src/App.tsx`
- `apps/admin/src/App.css`
- `apps/admin/src/lib/api.ts`
- `apps/admin/src/lib/types.ts`

The page reuses existing panels, tables, buttons, loading/empty/error states,
tokens, responsive breakpoints, and text-backed runtime outcome semantics.

### Tests

- `apps/backend/src/repositories/evaluation-metrics.repository.spec.ts`
- `apps/backend/src/stats/evaluation-metrics.service.spec.ts`
- `apps/backend/src/stats/stats-time-range.spec.ts`
- `apps/backend/src/stats/dto/stats-query.dto.spec.ts`
- `apps/backend/src/stats/stats.service.spec.ts`
- `apps/backend/src/stats/stats.controller.spec.ts`
- `apps/backend/src/evaluation/evaluation.service.spec.ts`
- `apps/backend/test/phase-14-evaluation-stats.e2e-spec.ts`
- `docs/plan/phase-14-test-coverage-map.md`

### Durable documentation

- `docs/plan/recommended-enhancements-roadmap.md`
  - Authoritative Phase 14 completion and validation evidence.
- `docs/design/mvp-api-and-contracts.md`
- `docs/design/software-architecture-document.md`
- `docs/release/security-review.md`
- `docs/release/demo-script.md`
- `docs/release/troubleshooting.md`
- `docs/research/feature-flag-platform-research-report.md`
- `docs/presentation/slide-outline.md`
- `README.md`

## Decisions and guardrails

- Metrics are aggregate telemetry, not audit records or raw evaluation events.
- Stored statistics must exclude targeting keys, user IDs, roles, attributes,
  request bodies, IP addresses, matched rule IDs, actors, and credentials.
- Successful resolution records the actual environment key. Early unresolved
  outcomes may use the private `__unresolved__` dimension.
- UTC-hour buckets and half-open `[from, to)` query ranges avoid timezone and
  overlapping-boundary ambiguity.
- Statistics are eventually consistent. Telemetry completeness is secondary to
  evaluation availability.
- Metric writes are outside configuration transactions and do not create audit
  entries.
- Control-plane statistics reads remain separate from the data-plane decision
  engine.
- Feature configuration status remains distinct from runtime On/Off outcomes.
- Deterministic precedence, stable non-PII rollout keys, safe default-off
  behavior, and Phase 13 cache invalidation semantics remain unchanged.

## Validation and caveats

Final gate evidence recorded in
`docs/plan/recommended-enhancements-roadmap.md`:

- Prisma validation and client generation passed.
- All three repository migrations were applied.
- Focused Phase 14 tests: 7 suites and 57 tests passed.
- Phase 14 E2E: 9 tests passed.
- Full backend unit suite: 47 suites and 357 tests passed.
- Integration suite: 3 suites and 11 tests passed.
- Full E2E suite: 9 suites and 37 tests passed.
- Backend, admin, and demo builds passed.
- Workspace lint and `git diff --check` passed.
- Live API and Swagger checks confirmed both statistics endpoints.
- Privacy review found context-related terms only in negative test assertions.
- Step 12 responsive dashboard validation was user-confirmed. A later
  automated headless-browser rerun was blocked by the restricted execution
  environment.
- `markdownlint` was unavailable.
- Database-backed tests emit a non-failing `pg` deprecation warning about
  concurrent `client.query()` usage. Track this during dependency maintenance.

Useful final checks:

```bash
npm run prisma:validate --workspace=@ffp/backend
npx prisma migrate status --config apps/backend/prisma.config.ts
npm run test --workspace=@ffp/backend
npm run test:integration --workspace=@ffp/backend
npm run test:e2e --workspace=@ffp/backend
npm run build
npm run lint
npm run diff:check
```

## Best reusable next prompt

> Continue with Phase 15 in
> `docs/plan/recommended-enhancements-roadmap.md`. First verify all Phase 14
> completion evidence and Gate B prerequisites that already apply. Then teach
> and implement the `@ffp/js-sdk` and migrate the demo app in small reversible
> increments. Preserve the stable evaluation response contract, backend reason
> semantics, typed fail-closed SDK fallback, timeout behavior, privacy-safe
> context handling, and the completed Phase 10–14 regression baseline. Do not
> declare Gate B passed until SDK and demo tests prove the contract is stable.

## Source notes

This reference summarizes the current Codex conversation and the resulting
repository artifacts. The active guardrails remain `AGENTS.md`,
`docs/plan/project-goal.md`, and
`docs/plan/recommended-enhancements-roadmap.md`.
