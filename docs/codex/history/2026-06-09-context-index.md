# Codex Context History — 2026-06-09

Purpose: compact context for future Codex sessions. Use this as an index, not a transcript.

## Read first

- Active authority: `AGENTS.md`.
- Product and deadline sources:
  - `docs/requirement/requirement-init.md`
  - `docs/requirement/info-init.md`
  - `docs/plan/project-goal.md`
- Current authoritative delivery dates in repo docs:
  - Submission: July 1, 2026.
  - Presentation: July 2, 2026.
- Durable Codex context to prefer before raw logs:
  - `docs/codex/context-map.md`
  - `docs/codex/mcp-tool-selection.md`
  - `docs/codex/history/2026-06-08-context-index.md`
  - `docs/codex/reference/phase-3-backend-foundation.md`
  - `docs/codex/reference/phase-3-request-context-x-request-id-middleware-fix.md`
  - `docs/codex/reference/phase-3-audit-log-prisma-nullable-json-fix.md`
  - `docs/codex/reference/phase-3-health-endpoint-type-only-import-fix.md`
- Repo-scoped Codex setup remains in `.codex/agents/` and `.agents/skills/`.

## Repo guardrails to keep

- Prioritize required MVP deliverables before recommended enhancements: research
  report, backend API, admin dashboard, demo app, database, validation/error
  handling, README run instructions, seed data, and short design docs.
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

- The codebase was inspected for a mentor-facing project plan/status update.
  Observed stack and progress:
  - Root npm workspace with `apps/backend`, `apps/admin`, and `apps/demo`.
  - NestJS/TypeScript backend with Prisma/PostgreSQL schema, migration, seed data,
    Swagger setup, validation/error-handling foundation, request context,
    audit-log service, transaction service, and repository skeletons.
  - React + Vite admin and demo apps exist, but dashboard/demo integration still
    needs real backend API wiring.
  - Remaining core work: management APIs, deterministic evaluation engine,
    dashboard integration, demo integration, and final docs/report/slides.
- A concise mentor update was drafted around this delivery direction:
  configure flag -> persist config -> evaluate by user context -> demo feature
  On/Off. It prioritized backend/data model/evaluation first, then dashboard,
  demo app, docs/report/slides, and final polish.
- Validation during the inspection session succeeded:
  - `npm run test --workspaces --if-present` reported 1 backend Jest suite passed.
  - `npm run build --workspaces --if-present` built admin, backend, and demo.
- Date caveat: that mentor-plan prompt supplied later planning dates (`07/07`
  and final presentation `09-10/07`). Current durable repo sources still say
  July 1, 2026 submission and July 2, 2026 presentation, so future plans should
  trust `docs/requirement/info-init.md` and `docs/plan/project-goal.md` unless
  the user explicitly updates the requirements.
- The June 8 Codex context index was created and committed:
  - File: `docs/codex/history/2026-06-08-context-index.md`.
  - Commit: `ffeaf46` (`docs: add June 8th codex context history index`).
  - It summarized the Phase 3 backend foundation, merged PR #14/#15 context,
    and the known audit-log/environment-delete documentation caveat.

## Current observed working tree notes

- Observed before writing this file on 2026-06-10:
  - Branch: `develop...origin/develop [ahead 1]`.
  - `HEAD`: `ffeaf46` (`docs: add June 8th codex context history index`).
  - Working tree was clean before creating `docs/codex/history/2026-06-09-context-index.md`.
- Intended current change from this session:
  - Add `docs/codex/history/2026-06-09-context-index.md`.
- Relevant current implementation paths:
  - Backend foundation: `apps/backend/src/common/`, `apps/backend/src/database/`,
    `apps/backend/src/audit/`, `apps/backend/src/repositories/`.
  - Prisma data model: `apps/backend/prisma/schema.prisma`,
    `apps/backend/prisma/migrations/20260605133630_init_data_model/migration.sql`,
    `apps/backend/prisma/seed.ts`.
  - Admin/demo scaffolds: `apps/admin/src/`, `apps/demo/src/`.
- Known caveat inherited from June 8: verify and correct the wording in
  `docs/learning/data-model-and-migrations.md` around environment deletes and
  audit entries before relying on that doc for implementation details.
- No live database MCP was needed for the June 9 sessions; work used local
  repository inspection and npm build/test validation.

## Best next prompt for Codex

Continue from `develop` after Phase 3 backend foundation. Read `AGENTS.md`,
`docs/plan/project-goal.md`, `docs/plan/implementation-roadmap.md`,
`docs/design/mvp-api-and-contracts.md`, and
`docs/codex/reference/phase-3-backend-foundation.md`. Then implement the next
required MVP slice: deterministic evaluation engine plus `POST /v1/evaluate`,
with rule order global disable -> user allowlist -> role targeting -> percentage
rollout -> default off, stable non-PII rollout hashing, fail-closed defaults,
evaluation-shaped `NOT_FOUND`, and focused Jest tests. Also verify the
`docs/learning/data-model-and-migrations.md` audit-log/environment-delete caveat.

## Session index, compressed

- `019eaaa0-a372-74d0-b424-f86657ea1835` (`codex_vscode`, repo cwd, 11:25 ICT):
  inspected repo status, package structure, backend/frontend/demo progress,
  Prisma schema/migration/seed, README/docs, and npm validation; produced a
  concise mentor-facing plan/status update for the feature flag MVP.
- `019eacd0-e3ec-7ce3-8bb1-717427aab518` (`codex_vscode`, repo cwd, 21:37 ICT):
  used `codex-history-index` to create `docs/codex/history/2026-06-08-context-index.md`,
  validated it, and recorded that `develop` was clean and ahead by commit
  `ffeaf46`.
