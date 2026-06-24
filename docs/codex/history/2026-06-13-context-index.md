# Codex Context History — 2026-06-13

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
  - `docs/codex/history/2026-06-10-context-index.md`
  - `docs/codex/history/2026-06-11-context-index.md`
  - `docs/codex/history/2026-06-12-context-index.md`
  - `docs/codex/reference/phase-4-evaluation-engine-data-plane-api.md`
  - `docs/codex/reference/phase-5-management-apis-implementation.md`
  - `docs/codex/reference/phase-5-e2e-audit-log-test-fixes.md`
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

- Twelve repo-scoped Codex session logs were found for this date under
  `~/.codex/sessions/2026/06/13/`.
- The June 12 handoff was created:
  `docs/codex/history/2026-06-12-context-index.md`.
  - It captured PR #21 merge context, Phase 6 early vertical slice guidance,
    current learning docs, and known e2e/audit-log testing caveats.
- Repo structure and backend architecture were explained from current files:
  - NestJS modules keep controllers, services, repositories, DTOs, and pure
    evaluation logic separated.
  - Prisma/PostgreSQL persistence is isolated behind database/repository layers.
  - Control-plane management endpoints and data-plane evaluation endpoints must
    stay separate even though one backend service hosts both.
- A broad release/demo readiness review inspected backend, Prisma schema/seed,
  admin/demo apps, README/docs, and tracked artifacts.
  - Session validation reported `npm run test` passed with 32 backend tests.
  - Session validation reported `npm run build` passed for backend/admin/demo.
  - Backend e2e tests were intentionally not run in that review because local
    Supertest server binding and append-only audit data can require careful
    environment handling.
- Backend testing guidance became durable documentation:
  - `docs/testing/backend-testing-strategy.md`
  - `docs/testing/pre-phase-6-backend-unit-test-plan.md`
  - `docs/testing/backend-integration-testing-strategy.md`
  - `docs/testing/pre-phase-6-backend-integration-test-plan.md`
- The unit-test plan was expanded from Phase 4/5 only to all backend phases
  before Phase 6, then renamed to
  `docs/testing/pre-phase-6-backend-unit-test-plan.md`.
- The integration-test docs explicitly preserve project guardrails:
  - dedicated test database strategy,
  - append-only audit-log isolation,
  - repository/service/app-module integration layers,
  - Phase 0-5 coverage before starting Phase 6 UI/demo work.
- Several learning/mentoring sessions clarified testing and design concepts:
  - unit vs integration vs e2e testing,
  - what business/domain behavior means in this feature-flag platform,
  - when to unit test services, controllers, repositories, utilities, guards,
    middleware, DTOs, and filters,
  - pragmatic SOLID use for controllers/services/evaluation/repositories/audit,
  - `/v1` as the stable REST API version prefix.
- Evening test-building work focused on pre-Phase 6 backend unit coverage.
  Current git history on `test/unit-test` now shows commits for:
  - `createPageResponse`, API exception helpers, and audit snapshot utilities,
  - `AuditLogService.record`, `ProjectsService`, `FlagRulesService`,
    `FeatureFlagsService`, `SampleUsersService`, `AuditLogsService`, and
    `EvaluationService`,
  - actor guard, request context service/middleware, API exception filter, and
    common key/pagination DTOs.
- Some late logs include repeated, rolled-back, or interrupted instructional
  turns. Trust the current filesystem and git history over transient session
  text when they differ.

## Current observed working tree notes

- Current filesystem inspection on 2026-06-14 for the June 13 handoff reports:
  - Branch: `test/unit-test`.
  - `HEAD`: `692fc88` (`test: add unit tests for ApiExceptionFilter, key param DTOs, and PaginationQueryDto`).
  - `develop` and `origin/develop` point at `0232ed6`
    (`docs: add backend integration testing strategy and phase 6 planning documentation`).
- Staged additions are present and should be treated as user/current work:
  - `apps/backend/src/common/dto/key-param.dto.spec.ts`
  - `apps/backend/src/common/dto/pagination-query.dto.spec.ts`
  - `apps/backend/src/common/dto/time-range-query.dto.spec.ts`
  - `apps/backend/src/database/transaction.service.spec.ts`
