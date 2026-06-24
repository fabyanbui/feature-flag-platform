# Codex Context History — 2026-06-14

Purpose: compact context for future Codex sessions. Use this as an index, not a transcript.

## Read first

- Active authority: `AGENTS.md`.
- Product and deadline sources:
  - `docs/requirement/requirement-init.md`
  - `docs/requirement/info-init.md`
  - `docs/plan/project-goal.md`
- Current authoritative dates in repo docs:
  - Submission: July 7, 2026.
  - Presentation: July 9, 2026.
- Durable Codex context to prefer before raw logs:
  - `docs/codex/context-map.md`
  - `docs/codex/mcp-tool-selection.md`
  - `docs/codex/history/2026-06-13-context-index.md`
  - `docs/codex/reference/pre-phase-6-backend-unit-tests.md`
  - `docs/codex/reference/pre-phase-6-backend-integration-tests.md`
  - `docs/codex/reference/repository-test-validation-commands.md`
  - `docs/testing/pre-phase-6-backend-unit-test-plan.md`
  - `docs/testing/pre-phase-6-backend-integration-test-plan.md`
- Repo-scoped Codex setup remains in `.codex/agents/` and `.agents/skills/`.

## Repo guardrails to keep

- Prioritize required MVP deliverables before recommended enhancements: research
  report, backend API, admin dashboard, demo app, database, validation/error
  handling, README run instructions, seed data, short design docs, slides, and
  report.
- Preserve deterministic evaluation and stable percentage rollout hashing.
- Preserve safe defaults and fail-closed evaluation; missing project/flag returns
  `enabled=false` with `reason=NOT_FOUND` in evaluation responses.
- Preserve append-only audit logging for project/flag/rule mutations, with
  before/after snapshots written in the same transaction as the mutation.
- Keep management/control-plane APIs separate from runtime data-plane evaluation.
- Use stable, non-PII identifiers for targeting and rollout keys.
- Keep feature flag status labels distinct from runtime On/Off state.
- Never expose secrets or connection strings; keep `.env.example` aligned with
  `.env` variable shape using safe placeholders only.

## What happened today

- Eight repo-scoped Codex session logs were found under
  `~/.codex/sessions/2026/06/14/`.
- The June 13 handoff was created:
  `docs/codex/history/2026-06-13-context-index.md`.
  - It captured pre-Phase 6 testing docs, unit-test branch state, staged DTO and
    transaction specs, and persistent caveats around e2e sandboxing and
    append-only audit logs.
- Pre-Phase 6 backend integration-test work was completed through guided steps.
  Durable result:
  `docs/codex/reference/pre-phase-6-backend-integration-tests.md`.
  - Coverage described there includes a dedicated integration Jest config,
    AppModule/service integration helpers, project creation with default
    environment and audit row, audit transaction rollback, feature flag creation
    with safe defaults, rule replacement with before/after audit snapshots,
    evaluation `NOT_FOUND`, persisted role targeting, deterministic percentage
    rollout, request ID behavior, and validation/error shape.
- PR #22 was created from `test/unit-test` to `develop`, then reviewed.
  - Review concern: feature flag list `status` filtering/sorting must be scoped
    to the default environment config used by the response, not any environment
    config.
  - Current git history shows PR #22 was merged into `develop`.
- PR #23 was created from `test/integration-test` to `develop`, then reviewed.
  - Review concern: deterministic percentage rollout integration coverage should
    use a partial rollout with known on/off outcomes, not `percentage: 100`.
  - Current git history shows PR #23 was merged into `develop`.
- A lint warning in
  `apps/backend/test/integration/phase-3-foundation.integration-spec.ts` was
  fixed by introducing a typed `httpServer(): App` helper for Supertest calls.
  Current git history shows this as commit `5e5a226` on `develop`.
- Repository test/validation commands were listed and made durable in:
  `docs/codex/reference/repository-test-validation-commands.md`.
  - It includes unit, integration, e2e, coverage, watch/debug, recommended
    pre-submit validation, optional Prisma validation, and sandbox caveats.
- API testing guidance was provided for automated tests, Swagger/manual calls,
  and UI/demo smoke tests.
  - Swagger UI endpoint: `http://localhost:3000/docs`.
  - API base path: `/v1`.
  - Suggested Swagger smoke path starts with `GET /v1/health`, then evaluates a
    seeded flag after running migrations and seed data.
