# Codebase Map — Feature Flag Platform

This document maps the current repository after Phase 2. It explains the
project from scratch, then shows where each file fits in the final MVP.

Use this before changing code so you know:

- what already exists,
- what is still placeholder,
- what is implemented in the database layer,
- which files are source of truth,
- which future phase should own the next change.

## 1. Current Project State

This repository is a mini feature flag management platform. Its purpose is to
demonstrate safe feature release management: deploy code once, then control
feature exposure through runtime flag configuration.

The required MVP must include:

1. research report,
2. backend REST API,
3. admin dashboard,
4. demo application,
5. PostgreSQL database,
6. validation and error handling,
7. seed data,
8. README setup/run instructions,
9. short design docs,
10. presentation-ready explanation of need, value, novelty, technology choices,
    alternatives, and competitor comparison.

The current implementation has completed:

| Phase | Status | What exists |
| --- | --- | --- |
| Phase 0 | Done | MVP contracts and API behavior docs. |
| Phase 1 | Done | Monorepo scaffold, NestJS backend, Vite admin, Vite demo, local workflow. |
| Phase 2 | Done | Prisma/PostgreSQL data model, initial migration, seed data, DB constraints. |
| Phase 3+ | Not yet implemented | Real backend APIs, validation pipeline, Prisma service, audit service, evaluation engine, admin/demo integrations. |

Current important limitation:

> The database model exists, but the NestJS app still only exposes the
> placeholder `GET /v1` route. Real management and evaluation APIs are future
> work.

## 2. Big-Picture Mental Model

Think of the repo as three apps plus a PostgreSQL-backed data foundation:

```mermaid
graph LR
  Browser[Browser]
  Admin[Admin Dashboard<br/>apps/admin]
  Demo[Demo App<br/>apps/demo]
  Backend[NestJS Backend<br/>apps/backend]
  Prisma[Prisma Schema + Client<br/>apps/backend/prisma]
  DB[(PostgreSQL<br/>ffp_dev)]

  Browser --> Admin
  Browser --> Demo
  Admin -. future control-plane REST .-> Backend
  Demo -. future data-plane evaluate .-> Backend
  Backend -. future Prisma service .-> Prisma
  Prisma --> DB
```

The critical separation:

- **Control plane** means configuration:
  - admin dashboard,
  - project management,
  - feature flag management,
  - environment-specific flag config,
  - rule management,
  - audit log viewing.
- **Data plane** means runtime evaluation:
  - demo app,
  - `POST /v1/evaluate`,
  - deterministic rule evaluation,
  - safe `enabled=false` fallbacks.

The admin app should not pretend to be the evaluator. The demo app should not
directly edit flag configuration.

## 3. Top-Level Repository Map

```text
.
├── AGENTS.md
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.base.json
├── .env.example
├── .gitignore
├── apps/
│   ├── backend/
│   ├── admin/
│   └── demo/
├── docs/
│   ├── requirement/
│   ├── plan/
│   ├── design/
│   ├── research/
│   ├── competitor-analysis/
│   ├── codex/
│   └── learning/
└── node_modules/
```

### 3.1 `AGENTS.md`

This is the repository guardrail source.

Important rules:

- Use NestJS, Prisma, PostgreSQL, REST/Swagger, Jest, and in-memory cache for
  MVP.
- Keep management/control-plane concerns separate from evaluation/data-plane
  concerns.
- Evaluation responses must include `enabled`, `reason`, `projectKey`, and
  `flagKey`.
- Missing project/flag must return `enabled=false` and `reason=NOT_FOUND`.
- Percentage rollout must be deterministic and use stable non-PII keys.
- Project, flag, and rule mutations must write append-only audit logs in the
  same transaction.
- Feature flag status/config labels are distinct from runtime On/Off state.

### 3.2 `README.md`

This is the human onboarding entrypoint.

It currently explains:

- project purpose,
- delivery criteria,
- MVP guardrails,
- local prerequisites,
- PostgreSQL Docker startup,
- app run commands,
- validation commands.

