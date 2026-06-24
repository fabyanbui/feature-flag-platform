# Phase 2 Prisma Data Model and Migration — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a reference, not a transcript.

## Scope

This session guided Phase 2 of `docs/plan/implementation-roadmap.md`: data model, PostgreSQL/Prisma migration setup, seed data, and final validation for the Feature Flag Platform MVP. It followed the repository guardrails in `AGENTS.md`, with emphasis on deterministic evaluation readiness, append-only audit logs, stable non-PII rollout keys, safe defaults, and clear control-plane/data-plane separation.

## High-signal outcomes

- Added a Prisma/PostgreSQL Phase 2 model with environment support inspired by competitor feature-flag systems, while keeping the MVP scope controlled.
- Chose a normalized environment-aware model:
  - `Project` owns `Environment`, `FeatureFlag`, `SampleUserContext`, and `AuditLogEntry`.
  - `FeatureFlag` stores flag identity and lifecycle only.
  - `FlagEnvironmentConfig` stores environment-specific runtime configuration: `status`, `servingMode`, and `killSwitch`.
  - `FlagRule` belongs to `FlagEnvironmentConfig`, making rules environment-specific.
- Split flag lifecycle and environment runtime state:
  - `FeatureFlagLifecycleStatus`: `ACTIVE`, `ARCHIVED`.
  - `FlagConfigStatus`: `ENABLED`, `DISABLED`.
  - Runtime evaluation result remains separate and will later be returned as `enabled=true/false`.
- Added audit target/action concepts for environment-aware configuration:
  - `AuditTargetType.FLAG_CONFIG`.
  - `FLAG_CONFIG_CREATED`, `FLAG_CONFIG_UPDATED`, `FLAG_CONFIG_DELETED`.
- Preserved MVP rule types:
  - `USER_ALLOWLIST`
  - `ROLE_TARGETING`
  - `PERCENTAGE_ROLLOUT`
- Added Prisma 7 setup details:
  - `schema.prisma` datasource has only `provider = "postgresql"`.
  - `DATABASE_URL` is configured in `apps/backend/prisma.config.ts`.
  - Seed command is configured under `migrations.seed` in `prisma.config.ts`, not in `package.json`.
  - Prisma Client uses `@prisma/adapter-pg` and `pg`.
- Resolved migration setup issues:
  - Granted local PostgreSQL user `ffp` `CREATEDB` to allow Prisma shadow database creation.
  - Reset local migration drift after a generated migration had been applied/missing locally.
  - Created a clean initial migration.
- Added manual SQL constraints to the migration:
  - partial unique index `environments_one_default_per_project` to enforce one default environment per project.
  - triggers `audit_log_entries_no_update` and `audit_log_entries_no_delete` using `prevent_audit_log_mutation()` to enforce append-only audit logs.
- Added seed data for demo readiness:
  - one demo project: `demo-project`.
  - environments: `production`, `staging`, `development`.
  - flags: `beta-dashboard`, `new-checkout`.
  - production config for `beta-dashboard` as global-on.
  - production config for `new-checkout` as targeted.
  - rules for `new-checkout` in production: allowlist, role targeting, percentage rollout.
  - sample users: `demo-user-beta`, `demo-user-regular`, `demo-user-admin`.
  - synthetic system audit entries for seeded setup.

## Files and artifacts

Key files created or updated:

- `apps/backend/prisma/schema.prisma`
  - Prisma 7-compatible schema with environment-aware feature flag data model.
- `apps/backend/prisma.config.ts`
  - Loads root `.env` and app `.env`.
  - Configures schema path, migration path, seed command, and datasource URL.
- `apps/backend/prisma/migrations/20260605133630_init_data_model/migration.sql`
  - Initial data model migration.
  - Includes manual partial unique index for default environments.
  - Includes append-only audit trigger/function SQL.
- `apps/backend/prisma/migrations/migration_lock.toml`
  - Prisma migration provider lock.
- `apps/backend/prisma/seed.ts`
  - Idempotent demo seed script using Prisma 7 PostgreSQL adapter.
  - Uses `Prisma.AuditLogEntryUncheckedCreateInput` for scalar FK audit inserts.
  - Uses `Prisma.DbNull` for nullable JSON audit snapshots instead of raw `null`.
- `apps/backend/package.json`
  - Prisma scripts exist for validate, generate, migrate, studio, and seed.
  - Dependencies include Prisma 7, `@prisma/adapter-pg`, `pg`, `dotenv`, `tsx`, and `@types/pg`.

Related docs to keep aligned later:

- `docs/plan/implementation-roadmap.md`
- `docs/design/software-architecture-document.md`
- `docs/design/mvp-api-and-contracts.md`
- `docs/plan/project-goal.md`
- `docs/requirement/requirement-init.md`
- `AGENTS.md`

## Decisions and guardrails

- Environment support was accepted as a small Phase 2 schema enhancement because it is foundational and hard to retrofit cleanly later, but advanced environment features remain out of MVP scope.
- Do not add SDK keys, approval workflows, environment permissions, promotion pipelines, segments, statistics, or rule versioning until required MVP deliverables are complete.
- `ARCHIVED` belongs to flag lifecycle, not environment config. Environment config uses only enabled/disabled behavior plus serving mode and kill switch.
- Evaluation in later phases should default to `production` if `environmentKey` is omitted, unless API contracts are updated to require an explicit environment.
- Expected future evaluation order with environments:
  1. missing project/environment/flag/config -> safe `NOT_FOUND`
  2. archived flag -> `FLAG_ARCHIVED`
  3. config kill switch -> `KILL_SWITCH`
  4. config disabled -> `FLAG_DISABLED`
  5. serving mode global on -> `GLOBAL_ON`
  6. user allowlist rules
  7. role targeting rules
  8. percentage rollout rules using deterministic hashing and stable non-PII `targetingKey`
  9. default off
