# Codex Context History — 2026-06-24

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
- Read these completed recommended-phase references:
  - `docs/codex/reference/phase-10-evaluation-precedence-contract.md`
  - `docs/codex/reference/phase-11-audit-backed-configuration-history.md`
  - `docs/codex/reference/phase-12-group-kill-switch.md`
- `docs/plan/recommended-enhancements-roadmap.md` is authoritative for the next
  recommended phase. Phases 10, 11, and 12 are complete; Phase 13 is next.
- Durable Codex context remains under `docs/codex/`, `.codex/`, and
  `.agents/skills/`.

## Repo guardrails to keep

- Protect the required MVP and July delivery dates before additional
  recommended work.
- Preserve deterministic evaluation, stable percentage hashing, safe defaults,
  and fail-closed `NOT_FOUND` and `ERROR` behavior.
- Current terminal precedence is:
  `FLAG_ARCHIVED` -> `FLAG_DISABLED` -> `GROUP_KILL_SWITCH` ->
  `KILL_SWITCH` -> `GLOBAL_ON` -> ordered enabled rules -> `DEFAULT_OFF`.
- Preserve append-only audit records with before/after snapshots in the same
  transaction as management mutations.
- Keep management/control-plane concerns separate from runtime evaluation.
- Use stable, non-PII targeting and rollout keys.
- Keep lifecycle/configuration status distinct from runtime On/Off state.
- Group identity is project-scoped; group kill-switch state is
  environment-specific and defaults inactive.
- Cache work must store reusable evaluation snapshots only, never
  user-specific final decisions.
- Keep `.env.example` aligned with `.env` variable shape using safe
  placeholders; never copy secrets or raw session metadata into documentation.

## What happened today

- Thirty-four local June 24 session logs had `cwd` set to this repository.
  Continuation, PR utility, and short support sessions are compressed below.
- Created and committed
  `docs/codex/history/2026-06-23-context-index.md`.
- Completed Phase 10, Evaluation Tests and Precedence Contract:
  - fixed flag-disabled precedence over the per-flag kill switch,
  - added terminal-precedence, disabled-rule, rule-order, percentage-boundary,
    deterministic-result, invalid-context, and fail-closed error tests,
  - added `docs/plan/phase-10-recommended-test-coverage-map.md`,
  - documented the contract in the design and learning guides,
  - validated 219 backend tests and the backend build,
  - merged PR #28 into `develop`.
- Completed Phase 11, Audit-Backed Configuration History:
  - added
    `GET /v1/projects/{projectKey}/flags/{flagKey}/history`,
  - reused append-only audit entries instead of adding a version table,
  - scoped history through immutable flag and flag-config IDs with stable
    pagination ordering,
  - added backend unit and E2E tests,
  - added `FlagHistoryPanel` to the rule editor with refresh, pagination,
    snapshots, responsive states, and project-wide audit navigation,
  - updated architecture, roadmap, and demo documentation,
  - validated 226 backend unit tests, 21 E2E tests, builds, lint, Prisma, diff,
    and reported browser checks,
  - merged PR #30 into `develop`.
- Completed Phase 12, Environment-Specific Group Kill Switch:
  - added `FlagGroup`, `FlagGroupConfig`, optional project-wide flag membership,
    migration, repositories, services, DTOs, controllers, and audit events,
  - group creation now initializes an inactive configuration for every existing
    project environment,
  - added deterministic `GROUP_KILL_SWITCH` evaluation behavior and fail-closed
    handling for missing expected group configuration,
  - added admin group management, switch controls, flag assignment, keyboard
    improvements, and runtime-state display,
  - seeded `customer-experience` with `beta-dashboard` and `new-checkout`,
  - documented the Phase 13 after-commit cache-invalidation contract,
  - validated 273 backend unit tests, 11 integration tests, 24 E2E tests, all
    workspace builds and lint, Prisma validation, idempotent seed execution,
    read-only database state, and diff checks,
  - marked Gate A passed and merged PR #31 into `develop`.
- Added standalone references for Phases 10, 11, and 12 under
  `docs/codex/reference/`.
- A later support session produced a manual Phase 12 completion checklist for
  admin, demo, Swagger/API, audit, responsive, accessibility, and failure-state
  verification; it did not record a new validation run.
- Temporarily disabled the Prisma, PostgreSQL readonly, and Playwright MCP
  servers in `.codex/config.toml` to reduce context/token cost. Re-enable only
  when their live database or browser capabilities are needed.
- A credential embedded in the Git remote was noticed in session output. The
  current filesystem reports an HTTPS origin with no embedded credentials; do
  not reintroduce credentials into remote URLs or logs.

## Current observed working tree notes

- Date interpreted for this file: June 24, 2026 in ICT (`+0700`).
- Current branch before writing this file: `develop`.
- Current `HEAD` before writing this file: `0e7500b`.
- Working tree was clean before this file was added.
- `docs/plan/recommended-enhancements-roadmap.md` records Phase 12 as complete
  and starts Phase 13 at the in-memory evaluation-snapshot cache.
- Phase 12's future invalidation contract is:
  - assignment, reassignment, or unassignment invalidates that flag in every
    environment,
  - a group-switch toggle invalidates every assigned flag in the affected
    environment,
  - group creation or rename requires no evaluation invalidation,
  - invalidation occurs only after the mutation transaction commits.
- The PostgreSQL test driver emitted a non-failing concurrent-query deprecation
  warning during Phase 12 validation; investigate before upgrading to `pg` 9.
- `markdownlint` is not installed.
- The MCP configuration now differs from the Phase 12 reference's point-in-time
  caveat: the three disabled-server settings were committed after Phase 12
  merged.

## Best next prompt for Codex

Continue on `develop`. Read `AGENTS.md`,
`docs/codex/history/2026-06-24-context-index.md`,
`docs/codex/reference/phase-12-group-kill-switch.md`, and Phase 13 in
`docs/plan/recommended-enhancements-roadmap.md`. Teach and implement Phase 13
step by step, beginning with the cache interface, snapshot key, bounded
eviction, TTL, observability, and tests. Cache only reusable evaluation
snapshots, never user-specific decisions. Preserve deterministic evaluation,
safe failures, append-only audit logging, and the documented after-commit
invalidation boundaries. Do not use Playwright or live database MCPs unless
they are explicitly re-enabled and needed.

## Session index, compressed

- `12:28-12:31 ICT`: created the June 23 history index and began Phase 10
  evaluation-contract work.
- `12:37-13:24 ICT`: implemented, tested, documented, and prepared Phase 10;
  PR #28 was subsequently merged.
- `13:43-15:20 ICT`: implemented Phase 11 backend history, admin panel,
  responsive/browser validation, documentation, reference, and PR #30.
- `15:21-21:53 ICT`: planned and implemented the complete Phase 12 vertical
  slice, hardened environment initialization, added its durable reference, and
  merged PR #31.
- `21:23-21:56 ICT`: reviewed MCP token cost and committed temporary disabling
  of Prisma, PostgreSQL readonly, and Playwright servers.
- `23:35-23:45 ICT`: produced the manual Phase 12 validation checklist and
  started this June 24 history index update.
