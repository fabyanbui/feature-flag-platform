# Codex Context History — 2026-06-06

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
  - `docs/codex/history/2026-06-05-context-index.md`
  - `docs/codex/reference/phase-2-prisma-data-model-and-migration.md`
  - `docs/codex/reference/phase-3-mcp-database-tooling.md`
  - `.codex/config.toml`
  - `.codex/agents/*.toml`
  - `.agents/skills/*/SKILL.md`
- Current filesystem is more authoritative than chat history. June 6 mostly set
  up tooling and guidance for Phase 3, not Phase 3 backend code itself.
- End-of-day committed context was `develop` at `d746563` with the Prisma and
  read-only PostgreSQL MCP configuration plus a Phase 3 tooling reference.

## Repo guardrails to keep

- Required MVP before enhancements: research report, backend API, admin
  dashboard, demo app, database, validation/error handling, README run
  instructions, seed data, and short design docs.
- July dates from `docs/requirement/info-init.md`: submission July 1, 2026;
  presentation July 2, 2026.
- Single backend service hosts management and evaluation endpoints.
- MVP stack: NestJS, Prisma, PostgreSQL, REST/Swagger, Jest, in-memory cache.
- Keep control-plane management/dashboard separate from data-plane evaluation.
- Evaluation responses must include `enabled`, `reason`, `projectKey`, and
  `flagKey`; missing project or flag returns `enabled=false`,
  `reason=NOT_FOUND`.
- Default rule order stays global disable/kill switch -> user allowlist -> role
  targeting -> percentage rollout -> default off.
- Percentage rollout must be deterministic with stable hashing over stable,
  non-PII rollout keys.
- Project, flag, config, and rule mutations must write append-only audit logs
  with before/after snapshots in the same transaction.
- Feature flag lifecycle/status labels are distinct from runtime On/Off state.
- Keep `.env.example` aligned with `.env` variable shape using safe placeholders
  only; never copy secrets from session logs or local env files.

## What happened today

### Phase 3 backend foundation was scoped

- Reviewed `docs/plan/implementation-roadmap.md` Phase 3 and taught the planned
  backend foundation work step-by-step.
- Phase 3 target remains infrastructure for later APIs, not business endpoint
  expansion by itself:
  - validation pipeline and DTO boundaries,
  - consistent error response handling,
  - Swagger/OpenAPI setup,
  - transaction helper for mutation flows,
  - audit logging service,
  - repository/data-access layer,
  - request context/correlation ID support.
- Recommended backend structure keeps controllers thin, deterministic evaluation
  outside controllers, and audit/transaction boundaries ready for Phase 4/5.

### MCP database tooling was selected and configured

- Researched and configured official Prisma MCP in project-scoped
  `.codex/config.toml`:
  - `[mcp_servers.prisma]`
  - `url = "https://mcp.prisma.io/mcp"`
  - `default_tools_approval_mode = "prompt"`
- Researched PostgreSQL read-only MCP options because the older reference
  PostgreSQL MCP server is archived.
- Selected YawLabs `@yawlabs/postgres-mcp` as the preferred local/dev
  inspection MCP for this project because it is read-only by default and
  supports schema/table/index/health/privilege inspection.
- Configured `[mcp_servers.postgres_readonly]` in `.codex/config.toml` to:
  - load `POSTGRES_MCP_DATABASE_URL` from `.env`,
  - map it to the MCP server's expected `DATABASE_URL`,
  - set row and timeout defaults,
  - prompt by default,
  - disable `pg_query` and `pg_kill`.
- Added/updated `POSTGRES_MCP_DATABASE_URL` guidance in `.env.example` and local
  `.env`; the read-only MCP must use a separate `mcp_reader` role, not the app
  write-capable `DATABASE_URL`.
- Created durable reference:
  - `docs/codex/reference/phase-3-mcp-database-tooling.md`

### MCP tests and credential diagnosis

- Prisma MCP test succeeded at the tool/connectivity level:
  - the MCP responded and reported no available Prisma Postgres databases.
- PostgreSQL read-only MCP was reachable, but database authentication failed for
  `mcp_reader` with PostgreSQL code `28P01`.