Because Phase 2 has added Prisma and seed commands, README should eventually be
expanded with migration/seed instructions during release-readiness work.

### 3.3 Root `package.json`

The root package defines the npm workspace:

```json
{
  "workspaces": ["apps/*"]
}
```

Root scripts:

```bash
npm run dev:backend
npm run dev:admin
npm run dev:demo
npm run build
npm run lint
npm run test
npm run diff:check
```

Meaning:

- The root controls all app workspaces.
- Install dependencies from the root.
- Keep one root `package-lock.json`.
- Do not install dependencies independently inside apps unless intentionally
  using npm workspace flags.

### 3.4 `tsconfig.base.json`

Shared TypeScript configuration for strictness and consistency.

Current purpose:

- frontend app TS configs extend it,
- it keeps strict TypeScript behavior consistent,
- future shared packages should also align with it.

### 3.5 `.env.example`

This documents local environment values.

Important app variables:

```text
DATABASE_URL=postgresql://ffp:ffp_dev_password@localhost:5432/ffp_dev?schema=public
API_PORT=3000
ADMIN_ORIGIN=http://localhost:5173
DEMO_ORIGIN=http://localhost:5174
VITE_API_BASE_URL=http://localhost:3000/v1
VITE_DEFAULT_PROJECT_KEY=demo-project
VITE_DEFAULT_FLAG_KEY=new-checkout
```

Rules:

- commit `.env.example`,
- do not commit real `.env`,
- never put secrets in `VITE_*` variables because frontend builds expose them
  to the browser.

## 4. Application Map

### 4.1 Backend — `apps/backend`

Purpose:

> The backend is the single NestJS service that will host both management APIs
> and evaluation APIs.

Current structure:

```text
apps/backend/
├── package.json
├── prisma.config.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│       ├── migration_lock.toml
│       └── 20260605133630_init_data_model/
│           └── migration.sql
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── app.controller.spec.ts
└── test/
    ├── app.e2e-spec.ts
    └── jest-e2e.json
```

#### 4.1.1 Backend runtime entrypoint

File:

```text
apps/backend/src/main.ts
```

Current responsibilities:

1. Create Nest app from `AppModule`.
2. Set global API prefix to `/v1`.
3. Enable CORS for `ADMIN_ORIGIN` and `DEMO_ORIGIN`.
4. Read `API_PORT`, defaulting to `3000`.
5. Start the server.
6. Log startup failures.

Current API check:

```bash
curl http://localhost:3000/v1
```

Current response:

```text
Hello World!
```

That response is only a scaffold health check.

#### 4.1.2 Backend root module

File:

```text
apps/backend/src/app.module.ts
```

Current responsibilities:

- load `.env` using `@nestjs/config`,
- make configuration global,
- register placeholder controller/service.

Future Phase 3 work should add:

- Prisma module/service,
- validation pipeline,
- error handling,
- request/correlation ID support,
- transaction helper,
- audit logging service,
- repository/data-access boundaries.

#### 4.1.3 Backend app placeholder files

Files:

```text
apps/backend/src/app.controller.ts
apps/backend/src/app.service.ts
apps/backend/src/app.controller.spec.ts
```

Current purpose:

- prove NestJS app compiles,
- expose placeholder `GET /v1`,
- provide starter unit test.

These are not yet the real feature flag API.

#### 4.1.4 Backend package scripts

Backend workspace scripts now include both NestJS and Prisma commands:

```bash
npm run build --workspace=@ffp/backend
npm run test --workspace=@ffp/backend
npm run test:e2e --workspace=@ffp/backend
npm run lint --workspace=@ffp/backend
npm run prisma:validate --workspace=@ffp/backend
npm run prisma:generate --workspace=@ffp/backend
npm run prisma:migrate --workspace=@ffp/backend
npm run prisma:studio --workspace=@ffp/backend
npm run db:seed --workspace=@ffp/backend
```

