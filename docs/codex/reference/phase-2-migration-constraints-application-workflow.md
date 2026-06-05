# Phase 2 Migration Constraints and Application Workflow — Full Codex Response Reference

Purpose: standalone reference expanded from the two latest Codex responses about Step 6 and Step 7 of Phase 2 database migrations.

## Original request context

The user is implementing Phase 2 of `docs/plan/implementation-roadmap.md` for the feature flag platform: data model and migrations. The backend Prisma schema has already been created, reviewed, validated, and used to create an initial migration with `--create-only`.

The two latest substantive Codex responses covered:

1. **Step 6 — Add manual SQL constraints** to the generated Prisma migration before applying it.
2. **Step 7 — Apply migration and verify DB constraints** after the manual constraints are present.

Relevant repository guardrails from `AGENTS.md` and project planning:

- Preserve append-only audit logging for configuration mutations.
- Preserve deterministic evaluation and fail-closed defaults.
- Preserve control-plane/data-plane separation.
- Keep Phase 2 focused on the database foundation before backend APIs, UI, and demo integration.
- Required MVP deliverables come before recommended enhancements.

## Full response reference

## Step 6 — Add manual SQL constraints

### Step 6 goal

Edit the generated migration SQL to add two database-level guarantees that Prisma cannot fully express in `schema.prisma`:

1. only one default environment per project;
2. append-only audit logs.

The active-session migration file was:

```text
apps/backend/prisma/migrations/20260605133630_init_data_model/migration.sql
```

For future sessions, use the actual generated migration path:

```text
apps/backend/prisma/migrations/<timestamp>_init_data_model/migration.sql
```

### Open the migration SQL file

Open:

```text
apps/backend/prisma/migrations/<timestamp>_init_data_model/migration.sql
```

Go to the very bottom of the file, after the final generated foreign key statement. In the active session, the ending was:

```sql
ALTER TABLE "audit_log_entries" ADD CONSTRAINT "audit_log_entries_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

### Add one default environment constraint

Append this SQL:

```sql
-- ManualConstraint
-- Ensure each project has at most one default environment.
CREATE UNIQUE INDEX "environments_one_default_per_project"
ON "environments" ("project_id")
WHERE "is_default" = true;
```

This prevents invalid data such as:

```text
demo-project
  ├── production isDefault=true
  └── staging isDefault=true
```

The Prisma schema can include a normal index on `(project_id, is_default)`, but that does not enforce exactly this rule. PostgreSQL's partial unique index enforces **at most one** default environment per project. Application or seed logic should still ensure each project gets an appropriate default environment.

### Add append-only audit log protection

Append this SQL after the default environment index:

```sql
-- ManualConstraint
-- Audit log entries are append-only: inserts are allowed, updates/deletes are rejected.
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log_entries is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_entries_no_update
BEFORE UPDATE ON "audit_log_entries"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE TRIGGER audit_log_entries_no_delete
BEFORE DELETE ON "audit_log_entries"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_mutation();
```

This allows inserts into `audit_log_entries`, but rejects updates and deletes at the database layer.

### Expected file ending after Step 6

The migration should end like this:

```sql
ALTER TABLE "audit_log_entries" ADD CONSTRAINT "audit_log_entries_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ManualConstraint
-- Ensure each project has at most one default environment.
CREATE UNIQUE INDEX "environments_one_default_per_project"
ON "environments" ("project_id")
WHERE "is_default" = true;

