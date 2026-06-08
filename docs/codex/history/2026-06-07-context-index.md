# Codex Context History — 2026-06-07

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
  - `docs/codex/mcp-tool-selection.md`
  - `docs/codex/history/2026-06-06-context-index.md`
  - `docs/codex/reference/phase-3-mcp-database-tooling.md`
  - `docs/codex/reference/postgresql-readonly-mcp-codex-config-fix.md`
  - `docs/codex/reference/prisma-mcp-codex-setup-and-test.md`
  - `docs/codex/reference/phase-3-request-context-x-request-id-middleware-fix.md`
  - `.codex/config.toml`
  - `.codex/agents/*.toml`
  - `.agents/skills/*/SKILL.md`
- Current filesystem is authoritative. Today moved from MCP setup into Phase 3
  backend foundation implementation on branch `feat/backend-foundation`.

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

### June 6 history was updated and committed

- Used `codex-history-index` to summarize June 6 repo sessions.
- Created/updated:
  - `docs/codex/history/2026-06-06-context-index.md`
- Later commit history shows this context work included in:
  - `e92d654` — database MCP connection string/context history updates.

### MCP setup was made durable for future agents

- Configured/documented project-scoped Prisma MCP and PostgreSQL read-only MCP
  behavior.
- Added MCP selection guidance so future Codex sessions know which MCP to use:
  - Prisma MCP for Prisma Postgres control-plane tasks, database discovery,
    creation, backups/recovery, connection strings, and explicitly approved
    Prisma-managed schema/data operations.
  - PostgreSQL readonly MCP for data-plane inspection only: health, schema,
    SELECT validation, migration/seed checks, EXPLAIN, locks, bloat/index,
    table privileges, and audit-log verification.
- Files made authoritative for this behavior:
  - `AGENTS.md`
  - `.codex/config.toml`
  - `docs/codex/mcp-tool-selection.md`
- MCP safety status:
  - Prisma MCP tested successfully against the Personal workspace; no Prisma
    Postgres databases existed at test time.
  - PostgreSQL readonly MCP initially failed for `mcp_reader` auth.
  - Local fallback later tested successfully against `ffp_dev`, but using the
    app role `ffp`; acceptable for local Phase 3 inspection only, not a final
    staging/production safety posture.
  - Durable recommendation: create/fix a true least-privilege `mcp_reader` role
    before using the MCP outside local development.
- Session references created:
  - `docs/codex/reference/postgresql-readonly-mcp-codex-config-fix.md`
  - `docs/codex/reference/prisma-mcp-codex-setup-and-test.md`

### Phase 3 backend foundation started

- Recommended branch name was `feature/phase-3-backend-foundation`; current
  observed branch is `feat/backend-foundation`.
- Used `workflow-feature-delivery` for Phase 3 implementation guidance.
- Phase 3 was framed as backend foundation, not business API expansion:
  - validation pipeline and DTO boundaries,
  - consistent API errors,
  - Swagger/OpenAPI,
  - request context/correlation IDs,
  - Prisma database module,
  - transaction helper,
  - audit logging service,
  - repository/data-access skeleton.
- Swagger path decision: prefer `api-docs` over `docs` to avoid confusion with
  the repository `docs/` directory during demos/presentation.

### Phase 3 code implemented through audit logging service

- Backend dependency/package setup was committed:
  - `f93abd8` — Swagger and validation dependencies.
- API foundation code was added and committed:
  - `e6ff5a0` — API constants for prefix/header/key rules.
  - `95775da` — standardized API error code/response interfaces.
  - `288cecb` — pagination DTOs, key-param DTOs, and global validation pipe.
  - `a9a823e` — global `ApiExceptionFilter`, including Prisma unique-constraint
    handling.
  - `0dff994` — Swagger docs and health-check integration.
- Request context/correlation ID work was added and debugged:
  - `82ccc1d` — AsyncLocalStorage request-context middleware and global
    registration in `main.ts`.
  - `759431d` — fixed missing `X-Request-Id` on `/v1` by moving from
    route-bound middleware to app-level Express middleware.
  - Reference created:
    `docs/codex/reference/phase-3-request-context-x-request-id-middleware-fix.md`
