# Phase 2 Prisma Migration Manual Constraints — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response about adding manual SQL constraints to the Phase 2 initial Prisma migration.

## Original request context

The user is implementing Phase 2 of the feature flag platform roadmap: data model and migrations. The Prisma schema has already been created and validated, and the initial migration was generated with `--create-only`.

The latest guidance covered Step 6: edit the generated Prisma migration SQL before applying it, because Prisma cannot fully express two required database guarantees:

1. Each project must have at most one default environment.
2. Audit log entries must be append-only.

Relevant project guardrails from `AGENTS.md`:

- Preserve append-only audit logging for mutations.
- Preserve deterministic evaluation and safe defaults.
- Keep control-plane configuration concerns separate from data-plane evaluation.
- Keep Phase 2 focused on the database foundation before backend APIs and UI.

## Full response reference

### Step 6 goal

Edit the generated migration SQL to add manual database constraints that are not fully represented in the Prisma schema.

The migration file from the active session was:

```text
apps/backend/prisma/migrations/20260605133630_init_data_model/migration.sql
```

For future sessions, use the actual generated migration directory under:

```text
apps/backend/prisma/migrations/<timestamp>_init_data_model/migration.sql
```

Do not apply the migration before adding these manual SQL statements.

### Open the generated migration

Open the generated migration SQL file:

```text
apps/backend/prisma/migrations/<timestamp>_init_data_model/migration.sql
```

Go to the bottom of the file, after the final foreign key statement. In the active session, the final generated SQL was:

```sql
ALTER TABLE "audit_log_entries" ADD CONSTRAINT "audit_log_entries_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

### Add one-default-environment-per-project constraint

Append this SQL:

```sql
-- ManualConstraint
-- Ensure each project has at most one default environment.
CREATE UNIQUE INDEX "environments_one_default_per_project"
ON "environments" ("project_id")
WHERE "is_default" = true;
```

This prevents invalid data such as one project having multiple default environments:

```text
demo-project
  ├── production isDefault=true
  └── staging isDefault=true
```

The normal Prisma schema has an index on `(project_id, is_default)`, but that index does not enforce uniqueness only when `is_default=true`. A PostgreSQL partial unique index is the correct database-level constraint for this rule.

### Add append-only audit log protection

Append this SQL after the default-environment partial unique index:

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

This allows inserts into `audit_log_entries`, but rejects direct updates and deletes. It supports the project requirement that configuration changes must be auditable and audit history must be append-only.

### Expected migration ending

The end of the migration file should look like this:

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

### Do not apply the migration yet

After editing, save the migration SQL file and stop. The next workflow step is to apply the migration and verify the constraints.

## Key decisions and rationale

### PostgreSQL partial unique index for default environment

The schema includes environment support so that the platform can model competitor-style environment separation, such as development, staging, and production. Because only one environment should be the default for a project, the database needs to enforce:

```text
one project -> at most one environment where is_default = true
```

Prisma can express normal indexes and unique constraints, but it cannot directly express this partial unique index in the Prisma model. Therefore, it must be added manually in the generated migration SQL.

### Trigger-based append-only audit log enforcement

The audit log is part of the core safety story for the MVP. The application layer should not expose update/delete audit endpoints, but database-level protection is still valuable because it protects against accidental repository/service code changes and direct SQL mistakes.

The trigger approach ensures:

- `INSERT` is allowed.
- `UPDATE` is rejected.
- `DELETE` is rejected.

This supports the guardrail that mutations for projects, flags, and rules must write append-only audit entries with before/after snapshots in the same transaction.

## Commands, files, and artifacts

### Files

Generated migration file to edit:

```text
apps/backend/prisma/migrations/<timestamp>_init_data_model/migration.sql
```

Active-session concrete path:

```text
apps/backend/prisma/migrations/20260605133630_init_data_model/migration.sql
```

### Manual SQL to add

One-default-environment-per-project:

```sql
CREATE UNIQUE INDEX "environments_one_default_per_project"
ON "environments" ("project_id")
WHERE "is_default" = true;
```

Append-only audit log trigger function and triggers:

```sql
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

## Validation checklist

Before continuing to migration application:

- [ ] The migration SQL file exists under `apps/backend/prisma/migrations/<timestamp>_init_data_model/migration.sql`.
- [ ] The one-default-environment partial unique index is appended after generated foreign keys.
- [ ] The append-only audit trigger function is appended after generated foreign keys.
- [ ] Both update and delete triggers exist for `audit_log_entries`.
- [ ] The migration has not yet been applied after manual edits.

After applying the migration in a later step, validate:

- [ ] Creating a second default environment in the same project fails.
- [ ] Updating an `audit_log_entries` row fails.
- [ ] Deleting an `audit_log_entries` row fails.
- [ ] Inserting an `audit_log_entries` row still works.

## Risks and caveats

- If the migration is applied before adding this manual SQL, the database will miss important safety constraints.
- If this migration is regenerated later, the manual SQL must be preserved or re-added.
- The partial unique index enforces at most one default environment, not at least one default environment. The application/seed logic should still create one default environment per project.
- The audit trigger protects the table from updates and deletes, but application code must still ensure audit entries are created in the same transaction as configuration mutations.
- For destructive local database reset operations, confirm that only local development data is affected.

## Reuse prompts

Use these prompts to continue or reuse the workflow:

```text
Continue Phase 2 from the manual migration constraints reference. Help me apply the migration and verify the one-default-environment and append-only audit-log constraints.
```

```text
Review the generated Prisma migration SQL for the feature flag platform and confirm the manual constraints for default environments and audit log immutability are present.
```

```text
Create SQL validation commands to prove that the environments partial unique index and audit_log_entries append-only triggers work correctly.
```
