# Prisma MCP Codex Setup and Test — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a
reference, not a transcript.

## Scope

This session focused on setting up and validating the official Prisma MCP
server for Codex before Phase 3 data model and migration work on the Feature
Flag Platform.

The user first asked for recommended MCP support for data model and migration
work. The recommendation was to keep the setup small and safe:

- Prisma MCP for Prisma database context and Prisma Postgres operations.
- PostgreSQL read-only MCP for local/dev schema inspection if needed.
- Supabase MCP only if the project later chooses Supabase-hosted Postgres.

The user then requested Prisma MCP setup specifically from the official Prisma
MCP documentation and asked Codex to test the configured server.

## High-signal outcomes

- Researched the official Prisma MCP documentation:
  <https://www.prisma.io/docs/ai/tools/mcp-server>
- Researched Codex MCP configuration behavior through the official Codex manual
  helper, which confirmed that Codex MCP servers can be configured in
  `~/.codex/config.toml` or project-scoped `.codex/config.toml` for trusted
  projects.
- Added the official Prisma MCP server to the project-scoped Codex config:

```toml
[mcp_servers.prisma]
url = "https://mcp.prisma.io/mcp"
default_tools_approval_mode = "prompt"
startup_timeout_sec = 20
tool_timeout_sec = 60
```

- Kept the Prisma MCP project-scoped instead of global so this database tooling
  applies to this repository without changing all Codex projects.
- Set `default_tools_approval_mode = "prompt"` because Prisma MCP can expose
  database-affecting tools such as SQL execution and database management.
- Validated Codex config visibility with:

```bash
codex mcp list
codex mcp get prisma
```

- Tested the live Prisma MCP tools successfully:
  - `fetch_workspace_details` connected to Prisma and returned the user's
    Personal workspace.
  - `list_prisma_postgres_databases` returned that the workspace currently has
    no Prisma Postgres databases.

## Files and artifacts

- `.codex/config.toml`
  - Added `[mcp_servers.prisma]`.
  - Uses the official streamable HTTP endpoint
    `https://mcp.prisma.io/mcp`.
  - Keeps Prisma MCP calls approval-gated by default.
- `docs/codex/reference/prisma-mcp-codex-setup-and-test.md`
  - This reusable reference document.
- Related broader reference:
  - `docs/codex/reference/phase-3-mcp-database-tooling.md`

## Decisions and guardrails

- Prefer project-scoped MCP configuration for repository-specific database
  tooling.
- Prisma migrations should remain the source of truth for schema changes in
  the repo.
- Use Prisma MCP for Prisma workspace/database context and Prisma Postgres
  operations, but do not treat MCP-side database changes as a replacement for
  reviewed Prisma migration files.
- Keep database-affecting MCP tools approval-gated.
- Do not expose secrets, database passwords, `.env` values, or Prisma tokens in
  reference docs.
- Continue preserving project guardrails from `AGENTS.md`:
  - deterministic evaluation,
  - safe defaults,
  - stable non-PII rollout keys,
  - append-only audit logging,
  - clear control-plane/data-plane separation.

## Validation and caveats

- `codex mcp list` showed `prisma` configured and enabled with URL
  `https://mcp.prisma.io/mcp`.
- `codex mcp get prisma` showed:
  - transport: `streamable_http`
  - enabled: `true`
  - `default_tools_approval_mode = "prompt"`
  - startup timeout: `20`
  - tool timeout: `60`
- Live Prisma MCP test succeeded:
  - workspace lookup returned a Personal workspace.
  - database listing returned no Prisma Postgres databases yet.
- No Prisma Postgres database was created in this session.
- The current result proves MCP connection/authentication works, but future
  data model work still needs a database to be created or connected before
  Prisma MCP can inspect project tables.
- Current running Codex sessions may need restart/reload before newly added MCP
  config appears as callable tools.

## Best reusable next prompt

Continue Phase 3 data model and migration work using the configured Prisma MCP.
First decide whether to create a Prisma Postgres database for
`feature-flag-platform` or continue with local PostgreSQL. If creating Prisma
Postgres, use the Prisma MCP intentionally and keep tool approvals enabled.
Then scaffold or verify `prisma/schema.prisma`, generate reviewed Prisma
migration files, seed demo data, and preserve the required MVP tables:
`projects`, `feature_flags`, `flag_rules`, `sample_user_contexts`, and
`audit_log_entries`. Keep mutations auditable in the same transaction and keep
runtime evaluation deterministic and fail-closed.

## Source notes

- Source session: current visible Codex conversation.
- Repo guardrails:
  - `AGENTS.md`
  - `docs/plan/project-goal.md`
  - `docs/requirement/requirement-init.md`
  - `docs/requirement/info-init.md`
- Skill used:
  - `.agents/skills/codex-session-reference/SKILL.md`
- External references:
  - Prisma MCP docs: <https://www.prisma.io/docs/ai/tools/mcp-server>
  - Codex MCP docs: <https://developers.openai.com/codex/mcp>