Use:

- `prisma:validate` after editing `schema.prisma`,
- `prisma:generate` after schema changes,
- `prisma:migrate` for local development migrations,
- `db:seed` to load demo data,
- `prisma:studio` to inspect local data.

### 4.2 Backend Prisma Layer — `apps/backend/prisma`

Purpose:

> The Prisma layer defines the PostgreSQL schema, migrations, and seed data.

This is the most important Phase 2 addition.

#### 4.2.1 Prisma config

File:

```text
apps/backend/prisma.config.ts
```

Current responsibilities:

- load root `.env`,
- load backend `.env` with override support,
- require `DATABASE_URL`,
- point Prisma to `prisma/schema.prisma`,
- point Prisma to `prisma/migrations`,
- configure seed command as `tsx prisma/seed.ts`,
- pass datasource URL to Prisma.

Important Prisma 7 detail:

> `schema.prisma` only declares `provider = "postgresql"`. The database URL is
> supplied through `prisma.config.ts`.

#### 4.2.2 Prisma schema

File:

```text
apps/backend/prisma/schema.prisma
```

Main models:

```text
Project
Environment
FeatureFlag
FlagEnvironmentConfig
FlagRule
SampleUserContext
AuditLogEntry
```

Main enums:

```text
FeatureFlagLifecycleStatus
FlagConfigStatus
ServingMode
RuleType
AuditTargetType
AuditAction
```

High-level meaning:

- `Project` owns the platform workspace.
- `Environment` scopes runtime config to production/staging/development.
- `FeatureFlag` stores stable flag identity and lifecycle.
- `FlagEnvironmentConfig` stores per-environment runtime behavior.
- `FlagRule` stores ordered targeting/rollout rules.
- `SampleUserContext` stores non-PII demo contexts.
- `AuditLogEntry` stores append-only configuration history.

#### 4.2.3 Initial migration

File:

```text
apps/backend/prisma/migrations/20260605133630_init_data_model/migration.sql
```

This migration creates:

- PostgreSQL enum types,
- all Phase 2 tables,
- primary keys,
- unique indexes,
- query indexes,
- foreign keys,
- manual default-environment uniqueness constraint,
- manual append-only audit triggers.

Manual constraints are especially important:

```text
environments_one_default_per_project
audit_log_entries_no_update
audit_log_entries_no_delete
```

#### 4.2.4 Seed script

File:

```text
apps/backend/prisma/seed.ts
```

The seed script creates demo data:

| Data | Values |
| --- | --- |
| Project | `demo-project` |
| Environments | `production`, `staging`, `development` |
| Flags | `beta-dashboard`, `new-checkout` |
| Rules | allowlist, role targeting, percentage rollout |
| Users | `demo-user-beta`, `demo-user-regular`, `demo-user-admin` |
| Audit actor | `system` |
| Audit source | `seed` |

It uses `upsert` so it can be run repeatedly without duplicating core demo
data.

### 4.3 Admin App — `apps/admin`

Purpose:

> The admin app is the future control-plane dashboard.

Current structure:

```text
apps/admin/
├── package.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.css
│   └── index.css
└── public/
```

Current screen:

- title: Admin Dashboard,
- API base URL,
- default project key,
- reminder that runtime state is not evaluated in the admin scaffold.

Future screens:

```text
Project list
Feature flag list
Create/edit feature flag
Rule configuration
Audit log
```

Future API clients should call management/control-plane endpoints only.

Important UI semantic rule:

> `Enabled`, `Disabled`, and `Archived` are configuration/lifecycle labels.
> `On` and `Off` are runtime evaluation results.

### 4.4 Demo App — `apps/demo`

Purpose:

> The demo app is the future data-plane client that calls evaluation and shows
> runtime feature behavior.

Current structure:

```text
apps/demo/
├── package.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.css
│   └── index.css
└── public/
```

Current screen:

