# Codex Context History — 2026-06-04

Purpose: compact context for future Codex sessions. Use this as an index, not a transcript.

## Read first

- Active repo authority: `AGENTS.md`.
- Product sources:
  - `docs/requirement/requirement-init.md`
  - `docs/requirement/info-init.md`
  - `docs/plan/project-goal.md`
- Durable Codex context files:
  - `docs/codex/context-map.md`
  - `docs/codex/task-template.md`
  - `docs/codex/history/*.md`
  - `docs/codex/reference/*.md`
  - `.codex/config.toml`
  - `.codex/agents/*.toml`
  - `.agents/skills/*/SKILL.md`
- Current branch head observed during this update:
  `docs/codebase-infra-lab` at `6284ef7`.
- Trust the filesystem over chat history. Today includes a revert and later
  re-scaffold; the current filesystem has a tracked Phase 1 scaffold.

## Repo guardrails to keep

- Required MVP before enhancements: research report, backend API, admin
  dashboard, demo app, database, validation/error handling, README run
  instructions, seed data, and short design docs.
- July dates from `docs/requirement/info-init.md`: submission July 1, 2026;
  presentation July 2, 2026.
- Single backend service hosts management and evaluation endpoints.
- MVP stack: NestJS, Prisma, PostgreSQL, REST/Swagger, Jest, in-memory cache.
- Keep control-plane APIs/dashboard separate from data-plane evaluation.
- Default rule order: global disable -> user allowlist -> role targeting ->
  percentage rollout -> default off.
- Percentage rollout must be deterministic with stable hashing over stable,
  non-PII rollout keys.
- Evaluation responses must include `enabled`, `reason`, `projectKey`, and
  `flagKey`; missing project or flag returns `enabled=false`,
  `reason=NOT_FOUND`.
- Project, flag, and rule mutations must write append-only audit logs with
  before/after snapshots in the same transaction.
- Feature flag status labels (`Enabled`, `Disabled`, `Archived`) are separate
  from runtime state (`On`, `Off`).
- Keep `.env.example` aligned with `.env` variable shape using placeholders
  only; do not commit real tokens or local secrets.

## What happened today

### Phase 0 API and contracts persisted

- Added `docs/design/mvp-api-and-contracts.md` as the Phase 0 contract source.
- It now covers `/v1` API conventions, actor identity, request IDs,
  control-plane/data-plane split, evaluation contract, `NOT_FOUND` behavior,
  invalid-context/error fallbacks, reason codes, rule model, deterministic
  rollout hashing, key validation, error shape, pagination/filtering/sorting,
  sample user context, audit log rules, seed/demo expectations, and MVP
  exclusions.
- Added durable Codex references:
  - `docs/codex/reference/phase-0-mvp-api-contracts.md`
  - `docs/codex/reference/feature-flag-platform-tech-stack-decisions.md`

### Phase 1 scaffold completed and validated

- Root npm workspace scaffold now exists:
  - `package.json`
  - `package-lock.json`
  - `tsconfig.base.json`
  - workspace pattern: `apps/*`
  - scripts: `dev:backend`, `dev:admin`, `dev:demo`, `build`, `lint`,
    `test`, `diff:check`
- Backend scaffold exists under `apps/backend` using NestJS.
  - `apps/backend/src/main.ts` uses `/v1` prefix and has explicit bootstrap
    error logging for the no-floating-promises lint warning.
  - This is still scaffold/foundation code; management APIs, evaluation engine,
    Prisma, seed data, and audit logging are not implemented yet.
- Admin dashboard scaffold exists under `apps/admin` using Vite, React, and
  TypeScript.
- Demo app scaffold exists under `apps/demo` using Vite, React, and TypeScript.
- Root `README.md` now includes local development setup for npm install,
  `.env`, Docker PostgreSQL, running the apps, and scaffold validation.
- Root `.env.example` intentionally contains optional Codex/local assistant
  tooling placeholders followed by backend/frontend runtime config.
