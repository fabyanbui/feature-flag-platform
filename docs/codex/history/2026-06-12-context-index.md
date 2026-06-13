# Codex Context History — 2026-06-12

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

- Five repo-scoped Codex session logs were found for this date under
  `~/.codex/sessions/2026/06/12/`.
- The June 11 history handoff was created:
  `docs/codex/history/2026-06-11-context-index.md`.
  - It summarized June 11 work and pointed future sessions back to the June 10
    Phase 4/5 merge context.
  - Validation in that session reported `git diff --check` passed and
    `markdownlint` was unavailable.
- Phase 6 was explained from `docs/plan/implementation-roadmap.md`:
  - Phase 6 is the early vertical slice.
  - It should prove create project -> create flag -> configure rule -> evaluate
    through `/v1/evaluate` -> display in demo app -> verify audit entries.
  - It exists to validate API contracts before expanding admin/demo UI scope.
- PR #21 was created from `docs/codebase-infra-lab` to `develop`:
  - Title: `docs: add codebase learning guides and domain overview`.
  - URL recorded in the session: `https://github.com/fabyanbui/feature-flag-platform/pull/21`.
  - The PR was reviewed twice; both reviews found no blocking documentation
    issues.
- Current git history shows PR #21 has since been merged to `develop` as
  `6e59633` (`Merge pull request #21 from fabyanbui/docs/codebase-infra-lab`).
  Durable learning docs now present include:
  - `docs/learning/codebase-map.md`
  - `docs/learning/control-plane-api-and-audit-logs.md`
  - `docs/learning/data-model-and-migrations.md`
  - `docs/learning/data-model-migration-keywords.md`
  - `docs/learning/data-plane-api-and-evaluation-engine.md`
  - `docs/learning/domain-logic.md`
  - `docs/learning/local-dev-workflow.md`
- Backend source-relationship discussion happened but did not leave durable graph
  files in the current filesystem.
  - Codex suggested strategies/tools such as codebase maps, dependency graphs,
    call-flow tracing, Compodoc, Madge, sourcegraph-style search, and focused
    reading by module boundary.
  - A Madge command was attempted to generate backend graph JSON under
    `docs/learning/backend-graphs/`, but current filesystem inspection shows no
    `docs/learning/backend-graphs/`, `backend-source-graph.json`, or
    `backend-compodoc/` files remain.
  - Trust the current filesystem over the transient session state.
- CORS was explained as a browser security rule controlling which origins may
  call the backend API from frontend code; future security review should keep
  demo/admin origins explicit and avoid broad production defaults.
- Backend checkpoint testing guidance was given before Phase 6:
  - Validate build and Prisma schema first.
  - Run focused unit tests for stable hashing and evaluation engine behavior.
  - Run Phase 5 management/e2e tests when the environment permits local server
    binding and database access.
  - Use risk-based backend testing before full UI testing.
  - Apply smoke, functional/API, validation/error, audit/integration,
    regression, and exploratory testing as appropriate.

## Current observed working tree notes

- Current filesystem inspection on 2026-06-13 reports:
  - Branch: `develop...origin/develop`.
  - `HEAD`: `6e59633` (`Merge pull request #21 from fabyanbui/docs/codebase-infra-lab`).
  - Working tree was clean before writing this June 12 context index.
- `docs/codex/history/2026-06-12-context-index.md` did not exist before this
  update.
- `docs/codex/history/2026-06-11-context-index.md` is now committed in current
  history as `d2306ed`.
- Current `docs/learning/` contains Markdown learning guides only; generated
  backend graph/Compodoc artifacts referenced in the June 12 IDE tabs are not
  present.
- Known caveat from earlier sessions remains relevant: backend e2e tests can
  require execution outside the Codex sandbox because Supertest local server
  binding may fail with `listen EPERM`.
- Known data invariant remains relevant: do not delete from `audit_log_entries`
  in tests; append-only audit logging is intentional.

## Best next prompt for Codex

Continue from `develop` after PR #21 merge. Read `AGENTS.md`,
`docs/plan/project-goal.md`, `docs/plan/implementation-roadmap.md`,
`docs/design/mvp-api-and-contracts.md`,
`docs/codex/history/2026-06-10-context-index.md`,
`docs/codex/history/2026-06-11-context-index.md`, and the current
`docs/learning/*.md` guides. Start Phase 6 early vertical slice: seed or verify a
sample project, create a feature flag, configure at least one rule, evaluate via
`POST /v1/evaluate`, verify append-only audit entries for setup mutations, and
wire the demo app to show the result. Add focused tests for deterministic rule
order, stable percentage rollout, `NOT_FOUND`, validation errors, and audit-log
writes. Preserve safe defaults, stable non-PII rollout keys, audit logging, and
control-plane/data-plane separation.

## Session index, compressed

- `019eb9de-7148-7cd3-9edf-0f8005623dd7` (10:27 ICT): used
  `codex-history-index` to create
  `docs/codex/history/2026-06-11-context-index.md` from June 11 logs and repo
  state.
- `019eb9ec-7b71-7353-9c96-8d9ef60fd31c` (10:42 ICT): answered what Phase 6
  means in `docs/plan/implementation-roadmap.md`; no file changes.
- `019ebae2-ff0c-7a32-8bdb-47058c01b5e0` (15:11 ICT): created PR #21 from
  `docs/codebase-infra-lab` to `develop` and gave an initial review with no
  blocking findings.
- `019ebae5-37c7-7ff3-a687-b395de6eb75a` (15:14 ICT): used
  `workflow-quality-review` for a deeper PR #21 review; output reported the
  documentation patch as correct with no findings.
- `019ebc56-ed76-7383-b299-0d36509dadb7` (21:57 ICT): answered learning and
  tooling questions about understanding backend source relationships, CORS,
  graph visualization, and what/how to test before Phase 6; no durable source
  changes are present in the current filesystem from this session.