- Direct checks showed:
  - app user `ffp` could connect to local `ffp_dev`,
  - `mcp_reader` could not authenticate,
  - `mcp_reader` did not exist in `pg_roles` at the time of diagnosis.
- Durable fix recommended: create or update `mcp_reader` with read-only grants
  against `ffp_dev`, then restart Codex and retest `pg_health`, schemas, tables,
  extensions, and table privileges.
- Important connection-string caveat: remove Prisma-only `?schema=public` from
  normal PostgreSQL client/MCP URLs. Keep that query parameter only where Prisma
  expects it, such as app `DATABASE_URL`.

### June 5 daily history index was generated

- Used `codex-history-index` to summarize June 5 Phase 2 work from local Codex
  logs.
- Created:
  - `docs/codex/history/2026-06-05-context-index.md`
- That file summarizes Phase 2 Prisma data model, migration, seed data,
  validation, caveats, and best next prompt for Phase 3.

### Commits observed for June 6

- `76be044` — registered Prisma MCP server with prompt-based tool approval.
- `a4669dd` — added read-only PostgreSQL MCP server configuration.
- `d746563` — added Codex session summary for Phase 3 MCP database tooling.

## Current observed working tree notes

- Current branch during this update: `develop` at `d746563`.
- `git status --short` before writing this June 6 index showed:
  - `M .env.example`
  - `?? docs/codex/history/2026-06-05-context-index.md`
- The current `.env.example` diff removes `?schema=public` from
  `POSTGRES_MCP_DATABASE_URL`; this belongs to the June 6 PostgreSQL MCP URL
  correction.
- This update adds `docs/codex/history/2026-06-06-context-index.md`; expect it
  to appear as untracked until committed.
- Ignored local artifacts observed and not source:
  - `.env`
  - `apps/admin/.env`
  - `apps/demo/.env`
  - `node_modules/`
  - `apps/*/node_modules/`
  - `apps/*/dist/`
- `.env` contains local connection values; keep it ignored and do not copy real
  passwords into docs, prompts, or commits.
- Backend implementation caveat carried from June 5: `apps/backend/package.json`
  may still have stale `start:prod: node dist/main` while Nest build output was
  observed under `apps/backend/dist/src/main.js`; verify before production-like
  runs.

## Best next prompt for Codex

```text
Use AGENTS.md, docs/plan/project-goal.md, docs/plan/implementation-roadmap.md,
docs/design/mvp-api-and-contracts.md,
docs/codex/history/2026-06-05-context-index.md,
docs/codex/history/2026-06-06-context-index.md, and
docs/codex/reference/phase-3-mcp-database-tooling.md as context. Continue Phase
3 backend foundation. First inspect git status and verify whether the
mcp_reader role has been created; if not, provide or apply a safe local SQL
setup path without exposing secrets. Then implement the NestJS Prisma
module/service with Prisma 7 and @prisma/adapter-pg, request context/correlation
IDs, validation/error handling, repository boundaries, transaction helper, and
audit logging service. Preserve same-transaction audit writes, append-only audit
logs, safe defaults, stable non-PII rollout keys, deterministic evaluation, and
control-plane/data-plane separation.
```

## Session index, compressed

- 12:04 — reviewed Phase 3 roadmap and produced a principal-engineer
  step-by-step plan for backend foundation.
- 12:07 — researched MCP setup for data model/migration work, configured Prisma
  MCP, shortlisted PostgreSQL read-only MCPs, selected YawLabs, configured
  `postgres_readonly`, and wrote `phase-3-mcp-database-tooling.md`.
- 15:27 — tested MCPs: Prisma responded; PostgreSQL read-only MCP failed DB auth
  for `mcp_reader`.
- 15:29 — retested PostgreSQL read-only MCP; auth failure persisted.
- 15:31 — repeated read-only MCP checks across health/schema/table/extension/
  privilege tools; same `mcp_reader` auth failure.
- 15:32 — diagnosed local env/DB role state, confirmed app DB connectivity,
  found `mcp_reader` absent, removed `?schema=public` from MCP URLs, and taught
  how to create/grant the read-only role via local PostgreSQL or Docker.
- 16:05 — generated `docs/codex/history/2026-06-05-context-index.md` from June 5
  session logs.