- title: Demo Application,
- evaluation API URL,
- project key,
- flag key,
- reminder that runtime state is not evaluated in Phase 1/2.

Future behavior:

1. Select sample context.
2. Send `POST /v1/evaluate`.
3. Display `projectKey`, `flagKey`, `enabled`, `variant`, `reason`, and
   `matchedRuleId`.
4. Show/hide demo feature based on `enabled`.
5. Demonstrate global-on, role targeting, percentage rollout, and `NOT_FOUND`.

## 5. Current Data Model Map

Phase 2 made the data model environment-aware.

```mermaid
erDiagram
  PROJECT ||--o{ ENVIRONMENT : has
  PROJECT ||--o{ FEATURE_FLAG : owns
  PROJECT ||--o{ FLAG_ENVIRONMENT_CONFIG : scopes
  PROJECT ||--o{ SAMPLE_USER_CONTEXT : has
  PROJECT ||--o{ AUDIT_LOG_ENTRY : records

  ENVIRONMENT ||--o{ FLAG_ENVIRONMENT_CONFIG : configures
  FEATURE_FLAG ||--o{ FLAG_ENVIRONMENT_CONFIG : has
  FLAG_ENVIRONMENT_CONFIG ||--o{ FLAG_RULE : has
  ENVIRONMENT ||--o{ AUDIT_LOG_ENTRY : contextualizes
```

### 5.1 Why `FeatureFlag` and `FlagEnvironmentConfig` are separate

`FeatureFlag` answers:

```text
What is this flag?
```

Examples:

- key,
- name,
- description,
- lifecycle status,
- archived timestamp.

`FlagEnvironmentConfig` answers:

```text
How does this flag behave in this environment?
```

Examples:

- enabled/disabled config status,
- global-on versus targeted serving mode,
- kill switch,
- rules.

This avoids accidental production changes when experimenting in staging or
development.

### 5.2 Table purpose summary

| Table | Purpose |
| --- | --- |
| `projects` | Top-level container for all feature flag data. |
| `environments` | Environment scope such as production/staging/development. |
| `feature_flags` | Stable flag identity and lifecycle. |
| `flag_environment_configs` | Runtime config for one flag in one environment. |
| `flag_rules` | Ordered targeting/rollout rules for one config. |
| `sample_user_contexts` | Demo contexts using stable non-PII targeting keys. |
| `audit_log_entries` | Append-only record of configuration changes. |

### 5.3 Important constraints

| Constraint | Why it matters |
| --- | --- |
| `Project.key` unique | Project lookup by key is deterministic. |
| `Environment(projectId, key)` unique | Environment keys are stable per project. |
| one default environment per project | Evaluation can safely default when needed. |
| `FeatureFlag(projectId, key)` unique | Flag keys are unique inside a project. |
| `FlagEnvironmentConfig(flagId, environmentId)` unique | One config per flag/environment pair. |
| `FlagRule(flagConfigId, priority)` unique | Rule order is stable and unambiguous. |
| `SampleUserContext(projectId, targetingKey)` unique | Demo rollout keys are stable per project. |
| audit update/delete triggers | Audit history is append-only at DB level. |

### 5.4 Delete behavior

| Relationship | Behavior |
| --- | --- |
| Project -> Environment | Cascade |
| Project -> FeatureFlag | Restrict |
| Project -> FlagEnvironmentConfig | Restrict |
| Project -> AuditLogEntry | Restrict |
| FeatureFlag -> FlagEnvironmentConfig | Cascade |
| Environment -> FlagEnvironmentConfig | Restrict |
| FlagEnvironmentConfig -> FlagRule | Cascade |
| Environment -> AuditLogEntry | Set null |

Future APIs should still use explicit, audited mutations instead of relying on
blind cascades.

## 6. Seed Data Map

After running:

```bash
npm run db:seed --workspace=@ffp/backend
```

Expected demo data:

