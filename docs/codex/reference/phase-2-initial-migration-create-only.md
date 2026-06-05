# Phase 2 Initial Migration Create-Only — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a reference, not a transcript.

## Scope

This reference covers only Phase 2 Step 5 of the Feature Flag Platform roadmap: creating the initial Prisma migration SQL file without applying it yet.

The work follows the environment-aware Prisma schema from `apps/backend/prisma/schema.prisma` and comes after Step 4 validation succeeded.

## High-signal outcomes

- Step 5 goal is to generate the first migration folder and `migration.sql` with `--create-only`.
- The intended command from the repository root is:

  ```bash
  npm run prisma:migrate --workspace=@ffp/backend -- --create-only --name init_data_model
  ```

- The command initially failed with Prisma error `P3014` because Prisma Migrate could not create its shadow database.
- Root cause: local PostgreSQL role `ffp` could connect to `ffp_dev`, but did not have `CREATEDB` permission.
- Local development fix was applied successfully:

  ```bash
  sudo -u postgres psql -c "ALTER ROLE ffp CREATEDB;"
  ```

- Terminal also printed a harmless warning:

  ```text
  could not change directory to "/home/fabyanbui/drive/feature-flag-platform": Permission denied
  ```

  The important successful output was:

  ```text
  ALTER ROLE
  ```

- After that fix, Step 5 should be retried with the create-only migration command.
- The retry then failed with Prisma error `P3015`:

  ```text
  Could not find the migration file at migration.sql.
  Please delete the directory or restore the migration file.
  ```

- Root cause: the earlier failed migration attempt left behind an incomplete
  migration directory under `apps/backend/prisma/migrations/` without a
  `migration.sql` file.
- Safe cleanup guidance: list migration directories, then remove only the
  incomplete empty directory with `rmdir`, not `rm -rf`.
- A later retry failed with Prisma drift detection because the database already
  had the initial schema and `_prisma_migrations` recorded
  `20260605131148_init_data_model`, while the local migrations directory was
  empty.
- Root cause: the initial migration had been applied to the local development
  database but the matching local migration folder/file was missing.
- Clean local-development fix: reset the local development database, then
  recreate the migration with `--create-only`.
- Prisma 7 caveat: `prisma migrate reset` no longer accepts `--skip-seed` in
  this setup. The attempted command with `--skip-seed` did not run the reset.
  Use only `--force --schema prisma/schema.prisma`.

## Files and artifacts

Files involved:

- `apps/backend/prisma/schema.prisma`
- `apps/backend/prisma.config.ts`
- `apps/backend/package.json`
- `.env`

Expected artifact after retry succeeds:

```text
apps/backend/prisma/migrations/<timestamp>_init_data_model/migration.sql
```

No migration SQL should be manually edited until Step 6.

Possible stale artifact from the failed first attempt:

```text
apps/backend/prisma/migrations/<timestamp>_init_data_model/
```

If this directory is empty and has no `migration.sql`, remove it with:

```bash
rmdir apps/backend/prisma/migrations/<timestamp>_init_data_model
```

Current observed local state during this Step 5 troubleshooting:

```text
apps/backend/prisma/
apps/backend/prisma/migrations/
apps/backend/prisma/schema.prisma
```

That means the migrations directory exists but has no migration SQL file.

## Decisions and guardrails

- Use `--create-only` for Step 5 so Prisma creates SQL without applying it.
- Do not run a normal migration yet; Step 6 must first add manual PostgreSQL constraints.
- For local development, granting `CREATEDB` to role `ffp` is acceptable because Prisma Migrate needs a shadow database.
- For shared or production-like environments, prefer a dedicated shadow database instead of broad `CREATEDB` permission.
- Preserve Phase 2 scope: data model, migration generation, PostgreSQL constraints, and seed data only. Do not implement controllers, services, or evaluation APIs in this step.

## Validation and caveats

Retry Step 5 from the repository root:

```bash
npm run prisma:migrate --workspace=@ffp/backend -- --create-only --name init_data_model
```

Verify the migration file exists:

```bash
find apps/backend/prisma/migrations -maxdepth 2 -type f
```

Expected output should include:

```text
apps/backend/prisma/migrations/<timestamp>_init_data_model/migration.sql
```

If Prisma reports `P3015`, inspect the migration directory:

```bash
find apps/backend/prisma/migrations -maxdepth 2 -print
```

If there is an incomplete empty `<timestamp>_init_data_model` directory with no
`migration.sql`, remove only that empty directory:

```bash
rmdir apps/backend/prisma/migrations/<timestamp>_init_data_model
```

Then retry the create-only migration command.

If Prisma reports drift and says a migration is applied to the database but
missing locally, reset this local development database:

```bash
cd apps/backend
npx prisma migrate reset --force --schema prisma/schema.prisma
cd ../..
```

Do not include `--skip-seed`; this Prisma 7 setup reports it as an unknown
option.

Then recreate the migration SQL without applying it:

```bash
npm run prisma:migrate --workspace=@ffp/backend -- --create-only --name init_data_model
```

If Step 5 is retried and succeeds, proceed to Step 6 and edit the generated `migration.sql` to add:

1. one-default-environment-per-project partial unique index,
2. append-only audit log update/delete prevention triggers.

Known caveats:

- Granting `CREATEDB` is a local-development convenience. It should not be
  treated as the production database permission model.
- `prisma migrate reset --force` is destructive for the local development DB.
  It is acceptable here only because this is Phase 2 local setup and the
  generated migration has not been finalized.
- Step 5 remains incomplete until
  `apps/backend/prisma/migrations/<timestamp>_init_data_model/migration.sql`
  exists locally.

## Best reusable next prompt

Continue Phase 2 Step 5. The Prisma create-only migration initially failed
with `P3014` because role `ffp` lacked `CREATEDB`; `ALTER ROLE ffp CREATEDB`
has succeeded. A retry failed with `P3015` because an incomplete migration
directory existed without `migration.sql`. A later retry reported drift because
the database has an applied `20260605131148_init_data_model` migration but the
local migrations directory is empty. For this local dev DB, run
`cd apps/backend && npx prisma migrate reset --force --schema prisma/schema.prisma && cd ../..`
without `--skip-seed`, then rerun
`npm run prisma:migrate --workspace=@ffp/backend -- --create-only --name init_data_model`.
Verify `migration.sql` exists and stop before Step 6 manual SQL constraints.

## Source notes

- Source conversation: current Codex session, limited to Phase 2 Step 5.
- Active roadmap source: `docs/plan/implementation-roadmap.md`.
- Schema source: `apps/backend/prisma/schema.prisma`.
- Project guardrails source: `AGENTS.md`.
- Relevant previous references:
  - `docs/codex/reference/phase-2-prisma-schema-creation.md`
  - `docs/codex/reference/phase-2-prisma-validation-tooling-fix.md`
  - `docs/codex/reference/phase-2-postgresql-config-check.md`
