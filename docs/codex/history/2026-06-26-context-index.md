# Codex Context History — 2026-06-26

Purpose: compact context for future Codex sessions. Use this as an index, not a
transcript.

## Read first

- Active authority: `AGENTS.md`.
- Product and deadline sources:
  - `docs/requirement/requirement-init.md`
  - `docs/requirement/info-init.md`
  - `docs/plan/project-goal.md`
- Submission is due July 7, 2026; presentation is July 9, 2026. Slides and the
  research report remain required final artifacts.
- `docs/plan/implementation-roadmap.md` is the completed MVP regression
  baseline.
- `docs/plan/recommended-enhancements-roadmap.md` is the active source for
  recommended phase completion evidence and Gate A/B/C sequencing.
- Durable Codex context remains under `docs/codex/`, `.codex/`, and
  `.agents/skills/`.
- Useful June 26 release-readiness references:
  - `docs/plan/requirement-traceability-matrix.md`
  - `docs/release/final-recommended-release-review.md`
  - `docs/release/demo-script.md`
  - `docs/release/troubleshooting.md`

## Repo guardrails to keep

- Preserve deterministic evaluation, stable percentage hashing, safe defaults,
  and fail-closed `NOT_FOUND` and `ERROR` behavior.
- Authoritative evaluation precedence remains:
  `FLAG_ARCHIVED` -> `FLAG_DISABLED` -> `GROUP_KILL_SWITCH` ->
  `KILL_SWITCH` -> `GLOBAL_ON` -> ordered enabled rules -> `DEFAULT_OFF`.
- Cache only reusable evaluation snapshots; never cache user-specific final
  decisions, raw context, targeting keys, roles, attributes, or matched rule
  IDs.
- Evaluation statistics remain aggregate and privacy-preserving.
- Preserve append-only audit entries with trusted before/after snapshots in the
  same transaction as control-plane mutations.
- Keep server-resolved RBAC authoritative; clients must not elevate by
  spoofing actor or role headers.
- Keep management/control-plane concerns separate from runtime evaluation and
  SDK data-plane concerns.
- Use stable, non-PII identifiers for targeting and rollout keys.
- Keep feature flag lifecycle/configuration status distinct from runtime On/Off
  state.
- Keep Redis optional; the stable demo path must not require Redis.
- Keep `.env.example` aligned with `.env` variable shape using safe
  placeholders only.

## What happened today

- Fourteen local June 26 session logs had `cwd` set to this repository.
- Created PR #37 from `feat/demo-rbac` to `develop` for Phase 16 demo RBAC.
- Completed Phase 17, Docker Compose Baseline:
  - added root `docker-compose.yml`, `.dockerignore`, and Dockerfiles for
    backend, admin, and demo,
  - configured PostgreSQL, backend, admin, and demo services with health checks
    and documented environment variables,
  - kept migration/seed manual at this phase and explicitly deferred Redis and
    one-command startup,
  - corrected backend production startup to `dist/src/main.js`,
  - updated `.env.example`, `README.md`, troubleshooting, and the roadmap,
  - validated Compose config/build/runtime, CORS, frontend API URLs, seeded
    evaluation, restart persistence, lint, tests, build, and diff checks,
  - created PR #38 from `chore/docker-compose-baseline` to `develop`.
- Gate C was treated as ready after Phase 17 evidence:
  - full tests passed,
  - Docker baseline worked,
  - no unfinished migrations were observed,
  - in-memory cache remained stable,
  - Redis was still deferred and optional.
- Completed Phase 18, Optional Redis Cache Provider:
  - added `EVALUATION_CACHE_PROVIDER=memory|none|redis`, with `memory` as the
    default and `none` for no-cache validation,
  - added no-op and Redis evaluation snapshot cache providers behind the
    existing cache abstraction,
  - preserved deterministic evaluation, response contracts, TTL/key semantics,
    invalidation behavior, and repository fallback,
  - added optional Compose `redis` profile and Redis health check,
  - documented provider selection, Redis fallback, and privacy/security
    constraints,
  - validated provider tests, all backend/SDK tests, integration/E2E suites,
    build, lint, Prisma, Compose config, Redis `PONG`, and Redis-outage
    fallback,
  - created PR #39 from `chore/redis-cache-provider` to `develop`.
- Completed Phase 19, Docker Compose Stabilization:
  - added one-shot `migrate` and `demo-seed` services,
  - made `docker compose up --build` the final stable demo startup path,
  - changed `apps/backend/prisma/seed.ts` to create missing demo records
    without resetting existing flag state, rules, group kill switches, group
    assignments, lifecycle state, or sample users,
  - kept Redis optional under the existing `redis` profile,
  - updated README, troubleshooting, demo script, `.env.example`, and roadmap,
  - validated clean Compose startup on alternate host ports, health checks,
    admin/demo HTTP 200s, CORS, seeded evaluations, frontend API bundle URLs,
    migration/seed rerun safety, group kill-switch preservation, Redis profile,
    lint, tests, build, Prisma, and diff checks,
  - created PR #40 from `chore/docker-compose-stabilization` to `develop`.
