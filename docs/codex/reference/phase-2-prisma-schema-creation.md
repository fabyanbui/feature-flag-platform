# Phase 2 Prisma Schema Creation — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a reference, not a transcript.

## Scope

This reference covers only the Phase 2 `schema.prisma` creation/design step for the Feature Flag Platform backend.

It summarizes the schema decisions made while creating `apps/backend/prisma/schema.prisma` after Phase 1 setup and before migrations, seed data, or backend services are implemented.

## High-signal outcomes

- The Phase 2 schema was upgraded from a minimal project/flag/rule model to an environment-aware model inspired by competitor platforms.
- The final domain shape is:

  ```text
  Project
    ├── Environment
    ├── FeatureFlag
    ├── SampleUserContext
    └── AuditLogEntry

  FeatureFlag
    └── FlagEnvironmentConfig
          └── FlagRule
  ```

- `FeatureFlag` is now the stable project-level flag definition.
- `Environment` represents project-scoped runtime environments such as `production`, `staging`, and `development`.
- `FlagEnvironmentConfig` stores environment-specific flag behavior: enabled/disabled status, serving mode, kill switch, and ordered rules.
- `FlagRule` belongs to `FlagEnvironmentConfig`, not directly to `FeatureFlag`, so rules can differ by environment.
- `SampleUserContext` remains project-scoped because demo users are reusable non-PII evaluation contexts across environments.
- `AuditLogEntry` supports optional environment scope and includes config-specific target/action enums.
- The schema uses Prisma 7-compatible datasource syntax: `datasource db { provider = "postgresql" }`; connection URL handling is expected in `prisma.config.ts`, not `schema.prisma`.

## Files and artifacts

- Created/updated authoritative schema file:
  - `apps/backend/prisma/schema.prisma`

- Important schema models:
  - `Project`
  - `Environment`
  - `FeatureFlag`
  - `FlagEnvironmentConfig`
  - `FlagRule`
  - `SampleUserContext`
  - `AuditLogEntry`

- Important enums:
  - `FeatureFlagLifecycleStatus` with `ACTIVE`, `ARCHIVED`
  - `FlagConfigStatus` with `ENABLED`, `DISABLED`
  - `ServingMode` with `GLOBAL_ON`, `TARGETED`
  - `RuleType` with `USER_ALLOWLIST`, `ROLE_TARGETING`, `PERCENTAGE_ROLLOUT`
  - `AuditTargetType` including `FLAG_CONFIG`
  - `AuditAction` including `FLAG_CONFIG_CREATED`, `FLAG_CONFIG_UPDATED`, and `FLAG_CONFIG_DELETED`

## Decisions and guardrails

- Add environments now because Phase 2 is the safest time to introduce foundational data modeling. Keep environment behavior MVP-safe by defaulting later APIs to `production` unless an environment selector is explicitly added.
- Do not model `Project -> Environment -> FeatureFlag` as ownership. Instead, both environments and feature flags belong to a project; `FlagEnvironmentConfig` joins one flag to one environment.
- Move archive semantics to `FeatureFlag`:
  - `FeatureFlag.lifecycleStatus = ACTIVE | ARCHIVED`
  - `FeatureFlag.archivedAt` stores archive time.
- Keep environment-specific enabled/disabled state in `FlagEnvironmentConfig.status`:
  - `ENABLED | DISABLED`
- Runtime evaluation remains distinct from status labels:
  - status/config fields describe management configuration
  - future evaluation responses still return runtime `enabled=true|false`
- `FlagEnvironmentConfig` includes `projectId` and composite relations to `FeatureFlag` and `Environment` to prevent cross-project config links.
- Audit model was extended for environment-aware config mutations:
  - use `FLAG_CONFIG` for changes to environment-specific flag config
  - use `FEATURE_FLAG` for flag definition/lifecycle changes
  - use `FLAG_RULES_REPLACED` against the relevant config/rule scope when ordered rules are replaced
- Preserve repository guardrails:
  - deterministic evaluation remains required later
  - append-only audit logging remains required later
  - stable non-PII rollout keys remain required for sample users and percentage rollout
  - safe defaults should favor disabled/off behavior
  - control-plane configuration remains separate from data-plane evaluation

## Validation and caveats

- The final proposed schema was locally checked with Prisma validation syntax using Prisma 7-compatible datasource style.
- Migrations were not created in this step.
- Seed data was not created in this step.
- Backend services/controllers were not created in this step.
- Because Prisma does not express all needed PostgreSQL constraints directly, the initial migration should later add manual SQL for:
  - exactly one default environment per project:

    ```sql
    CREATE UNIQUE INDEX environments_one_default_per_project
    ON "environments" ("project_id")
    WHERE "is_default" = true;
    ```

  - append-only audit log behavior via update/delete prevention triggers on `audit_log_entries`.

- Key format validation for `projectKey`, `environmentKey`, and `flagKey` should still be enforced in DTO/service validation later. PostgreSQL check constraints may be added in migration SQL if desired.
- The environment-aware schema slightly expands the original MVP. To avoid over-engineering, do not add SDK keys, segments, approval workflows, environment RBAC, promotion pipelines, or rule versioning before the required MVP is demo-ready.
- The API/design docs may need a small follow-up update because `docs/design/mvp-api-and-contracts.md` currently predates the environment-aware schema and does not yet freeze an `environmentKey` request field.

## Best reusable next prompt

Continue Phase 2 from the environment-aware Prisma schema. Validate `apps/backend/prisma/schema.prisma`, add the Prisma 7 `prisma.config.ts` if required, then create the initial migration with manual PostgreSQL SQL for one default environment per project and append-only audit log triggers. Keep the MVP guardrails: deterministic evaluation, safe defaults, non-PII rollout keys, transactionally written audit entries, and clear control-plane/data-plane separation.

## Source notes

- Source conversation: current Codex session, limited to the schema creation/design step.
- Project guardrails source: `AGENTS.md`.
- Active roadmap source: `docs/plan/implementation-roadmap.md`, Phase 2 — Data model and migrations.
- Product requirement source: `docs/requirement/requirement-init.md`.
- Submission/evaluation source: `docs/requirement/info-init.md`.
- API contract baseline: `docs/design/mvp-api-and-contracts.md`.
- Architecture baseline: `docs/design/software-architecture-document.md`.
