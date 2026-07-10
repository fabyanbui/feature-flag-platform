# Codex Context History — 2026-06-25

Purpose: compact context for future Codex sessions. Use this as an index, not a
transcript.

## Read first

- Active authority: `AGENTS.md`.
- Product and deadline sources:
  - `docs/requirement/requirement-init.md`
  - `docs/requirement/info-init.md`
  - `docs/plan/project-goal.md`
- Submission is due July 7, 2026; presentation is July 9, 2026. Slides and the
  research report remain required.
- `docs/plan/implementation-roadmap.md` is the completed MVP regression
  baseline.
- `docs/plan/recommended-enhancements-roadmap.md` is the active source for
  recommended phase completion evidence and Gate A/B/C sequencing.
- Durable Codex context remains under `docs/codex/`, `.codex/`, and
  `.agents/skills/`.
- Useful June 25 references:
  - `docs/codex/reference/phase-13-in-memory-evaluation-snapshot-cache.md`
  - `docs/codex/reference/phase-14-evaluation-statistics-dashboard.md`
  - `docs/plan/phase-14-test-coverage-map.md`

## Repo guardrails to keep

- Preserve deterministic evaluation, stable percentage hashing, safe defaults,
  and fail-closed `NOT_FOUND` and `ERROR` behavior.
- Authoritative evaluation precedence is:
  `FLAG_ARCHIVED` -> `FLAG_DISABLED` -> `GROUP_KILL_SWITCH` ->
  `KILL_SWITCH` -> `GLOBAL_ON` -> ordered enabled rules -> `DEFAULT_OFF`.
- Cache reusable evaluation snapshots only; never cache user-specific final
  decisions or raw evaluation context.
- Count evaluation statistics as aggregate metrics only; never persist user ID,
  targeting key, roles, attributes, or matched rule IDs in metrics.
- Preserve append-only audit entries with trusted before/after snapshots in the
  same transaction as control-plane mutations.
- After a successful mutation commits, invalidate only affected evaluation
  snapshots; cache failures must not change evaluation decisions.
- Keep management/control-plane concerns separate from runtime evaluation and
  the client SDK data plane.
- Use stable, non-PII identifiers for targeting and rollout keys.
- Keep lifecycle/configuration status distinct from runtime On/Off state.
- RBAC demo identities are server-resolved bearer identities; clients must not
  be able to elevate by spoofing actor or role headers.
- Keep `.env.example` aligned with `.env` variable shape using safe
  placeholders only.

## What happened today

- Thirty-six local June 25 session logs had `cwd` set to this repository.
- Created PR #32 from `chore/setup-basic-ci` to `develop` and hardened the CI
  workflow:
  - pinned GitHub Actions, Ubuntu, and Node versions,
  - disabled persisted checkout credentials,
  - restricted token permissions,
  - added Prisma generation and seed idempotency checks,
  - added weekly Dependabot checks,
  - optimized install and whitespace-validation behavior.
- Completed Phase 13, In-Memory Evaluation-Snapshot Cache:
  - documented the cache contract and default TTL behavior,
  - added `EvaluationSnapshotCache`, deterministic snapshot keys, and an
    in-memory TTL provider,
  - wired a shared `EvaluationCacheModule`,
  - integrated cache hit/miss behavior into evaluation while preserving
    repository fallback and fail-closed behavior,
  - added `EvaluationCacheInvalidator` and after-commit invalidation for flag,
    rule, group assignment, and group switch mutations,
  - added unit and E2E coverage for keys, TTL, cache isolation, invalidation,
    fallback, and warmed-snapshot refresh,
  - updated docs and created
    `docs/codex/reference/phase-13-in-memory-evaluation-snapshot-cache.md`,
  - final validation recorded lint, unit, integration, E2E, build, Prisma
    schema/client checks, and `git diff --check`,
  - created PR #33 from `feat/evaluation-snapshot-cache` to `develop`.
- Modernized Codex skills and context to match the stable MVP plus active
  recommended roadmap:
  - updated existing `.agents/skills/*` wording away from MVP-only assumptions,
  - added `evaluation-runtime-reliability`, `javascript-sdk-delivery`,
    `demo-rbac`, and `docker-compose-delivery`,
  - updated `AGENTS.md`, `.codex/config.toml`, `.codex/agents/*.toml`,
    `docs/codex/context-map.md`, `docs/codex/task-template.md`,
    `docs/plan/project-goal.md`, and `README.md`,
  - validated all 17 skills and Codex TOML loading.
- Completed Phase 14, Evaluation Statistics and Dashboard:
  - added the statistics contract to `docs/design/mvp-api-and-contracts.md`,
  - created `docs/plan/phase-14-test-coverage-map.md` and TDD red tests,
  - added `FlagEvaluationMetric` plus migration
    `20260625052509_add_flag_evaluation_metrics`,
  - added privacy-preserving atomic metric upserts, metrics service, stats
    module, and final-result evaluation recording,
  - preserved cache-hit counting, `NOT_FOUND` and `ERROR` counting, actual
    default-environment resolution, and metric failure isolation,
  - added query DTOs, normalized `[from, to)` UTC time ranges, repository
    aggregation, `StatsService`, and `StatsController`,
  - exposed `GET /v1/projects/:projectKey/stats/flags` and
    `GET /v1/projects/:projectKey/flags/:flagKey/stats`,
  - added Phase 14 E2E coverage for cache hit/miss counting, enabled/disabled
    and reason aggregation, pagination, environment isolation, privacy,
    validation errors, and metric failure behavior,
  - added the admin Statistics page with filters, summary cards, reason table,
    loading/error/empty/retry states, responsive styles, and accessible On/Off
    language,
  - updated roadmap, architecture, API docs, security review, demo script,
    research report, slide outline, README, and troubleshooting docs,
  - created
    `docs/codex/reference/phase-14-evaluation-statistics-dashboard.md`,
  - created PR #34 from `feat/evaluation-statistics` to `develop`.
