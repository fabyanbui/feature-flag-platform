# Phase 3 MCP Database Tooling — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a reference, not a transcript.

## Scope

This session prepared Codex MCP tooling for Phase 3 data model and migration work
on the Feature Flag Platform. The user wanted safe MCP support before continuing
implementation, especially for Prisma migrations and read-only PostgreSQL
inspection.

The work stayed aligned with the repo guardrails in `AGENTS.md` and
`docs/plan/project-goal.md`: Prisma + PostgreSQL remain the MVP persistence
stack, Prisma migrations stay the schema source of truth, and database
inspection should not weaken safe defaults, deterministic evaluation,
append-only audit logging, or control-plane/data-plane separation.

## High-signal outcomes

- Recommended a small MCP set for data model and migration work:
  - Prisma MCP for Prisma Postgres/database context.
  - PostgreSQL read-only MCP for inspecting migrated local/dev schema.
  - Supabase MCP only if the project later chooses Supabase-hosted Postgres.
- Researched the official Prisma MCP docs and configured the project-scoped
  Codex config for Prisma:
  - `url = "https://mcp.prisma.io/mcp"`
  - `default_tools_approval_mode = "prompt"`
- Researched PostgreSQL read-only MCP options because the older reference
  PostgreSQL MCP server is archived.
- Selected YawLabs `@yawlabs/postgres-mcp` as the preferred project candidate
  because it is read-only by default, supports schema introspection, and
  recommends PostgreSQL role-based least privilege as the real security
  boundary.
- Configured a project-scoped Codex MCP server named `postgres_readonly` that:
  - launches `npx -y @yawlabs/postgres-mcp@latest`,
  - requires `POSTGRES_MCP_DATABASE_URL` from `.env`,
  - maps that value to the MCP server's expected `DATABASE_URL`,
  - uses row and timeout defaults,
  - prompts by default for MCP tools,
  - disables `pg_query` and `pg_kill` for a stricter inspection-only posture.
- Added `POSTGRES_MCP_DATABASE_URL` guidance to `.env.example` and local `.env`
  handling so future Codex sessions do not reuse the application write-capable
  `DATABASE_URL` for MCP database inspection.

## Files and artifacts

Primary paths touched or made relevant:

- `.codex/config.toml`
  - Added `[mcp_servers.prisma]`.
  - Added `[mcp_servers.postgres_readonly]`.
- `.env.example`
  - Added `POSTGRES_MCP_DATABASE_URL` example for an `mcp_reader` role.
- `.env`
  - Local-only secret-bearing file; should remain ignored and should not be
    copied into docs or committed.
- `docs/codex/reference/phase-3-mcp-database-tooling.md`
  - This reusable reference.

Important validation commands used during the session:

```bash
codex mcp list
codex mcp get prisma
codex mcp get postgres_readonly
```

## Decisions and guardrails

- Keep MCP configuration project-scoped in `.codex/config.toml`, not global,
  because this database tooling is specific to this repository.
- Use Prisma migrations as the source of truth. The PostgreSQL MCP is for
  inspection, validation, schema exploration, and diagnostics after migrations,
  not for applying schema changes.
- Do not point the PostgreSQL MCP at the app's write-capable `DATABASE_URL`.
  Use a separate least-privilege role such as `mcp_reader`.
- Keep `ALLOW_WRITES` unset for YawLabs Postgres MCP.
- Keep `pg_query` and `pg_kill` disabled in Codex config for the MVP workflow;
  prefer introspection tools and the unconditional `pg_readonly` tool.
- If future work needs broader DB actions, make that an explicit, reviewed
  change and preserve migration/audit boundaries.
- Use safe DB role setup similar to:

```sql
CREATE ROLE mcp_reader LOGIN PASSWORD 'change_me';
GRANT CONNECT ON DATABASE ffp_dev TO mcp_reader;
GRANT USAGE ON SCHEMA public TO mcp_reader;
GRANT pg_read_all_data TO mcp_reader;
```

## Validation and caveats

- `codex mcp list` showed `prisma` and `postgres_readonly` configured and
  enabled.
- `codex mcp get prisma` showed Prisma using streamable HTTP at
  `https://mcp.prisma.io/mcp`.
- `codex mcp get postgres_readonly` showed a stdio server launched through
  `bash -lc`, with `disabled_tools = pg_query, pg_kill`.
- The PostgreSQL MCP will not start until `POSTGRES_MCP_DATABASE_URL` is set in
  `.env` to a valid read-only PostgreSQL connection string.
- The YawLabs package is community-maintained, not an official PostgreSQL or MCP
  steering-group server. Treat it like any npm dependency: keep tool approvals
  cautious and rely on PostgreSQL permissions for the real boundary.
- Network access is needed the first time `npx -y @yawlabs/postgres-mcp@latest`
  downloads the package.
- Do not include real `.env` values in docs, issue comments, or prompts.

## Best reusable next prompt

Continue Phase 3 using the configured MCP tooling. First verify that
`POSTGRES_MCP_DATABASE_URL` points to a real least-privilege `mcp_reader` role,
then restart Codex and confirm `/mcp` shows `prisma` and `postgres_readonly`.
Use Prisma migrations as the source of truth, and use PostgreSQL MCP only for
read-only schema inspection of `projects`, `feature_flags`, `flag_rules`,
`sample_user_contexts`, and `audit_log_entries`. Preserve deterministic
feature-flag evaluation, append-only audit logging, safe defaults, stable
non-PII rollout keys, and control-plane/data-plane separation.

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
  - Prisma MCP docs: <https://www.prisma.io/docs/ai/tools/mcp-server>
  - YawLabs Postgres MCP listing:
    <https://glama.ai/mcp/servers/YawLabs/postgres-mcp>
  - YawLabs Postgres MCP GitHub:
    <https://github.com/YawLabs/postgres-mcp>
