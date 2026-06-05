# Phase 2 Apply Migration and Verify DB Constraints — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response.

## Original request context

The user was working through Phase 2 of
`docs/plan/implementation-roadmap.md`: data model and migrations for the
feature flag platform. The latest guidance immediately before this reference
covered **Step 7 — Apply migration and verify DB constraints**, after the user
completed Step 6 by adding manual SQL constraints to the generated Prisma
migration.

Relevant repository guardrails:

- Preserve deterministic evaluation and fail-closed defaults.
- Preserve append-only audit logging for mutations.
- Preserve stable, non-PII rollout and targeting keys.
- Preserve control-plane/data-plane separation.
- Prioritize required MVP deliverables before optional enhancements.

## Full response reference

Step 7 applies the generated Phase 2 Prisma migration to PostgreSQL and verifies
that the database constraints required for the MVP are present.

The step should be executed only after the generated migration SQL has been
edited to include:

1. a partial unique index that allows only one default environment per project;
2. trigger-based append-only protection for `audit_log_entries`.

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

The exact timestamp depends on when the migration folder was generated. In the
session that produced this reference, the migration folder was named similar to
`20260605133630_init_data_model`, but future runs should use the actual
generated folder name.

### Generate Prisma Client

After applying the migration, regenerate Prisma Client:

```bash
npm run prisma:generate --workspace=@ffp/backend
```

Expected result:

```text
Generated Prisma Client
```

This confirms that TypeScript code in later phases can import and use the
generated Prisma client for the Phase 2 schema.

### Verify tables exist

Use `psql` with the local development database URL from `.env`. Do not commit
or paste real secrets. If `DATABASE_URL` is exported in the shell, run:

```bash
psql "$DATABASE_URL" -c "\dt"
```

If `DATABASE_URL` is not exported, use the local development URL from `.env`
directly in the command for local verification only.

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

These tables satisfy the Phase 2 database scope:

- project containers;
- environment separation;
- feature flag definitions;
- environment-specific flag configuration;
- ordered targeting rules;
- sample demo user contexts;
- append-only audit log entries.

### Verify one-default-environment index exists

Run:

```bash
psql "$DATABASE_URL" -c "\di environments_one_default_per_project"
```

Expected result includes:

```text
environments_one_default_per_project
```

This verifies the manual partial unique index:

```sql
CREATE UNIQUE INDEX "environments_one_default_per_project"
ON "environments" ("project_id")
WHERE "is_default" = true;
```

The purpose is to prevent invalid configuration such as two default
environments in the same project.

### Verify audit triggers exist

Run:

```bash
psql "$DATABASE_URL" -c "\dS+ audit_log_entries"
```

Look for these trigger names:

```text
audit_log_entries_no_update
audit_log_entries_no_delete
```

These triggers enforce the append-only audit-log requirement at the database
layer. Inserts are allowed; updates and deletes are rejected.

### If migration fails

Do not edit files randomly. Capture the full terminal output and diagnose the
specific failure.

Common issues include:

- duplicate index name;
- migration already applied;
- typo in the manual SQL trigger or function;
- database not reset cleanly after earlier migration drift;
- missing PostgreSQL permissions for local Prisma migration workflows.

## Key decisions and rationale

### Apply only after manual constraints are present

The migration should not be applied before adding the manual SQL constraints,
because Prisma schema alone cannot fully express:

- partial uniqueness for one default environment per project;
- trigger-based append-only audit protection.

Applying the migration after manual edits ensures the database itself enforces
critical MVP invariants.

### Verify database state explicitly

The workflow includes direct `psql` verification because a successful Prisma
migration command is not enough to prove the manual SQL constraints exist.

The reference verifies:

- table creation;
- the manual partial unique index;
- audit immutability triggers.

### Keep secrets out of documentation

The original response used the local development PostgreSQL URL inline. This
reference uses `"$DATABASE_URL"` or a placeholder description instead, because
reference documents should not preserve secrets or local-only credentials.

## Commands, files, and artifacts

Primary commands:

```bash
npm run prisma:migrate --workspace=@ffp/backend
npm run prisma:generate --workspace=@ffp/backend
psql "$DATABASE_URL" -c "\dt"
psql "$DATABASE_URL" -c "\di environments_one_default_per_project"
psql "$DATABASE_URL" -c "\dS+ audit_log_entries"
```

Primary files:

```text
apps/backend/prisma/schema.prisma
apps/backend/prisma.config.ts
apps/backend/prisma/migrations/<timestamp>_init_data_model/migration.sql
```

Expected migration artifacts:

```text
projects
environments
feature_flags
flag_environment_configs
flag_rules
sample_user_contexts
audit_log_entries
environments_one_default_per_project
audit_log_entries_no_update
audit_log_entries_no_delete
```

## Validation checklist

Use this checklist to mark Step 7 complete:

- [ ] `npm run prisma:migrate --workspace=@ffp/backend` completes.
- [ ] `npm run prisma:generate --workspace=@ffp/backend` completes.
- [ ] `psql "$DATABASE_URL" -c "\dt"` shows all Phase 2 tables.
- [ ] `psql "$DATABASE_URL" -c "\di environments_one_default_per_project"`
      shows the default-environment partial unique index.
- [ ] `psql "$DATABASE_URL" -c "\dS+ audit_log_entries"` shows
      `audit_log_entries_no_update`.
- [ ] `psql "$DATABASE_URL" -c "\dS+ audit_log_entries"` shows
      `audit_log_entries_no_delete`.
- [ ] No migration drift remains.
- [ ] No seed data has been added yet unless a later step explicitly adds it.

## Risks and caveats

- Prisma migration drift can occur if a migration is applied to the database
  but the local migration directory is deleted or changed.
- The manual SQL constraints must stay in the migration file committed to the
  repository; otherwise future setups will not enforce default-environment or
  append-only audit rules.
- `psql "$DATABASE_URL"` only works if `DATABASE_URL` is exported in the shell.
  If it is only stored in `.env`, either export it temporarily or use the local
  development URL directly without committing it.
- The audit triggers protect against accidental update/delete through SQL or
  Prisma, but application services in later phases must still avoid exposing
  update/delete flows for audit logs.

## Reuse prompts

Continue this workflow:

```text
Step 7 done. Teach me Step 8 to create seed data for the Phase 2 schema.
```

Troubleshoot migration failures:

```text
The Phase 2 migration failed with this output: <paste output>. Help me diagnose
without losing required migration constraints.
```

Verify audit immutability:

```text
Help me run a safe manual SQL test that proves audit_log_entries rejects UPDATE
and DELETE after the Phase 2 migration.
```

Prepare the next implementation phase:

```text
Review whether the applied Phase 2 schema is ready for Phase 3 backend
foundation work: Prisma service, repositories, validation, error handling, and
transactional audit logging.
```