- No unstaged source changes were present before writing this June 13 context
  index.
- The backend spec tree currently includes pre-Phase 6 coverage across common
  DTOs/errors/filters/guards/middleware/request context, database transaction
  wrapper, evaluation engine/service, projects, feature flags, flag rules,
  sample users, audit logs, and audit-log recording.
- `docs/testing/` currently contains the four testing strategy/plan files listed
  above.
- Local Codex session metadata can contain sensitive remote/config details; do
  not copy raw `session_meta` or raw command output into history docs.
- Known caveat remains relevant: backend e2e tests can require execution outside
  the Codex sandbox because Supertest local server binding may fail with
  `listen EPERM`.
- Known data invariant remains relevant: do not delete from `audit_log_entries`
  in tests; append-only audit logging is intentional.

## Best next prompt for Codex

Continue on branch `test/unit-test`. Read `AGENTS.md`,
`docs/plan/project-goal.md`, `docs/testing/pre-phase-6-backend-unit-test-plan.md`,
`docs/testing/pre-phase-6-backend-integration-test-plan.md`, and
`docs/codex/history/2026-06-13-context-index.md`. Preserve the staged spec files
unless I ask otherwise. Finish or review the current DTO/transaction unit tests,
then run focused backend validation (`npm run test --workspace=@ffp/backend --
--runInBand`, backend lint/build if needed). Keep tests deterministic, avoid live
DB writes for unit tests, preserve append-only audit logging, and keep control
plane/data plane boundaries clear before starting the Phase 6 vertical slice.

## Session index, compressed

- `019ebf00-c622-70c1-8065-fe4c8d89f5dd` (10:22 ICT): used
  `codex-history-index` to create
  `docs/codex/history/2026-06-12-context-index.md` from June 12 logs and repo
  state.
- `019ebf01-1aa1-7d71-9add-40a1dfc83ffe` (10:23 ICT): explained backend repo
  structure, NestJS layering, Prisma/PostgreSQL role, control-plane/data-plane
  separation, and why modules are organized as they are; no durable file change.
- `019ebf23-3df0-7b20-b823-1c6d6cd58eb5` (11:00 ICT): used
  `workflow-quality-review` for a broad MVP/readiness review; reported backend
  tests and workspace build passing, with e2e caveats.
- `019ebf3b-3dc7-7ab2-8e24-168b8096c7d5` (11:26 ICT): began advanced backend
  unit-test guidance and low-risk spec work around evaluation, repositories,
  flag rules, and audit-sensitive helpers.
- `019ebfa1-24f7-7ca3-ae78-03f9b1c0e2c9` (13:17 ICT): created and refined
  backend testing strategy docs, renamed the pre-Phase 6 unit plan, and added
  integration strategy/plan docs.
- `019ec024-57a1-7730-8c6c-9f45656195dc` (15:41 ICT): explained SOLID and how
  to apply it pragmatically to this NestJS feature-flag platform; no durable file
  change.
- `019ec0b0-e413-7a13-b6e0-4150e097845a` (18:14 ICT): explained `/v1` as the
  stable REST API version prefix for endpoints such as `/v1/evaluate`; no file
  change.
- `019ec16f-9598-7812-b708-9d2a610a0303` (21:42 ICT): suggested branch names
  for unit-test work, recommending `test/pre-phase-6-unit-tests` if both docs
  and tests are included; no file change.
- `019ec175-b916-7371-b8bf-168ceb381e15`,
  `019ec1ce-5a61-70b3-80b3-ea0e50df31e6`,
  `019ec1d1-3874-7ff0-9523-c352f0cd7046`, and
  `019ec1e4-8fab-7541-9c07-c5374b1ebfff` (21:49-23:50 ICT): repeated/continued
  pre-Phase 6 unit-test coaching and code prompts for DTOs, transaction service,
  projects, feature flags, flag rules, sample users, audit logs, and evaluation
  service. Current git history and staged files are the authoritative state.