- Completed Phase 15, JavaScript SDK and Demo App Migration:
  - added workspace package `packages/js-sdk` as `@ffp/js-sdk`,
  - implemented `evaluate`, `isEnabled`, `getVariant`, configurable timeout,
    custom fetch injection, strict response validation, and typed fail-closed
    client fallback,
  - migrated `apps/demo` away from direct evaluation `fetch`,
  - kept backend reason-code contracts unchanged while distinguishing
    SDK-local `errorSource=CLIENT` failures,
  - added 21 SDK unit tests and package dry-run validation,
  - updated architecture, README, requirements, security review, research
    report, slide outline, demo script, and roadmap,
  - recorded Gate B as passed on June 25, 2026,
  - PR #36 already existed from `feat/javascript-sdk` to `develop`.
- Phase 16, RBAC with Server-Resolved Demo Identities, was reported complete by
  the end of the June 25 sessions and current filesystem evidence confirms the
  commit:
  - added server-resolved admin/developer/viewer bearer identities,
  - replaced trusted actor-header authorization with centralized permissions,
  - protected the control plane while leaving health and evaluation public,
  - kept successful mutations audited with the resolved actor,
  - added admin identity switching and disabled-control explanations,
  - validation evidence recorded 374 backend unit tests, 11 integration tests,
    44 E2E tests, 21 SDK tests, builds, lint, browser checks, and
    `git diff --check`.
- The last June 25 session concluded that Phase 17 was safe to start, with Redis
  explicitly deferred until Gate C.

## Current observed working tree notes

- Date interpreted for this file: June 25, 2026 in ICT (`+0700`).
- Current branch while writing this file: `develop`.
- Current `HEAD` while writing this file: `614d006`.
- Working tree was clean before this file was added.
- The filesystem has advanced beyond the June 25 logs: current
  `docs/plan/recommended-enhancements-roadmap.md` records Phase 17 through
  Phase 20 completed on June 26, 2026. Use the current roadmap over this
  historical index for latest phase status.
- Current `develop` includes merges after June 25:
  - PR #37, Phase 16 demo RBAC,
  - PR #38, Docker Compose baseline,
  - PR #39, optional Redis cache provider,
  - PR #40, Docker Compose stabilization,
  - PR #41, final release review.
- `packages/js-sdk/dist/` is present in the repository as built package output.
- `apps/backend/src/stats/` is present with DTOs, service, controller, time
  range utilities, metrics recorder, and tests.
- `docs/plan/phase-14-test-coverage-map.md` exists.
- `markdownlint` was repeatedly unavailable in the local environment.
- Browser automation was intermittently unavailable in restricted Codex
  environments; Phase 16 later recorded successful headless Chromium checks.
- Database-backed tests emitted a non-failing `pg` concurrent-query deprecation
  warning during Phase 14/15 validation; treat as dependency-maintenance work,
  not a behavior regression.

## Best next prompt for Codex

Continue from current `develop`. Read `AGENTS.md`,
`docs/codex/history/2026-06-25-context-index.md`,
`docs/plan/recommended-enhancements-roadmap.md`, and the current release docs.
Use the roadmap's latest completion evidence, not the historical June 25 phase
status, because the filesystem has advanced through Phase 20 on June 26. Keep
the project submission-ready for July 7, 2026 and presentation-ready for July
9, 2026. Preserve deterministic evaluation, privacy-preserving cache/statistics
behavior, append-only audit logging, server-resolved RBAC, optional Redis, and
the Docker Compose demo workflow. If changing code, use small reversible
increments and validate with the strongest relevant npm, Prisma, Docker, and
diff checks available.

## Session index, compressed

- `02:10-02:30 ICT`: PR #32 created for basic CI; CI workflow hardened and
  optimized.
- `02:10-03:38 ICT`: Phase 13 cache work implemented step by step, documented,
  validated, referenced, and PR #33 created.
- `11:26-11:42 ICT`: Phase 14 planning began; Codex skills and repo context
  were modernized for active recommended-roadmap work.
- `11:32-16:50 ICT`: Phase 14 statistics backend, migration, APIs, admin UI,
  E2E tests, documentation, and completion evidence were delivered.
- `17:06 ICT`: PR #34 created for privacy-preserving evaluation statistics.
- `17:11 ICT`: PR #36 for `feat/javascript-sdk` already existed; Phase 15 was
  then completed with SDK, demo migration, docs, validation, and Gate B.
- `22:58-23:08 ICT`: Phase 16 RBAC sessions were interrupted while mapping
  server-resolved demo identities onto controllers, audit context, API client,
  and admin UI.
- `23:10-23:38 ICT`: Phase 16 was reported complete and committed; the final
  June 25 answer said Phase 17 could start, while deferring Redis until Gate C.