```text
Project:
  demo-project

Environments:
  production
  staging
  development

Flags:
  beta-dashboard
  new-checkout

Sample users:
  demo-user-beta
  demo-user-regular
  demo-user-admin
```

Production rules for `new-checkout`:

| Priority | Type | Meaning |
| ---: | --- | --- |
| 10 | `USER_ALLOWLIST` | Enables `demo-user-admin`. |
| 20 | `ROLE_TARGETING` | Enables users with `beta-tester`. |
| 30 | `PERCENTAGE_ROLLOUT` | Enables 50% by deterministic targeting key. |

Seed audit entries:

- actor: `system`,
- request ID: `seed_init`,
- source: `seed`,
- purpose: prove audit storage and demo traceability.

## 7. Documentation Map

The repository is documentation-heavy because the final presentation must
explain both implementation and engineering decisions.

```text
docs/
├── requirement/
├── plan/
├── design/
├── research/
├── competitor-analysis/
├── codex/
└── learning/
```

### 7.1 `docs/requirement/`

Product source and evaluation criteria:

- `requirement-init.md`
- `info-init.md`
- `feature-flag-research.md`
- `use-case-specification.md`
- backend/frontend/demo requirement files

Use this folder to answer:

> What must this project deliver?

### 7.2 `docs/plan/`

Planning and sequencing:

- `project-goal.md`
- `implementation-roadmap.md`
- `project-plan.md`
- `vision.md`

Use this folder to answer:

> What should be built next?

### 7.3 `docs/design/`

Architecture and API behavior:

- `software-architecture-document.md`
- `mvp-api-and-contracts.md`

Use this folder to answer:

> How should the system behave?

Important note:

> Phase 2 added environment-aware config. Before implementing APIs, the API
> contract should be reviewed/updated for `environmentKey` behavior or default
> environment behavior.

### 7.4 `docs/research/`

Research support:

- feature flags,
- rollout strategies,
- kill switches,
- audit logs,
- key considerations,
- API design.

Use this folder to answer:

> Why is this approach credible?

### 7.5 `docs/competitor-analysis/`

Competitor context:

- LaunchDarkly,
- Unleash,
- Flagsmith,
- ConfigCat,
- Split.

Use this folder to answer:

> How does this mini platform compare with existing solutions?

### 7.6 `docs/codex/`

Reusable Codex context:

- history indexes,
- task template,
- reference summaries,
- MCP/tooling notes.

High-value Phase 2 references:

```text
docs/codex/reference/phase-2-prisma-data-model-and-migration.md
docs/codex/reference/phase-2-data-model-final-validation.md
docs/codex/reference/phase-2-apply-migration-verify-db-constraints.md
docs/codex/reference/phase-2-prisma-seed-config-prisma-7.md
```

### 7.7 `docs/learning/`

Personal learning guides:

```text
docs/learning/codebase-map.md
docs/learning/local-dev-workflow.md
docs/learning/data-model-and-migrations.md
docs/learning/data-model-migration-keywords.md
```

Use these to relearn the repository without reading raw session transcripts.

## 8. Local Runtime and Commands

### 8.1 Local URLs and ports

| Piece | URL / value |
| --- | --- |
| Backend API | `http://localhost:3000/v1` |
| Admin app | `http://localhost:5173` |
| Demo app | `http://localhost:5174` |
| PostgreSQL | `localhost:5432` |
| Database | `ffp_dev` |

### 8.2 Start local PostgreSQL

```bash
docker start ffp-postgres
```

If the container does not exist, create it using the README Docker command.

Verify:

```bash
docker exec ffp-postgres psql -U ffp -d ffp_dev -c "select current_database(), current_user;"
```

### 8.3 Run apps

Use separate terminals:

```bash
npm run dev:backend
npm run dev:admin
npm run dev:demo
```

### 8.4 Prisma workflow

```bash
npm run prisma:validate --workspace=@ffp/backend
npm run prisma:generate --workspace=@ffp/backend
npm run prisma:migrate --workspace=@ffp/backend
npm run db:seed --workspace=@ffp/backend
```