- Sandbox caveat repeated during validation: backend integration/e2e tests can
  fail in Codex sandbox with local server binding or database connection errors
  such as `listen EPERM` or `connect EPERM`; rerun locally or with approved
  escalation when full integration validation is required.

## Current observed working tree notes

- Current filesystem inspection after summarizing June 14 reports:
  - Branch: `develop`.
  - Tracking: `develop...origin/develop`.
  - Working tree before writing this file: clean.
  - `HEAD`: `d21765a` (`docs: add reference guide for repository test and validation commands`).
- Recent `develop` history includes:
  - `d21765a` — repository test/validation command reference.
  - `5e5a226` — typed integration-test `httpServer` helper.
  - `85e3af5` — merge PR #23 from `test/integration-test`.
  - `9af257b` — merge PR #22 from `test/unit-test`.
- `docs/testing/` currently contains:
  - `docs/testing/backend-testing-strategy.md`
  - `docs/testing/pre-phase-6-backend-unit-test-plan.md`
  - `docs/testing/backend-integration-testing-strategy.md`
  - `docs/testing/pre-phase-6-backend-integration-test-plan.md`
- Important durable references added by June 14 work:
  - `docs/codex/reference/pre-phase-6-backend-integration-tests.md`
  - `docs/codex/reference/repository-test-validation-commands.md`
- Local Codex session metadata can contain sensitive remote/config details; do
  not copy raw `session_meta`, raw command output, tokens, or connection strings
  into history docs.

## Best next prompt for Codex

Continue on `develop`. Read `AGENTS.md`, `docs/plan/project-goal.md`,
`docs/testing/pre-phase-6-backend-unit-test-plan.md`,
`docs/testing/pre-phase-6-backend-integration-test-plan.md`,
`docs/codex/reference/pre-phase-6-backend-integration-tests.md`,
`docs/codex/reference/repository-test-validation-commands.md`, and
`docs/codex/history/2026-06-14-context-index.md`. Verify current backend test
state before starting Phase 6 UI/demo work. If touching integration/e2e tests,
preserve append-only audit logging, deterministic partial percentage rollout
coverage, fail-closed `NOT_FOUND` evaluation, and the Supertest `httpServer():
App` helper pattern. If running integration/e2e validation inside Codex, expect
possible sandbox `listen EPERM` or DB `connect EPERM` and request escalation only
when needed.

## Session index, compressed

- `019ec3d8-a8f3-7632-95bb-8858dd5589d0` (08:56 ICT): used
  `codex-history-index` to create
  `docs/codex/history/2026-06-13-context-index.md` from June 13 logs and repo
  state.
- `019ec416-0cb1-7b72-8d65-d512d272c5ba` (10:03 ICT): guided and completed
  pre-Phase 6 backend integration-test work, then created
  `docs/codex/reference/pre-phase-6-backend-integration-tests.md`.
- `019ec4a3-cd7a-7bb0-92a0-49f56c12a1f0` (12:38 ICT): created PR #22 from
  `test/unit-test` to `develop`; review noted feature flag list status filtering
  and sorting should match the default config displayed by responses.
- `019ec4a7-dccf-7881-baee-5ed0f93d8c4f` (12:43 ICT): repeated PR #22 review
  as structured findings; no additional durable file change.
- `019ec4b2-f75c-7752-a325-08d7f79b8566` (12:55 ICT): created PR #23 from
  `test/integration-test` to `develop`; review noted percentage rollout tests
  must use partial rollout cases to actually protect stable hashing behavior.
- `019ec4b5-9c5a-79f3-8d0b-ff8efb5ad16e` (12:58 ICT): repeated PR #23 review
  as structured findings and ran validation/review commands; integration tests
  surfaced sandbox/local-server and database permission caveats.
- `019ec4bc-e3f2-7f42-ac28-546594d85dd8` (13:06 ICT): fixed Supertest lint
  warnings with `httpServer(): App`, listed all repo test commands, and created
  `docs/codex/reference/repository-test-validation-commands.md`.
- `019ec5b7-abcf-7070-b0e8-0d3a27968a97` (17:40 ICT): explained how to test
  the API through automated tests and Swagger UI, including `/v1` base path,
  `GET /v1/health`, seeded evaluation scenarios, actor header use for mutations,
  and audit-log checks.