- Database/audit foundation was added:
  - `43baf3d` — `DatabaseModule`, `PrismaService`, and transaction service.
  - `f6fca1c` — audit logging service/types/module and `AuditModule`
    registration.
- Current observed backend foundation directories include
  `apps/backend/src/common/*`, `apps/backend/src/database/*`, and
  `apps/backend/src/audit/*`.

### Step 10 was scoped but not implemented

- After Step 9, Codex provided Step 10 instructions for a repository/data-access
  layer skeleton:
  - shared `DbClient` type,
  - project repository,
  - flag repository,
  - audit-log repository if useful,
  - repository module registration.
- Files for `apps/backend/src/repositories/*` were not observed in the current
  filesystem during this summary.
- Step 9 was implemented with validation intentionally skipped at the user's
  request; run validation before continuing substantial Phase 3 work.

## Current observed working tree notes

- Current branch during this update: `feat/backend-foundation`.
- Current HEAD before writing this file: `f6fca1c`.
- `git status --short` was clean before creating this June 7 index.
- This update adds `docs/codex/history/2026-06-07-context-index.md`; expect it
  to appear as modified/untracked until committed.
- `.env` exists locally and is ignored; do not copy real connection strings,
  passwords, tokens, or private URLs into docs or commits.
- `node_modules/` exists locally and is not source.
- `apps/backend/src/main.ts` currently registers request context middleware at
  app level before `app.setGlobalPrefix(API_PREFIX)` and configures Swagger at
  `SWAGGER_PATH`.
- `apps/backend/src/app.module.ts` currently imports `DatabaseModule` and
  `AuditModule` and provides `RequestContextService` and `ApiExceptionFilter`.
- No live database MCP was needed for this history update; repository files and
  logs were sufficient.

## Best next prompt for Codex

```text
Use AGENTS.md, docs/plan/project-goal.md, docs/plan/implementation-roadmap.md,
docs/design/mvp-api-and-contracts.md,
docs/codex/history/2026-06-06-context-index.md,
docs/codex/history/2026-06-07-context-index.md,
docs/codex/mcp-tool-selection.md, and relevant docs/codex/reference Phase 3
MCP/request-context docs as context. Continue Phase 3 backend foundation on
branch feat/backend-foundation. First inspect git
status and validate the current Step 9 audit logging implementation with lint,
typecheck/build, and targeted tests if available. Then implement Step 10:
repository/data-access skeleton under apps/backend/src/repositories, keeping
controllers thin and preserving same-transaction audit writes, append-only audit
logs, safe defaults, stable non-PII rollout keys, deterministic evaluation, and
control-plane/data-plane separation. Do not use live MCPs unless repository
files/tests are insufficient; if MCP is needed, follow docs/codex/mcp-tool-selection.md.
```

## Session index, compressed

- 10:16 — generated June 6 context index with `codex-history-index`.
- 14:25 — tested PostgreSQL readonly MCP; `mcp_reader` authentication failed.
- 14:27-15:00 — configured/researched Prisma and PostgreSQL MCPs, diagnosed
  `mcp_reader`, assessed safety, and created MCP reference docs.
- 15:08 — updated repo-scoped Codex MCP selection guardrails in `AGENTS.md`,
  `.codex/config.toml`, and `docs/codex/mcp-tool-selection.md`.
- 15:18 — recommended Phase 3 branch name.
- 16:06 — began Phase 3 step-by-step plan; decided Swagger path should be
  `api-docs` for demo clarity.
- 20:21 — advanced Phase 3 through validation, errors, Swagger, request
  context, database module, and audit logging plan.
- 20:31 — debugged missing `X-Request-Id` on `/v1`, fixed middleware
  registration, and created the request-context reference doc.
- 23:52 — implemented Step 9 audit service/types/module and `AuditModule`;
  validation was skipped per user instruction.
- 23:55 — generated this June 7 context index.