- `.gitignore` ignores `node_modules/`, `dist/`, `coverage/`, root/app `.env`
  files, and local OS noise while allowing `.env.example`.

### Durable Phase 1 Codex references added

- `docs/codex/reference/phase-1-project-scaffold-local-workflow.md`
- `docs/codex/reference/phase-1-nestjs-backend-scaffold.md`
- `docs/codex/reference/phase-1-shared-typescript-configuration.md`
- `docs/codex/reference/phase-1-admin-dashboard-scaffold.md`
- `docs/codex/reference/phase-1-demo-app-scaffold.md`
- `docs/codex/reference/phase-1-postgresql-local-setup.md`

### Learning branch/context added

- Current branch is `docs/codebase-infra-lab`.
- Added `docs/learning/codebase-map.md` as an advanced from-scratch map of:
  root workspace, backend/admin/demo responsibilities, control-plane vs
  data-plane, Docker/PostgreSQL basics, future Prisma/data model, future
  API/evaluation/audit flow, and learn/relearn/unlearn checkpoints.

### Git history caveat from today

- A scaffold commit was reverted, then the scaffold was recreated correctly.
  Do not infer current source state from the reverted commit alone.
- `package.json` repository URL is currently token-free. If any earlier local
  config or transcript exposed a real credential, keep treating it as revoked
  and never copy it into docs or code.

## Current observed working tree notes

- Before writing this index, `git status --short` was clean.
- This update adds `docs/codex/history/2026-06-04-context-index.md`; expect it
  to appear as untracked or modified until committed.
- Tracked implementation/planning artifacts observed:
  - `apps/backend/**`
  - `apps/admin/**`
  - `apps/demo/**`
  - `package.json`
  - `package-lock.json`
  - `tsconfig.base.json`
  - `docs/design/mvp-api-and-contracts.md`
  - `docs/learning/codebase-map.md`
- Ignored local artifacts exist and should not be treated as source:
  - `.env`
  - `apps/admin/.env`
  - `apps/demo/.env`
  - `node_modules/`
  - `apps/*/dist/`
- `markdownlint` was not available in several sessions; validation mainly used
  `git diff --check`.

## Best next prompt for Codex

```text
Use AGENTS.md, docs/plan/project-goal.md, docs/design/mvp-api-and-contracts.md,
docs/codex/history/2026-06-04-context-index.md, and
docs/learning/codebase-map.md as context.
Start the next MVP implementation phase by adding the backend data foundation:
Prisma/PostgreSQL setup, schema for projects/flags/rules/sample users/audit logs,
safe seed data, and tests for uniqueness and audit-ready mutations.
Keep the Phase 0 API contract authoritative, preserve deterministic evaluation,
safe defaults, NOT_FOUND fail-closed behavior, non-PII rollout keys, append-only
transactional audit logging, and control-plane/data-plane separation.
Before editing, inspect git status and ignored local build/runtime artifacts.
```

## Session index, compressed

- 09:47 — explained the project rule model and reinforced ordered rules,
  type-specific parameters, stable rollout behavior, and deterministic
  evaluation.
- 12:47 — reviewed stack choices/trade-offs and persisted the tech-stack
  reference; Phase 0 API contracts were committed around this workstream.
- 13:15 — taught Phase 1 setup steps from the Phase 0 contract and roadmap.
- 13:19 — used `git revert`; clarified that revert history remains linear
  unless separate branches are created.
- 13:22-17:58 — guided and validated Phase 1 scaffolding in steps:
  root npm workspace, NestJS backend, shared TypeScript config, admin app,
  demo app, PostgreSQL/env setup, README quickstart, lint/bootstrap fix, and
  durable reference documents.
- 15:06 — reviewed staged/unstaged scaffold changes; found that root workspace
  scripts should not fail before workspaces exist.
- 21:16 — suggested a learning branch strategy for mapping the scaffolded
  codebase plus Docker/PostgreSQL context.
- 21:22 — created `docs/learning/codebase-map.md` for codebase orientation.
- 23:50 — updated this daily Codex context index from local session logs.
