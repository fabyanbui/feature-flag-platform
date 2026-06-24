# PostgreSQL Read-Only MCP Codex Config Fix — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a
reference, not a transcript.

## Scope

This session configured and tested a PostgreSQL read-only MCP server for Codex
so Phase 3 work can inspect the local Feature Flag Platform database without
using MCP as a migration or write path.

The work focused on `.codex/config.toml`, `.env.example`, local `.env`
diagnostics, and validating that the MCP can read PostgreSQL metadata while
blocking writes. It preserved the repo guardrails from `AGENTS.md`: Prisma
migrations remain the schema source of truth, database inspection must stay
safe by default, and future mutation work must preserve append-only audit
logging and control-plane/data-plane separation.

## High-signal outcomes

- Researched PostgreSQL MCP options and selected YawLabs
  `@yawlabs/postgres-mcp` as the local/dev candidate because it is read-only by
  default and supports PostgreSQL schema inspection.
- Added a project-scoped Codex MCP server named `postgres_readonly` in
  `.codex/config.toml`.
- Configured the MCP to read `POSTGRES_MCP_DATABASE_URL` from `.env`, map it to
  the package's expected `DATABASE_URL`, and launch:

  ```text
  npx -y @yawlabs/postgres-mcp@latest
  ```

- Kept tool calls approval-gated with `default_tools_approval_mode = "prompt"`.
- Disabled broader/dangerous tools with:

  ```toml
  disabled_tools = ["pg_query", "pg_kill"]
  ```

- Added `.env.example` guidance for a dedicated `mcp_reader` connection string.
- Initial MCP tests failed because local PostgreSQL rejected the configured
  `mcp_reader` login.
- Codex could not create `mcp_reader` because:
  - the app DB user lacked `CREATEROLE`;
  - local `postgres` sudo access required a password.
- As a temporary local-only unblock, local `.env` was changed so
  `POSTGRES_MCP_DATABASE_URL` uses the working `ffp` app connection with the
  Prisma-specific query string removed for PostgreSQL client compatibility.
- After restarting/reloading the MCP, validation passed:
  - `pg_health` connected to PostgreSQL 14.23 and database `ffp_dev`;
  - `pg_list_schemas` showed `public`;
  - `pg_list_tables` showed the expected migrated tables;
  - `pg_readonly` returned a smoke-test row;
  - a `CREATE TEMP TABLE` attempt through `pg_readonly` was blocked.
- Safety review conclusion: acceptable for local Phase 3 inspection, but not
  safe enough for staging/production or real sensitive data until
  `POSTGRES_MCP_DATABASE_URL` uses a real least-privilege PostgreSQL role.

## Files and artifacts

- `.codex/config.toml`
  - Added `[mcp_servers.postgres_readonly]`.
  - Launches YawLabs Postgres MCP through `bash -lc`.
  - Requires `POSTGRES_MCP_DATABASE_URL`.
  - Leaves `ALLOW_WRITES` unset.
  - Disables `pg_query` and `pg_kill`.
- `.env.example`
  - Added a sample `POSTGRES_MCP_DATABASE_URL` for `mcp_reader`.
- `.env`
  - Local-only ignored file.
  - Temporarily changed to a working local connection for testing.
  - Must not be documented with real credentials or committed.
- `docs/codex/reference/postgresql-readonly-mcp-codex-config-fix.md`
  - This reference.

Useful MCP validation calls:

```text
postgres_readonly.pg_health
postgres_readonly.pg_list_schemas
postgres_readonly.pg_list_tables
postgres_readonly.pg_readonly
```

Useful local diagnostics used without printing secrets:

```bash
codex mcp get postgres_readonly
psql "$POSTGRES_MCP_DATABASE_URL" -v ON_ERROR_STOP=1 -Atc \
  "select current_user, current_database(), current_schema(), 1;"
```

## Decisions and guardrails

- Keep this MCP server project-scoped, not global, because it is specific to the
  local Feature Flag Platform database.
- Use PostgreSQL MCP only for read-only inspection, health checks, schema
  visibility, table descriptions, constraints, indexes, and migration-result
  validation.
- Do not use PostgreSQL MCP to apply schema changes; use Prisma migrations.
- Keep `ALLOW_WRITES` unset.
- Keep `pg_query` and `pg_kill` disabled unless a future session explicitly
  reviews and accepts the risk.
- Prefer pinning the package version instead of `@latest`; the cached observed
  version during this session was `@yawlabs/postgres-mcp@0.6.20`.
- The real security boundary should be PostgreSQL permissions, not only MCP
  tool behavior.
- For a safer final setup, create a real read-only role:

  ```sql
  CREATE ROLE mcp_reader LOGIN PASSWORD 'change_me';
  GRANT CONNECT ON DATABASE ffp_dev TO mcp_reader;
  GRANT USAGE ON SCHEMA public TO mcp_reader;
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO mcp_reader;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO mcp_reader;
  ```

## Validation and caveats

- Final MCP test passed after restart/reload.
- `pg_health` reported:
  - connected: true;
  - PostgreSQL: 14.23;
  - database: `ffp_dev`;
  - table count: 8.
- `pg_readonly` smoke test returned:
  - current user: `ffp`;
  - database: `ffp_dev`;
  - schema: `public`;
  - test value: 1.
- Visible tables included:
  - `_prisma_migrations`;
  - `audit_log_entries`;
  - `environments`;
  - `feature_flags`;
  - `flag_environment_configs`;
  - `flag_rules`;
  - `projects`;
  - `sample_user_contexts`.
- Read-only enforcement was validated with a `CREATE TEMP TABLE` attempt; MCP
  rejected it with a write-blocked/read-only transaction error.
- Caveat: the local MCP currently connects as `ffp`, not `mcp_reader`. This is
  useful for local inspection, but should be replaced with a least-privilege
  read-only role before using MCP with shared, staging, production, or
  sensitive data.
- The YawLabs package is community-maintained. Treat it as a normal npm
  dependency with supply-chain risk: pin versions, keep approval prompts, and
  avoid granting more DB privilege than needed.

## Best reusable next prompt

Continue Phase 3 data-model work using the configured PostgreSQL read-only MCP.
First replace the temporary local `POSTGRES_MCP_DATABASE_URL` fallback with a
real `mcp_reader` read-only role if PostgreSQL admin access is available. Then
restart Codex, verify `postgres_readonly.pg_health`, and use the MCP only for
schema/migration inspection. Keep Prisma migrations as the source of truth and
preserve deterministic evaluation, append-only audit logging, safe defaults,
stable non-PII rollout keys, and control-plane/data-plane separation.

## Source notes

- Current conversation was the source session.
- Repo guardrails:
  - `AGENTS.md`
  - `docs/plan/project-goal.md`
  - `docs/requirement/requirement-init.md`
  - `docs/requirement/info-init.md`
- Skills used:
  - `.agents/skills/data-modeling/SKILL.md`
  - `.agents/skills/security-defaults/SKILL.md`
  - `.agents/skills/codex-session-reference/SKILL.md`
- External references used during setup:
  - YawLabs Postgres MCP listing:
    <https://glama.ai/mcp/servers/YawLabs/postgres-mcp>
  - YawLabs Postgres MCP GitHub:
    <https://github.com/YawLabs/postgres-mcp>
