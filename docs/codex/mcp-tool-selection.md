# Codex MCP Tool Selection

This guide tells Codex when to use the Prisma MCP and when to use the
PostgreSQL readonly MCP for this repository.

## Default behavior

Prefer local repository context first:

1. Read `AGENTS.md`, requirement docs, architecture docs, Prisma schema,
   migrations, seed scripts, tests, and README files.
2. Use normal file edits for implementation and documentation changes.
3. Use an MCP only when the task needs live Prisma Postgres workspace context or
   live database state that cannot be answered reliably from files.

Keep all MCP usage aligned with the project guardrails: deterministic
evaluation, append-only audit logs, safe defaults, stable non-PII rollout keys,
and clear control-plane/data-plane separation.

## Use Prisma MCP for control-plane tasks

Use the Prisma MCP when the user asks Codex to work with Prisma Postgres as a
managed service or when cloud database metadata is needed.

Typical Prisma MCP use cases:

- List available Prisma Postgres projects/databases.
- Create a new Prisma Postgres database.
- Create or list Prisma Postgres connection strings.
- List backups or restore a backup to a new database.
- Introspect a Prisma-managed database when live schema metadata is needed.
- Execute an explicitly approved schema update on a Prisma Postgres database.
- Execute an explicitly approved SQL query on a Prisma Postgres database when
  the PostgreSQL readonly MCP is unavailable or not connected to the target.

Safety rules:

- Treat Prisma MCP as potentially mutating because it can manage databases and
  execute SQL.
- Confirm before creating/deleting resources, creating connection strings,
  restoring backups, executing schema updates, or running non-read-only SQL.
- Do not print connection strings or secrets unless the user explicitly asks.
- Prefer read-only SQL and schema introspection unless a write is necessary and
  confirmed.

## Use PostgreSQL readonly MCP for data-plane inspection

Use the PostgreSQL readonly MCP when Codex needs to inspect the configured
database through `POSTGRES_MCP_DATABASE_URL`.

Typical PostgreSQL readonly MCP use cases:

- Verify the current schema after Prisma migrations.
- Describe tables, views, columns, indexes, constraints, and relationships.
- Validate seed data with `SELECT` queries.
- Check that projects, flags, ordered rules, sample contexts, and audit logs
  exist as expected.
- Inspect audit log entries after mutation tests or local demo flows.
- Run `EXPLAIN` or `EXPLAIN ANALYZE` for read-only statements.
- Check database health, locks, table bloat, sequential scans, unused indexes,
  installed extensions, roles, and table privileges.
- Search for columns across schemas.

Safety rules:

- Use only for read-only inspection and diagnostics.
- Never use it for writes, schema changes, database creation/deletion, backup
  management, or connection-string management.
- Keep `POSTGRES_MCP_DATABASE_URL` pointed at a least-privilege read-only role,
  not the application `DATABASE_URL`.
- Do not print database URLs, passwords, or other secrets.

## Decision table

| Task | Preferred path |
| --- | --- |
| Design Prisma models or migrations | Read/edit repo files first |
| Implement NestJS services/controllers | Read/edit repo files first |
| Validate evaluation behavior | Tests first, then readonly MCP if live DB state matters |
| Inspect current tables/indexes/constraints | PostgreSQL readonly MCP |
| Verify seed data or audit logs with `SELECT` | PostgreSQL readonly MCP |
| Analyze slow read query or missing index | PostgreSQL readonly MCP |
| Create a managed Prisma Postgres database | Prisma MCP |
| Create/list a Prisma connection string | Prisma MCP |
| List/restore managed backups | Prisma MCP |
| Run schema update against Prisma Postgres | Prisma MCP after confirmation |
| Run data mutation against Prisma Postgres | Prisma MCP only after confirmation |
| Delete databases or connection strings | Prisma MCP only after explicit confirmation |

## Practical examples

- "What tables exist in my local dev database?" -> PostgreSQL readonly MCP
  (`pg_list_tables`, `pg_describe_table`).
- "Did the seed create the demo project and `new-checkout` flag?" ->
  PostgreSQL readonly MCP with a parameterized `SELECT`.
- "Does audit logging write before/after snapshots?" -> Run tests first; if live
  verification is requested, use PostgreSQL readonly MCP to inspect audit rows.
- "Create a Prisma Postgres database for this project." -> Prisma MCP.
- "Generate a connection string for the database." -> Prisma MCP; do not print
  secrets unless the user asked for them.
- "Apply this schema SQL to the hosted database." -> Prisma MCP only after
  explaining the SQL and getting confirmation.

## Adaptation checklist

When adapting this repo configuration:

- Keep `.codex/config.toml` MCP server names stable:
  `prisma` and `postgres_readonly`.
- Keep `POSTGRES_MCP_DATABASE_URL` separate from `DATABASE_URL`.
- Prefer a database role that can `SELECT` from application tables and inspect
  catalog metadata, but cannot insert, update, delete, truncate, or alter schema.
- Review disabled or approval-gated tools before enabling any mutating database
  capability.
