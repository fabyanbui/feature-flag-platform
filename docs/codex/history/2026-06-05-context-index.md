# Codex Context History — 2026-06-05

Purpose: compact context for future Codex sessions. Use this as an index, not a transcript.

## Read first

- Active repo authority: `AGENTS.md`.
- Product sources:
  - `docs/requirement/requirement-init.md`
  - `docs/requirement/info-init.md`
  - `docs/plan/project-goal.md`
- Durable Codex context files:
  - `docs/codex/context-map.md`
  - `docs/codex/task-template.md`
  - `docs/codex/history/2026-06-04-context-index.md`
  - `docs/codex/reference/phase-2-prisma-data-model-and-migration.md`
  - `docs/codex/reference/phase-2-data-model-final-validation.md`
  - `docs/codex/reference/phase-2-migration-constraints-application-workflow.md`
  - `docs/codex/reference/phase-2-prisma-seed-config-prisma-7.md`
  - `.codex/agents/*.toml`
  - `.agents/skills/*/SKILL.md`
- Current filesystem is more authoritative than chat history. Several Phase 2
  sessions were step-by-step teaching/retry sessions; use the committed Prisma
  files and durable reference docs as the source of truth.
- End-of-day Phase 2 work was merged by PR #13 at commit `52de240`; this
  update was run later on `develop` at `d746563`, which also includes June 6
  MCP/database-tooling commits.

## Repo guardrails to keep

- Required MVP before enhancements: research report, backend API, admin
  dashboard, demo app, database, validation/error handling, README run
  instructions, seed data, and short design docs.
- July dates from `docs/requirement/info-init.md`: submission July 1, 2026;
  presentation July 2, 2026.
- Single backend service hosts management and evaluation endpoints.
- MVP stack: NestJS, Prisma, PostgreSQL, REST/Swagger, Jest, in-memory cache.
- Keep control-plane management/dashboard separate from data-plane evaluation.
- Evaluation responses must include `enabled`, `reason`, `projectKey`, and
  `flagKey`; missing project or flag returns `enabled=false`,
  `reason=NOT_FOUND`.
- Default rule order stays global disable/kill switch -> user allowlist -> role
  targeting -> percentage rollout -> default off.
- Percentage rollout must be deterministic with stable hashing over stable,
  non-PII rollout keys.
- Project, flag, config, and rule mutations must write append-only audit logs
  with before/after snapshots in the same transaction.
- Feature flag lifecycle/status labels are distinct from runtime On/Off state.
- Keep `.env.example` aligned with `.env` variable shape using safe placeholders
  only; never copy secrets from session logs or local env files.

## What happened today

### Backend package and local workflow review

- Reviewed backend package manifests from current and previous commits.
- Found a durable caveat: `apps/backend/package.json` still has
  `start:prod: node dist/main`, while Nest build output was observed under
  `apps/backend/dist/src/main.js`. Fix before relying on production start.
- Confirmed root npm workspace and Phase 1 scaffold were present from the
  previous day.
- Added learning/local workflow documentation:
  - `docs/learning/local-dev-workflow.md`
- Added PostgreSQL setup references for Phase 2:
  - `docs/codex/reference/phase-2-postgresql-config-check.md`

### Phase 2 Prisma data model implemented

- Phase 2 became the database foundation rather than controller/API work.
- Added/settled a Prisma 7 + PostgreSQL model in:
  - `apps/backend/prisma/schema.prisma`
  - `apps/backend/prisma.config.ts`
- Model now includes:
  - `Project`
  - `Environment`
  - `FeatureFlag`
  - `FlagEnvironmentConfig`
  - `FlagRule`
  - `SampleUserContext`
  - `AuditLogEntry`
- Environment support was accepted as a small foundational extension because it
  is hard to retrofit and aligns with real feature-flag tools, but advanced
  environment workflows remain out of MVP scope.
- Key modeling decisions:
  - `FeatureFlag` owns lifecycle: `ACTIVE`, `ARCHIVED`.
  - `FlagEnvironmentConfig` owns runtime config: `ENABLED`, `DISABLED`,
    `servingMode`, and `killSwitch`.
  - `FlagRule` belongs to `FlagEnvironmentConfig`, so rules are
    environment-specific.
  - Composite relations keep flag/config/environment within the same project.
  - Audit entries denormalize `projectKey`, optional `environmentKey`, and
    `targetKey` for readable audit APIs/UI.

### Prisma 7 setup and migration completed

- Added Prisma dependencies/scripts to the backend workspace, including Prisma
  7, `@prisma/adapter-pg`, `pg`, `dotenv`, `tsx`, and `@types/pg`.
- Prisma 7 caveats captured for future sessions:
  - `schema.prisma` datasource keeps only `provider = "postgresql"`.
  - `DATABASE_URL` is loaded through `apps/backend/prisma.config.ts`.
  - Seed command belongs under `migrations.seed` in `prisma.config.ts`.
  - Prisma Client should be constructed with `@prisma/adapter-pg`.
- Created initial migration:
  - `apps/backend/prisma/migrations/20260605133630_init_data_model/migration.sql`
  - `apps/backend/prisma/migrations/migration_lock.toml`
- Added manual migration SQL for guardrails that Prisma schema alone does not
  express:
  - partial unique index `environments_one_default_per_project`
  - `prevent_audit_log_mutation()` trigger function
  - `audit_log_entries_no_update`
  - `audit_log_entries_no_delete`