- Completed Phase 20, Final Recommended Release Review:
  - added `docs/plan/requirement-traceability-matrix.md`,
  - added `docs/release/final-recommended-release-review.md`,
  - updated README, API/design docs, architecture, research report, slide
    outline, demo script, security review, troubleshooting, and roadmap,
  - documented Redis as completed optional infrastructure, not part of the
    stable demo dependency path,
  - mapped MVP and recommended requirements to implementation, tests, docs, and
    demo scenarios,
  - recorded safe live demo path: SDK/demo evaluation, group kill switch,
    server-resolved RBAC, history/audit, and aggregate statistics,
  - validated lint, unit tests, integration tests, E2E tests, build, Prisma,
    diff checks, Compose config, and isolated clean Compose startup,
  - created PR #41 from `chore/final-release-review` to `develop`.
- Updated `docs/codex/history/2026-06-25-context-index.md` after the Phase 20
  work landed; that file records June 25 context and notes that the filesystem
  had advanced through Phase 20 on June 26.

## Current observed working tree notes

- Date interpreted for this file: June 26, 2026 in ICT (`+0700`).
- Current branch while writing this file: `develop`.
- Current `HEAD` while writing this file: `2e41bdf`.
- Current `develop` is one local commit ahead of `origin/develop`:
  `docs: add Codex context history index for June 25, 2026`.
- Working tree was clean before adding this June 26 history file.
- Current roadmap records Phases 10 through 20 complete; no next recommended
  phase or unpassed gate is listed after Phase 20.
- `docs/plan/recommended-enhancements-roadmap.md` does not contain a separate
  "Gate C passed" heading, but Phase 18 completion evidence exists after the
  Phase 17/Gate C prerequisites were validated.
- `docker compose up --build` is now the stable local Docker demo workflow.
- Optional Redis remains behind the `redis` Compose profile and
  `EVALUATION_CACHE_PROVIDER=redis`; default cache provider remains `memory`.
- Docker Buildx was unavailable locally during validation; successful Docker
  validation used the documented legacy builder fallback.
- `markdownlint` was not installed locally, so optional Markdown linting was
  skipped in Phase 17 through Phase 20 and in context-index updates.
- Existing non-failing `pg` concurrent-query deprecation warnings appeared in
  database-backed tests; treat as dependency-maintenance work, not a behavior
  regression.
- `.codex/` currently contains repo-scoped Codex agent TOML files and config;
  `.agents/skills/` currently contains 17 repo-scoped skills.
- `packages/js-sdk/dist/` remains present as built package output.

## Best next prompt for Codex

Continue from current `develop`. Read `AGENTS.md`,
`docs/codex/history/2026-06-26-context-index.md`,
`docs/plan/recommended-enhancements-roadmap.md`,
`docs/plan/requirement-traceability-matrix.md`, and
`docs/release/final-recommended-release-review.md`. Treat the MVP as the
protected baseline and Phase 20 as the current recommended-level release
decision. Keep the project submission-ready for July 7, 2026 and
presentation-ready for July 9, 2026. Preserve deterministic evaluation,
append-only audit logging, server-resolved RBAC, privacy-preserving cache and
statistics behavior, optional Redis, and the Docker Compose demo workflow. If
changing code, use small reversible increments and validate with the strongest
relevant npm, Prisma, Docker, and diff checks available.

## Session index, compressed

- `10:07 ICT`: PR #37 created for Phase 16 server-resolved demo RBAC.
- `10:10-10:29 ICT`: Phase 17 guidance began; short interrupted session.
- `10:29-10:55 ICT`: Phase 17 Docker Compose baseline implemented,
  documented, validated, and judged safe for Phase 18 after Gate C review.
- `17:55 ICT`: short greeting-only session; no durable repo outcome.
- `17:58 ICT`: PR #38 created for Docker Compose baseline.
- `18:09-18:11 ICT`: Phase 18 guidance began; Phase 18 identified as optional
  Redis cache provider after the user wording referenced Phase 17.
- `18:11-20:33 ICT`: Phase 18 Redis/no-op/memory cache provider work
  implemented, documented, validated, and judged safe for Phase 19.
- `20:33 ICT`: PR #39 created for optional Redis cache provider.
- `20:41-20:42 ICT`: Phase 19 planning began with Docker Compose delivery
  focus.
- `20:42-21:47 ICT`: Phase 19 one-command Compose workflow and idempotent seed
  behavior implemented, documented, validated, and judged safe for Phase 20.
- `21:47 ICT`: PR #40 created for Docker Compose stabilization.
- `21:54-23:14 ICT`: Phase 20 final recommended release review implemented,
  documented, validated, and recorded as release-ready.
- `23:14 ICT`: PR #41 created for final release-review documentation.
- `01:49 ICT on June 27`: June 25 context index was updated from the June 25
  logs and current filesystem evidence.