- `FlagEnvironmentConfig.projectId` is intentionally present to support same-project consistency between a flag and environment.
- Composite relations reference `(projectId, id)` on `FeatureFlag` and `Environment` to prevent connecting a flag from one project to an environment from another project.
- Audit logs are append-only at the database level; mutation services in later phases must still write audit entries in the same transaction as the mutation.
- Audit entries denormalize `projectKey` and optional `environmentKey` for readable logs and future API responses.
- Feature flag status/lifecycle labels must remain distinct from runtime On/Off evaluation output.

## Validation and caveats

Validation performed during the session:

- `npx prisma validate --schema prisma/schema.prisma` succeeded after adapting to Prisma 7 datasource config.
- Initial migration was created and applied after resolving shadow database permissions and local drift.
- PostgreSQL table checks confirmed Phase 2 tables exist.
- Manual checks confirmed:
  - `environments_one_default_per_project` index exists.
  - `audit_log_entries_no_update` and `audit_log_entries_no_delete` triggers exist.
- Seed data was run successfully after adding `migrations.seed = 'tsx prisma/seed.ts'` to `apps/backend/prisma.config.ts`.
- `npm run build --workspace=@ffp/backend` initially failed due to Prisma seed typing, then passed after fixing:
  - `createAuditIfMissing` to use `Omit<Prisma.AuditLogEntryUncheckedCreateInput, 'id'>`.
  - `before: null` values to use `before: Prisma.DbNull`.

Important caveats:

- Prisma 7 removed support for `url = env("DATABASE_URL")` in `schema.prisma`; future Prisma changes should be checked before changing config shape.
- Prisma 7 `migrate reset` did not support `--skip-seed` in this local setup; use `npx prisma migrate reset --force --schema prisma/schema.prisma` if a local reset is needed.
- `psql` does not accept Prisma's `?schema=public` query parameter. Use `postgresql://ffp:ffp_dev_password@localhost:5432/ffp_dev` for manual `psql` commands.
- Local user `ffp` was granted `CREATEDB` so Prisma Migrate can create its shadow database. This is acceptable for local development; shared environments should use a dedicated shadow database URL instead.
- Adding environments means `docs/design/mvp-api-and-contracts.md` should be updated before API implementation to clarify `environmentKey` behavior and defaulting.
- Phase 3 backend services should create a shared Prisma provider that constructs `PrismaClient` with `@prisma/adapter-pg`, matching the seed script.

Useful validation commands:

```bash
npm run prisma:validate --workspace=@ffp/backend
npm run prisma:generate --workspace=@ffp/backend
npm run prisma:migrate --workspace=@ffp/backend
npm run db:seed --workspace=@ffp/backend
npm run build --workspace=@ffp/backend
npm run diff:check
```

PostgreSQL verification commands:

```bash
psql "postgresql://ffp:ffp_dev_password@localhost:5432/ffp_dev" -c "\dt"
psql "postgresql://ffp:ffp_dev_password@localhost:5432/ffp_dev" -c "\di environments_one_default_per_project"
psql "postgresql://ffp:ffp_dev_password@localhost:5432/ffp_dev" -c "\dS+ public.audit_log_entries"
```

Constraint behavior tests expected to fail successfully:

```bash
psql "postgresql://ffp:ffp_dev_password@localhost:5432/ffp_dev" -c "UPDATE environments SET is_default = true WHERE project_id = (SELECT id FROM projects WHERE key = 'demo-project') AND key = 'staging';"
psql "postgresql://ffp:ffp_dev_password@localhost:5432/ffp_dev" -c "UPDATE audit_log_entries SET actor = 'changed' WHERE id = 'audit_seed_project_created';"
psql "postgresql://ffp:ffp_dev_password@localhost:5432/ffp_dev" -c "DELETE FROM audit_log_entries WHERE id = 'audit_seed_project_created';"
```

## Best reusable next prompt

Continue from Phase 2 completion into Phase 3. Review `apps/backend/prisma/schema.prisma`, `apps/backend/prisma.config.ts`, `apps/backend/prisma/seed.ts`, and the initial migration. Implement the backend foundation professionally: create a Prisma module/service using Prisma 7 with `@prisma/adapter-pg`, add request context/correlation ID support, validation/error handling, DTO boundaries, transaction helper, audit logging service, and repository/data-access layer. Preserve append-only audit logs, same-transaction audit writes for mutations, environment-aware flag configuration, safe defaults, and control-plane/data-plane separation.

## Source notes

- Source: current Codex conversation covering Phase 2 implementation guidance, migration troubleshooting, environment-schema review, seed setup, and build fix.
- Repository guardrails: `AGENTS.md` and `docs/plan/project-goal.md`.
- Product source: `docs/requirement/requirement-init.md` and `docs/requirement/info-init.md`.
- Roadmap source: `docs/plan/implementation-roadmap.md`.