### 8.5 Validation workflow

```bash
npm run build
npm run test
npm run lint
npm run diff:check
```

If available:

```bash
markdownlint docs/**/*.md README.md AGENTS.md
```

## 9. Request Flow Map

### 9.1 Current implemented HTTP flow

```mermaid
sequenceDiagram
  participant Client
  participant Backend

  Client->>Backend: GET /v1
  Backend-->>Client: Hello World!
```

This only proves that the NestJS backend starts.

### 9.2 Future control-plane mutation flow

Example: update flag config or replace rules.

```mermaid
sequenceDiagram
  participant Admin as Admin Dashboard
  participant API as Management API
  participant DB as PostgreSQL

  Admin->>API: Mutate project/flag/config/rules
  API->>API: Validate DTO, actor, request ID
  API->>DB: Begin transaction
  API->>DB: Read before snapshot
  API->>DB: Write mutation
  API->>DB: Insert audit log entry
  API->>DB: Commit transaction
  API-->>Admin: Updated resource
```

Non-negotiable:

> Mutation and audit entry must be in the same transaction.

### 9.3 Future environment-aware evaluation flow

```mermaid
sequenceDiagram
  participant Demo as Demo App
  participant Eval as Evaluation API
  participant DB as PostgreSQL
  participant Engine as Rule Engine

  Demo->>Eval: POST /v1/evaluate
  Eval->>Eval: Validate projectKey, flagKey, context
  Eval->>DB: Load project
  Eval->>DB: Load environment or default environment
  Eval->>DB: Load flag
  Eval->>DB: Load flag environment config
  Eval->>DB: Load ordered rules
  Eval->>Engine: Evaluate deterministically
  Engine-->>Eval: enabled, variant, reason, matchedRuleId
  Eval-->>Demo: Evaluation result
```

Expected rule order with Phase 2 environment config:

1. Missing project/environment/flag/config -> `NOT_FOUND`.
2. Archived flag -> `FLAG_ARCHIVED`.
3. Config kill switch -> `KILL_SWITCH`.
4. Config disabled -> `FLAG_DISABLED`.
5. Config serving mode `GLOBAL_ON` -> `GLOBAL_ON`.
6. User allowlist rule.
7. Role targeting rule.
8. Percentage rollout rule.
9. Default off -> `DEFAULT_OFF`.

## 10. Files to Study First

### Step 1 — Root and guardrails

Read:

```text
AGENTS.md
README.md
package.json
.env.example
tsconfig.base.json
```

Goal:

> Understand project rules, workspace scripts, local env, and app boundaries.

### Step 2 — Current backend scaffold

Read:

```text
apps/backend/src/main.ts
apps/backend/src/app.module.ts
apps/backend/src/app.controller.ts
apps/backend/src/app.service.ts
apps/backend/package.json
```

Goal:

> Understand NestJS startup, `/v1` prefix, CORS, and current placeholder API.

### Step 3 — Prisma and data model

Read:

```text
apps/backend/prisma.config.ts
apps/backend/prisma/schema.prisma
apps/backend/prisma/migrations/20260605133630_init_data_model/migration.sql
apps/backend/prisma/seed.ts
```

Goal:

> Understand Phase 2 database design, constraints, migration, and demo data.

### Step 4 — Admin app

Read:

```text
apps/admin/src/main.tsx
apps/admin/src/App.tsx
apps/admin/src/App.css
apps/admin/package.json
apps/admin/vite.config.ts
```

Goal:

> Understand the control-plane UI placeholder.

### Step 5 — Demo app

Read:

```text
apps/demo/src/main.tsx
apps/demo/src/App.tsx
apps/demo/src/App.css
apps/demo/package.json
apps/demo/vite.config.ts
```

Goal:

> Understand the data-plane demo placeholder.

### Step 6 — Contracts and roadmap

Read:

```text
docs/plan/project-goal.md
docs/plan/implementation-roadmap.md
docs/design/software-architecture-document.md
docs/design/mvp-api-and-contracts.md
```

Goal:

> Understand what still needs to be implemented and what behavior is required.

## 11. Generated and Local Files to Ignore First

Do not study these first:

```text
node_modules/
apps/*/node_modules/
apps/*/dist/
apps/*/coverage/
.env
apps/*/.env
```

Why:

- dependencies are generated,
- build output is generated,
- local env may contain sensitive values,
- source of truth is in code, docs, schema, migration, and seed files.

## 12. Learn / Relearn / Unlearn

### 12.1 Learn

- Learn the npm workspace structure.
- Learn the difference between backend/admin/demo apps.
- Learn how NestJS starts and why `/v1` is global.
- Learn how Vite apps read `VITE_*` variables.
- Learn Prisma schema vs migration SQL.
- Learn why `FeatureFlag` and `FlagEnvironmentConfig` are separate.
- Learn why audit logs are append-only at the database level.

### 12.2 Relearn

Rebuild from a clean mental model:

```text
root workspace
-> backend NestJS app
-> Prisma schema and migrations
-> PostgreSQL tables
-> seed data
-> future backend APIs
-> admin config UI
-> demo evaluation UI
```

Then explain:

```text
Admin configures data.
Database persists data.
Audit logs record changes.
Demo asks for runtime decision.
Evaluation returns deterministic On/Off result.
```

### 12.3 Unlearn

| Wrong assumption | Correct understanding |
| --- | --- |
| The project is only a frontend/backend scaffold | Phase 2 database model, migration, seed, and constraints now exist. |
| Prisma is already wired into NestJS services | Prisma exists, but NestJS Prisma service/repositories are Phase 3 work. |
| Flags directly own all runtime behavior | Environment-specific runtime behavior lives in `FlagEnvironmentConfig`. |
| `ENABLED` always means user sees the feature | Rules can still return runtime Off. |
| Audit logs are just normal editable rows | Database triggers reject audit updates/deletes. |
| Seed data is random throwaway data | Seed data is deterministic demo setup. |
| Percentage rollout can be random | It must use stable hashing later. |
| Emails are good rollout keys | Use stable non-PII targeting keys. |
| Docker means the whole app is containerized | Currently Docker is used for PostgreSQL only. |

## 13. Before You Modify Code

Ask:

1. Is this control-plane, data-plane, persistence, UI, docs, or tooling?
2. Does this belong to the current roadmap phase?
3. Does it preserve safe default-off behavior?
4. Does it preserve deterministic evaluation?
5. Does it preserve stable non-PII targeting keys?
6. If it mutates config, where is the audit entry written?
7. If it touches audit entries, does append-only behavior remain intact?
8. If it changes schema, is a migration needed?
9. If it changes seed/demo behavior, is the presentation scenario still clear?
10. Does README or a learning doc need an update?

## 14. What To Build Next

According to `docs/plan/implementation-roadmap.md`, after Phase 2 the next
major phase is **Phase 3 — Backend foundation**.

Expected Phase 3 work:

1. validation pipeline and DTO boundaries,
2. consistent error responses,
3. Swagger/OpenAPI setup,
4. Prisma module/service using the Prisma 7 PostgreSQL adapter,
5. repository/data-access layer,
6. transaction helper,
7. audit logging service,
8. request ID / correlation context.

Do not jump directly to full UI or evaluation if the backend foundation is not
ready. The correct progression is:

```text
Data model
-> backend foundation
-> evaluation engine/API
-> management APIs with audit
-> vertical slice
-> admin UI
-> demo app
-> release readiness
```

## 15. One-Sentence Summary

This codebase is now a Phase 2 feature flag platform foundation: a root npm
workspace with NestJS backend, Vite admin app, Vite demo app, Prisma 7
PostgreSQL schema, initial migration, deterministic demo seed data, and
database-level audit immutability constraints, ready for Phase 3 backend
foundation work.