- Local migration troubleshooting decisions:
  - Local PostgreSQL role `ffp` was granted `CREATEDB` for Prisma shadow DB use.
  - For shared environments, prefer a dedicated shadow database URL instead.
  - `psql` commands should omit Prisma's `?schema=public` query parameter.

### Seed data and validation completed

- Implemented idempotent demo seed data in:
  - `apps/backend/prisma/seed.ts`
- Seed data supports demo scenarios:
  - project: `demo-project`
  - environments: `production`, `staging`, `development`
  - flags: `beta-dashboard`, `new-checkout`
  - `beta-dashboard` production config is global-on
  - `new-checkout` production config is targeted
  - rules for allowlist, role targeting, and percentage rollout
  - sample users: beta, regular, and admin demo users
  - synthetic system audit entries for seeded setup
- Fixed Prisma strict typing in `seed.ts`:
  - import `Prisma` alongside `PrismaClient`
  - use `Omit<Prisma.AuditLogEntryUncheckedCreateInput, 'id'>`
  - use `Prisma.DbNull` for nullable JSON audit snapshots
- Validation documented as passing in Phase 2 references:
  - `npm run prisma:validate --workspace=@ffp/backend`
  - `npm run build --workspace=@ffp/backend`
  - `npx prisma migrate status --schema prisma/schema.prisma`
  - seed counts for projects/environments/flags/configs/rules/sample users/audits
  - one-default-environment constraint rejected a duplicate default
  - audit update/delete attempts were rejected as append-only

### Durable Phase 2 references added

- `docs/codex/reference/phase-2-postgresql-config-check.md`
- `docs/codex/reference/phase-2-prisma-schema-creation.md`
- `docs/codex/reference/phase-2-prisma-validation-tooling-fix.md`
- `docs/codex/reference/phase-2-initial-migration-create-only.md`
- `docs/codex/reference/phase-2-prisma-migration-manual-constraints.md`
- `docs/codex/reference/phase-2-apply-migration-verify-db-constraints.md`
- `docs/codex/reference/phase-2-migration-constraints-application-workflow.md`
- `docs/codex/reference/phase-2-prisma-seed-config-prisma-7.md`
- `docs/codex/reference/phase-2-data-model-final-validation.md`
- `docs/codex/reference/phase-2-prisma-data-model-and-migration.md`

## Current observed working tree notes

- Current branch during this update: `develop` at `d746563`.
- `git status --short` before writing this index showed only:
  - `M .env.example`
- The current `.env.example` diff removes `?schema=public` from
  `POSTGRES_MCP_DATABASE_URL`; that belongs to the June 6 read-only PostgreSQL
  MCP setup, not the June 5 Phase 2 data-model work.
- This update adds `docs/codex/history/2026-06-05-context-index.md`; expect it
  to appear as untracked/modified until committed.
- Ignored local artifacts observed and not source:
  - `.env`
  - `apps/admin/.env`
  - `apps/demo/.env`
  - `node_modules/`
  - `apps/*/node_modules/`
  - `apps/*/dist/`
- Backend `start:prod` script still appears stale (`node dist/main`); fix to
  match actual build output before any production-like run.
- `apps/backend/package.json` still contains a legacy package-level Prisma seed
  stanza, but Prisma 7 seed discovery for this repo is controlled by
  `apps/backend/prisma.config.ts` under `migrations.seed`.

## Best next prompt for Codex

```text
Use AGENTS.md, docs/plan/project-goal.md, docs/plan/implementation-roadmap.md,
docs/design/mvp-api-and-contracts.md,
docs/codex/history/2026-06-05-context-index.md, and
docs/codex/reference/phase-2-prisma-data-model-and-migration.md as context.
Continue with Phase 3 backend foundation: create a NestJS Prisma module/service
using Prisma 7 with @prisma/adapter-pg, add request context/correlation IDs,
validation/error handling, repository boundaries, transaction helper, and audit
logging service. Preserve same-transaction audit writes, append-only audit logs,
environment-aware flag config semantics, safe defaults, stable non-PII rollout
keys, and control-plane/data-plane separation. Before editing, inspect git
status and do not commit ignored local env/build artifacts.
```

## Session index, compressed

- 09:43 — reviewed backend package manifests; found the stale `start:prod`
  path and Prisma seed/discovery caveats.
- 09:51-11:16 — taught Phase 2 step-by-step: Prisma dependency/script setup,
  schema target, validation setup, and migration-only workflow.
- 11:47 — created/expanded PostgreSQL local config reference for Phase 2.
- 15:45-16:19 — iterated the Prisma schema, adding environment-aware flag
  config, lifecycle/config split, audit target/action updates, and Prisma 7
  validation config fixes.
- 16:43-16:51 — merged scaffold/data-model branch work and added Prisma
  dependencies/configuration commits.
- 19:49-20:41 — generated initial migration SQL and documented migration
  creation without applying incomplete constraints.
- 21:16-21:59 — added manual SQL for one default environment and immutable
  audit logs, then documented migration application and DB verification.
- 22:11-22:37 — fixed Prisma 7 seed configuration and seed TypeScript typing;
  final validation confirmed schema, migration, seed counts, constraints,
  triggers, and backend build.
- 22:39 — merged PR #13 for `feat/data-model-migrations`; Phase 2 data model
  and migration foundation became part of `develop`.