-- ManualConstraint
-- Audit log entries are append-only: inserts are allowed, updates/deletes are rejected.
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log_entries is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_entries_no_update
BEFORE UPDATE ON "audit_log_entries"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE TRIGGER audit_log_entries_no_delete
BEFORE DELETE ON "audit_log_entries"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_mutation();
```

Do not run the migration until this manual SQL is saved.

## Step 7 — Apply migration and verify DB constraints

### Step 7 goal

Apply the migration to PostgreSQL and verify:

1. all Phase 2 tables exist;
2. the one-default-environment constraint exists;
3. audit logs reject update/delete operations through database triggers.

### Apply the migration

From the repository root, run:

```bash
npm run prisma:migrate --workspace=@ffp/backend
```

Expected result:

```text
The following migration(s) have been applied:
<timestamp>_init_data_model
```

The exact timestamp depends on the generated migration folder.

### Generate Prisma Client

Run:

```bash
npm run prisma:generate --workspace=@ffp/backend
```

Expected result:

```text
Generated Prisma Client
```

### Verify tables exist

If `DATABASE_URL` is exported in the shell, run:

```bash
psql "$DATABASE_URL" -c "\dt"
```

If it is not exported, use the local development database URL from `.env` directly for local verification only, without committing it to documentation or code.

Expected tables:

```text
projects
environments
feature_flags
flag_environment_configs
flag_rules
sample_user_contexts
audit_log_entries
```

### Verify manual index exists

Run:

```bash
psql "$DATABASE_URL" -c "\di environments_one_default_per_project"
```

Expected output should include:

```text
environments_one_default_per_project
```

This proves the manual partial unique index exists.

### Verify audit triggers exist

Run:

```bash
psql "$DATABASE_URL" -c "\dS+ audit_log_entries"
```

Look for:

```text
audit_log_entries_no_update
audit_log_entries_no_delete
```

These triggers prove the database rejects updates and deletes to audit log rows.

### If migration fails

Do not edit files randomly. Capture and inspect the full error.

Common issues include:

- duplicate index name;
- migration already applied;
- typo in the manual SQL trigger or function;
- database not reset cleanly after earlier migration drift;
- missing PostgreSQL permissions for local Prisma migration workflows.

## Key decisions and rationale

### Manual constraints belong in the migration

The manual SQL should be committed inside the initial migration so future setups receive the same safety guarantees. Adding the SQL ad hoc after migration would make the local database diverge from migration history.

### Environment default uses partial uniqueness

Only one environment should act as the default environment for a project. The database enforces **at most one** default environment with:

```sql
CREATE UNIQUE INDEX "environments_one_default_per_project"
ON "environments" ("project_id")
WHERE "is_default" = true;
```

This supports competitor-inspired environment separation without adding unnecessary MVP complexity such as environment permissions, approval workflows, SDK keys, or promotion pipelines.

### Audit logs are protected at the database layer

The application must not expose audit update/delete flows, but database-level protection makes the invariant stronger. The trigger function rejects any accidental or direct SQL update/delete attempt against `audit_log_entries`.

This supports the MVP audit requirement that mutations for projects, environments, flags, flag configs, rules, and sample users remain traceable through append-only audit history.

### Verification uses direct PostgreSQL inspection

A successful Prisma migration command is not enough to prove custom manual SQL exists. Direct `psql` checks verify the tables, partial unique index, and audit triggers are actually present in PostgreSQL.

## Commands, files, and artifacts

### Files

```text
apps/backend/prisma/schema.prisma
apps/backend/prisma.config.ts
apps/backend/prisma/migrations/<timestamp>_init_data_model/migration.sql
```

### Step 6 manual SQL artifacts

```text
environments_one_default_per_project
prevent_audit_log_mutation()
audit_log_entries_no_update
audit_log_entries_no_delete
```

### Step 7 commands

```bash
npm run prisma:migrate --workspace=@ffp/backend
npm run prisma:generate --workspace=@ffp/backend
psql "$DATABASE_URL" -c "\dt"
psql "$DATABASE_URL" -c "\di environments_one_default_per_project"
psql "$DATABASE_URL" -c "\dS+ audit_log_entries"
```

### Expected database tables

```text
projects
environments
feature_flags
flag_environment_configs
flag_rules
sample_user_contexts
audit_log_entries
```

## Validation checklist

Before applying migration:

- [ ] Migration SQL exists under `apps/backend/prisma/migrations/<timestamp>_init_data_model/migration.sql`.
- [ ] `environments_one_default_per_project` SQL is appended after generated SQL.
- [ ] `prevent_audit_log_mutation()` SQL is appended after generated SQL.
- [ ] `audit_log_entries_no_update` trigger is appended.
- [ ] `audit_log_entries_no_delete` trigger is appended.

After applying migration:

- [ ] `npm run prisma:migrate --workspace=@ffp/backend` completes.
- [ ] `npm run prisma:generate --workspace=@ffp/backend` completes.
- [ ] `psql "$DATABASE_URL" -c "\dt"` shows all Phase 2 tables.
- [ ] `psql "$DATABASE_URL" -c "\di environments_one_default_per_project"` shows the partial unique index.
- [ ] `psql "$DATABASE_URL" -c "\dS+ audit_log_entries"` shows `audit_log_entries_no_update`.
- [ ] `psql "$DATABASE_URL" -c "\dS+ audit_log_entries"` shows `audit_log_entries_no_delete`.
- [ ] No migration drift remains.

## Risks and caveats

- If the migration is applied before manual SQL is added, the local database can miss important safety constraints.
- If a migration folder is deleted after being applied, Prisma drift can occur.
- The partial unique index guarantees at most one default environment per project, not at least one. Seed/application logic should create the default environment.
- Audit triggers reject update/delete, but later service-layer code must still write audit entries in the same transaction as configuration mutations.
- Do not preserve real database credentials in reference documentation; prefer `DATABASE_URL` placeholders.
- Keep environment support small for MVP. Do not add SDK keys, approval workflows, environment RBAC, promotion pipelines, or environment cloning until required MVP deliverables are complete.

## Reuse prompts

Continue to the next Phase 2 step:

```text
Step 7 done. Teach me Step 8 to create seed data for the Phase 2 schema with environments, flag configs, rules, sample users, and audit entries.
```

Troubleshoot migration application:

```text
The Phase 2 migration failed with this output: <paste output>. Help me diagnose without losing the manual migration constraints.
```

Verify database constraints more deeply:

```text
Help me run safe SQL checks that prove one project cannot have two default environments and audit_log_entries rejects UPDATE and DELETE.
```

Prepare for Phase 3:

```text
Review whether the applied Phase 2 schema is ready for Phase 3 backend foundation work: Prisma service, repositories, validation, error handling, request context, and transactional audit logging.
```
