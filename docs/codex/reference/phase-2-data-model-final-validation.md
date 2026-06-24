# Phase 2 Data Model Final Validation — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a reference, not a transcript.

## Scope

This session completed the final validation workstream for Phase 2 of the feature flag platform implementation roadmap: Prisma/PostgreSQL data model, initial migration, manual database constraints, seed data, and backend build readiness.

The work stayed aligned with these project guardrails:

- Required MVP deliverables come before recommended enhancements.
- Deterministic evaluation and stable non-PII rollout keys must be preserved.
- Control-plane configuration and data-plane evaluation remain separate.
- Audit logs must be append-only and mutation audit entries must later be written transactionally.
- Feature flag lifecycle/status labels remain distinct from runtime On/Off evaluation results.

## High-signal outcomes

- Phase 2 schema includes environment support inspired by competitor platforms, while keeping MVP scope controlled.
- Final domain model:
  - `Project`
  - `Environment`
  - `FeatureFlag`
  - `FlagEnvironmentConfig`
  - `FlagRule`
  - `SampleUserContext`
  - `AuditLogEntry`
- `FeatureFlag` owns lifecycle state through `FeatureFlagLifecycleStatus` (`ACTIVE`, `ARCHIVED`).
- `FlagEnvironmentConfig` owns per-environment runtime configuration through:
  - `FlagConfigStatus` (`ENABLED`, `DISABLED`)
  - `ServingMode` (`GLOBAL_ON`, `TARGETED`)
  - `killSwitch`
- Rules attach to `FlagEnvironmentConfig`, not directly to `FeatureFlag`, so rollout rules can differ by environment.
- Audit model includes `FLAG_CONFIG` target semantics and config-specific actions.
- Manual migration SQL enforces:
  - one default environment per project,
  - append-only audit logs through PostgreSQL triggers.
- Seed data supports presentation/demo scenarios:
  - one `demo-project`,
  - `production`, `staging`, and `development` environments,
  - globally enabled `beta-dashboard`,
  - targeted `new-checkout`,
  - allowlist, role-targeting, and percentage-rollout rules,
  - beta, regular, and admin sample users,
  - seven seed audit entries.

## Files and artifacts

Important repo paths from this Phase 2 session:

- `apps/backend/prisma/schema.prisma`
  - Final Prisma schema for the data model.
  - Uses Prisma 7-compatible datasource shape with provider only; URL is loaded from config.
- `apps/backend/prisma.config.ts`
  - Loads root `.env` and backend `.env`.
  - Configures schema path, migrations path, seed command, and datasource URL for Prisma 7.
- `apps/backend/prisma/migrations/20260605133630_init_data_model/migration.sql`
  - Initial migration for all Phase 2 tables, enums, indexes, and foreign keys.
  - Includes manual constraints for default environment uniqueness and audit append-only behavior.
- `apps/backend/prisma/migrations/migration_lock.toml`
  - Prisma migration lock file.
- `apps/backend/prisma/seed.ts`
  - Idempotent seed script using `PrismaPg` adapter for Prisma 7.
  - Uses `Prisma.AuditLogEntryUncheckedCreateInput` for scalar FK audit creation.
  - Uses `Prisma.DbNull` for nullable JSON audit `before` snapshots.
- `apps/backend/package.json`
  - Contains Prisma scripts such as `prisma:validate`, `prisma:generate`, `prisma:migrate`, `prisma:studio`, and `db:seed`.

## Decisions and guardrails

- Environment support was accepted as a small, valuable MVP-plus data-model decision because competitors commonly separate flag configuration by environment.
- Environment support must not expand Phase 3-8 scope into SDK keys, approvals, RBAC, environment cloning, or promotion workflows.
- `ARCHIVED` moved out of per-environment config and into `FeatureFlag.lifecycleStatus`; archive is a flag lifecycle concern, not an environment runtime toggle.
- `FlagEnvironmentConfig.projectId` exists to help enforce same-project consistency between flags and environments.
- Composite references enforce that a config links a flag and environment from the same project:
  - config to `FeatureFlag(projectId, id)`
  - config to `Environment(projectId, id)`
- `Environment` deletion is restricted when configs exist, avoiding accidental removal of environment-scoped flag configuration.
- `FeatureFlag` deletion cascades to configs, and config deletion cascades to rules; later management APIs should still prefer explicit, audited mutation flows over blind deletes.
- Audit entries retain denormalized keys such as `projectKey`, `environmentKey`, and `targetKey` for readable audit API responses and UI display.
- `FLAG_RULES_REPLACED` should target `FLAG_CONFIG` because rules are environment-specific.

## Validation and caveats

Validated successfully in this session:

- `npm run prisma:validate --workspace=@ffp/backend`
- `npm run build --workspace=@ffp/backend`
- `npx prisma migrate status --schema prisma/schema.prisma` from `apps/backend`
- Seed counts in local PostgreSQL:
  - projects: 1
  - environments: 3
  - feature flags: 2
  - flag environment configs: 6
  - flag rules: 3
  - sample users: 3
  - audit entries: 7
- One-default-environment constraint rejected making `staging` default while `production` was already default.
- Audit update and delete commands were rejected by the append-only trigger with `audit_log_entries is append-only`.

Caveats for future sessions:

- Local PostgreSQL validation commands may require unsandboxed/local socket access in Codex.
- Do not include the actual `.env` database URL or password in documentation.
- Prisma 7 reads seed configuration from `prisma.config.ts` under `migrations.seed`, not from the legacy package-level Prisma seed field.
- Prisma 7 JSON nullable fields should use `Prisma.DbNull` or `Prisma.JsonNull`; raw TypeScript `null` can fail strict TypeScript builds.
- Phase 3 should add NestJS database integration using the Prisma 7 adapter pattern consistently.

## Best reusable next prompt

Continue with Phase 3 backend foundation. Use `AGENTS.md`, `docs/plan/implementation-roadmap.md`, and `docs/codex/reference/phase-2-data-model-final-validation.md` as context. Implement NestJS validation/error handling, request context/correlation ID, Prisma service using the Prisma 7 PostgreSQL adapter, repository boundaries, transaction helper, and audit logging service. Preserve control-plane/data-plane separation, append-only audit logs, same-transaction mutation audit writes, safe defaults, and environment-aware flag config semantics.

## Source notes

This reference summarizes the current Codex conversation and the final Phase 2 artifacts in the repository. It intentionally excludes raw transcript output, secrets, and repeated migration troubleshooting details except where they establish durable setup rules.
