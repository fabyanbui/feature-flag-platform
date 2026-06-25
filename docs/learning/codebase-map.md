# Codebase Map — Feature Flag Platform

> **Phase 16 update:** Older walkthrough sections may describe the removed
> `ActorRequiredGuard` and trusted `X-Actor` flow. The active implementation is
> under `apps/backend/src/auth/`.

This document maps the repository after **Phase 4** and **Phase 5** of
`docs/plan/implementation-roadmap.md`. It explains the project from scratch,
then shows where the current implementation lives.

Use this guide when you need to answer:

- What does this codebase do now?
- Which folders belong to the backend, admin dashboard, demo app, database, or
  documentation?
- Which APIs are already implemented?
- Where does deterministic evaluation happen?
- Where do control-plane mutations and audit logs happen?
- What should be built next?

## 1. Current Project State

This repository is a mini feature flag management platform. The platform helps
show one important software-release idea:

> Deploy code once, then control who can see a feature through runtime flag
> configuration.

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

Current roadmap state:

| Phase | Status | Current result |
| --- | --- | --- |
| Phase 0 | Done | MVP contracts, reason codes, API conventions, audit shape. |
| Phase 1 | Done | npm workspace, NestJS backend, Vite admin, Vite demo, local workflow. |
| Phase 2 | Done | Prisma/PostgreSQL model, migration, seed data, DB constraints. |
| Phase 3 | Done | Validation pipe, error filter, Swagger, Prisma service, repositories, transaction helper, request context, audit service. |
| Phase 4 | Done | Evaluation engine, stable rollout hashing, `POST /v1/evaluate`, unit tests. |
| Phase 5 | Done | Management APIs, sample users API, audit logs API, same-transaction audit writes, e2e tests. |
| Phase 6+ | Next | Vertical slice, admin UI, demo app integration, quality/release readiness. |

Important current limitation:

> The backend APIs and database are implemented, but the admin and demo Vite
> apps are still mostly scaffold UIs. The next major learning/building step is
> wiring a vertical slice from UI to API to database.

## 2. Big-Picture Mental Model

Think of the repo as three apps plus one PostgreSQL-backed backend system:

```mermaid
graph LR
  Browser[Browser]
  Admin[Admin Dashboard<br/>apps/admin]
  Demo[Demo App<br/>apps/demo]
  Backend[NestJS Backend<br/>apps/backend]
  Control[Control-Plane APIs<br/>projects, flags, rules, sample users, audit logs]
  Data[Data-Plane API<br/>POST /v1/evaluate]
  Engine[Evaluation Engine<br/>deterministic rules]
  Prisma[Prisma Client + Repositories]
  DB[(PostgreSQL)]

  Browser --> Admin
  Browser --> Demo
  Admin --> Control
  Demo --> Data
  Control --> Prisma
  Data --> Prisma
  Data --> Engine
  Prisma --> DB
```

The most important separation is:

| Plane | Meaning | Main client | Current backend modules |
| --- | --- | --- | --- |
| Control plane | Configuration and administration | Admin dashboard | `projects`, `feature-flags`, `flag-rules`, `sample-users`, `audit-logs` |
| Data plane | Runtime flag decision | Demo app / application code | `evaluation` |

Control plane answers:

```text
What projects, flags, rules, users, and audit history exist?
```

Data plane answers:

```text
For this project, flag, environment, and runtime context, is the feature on?
```

The admin dashboard should not directly evaluate flags. The demo app should not
edit configuration.

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
└── docs/
    ├── requirement/
    ├── plan/
    ├── design/
    ├── research/
    ├── competitor-analysis/
    ├── codex/
    └── learning/
```

### 3.1 `AGENTS.md`

This is the repository guardrail source for Codex and future contributors.

High-value guardrails:

- Use NestJS, Prisma, PostgreSQL, REST/Swagger, Jest, and an in-memory cache for
  the MVP stack.
- Keep control-plane and data-plane concerns separate.
- Evaluation responses must include `enabled`, `reason`, `projectKey`, and
  `flagKey`.
- Missing project or flag must return `enabled=false` and `reason=NOT_FOUND`.
- Percentage rollout must be deterministic using a stable non-PII rollout key.
- Project, flag, and rule mutations must write append-only audit entries in the
  same transaction.
- Feature flag lifecycle/config labels are not the same as runtime On/Off.

### 3.2 `README.md`

This is the human onboarding entrypoint.

It explains:

- project purpose,
- delivery criteria,
- MVP guardrails,
- prerequisites,
- PostgreSQL Docker startup,
- workspace run commands,
- validation commands.

Note for future release-readiness work:

> The README should be refreshed before submission so it reflects Phase 2-5
> migration, seed, API, and test workflows, not only the early scaffold.

### 3.3 Root `package.json`

The root package is an npm workspace controller:

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

- Install dependencies from the root with `npm install`.
- Keep one root `package-lock.json`.
- Use workspace scripts instead of entering each app manually.

### 3.4 `tsconfig.base.json`

This is the shared TypeScript baseline. Frontend app configs extend it, and
future shared packages should align with it.

### 3.5 `.env.example`

This documents local environment variables.

Important values:

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

- Commit `.env.example`.
- Do not commit real `.env` files.
- Do not put secrets in `VITE_*` variables because Vite exposes them to the
  browser bundle.

## 4. Backend Map — `apps/backend`

Purpose:

> The backend is the single NestJS service that hosts both management APIs and
> runtime evaluation APIs.

Current high-level structure:

```text
apps/backend/
├── package.json
├── prisma.config.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── common/
│   ├── database/
│   ├── repositories/
│   ├── audit/
│   ├── evaluation/
│   ├── projects/
│   ├── feature-flags/
│   ├── flag-rules/
│   ├── sample-users/
│   └── audit-logs/
└── test/
    ├── app.e2e-spec.ts
    ├── create-e2e-app.ts
    ├── database-test-utils.ts
    ├── jest-e2e.json
    └── phase-5-management.e2e-spec.ts
```

### 4.1 Backend startup — `src/main.ts`

`apps/backend/src/main.ts` is the runtime entrypoint.

It currently does all important application-wide setup:

1. Creates the Nest app from `AppModule`.
2. Installs `RequestContextMiddleware`.
3. Sets global API prefix to `/v1`.
4. Installs a global `ValidationPipe`.
5. Converts validation failures into the shared error shape.
6. Installs `ApiExceptionFilter` for consistent error responses.
7. Builds Swagger/OpenAPI docs.
8. Enables CORS for `ADMIN_ORIGIN` and `DEMO_ORIGIN`.
9. Reads `API_PORT`, defaulting to `3000`.
10. Starts the HTTP server.

Important local URLs:

```text
API root:      http://localhost:3000/v1
Swagger UI:    http://localhost:3000/docs
Swagger JSON:  http://localhost:3000/docs/json
```

### 4.2 Backend root module — `src/app.module.ts`

`AppModule` is the composition root.

Current imports:

```text
ConfigModule
CommonModule
DatabaseModule
AuditModule
RepositoriesModule
EvaluationModule
ProjectsModule
FeatureFlagsModule
FlagRulesModule
SampleUsersModule
AuditLogsModule
```

Mental model:

```text
AppModule
-> common app infrastructure
-> database and transaction infrastructure
-> audit writer
-> repository/data-access layer
-> data-plane evaluation module
-> control-plane management modules
```

The old scaffold `AppController` and `AppService` still exist as a small health
or root placeholder, but the real product APIs now live in feature modules.

## 5. Backend Infrastructure Modules

Phase 3 created the backend foundation that Phase 4 and Phase 5 depend on.

### 5.1 `common/`

Purpose:

> Shared API behavior, request context, validation-related DTOs, error helpers,
> middleware, guards, and utilities.

Important files:

```text
common/constants/api.constants.ts
common/dto/key-param.dto.ts
common/dto/page-response.dto.ts
common/dto/pagination-query.dto.ts
common/errors/api-error-code.ts
common/errors/api-error-response.ts
common/errors/api-exception.helpers.ts
common/filters/api-exception.filter.ts
common/guards/actor-required.guard.ts
common/middleware/request-context.middleware.ts
common/request-context/request-context.service.ts
common/utils/audit-snapshot.util.ts
```

Key concepts:

| File | What to learn |
| --- | --- |
| `api.constants.ts` | `/v1`, Swagger path, key regex, request headers. |
| `key-param.dto.ts` | Validates `projectKey` and `flagKey` route params. |
| `pagination-query.dto.ts` | Standard `limit`, `offset`, `sort`, `order`. |
| `page-response.dto.ts` | Standard `{ items, page }` response wrapper. |
| `api-exception.filter.ts` | Converts thrown errors into consistent API errors. |
| `actor-required.guard.ts` | Requires `X-Actor` for audited mutations. |
| `request-context.middleware.ts` | Reads or creates `X-Request-Id`; reads `X-Actor`. |
| `request-context.service.ts` | Stores request ID and actor with `AsyncLocalStorage`. |
| `audit-snapshot.util.ts` | Normalizes before/after snapshots for JSON storage. |

### 5.2 Request ID and actor model

Two headers matter for Phase 5:

| Header | Required? | Purpose |
| --- | --- | --- |
| `X-Request-Id` | Optional | Correlates logs, responses, and audit entries. Backend generates one if missing. |
| `X-Actor` | Required for mutations | Identifies who changed configuration. Needed for audit logs. |

Flow:

```mermaid
sequenceDiagram
  participant Client
  participant Middleware as RequestContextMiddleware
  participant Guard as ActorRequiredGuard
  participant Service

  Client->>Middleware: HTTP request with optional X-Request-Id and X-Actor
  Middleware->>Middleware: Store requestId and actor in AsyncLocalStorage
  Middleware-->>Client: Set X-Request-Id response header
  Client->>Guard: Mutation route
  Guard->>Guard: Require actor
  Guard->>Service: Continue only if actor exists
```

Read-only routes do not require `X-Actor`. Mutating routes do.

### 5.3 `database/`

Purpose:

> Connect NestJS to Prisma/PostgreSQL and provide transaction boundaries.

Important files:

```text
database/prisma.service.ts
database/transaction.service.ts
database/database.module.ts
```

`PrismaService`:

- extends `PrismaClient`,
- reads `DATABASE_URL` from config,
- uses `@prisma/adapter-pg`,
- connects on module init,
- disconnects on module destroy.

`TransactionService`:

- wraps `prisma.$transaction`,
- passes a `TransactionClient` to service callbacks,
- is used when a mutation and audit entry must commit together.

### 5.4 `repositories/`

Purpose:

> Thin data-access layer around Prisma queries.

Current repository files:

```text
repositories/projects.repository.ts
repositories/environments.repository.ts
repositories/feature-flags.repository.ts
repositories/flag-configs.repository.ts
repositories/flag-rules.repository.ts
repositories/sample-users.repository.ts
repositories/audit-logs.repository.ts
repositories/repository-client.type.ts
```

Mental model:

```text
Controller validates HTTP shape
-> Service owns business workflow and audit decisions
-> Repository owns Prisma query details
-> Prisma writes or reads PostgreSQL
```

Repositories accept an optional database client, so a service can pass a
transaction client during mutations.

### 5.5 `audit/`

Purpose:

> Write audit entries from mutation services.

Important files:

```text
audit/audit-log.service.ts
audit/audit-log.types.ts
audit/audit.module.ts
```

`AuditLogService.record(tx, input)` writes one row to `audit_log_entries` using
the same transaction client as the mutation.

It stores:

- `projectId`, `projectKey`,
- optional `environmentId`, `environmentKey`,
- `targetType`, `targetId`, `targetKey`,
- `action`,
- `actor`,
- `before`, `after`,
- `metadata`,
- `requestId`.

## 6. Data Model and Prisma Layer

Purpose:

> The Prisma layer defines PostgreSQL schema, migrations, seed data, enums, and
> persistence constraints.

Location:

```text
apps/backend/prisma/
├── schema.prisma
├── seed.ts
└── migrations/
    ├── migration_lock.toml
    └── 20260605133630_init_data_model/
        └── migration.sql
```

### 6.1 Prisma config

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

Prisma 7 detail:

> `schema.prisma` declares only `provider = "postgresql"`; the actual database
> URL is supplied through `prisma.config.ts` and the Prisma CLI/runtime config.

### 6.2 Prisma schema models

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
FeatureFlagLifecycleStatus: ACTIVE, ARCHIVED
FlagConfigStatus: ENABLED, DISABLED
ServingMode: GLOBAL_ON, TARGETED
RuleType: USER_ALLOWLIST, ROLE_TARGETING, PERCENTAGE_ROLLOUT
AuditTargetType: PROJECT, ENVIRONMENT, FEATURE_FLAG, FLAG_CONFIG, FLAG_RULE, SAMPLE_USER
AuditAction: PROJECT_CREATED, PROJECT_UPDATED, FEATURE_FLAG_CREATED, ...
```

Table purpose summary:

| Table | Purpose |
| --- | --- |
| `projects` | Top-level project/workspace. |
| `environments` | Environment scope such as production, staging, development. |
| `feature_flags` | Stable flag identity and lifecycle. |
| `flag_environment_configs` | Per-environment runtime behavior for a flag. |
| `flag_rules` | Ordered targeting/rollout rules for one flag config. |
| `sample_user_contexts` | Demo-safe non-PII user contexts. |
| `audit_log_entries` | Append-only history of configuration changes. |

### 6.3 Environment-aware flag model

The data model separates flag identity from runtime behavior.

`FeatureFlag` answers:

```text
What is this flag?
```

Examples:

- `key`,
- `name`,
- `description`,
- lifecycle status,
- archived timestamp.

`FlagEnvironmentConfig` answers:

```text
How does this flag behave in this environment?
```

Examples:

- config status: `ENABLED` or `DISABLED`,
- serving mode: `GLOBAL_ON` or `TARGETED`,
- kill switch,
- rules.

This prevents accidental production changes when experimenting in staging or
development.

### 6.4 Entity relationship map

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

### 6.5 Important constraints

| Constraint | Why it matters |
| --- | --- |
| `Project.key` unique | Project lookup by key is deterministic. |
| `Environment(projectId, key)` unique | Environment keys are stable per project. |
| One default environment per project | Evaluation can safely default if `environmentKey` is omitted. |
| `FeatureFlag(projectId, key)` unique | Flag keys are unique inside a project. |
| `FlagEnvironmentConfig(flagId, environmentId)` unique | One config per flag/environment pair. |
| `FlagRule(flagConfigId, priority)` unique | Rule order is stable and unambiguous. |
| `SampleUserContext(projectId, targetingKey)` unique | Demo rollout keys are stable per project. |
| Audit update/delete triggers | Audit history is append-only at DB level. |

## 7. Phase 4 Data-Plane API and Evaluation Engine

Phase 4 implemented runtime evaluation.

Location:

```text
apps/backend/src/evaluation/
├── dto/
│   ├── evaluate-request.dto.ts
│   └── evaluate-response.dto.ts
├── engine/
│   ├── evaluation-engine.ts
│   ├── evaluation.types.ts
│   ├── evaluation-engine.spec.ts
│   ├── stable-rollout-hash.ts
│   └── stable-rollout-hash.spec.ts
├── evaluation.controller.ts
├── evaluation.module.ts
├── evaluation.repository.ts
└── evaluation.service.ts
```

### 7.1 Endpoint

```text
POST /v1/evaluate
```

Request shape:

```json
{
  "projectKey": "demo-project",
  "environmentKey": "production",
  "flagKey": "new-checkout",
  "context": {
    "targetingKey": "demo-user-beta",
    "userId": "demo-user-beta",
    "roles": ["beta-tester"],
    "attributes": {
      "plan": "pro",
      "country": "VN"
    }
  }
}
```

`environmentKey` is optional. If omitted, the repository loads the project's
default environment.

Response shape:

```json
{
  "projectKey": "demo-project",
  "flagKey": "new-checkout",
  "enabled": true,
  "variant": "on",
  "reason": "ROLE_MATCH",
  "matchedRuleId": "rule_123"
}
```

### 7.2 Data-plane request flow

```mermaid
sequenceDiagram
  participant Client as Demo/API Client
  participant Controller as EvaluationController
  participant Service as EvaluationService
  participant Repo as EvaluationRepository
  participant Engine as evaluateFlag
  participant DB as PostgreSQL

  Client->>Controller: POST /v1/evaluate
  Controller->>Service: EvaluateRequestDto
  Service->>Repo: findSnapshot(projectKey, environmentKey, flagKey)
  Repo->>DB: Load project
  Repo->>DB: Load requested/default environment
  Repo->>DB: Load flag
  Repo->>DB: Load config and ordered rules
  Repo-->>Service: EvaluationSnapshot or null
  alt Missing project/environment/flag/config
    Service-->>Client: enabled=false, reason=NOT_FOUND
  else Snapshot found
    Service->>Engine: evaluateFlag(input, snapshot)
    Engine-->>Service: deterministic result
    Service-->>Client: enabled, variant, reason, matchedRuleId
  end
```

### 7.3 Evaluation order

The engine currently evaluates in this safe order:

1. Archived flag -> `FLAG_ARCHIVED`.
2. Kill switch -> `KILL_SWITCH`.
3. Disabled config -> `FLAG_DISABLED`.
4. Global-on serving mode -> `GLOBAL_ON`.
5. Enabled user allowlist rules -> `USER_ALLOWLIST`.
6. Enabled role targeting rules -> `ROLE_MATCH`.
7. Enabled percentage rollout rules -> `PERCENTAGE_ROLLOUT` or
   `INVALID_CONTEXT` when a rollout rule exists but no targeting key exists.
8. No match -> `DEFAULT_OFF`.

If the repository cannot find the project, environment, flag, or config, the
service returns:

```json
{
  "enabled": false,
  "reason": "NOT_FOUND"
}
```

If an unexpected evaluation error occurs, the service fails safely with
`enabled=false` and `reason=ERROR`.

### 7.4 Stable rollout hashing

File:

```text
apps/backend/src/evaluation/engine/stable-rollout-hash.ts
```

Purpose:

> Convert `projectKey + flagKey + targetingKey` into a stable bucket so the
> same user consistently lands in the same rollout group.

What to remember:

- Percentage rollout must not use `Math.random()`.
- The same inputs must return the same result across requests.
- Use stable non-PII `targetingKey` values.
- Changing `projectKey`, `flagKey`, or `targetingKey` changes the bucket.

### 7.5 Phase 4 tests

Important tests:

```text
evaluation/engine/evaluation-engine.spec.ts
evaluation/engine/stable-rollout-hash.spec.ts
```

They protect:

- rule precedence,
- default-off behavior,
- kill switch behavior,
- disabled and archived behavior,
- allowlist and role targeting,
- deterministic percentage rollout,
- invalid rollout context,
- stable hashing boundaries.

## 8. Phase 5 Control-Plane APIs

Phase 5 implemented management APIs with transactional audit logging.

The control-plane modules are:

```text
projects/
feature-flags/
flag-rules/
sample-users/
audit-logs/
```

### 8.1 Endpoint map

| Area | Method and path | Purpose | Actor required? |
| --- | --- | --- | --- |
| Projects | `GET /v1/projects` | List projects | No |
| Projects | `POST /v1/projects` | Create project | Yes |
| Projects | `GET /v1/projects/:projectKey` | Get project | No |
| Projects | `PATCH /v1/projects/:projectKey` | Update project | Yes |
| Flags | `GET /v1/projects/:projectKey/flags` | List flags | No |
| Flags | `POST /v1/projects/:projectKey/flags` | Create flag | Yes |
| Flags | `GET /v1/projects/:projectKey/flags/:flagKey` | Get flag | No |
| Flags | `PATCH /v1/projects/:projectKey/flags/:flagKey` | Update flag/config | Yes |
| Flags | `POST /v1/projects/:projectKey/flags/:flagKey/archive` | Archive flag | Yes |
| Flags | `POST /v1/projects/:projectKey/flags/:flagKey/restore` | Restore flag | Yes |
| Rules | `GET /v1/projects/:projectKey/flags/:flagKey/rules` | List rules | No |
| Rules | `PUT /v1/projects/:projectKey/flags/:flagKey/rules` | Replace rules | Yes |
| Sample users | `GET /v1/projects/:projectKey/sample-users` | List sample users | No |
| Sample users | `POST /v1/projects/:projectKey/sample-users` | Create sample user | Yes |
| Sample users | `DELETE /v1/projects/:projectKey/sample-users/:targetingKey` | Delete sample user | Yes |
| Audit logs | `GET /v1/projects/:projectKey/audit-logs` | List audit entries | No |

### 8.2 Control-plane mutation flow

Every audited mutation should follow this shape:

```mermaid
sequenceDiagram
  participant Client as Admin/API Client
  participant Guard as ActorRequiredGuard
  participant Service
  participant Tx as TransactionService
  participant Repo as Repository
  participant Audit as AuditLogService
  participant DB as PostgreSQL

  Client->>Guard: Mutation request with X-Actor
  Guard->>Service: Actor exists
  Service->>Tx: Begin transaction
  Tx->>Repo: Read before snapshot
  Tx->>Repo: Write mutation
  Tx->>Repo: Read or build after snapshot
  Tx->>Audit: Insert audit log with same tx
  Audit->>DB: audit_log_entries insert
  Tx-->>Service: Commit
  Service-->>Client: Updated resource
```

Non-negotiable:

> The config mutation and audit entry must be written in the same transaction.

### 8.3 Projects module

Location:

```text
apps/backend/src/projects/
├── dto/
│   ├── create-project.dto.ts
│   ├── project-query.dto.ts
│   ├── project-response.dto.ts
│   └── update-project.dto.ts
├── projects.controller.ts
├── projects.module.ts
└── projects.service.ts
```

Create request:

```json
{
  "key": "demo-project",
  "name": "Demo Project",
  "description": "Project used for feature flag demos."
}
```

Important behavior:

- project keys are immutable after creation,
- creation also creates default environments for the project,
- list supports pagination and search,
- duplicate project keys return a conflict-style error,
- create/update writes audit entries.

### 8.4 Feature flags module

Location:

```text
apps/backend/src/feature-flags/
├── dto/
│   ├── create-feature-flag.dto.ts
│   ├── feature-flag-query.dto.ts
│   ├── feature-flag-response.dto.ts
│   └── update-feature-flag.dto.ts
├── feature-flags.controller.ts
├── feature-flags.module.ts
└── feature-flags.service.ts
```

Create request:

```json
{
  "key": "new-checkout",
  "name": "New Checkout",
  "description": "Controls rollout of the new checkout experience."
}
```

Update request can change both identity metadata and default environment config:

```json
{
  "name": "New Checkout",
  "description": "Updated description.",
  "status": "ENABLED",
  "servingMode": "TARGETED",
  "killSwitch": false
}
```

Important behavior:

- `lifecycleStatus` is `ACTIVE` or `ARCHIVED`,
- `status` is config status, not runtime On/Off,
- `servingMode` controls global-on versus targeted evaluation,
- `killSwitch` forces runtime Off,
- archive/restore use explicit endpoints,
- mutations write audit entries.

### 8.5 Flag rules module

Location:

```text
apps/backend/src/flag-rules/
├── dto/
│   ├── replace-rules.dto.ts
│   ├── rule-query.dto.ts
│   └── rule-response.dto.ts
├── flag-rules.controller.ts
├── flag-rules.module.ts
└── flag-rules.service.ts
```

Replace rules request:

```json
{
  "rules": [
    {
      "type": "USER_ALLOWLIST",
      "priority": 10,
      "enabled": true,
      "parameters": {
        "userIds": ["demo-user-admin"]
      }
    },
    {
      "type": "ROLE_TARGETING",
      "priority": 20,
      "enabled": true,
      "parameters": {
        "roles": ["beta-tester"]
      }
    },
    {
      "type": "PERCENTAGE_ROLLOUT",
      "priority": 30,
      "enabled": true,
      "parameters": {
        "percentage": 50
      }
    }
  ]
}
```

Important behavior:

- rules are replaced as a set,
- duplicate priorities are rejected,
- rule type must be one of the MVP rule types,
- rule parameters are JSON because each rule type needs different data,
- replacement writes an audit entry with before/after snapshots.

### 8.6 Sample users module

Location:

```text
apps/backend/src/sample-users/
├── dto/
│   ├── create-sample-user.dto.ts
│   ├── sample-user-query.dto.ts
│   └── sample-user-response.dto.ts
├── sample-users.controller.ts
├── sample-users.module.ts
└── sample-users.service.ts
```

Create request:

```json
{
  "displayName": "Beta User",
  "targetingKey": "demo-user-beta",
  "userId": "demo-user-beta",
  "roles": ["beta-tester"],
  "attributes": {
    "plan": "pro",
    "country": "VN"
  }
}
```

Important behavior:

- sample users are demo helpers, not production identity records,
- `targetingKey` must be stable and non-PII,
- list supports search and role filters,
- create/delete writes audit entries,
- delete uses `targetingKey` in the URL.

### 8.7 Audit logs API

Location:

```text
apps/backend/src/audit-logs/
├── dto/
│   ├── audit-log-query.dto.ts
│   └── audit-log-response.dto.ts
├── audit-logs.controller.ts
├── audit-logs.module.ts
└── audit-logs.service.ts
```

Endpoint:

```text
GET /v1/projects/:projectKey/audit-logs
```

Supported filters:

```text
limit
offset
sort
order
targetType
targetKey
actor
action
from
to
```

Response item shape:

```json
{
  "id": "audit_123",
  "projectKey": "demo-project",
  "environmentKey": "production",
  "targetType": "FEATURE_FLAG",
  "targetId": "flag_123",
  "targetKey": "new-checkout",
  "action": "FEATURE_FLAG_UPDATED",
  "actor": "admin@example.local",
  "before": {},
  "after": {},
  "metadata": { "source": "api" },
  "requestId": "req_123",
  "createdAt": "2026-06-12T00:00:00.000Z"
}
```

Important behavior:

- audit entries are read-only from the API perspective,
- audit table has database-level update/delete protection,
- filters support presentation/debugging stories,
- request ID connects a user-facing response to audit history.

## 9. Pagination and Error Model

### 9.1 Pagination

List endpoints use this response shape:

```json
{
  "items": [],
  "page": {
    "limit": 20,
    "offset": 0,
    "total": 0,
    "hasNext": false
  }
}
```

Standard query fields:

| Field | Default | Meaning |
| --- | --- | --- |
| `limit` | `20` | Number of records, min 1 and max 100. |
| `offset` | `0` | Number of records to skip. |
| `sort` | endpoint-specific | Sort field, where supported. |
| `order` | `desc` | `asc` or `desc`. |

### 9.2 Error model

The backend uses shared error codes:

```text
NOT_FOUND
VALIDATION_ERROR
CONFLICT
INTERNAL_ERROR
```

Validation example:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed.",
  "details": [
    {
      "field": "projectKey",
      "message": "projectKey must use lowercase letters, numbers, and hyphens."
    }
  ],
  "requestId": "req_123"
}
```

Special data-plane rule:

> Missing project/flag/config during evaluation is not a thrown 404. It returns
> `enabled=false` with `reason=NOT_FOUND` so application clients fail closed.

## 10. Admin App Map — `apps/admin`

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
│   ├── index.css
│   └── assets/
└── public/
```

Current screen:

- admin dashboard scaffold,
- API base URL display,
- default project key display,
- reminder that runtime state is not evaluated inside admin.

Future Phase 7 screens:

```text
Project list
Feature flag list
Create/edit feature flag
Rule editor
Audit log page
Loading, empty, error, and confirmation states
```

Future admin API clients should call only control-plane endpoints.

Important UI semantic rule:

> `Enabled`, `Disabled`, and `Archived` are configuration/lifecycle labels.
> `On` and `Off` are runtime evaluation results.

## 11. Demo App Map — `apps/demo`

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
│   ├── index.css
│   └── assets/
└── public/
```

Current screen:

- demo application scaffold,
- evaluation API URL display,
- project key display,
- flag key display.

Future Phase 8 behavior:

1. Select or edit sample context.
2. Send `POST /v1/evaluate`.
3. Display `projectKey`, `flagKey`, `enabled`, `variant`, `reason`, and
   `matchedRuleId`.
4. Show/hide a visible demo feature based on `enabled`.
5. Demonstrate global-on, role targeting, percentage rollout, and `NOT_FOUND`.

The demo app should never require browser-exposed secrets.

## 12. Seed Data Map

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

## 13. Test Map

### 13.1 Unit tests

Important unit tests:

```text
apps/backend/src/app.controller.spec.ts
apps/backend/src/evaluation/engine/evaluation-engine.spec.ts
apps/backend/src/evaluation/engine/stable-rollout-hash.spec.ts
```

They prove:

- backend scaffold compiles,
- evaluation order is deterministic,
- rollout hash is stable,
- safe defaults are preserved.

### 13.2 E2E tests

Important e2e files:

```text
apps/backend/test/app.e2e-spec.ts
apps/backend/test/phase-5-management.e2e-spec.ts
apps/backend/test/create-e2e-app.ts
apps/backend/test/database-test-utils.ts
apps/backend/test/jest-e2e.json
```

Phase 5 e2e coverage includes:

- project create/list/update,
- missing `X-Actor` validation,
- duplicate conflict behavior,
- feature flag lifecycle and audit writes,
- rule replacement and evaluation impact,
- duplicate priority validation,
- sample user create/delete and audit writes,
- audit log filters and pagination.

Local note:

> Some e2e tests need a real listening server and database. If sandboxed test
> execution fails with a permission/listen error, run the test command in a
> normal local terminal.

## 14. Documentation Map

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

### 14.1 `docs/requirement/`

Product source and evaluation criteria.

Use this folder to answer:

> What must this project deliver?

Important files:

```text
docs/requirement/requirement-init.md
docs/requirement/info-init.md
docs/requirement/backend/be-init.md
docs/requirement/frontend/fe-init.md
docs/requirement/demo/demo-app.md
docs/requirement/feature-flag-research.md
```

### 14.2 `docs/plan/`

Planning and sequencing.

Use this folder to answer:

> What should be built next?

Important files:

```text
docs/plan/project-goal.md
docs/plan/implementation-roadmap.md
docs/plan/project-plan.md
docs/plan/vision.md
```

### 14.3 `docs/design/`

Architecture and API behavior.

Use this folder to answer:

> How should the system behave?

Important files:

```text
docs/design/software-architecture-document.md
docs/design/mvp-api-and-contracts.md
```

### 14.4 `docs/research/`

Research support.

Use this folder to answer:

> Why is this approach credible?

Topics include feature flags, rollout strategies, kill switches, audit logs,
API design, and key considerations.

### 14.5 `docs/competitor-analysis/`

Competitor context.

Use this folder to answer:

> How does this mini platform compare with existing solutions?

Competitors include LaunchDarkly, Unleash, Flagsmith, ConfigCat, and Split.

### 14.6 `docs/codex/`

Reusable Codex context.

High-value current references:

```text
docs/codex/reference/phase-2-prisma-data-model-and-migration.md
docs/codex/reference/phase-3-backend-foundation.md
docs/codex/reference/phase-4-evaluation-engine-data-plane-api.md
docs/codex/reference/phase-5-management-apis-implementation.md
```

Use these to recover implementation reasoning without reading old chat logs.

### 14.7 `docs/learning/`

Personal learning guides.

Current guides:

```text
docs/learning/codebase-map.md
docs/learning/local-dev-workflow.md
docs/learning/data-model-and-migrations.md
docs/learning/data-model-migration-keywords.md
docs/learning/data-plane-api-and-evaluation-engine.md
docs/learning/control-plane-api-and-audit-logs.md
```

Use these to relearn the repository from a beginner-friendly angle.

## 15. Local Runtime and Commands

### 15.1 Local URLs and ports

| Piece | URL / value |
| --- | --- |
| Backend API | `http://localhost:3000/v1` |
| Swagger UI | `http://localhost:3000/docs` |
| Admin app | `http://localhost:5173` |
| Demo app | `http://localhost:5174` |
| PostgreSQL | `localhost:5432` |
| Database | `ffp_dev` |

### 15.2 Start local PostgreSQL

```bash
docker start ffp-postgres
```

If the container does not exist, create it using the README Docker command.

Verify:

```bash
docker exec ffp-postgres psql -U ffp -d ffp_dev -c "select current_database(), current_user;"
```

### 15.3 Prisma workflow

```bash
npm run prisma:validate --workspace=@ffp/backend
npm run prisma:generate --workspace=@ffp/backend
npm run prisma:migrate --workspace=@ffp/backend
npm run db:seed --workspace=@ffp/backend
```

### 15.4 Run apps

Use separate terminals:

```bash
npm run dev:backend
npm run dev:admin
npm run dev:demo
```

### 15.5 Validation workflow

```bash
npm run build
npm run test
npm run lint
npm run diff:check
```

Backend-specific checks:

```bash
npm run test --workspace=@ffp/backend
npm run test:e2e --workspace=@ffp/backend
npm run prisma:validate --workspace=@ffp/backend
```

If available:

```bash
markdownlint docs/**/*.md README.md AGENTS.md
```

## 16. Manual API Smoke Tests

These examples assume the backend is running and the database has been seeded.

### 16.1 Evaluate a flag

```bash
curl -s http://localhost:3000/v1/evaluate \
  -H 'Content-Type: application/json' \
  -d '{
    "projectKey": "demo-project",
    "environmentKey": "production",
    "flagKey": "new-checkout",
    "context": {
      "targetingKey": "demo-user-beta",
      "userId": "demo-user-beta",
      "roles": ["beta-tester"]
    }
  }'
```

Expected kind of result:

```json
{
  "projectKey": "demo-project",
  "flagKey": "new-checkout",
  "enabled": true,
  "variant": "on",
  "reason": "ROLE_MATCH",
  "matchedRuleId": "..."
}
```

### 16.2 Missing flag fails closed

```bash
curl -s http://localhost:3000/v1/evaluate \
  -H 'Content-Type: application/json' \
  -d '{
    "projectKey": "demo-project",
    "flagKey": "missing-flag",
    "context": {
      "targetingKey": "demo-user-beta"
    }
  }'
```

Expected behavior:

```json
{
  "enabled": false,
  "reason": "NOT_FOUND"
}
```

### 16.3 List projects

```bash
curl -s 'http://localhost:3000/v1/projects?limit=20&offset=0'
```

### 16.4 Create a project with audit actor

```bash
curl -s http://localhost:3000/v1/projects \
  -H 'Content-Type: application/json' \
  -H 'X-Actor: local-admin' \
  -d '{
    "key": "local-project",
    "name": "Local Project",
    "description": "Created from a smoke test."
  }'
```

### 16.5 List audit logs

```bash
curl -s 'http://localhost:3000/v1/projects/demo-project/audit-logs?limit=20&offset=0'
```

## 17. Files to Study First

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

### Step 2 — Backend app assembly

Read:

```text
apps/backend/src/main.ts
apps/backend/src/app.module.ts
apps/backend/package.json
```

Goal:

> Understand NestJS startup, `/v1`, validation, Swagger, CORS, and module
> composition.

### Step 3 — Shared backend infrastructure

Read:

```text
apps/backend/src/common/
apps/backend/src/database/
apps/backend/src/repositories/
apps/backend/src/audit/
```

Goal:

> Understand request context, validation helpers, error handling, Prisma,
> transactions, repositories, and audit writer.

### Step 4 — Data model

Read:

```text
apps/backend/prisma.config.ts
apps/backend/prisma/schema.prisma
apps/backend/prisma/migrations/20260605133630_init_data_model/migration.sql
apps/backend/prisma/seed.ts
```

Goal:

> Understand tables, enums, constraints, seed scenarios, and audit immutability.

### Step 5 — Data-plane evaluation

Read:

```text
apps/backend/src/evaluation/evaluation.controller.ts
apps/backend/src/evaluation/evaluation.service.ts
apps/backend/src/evaluation/evaluation.repository.ts
apps/backend/src/evaluation/engine/evaluation-engine.ts
apps/backend/src/evaluation/engine/stable-rollout-hash.ts
```

Goal:

> Understand how `POST /v1/evaluate` loads a snapshot and returns a safe,
> deterministic runtime decision.

### Step 6 — Control-plane APIs

Read:

```text
apps/backend/src/projects/
apps/backend/src/feature-flags/
apps/backend/src/flag-rules/
apps/backend/src/sample-users/
apps/backend/src/audit-logs/
```

Goal:

> Understand how management APIs validate input, mutate data, and record audit
> entries.

### Step 7 — Frontend scaffolds

Read:

```text
apps/admin/src/App.tsx
apps/demo/src/App.tsx
```

Goal:

> Understand what still needs to be integrated in Phase 6-8.

## 18. Generated and Local Files to Ignore First

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
- source of truth is in code, docs, schema, migration, seed, and tests.

## 19. Learn / Relearn / Unlearn

### 19.1 Learn

- Learn the npm workspace structure.
- Learn how NestJS modules separate responsibilities.
- Learn how `/v1` is set globally.
- Learn the difference between control-plane APIs and data-plane APIs.
- Learn how Prisma models map to PostgreSQL tables.
- Learn why `FeatureFlag` and `FlagEnvironmentConfig` are separate.
- Learn how `POST /v1/evaluate` fails closed.
- Learn why percentage rollout uses stable hashing.
- Learn why `X-Actor` is required for mutations.
- Learn how same-transaction audit logging protects traceability.

### 19.2 Relearn

Rebuild your mental model in this order:

```text
root workspace
-> backend NestJS app
-> Prisma schema and migrations
-> PostgreSQL data
-> backend foundation
-> data-plane evaluation
-> control-plane management APIs
-> audit log history
-> future admin UI
-> future demo UI
```

Then explain:

```text
Admin configures flags.
Backend validates and persists config.
Mutations write audit logs.
Demo sends runtime context.
Evaluation engine returns deterministic On/Off decision.
```

### 19.3 Unlearn

| Wrong assumption | Correct understanding |
| --- | --- |
| The project is only a scaffold | Backend APIs, Prisma, evaluation, and audit logs now exist. |
| The admin UI evaluates flags | The admin UI configures flags; the data-plane API evaluates flags. |
| The demo app edits rules | The demo app calls `POST /v1/evaluate`; it should not mutate config. |
| `ENABLED` always means the user sees the feature | Runtime result can still be Off due to rules, kill switch, archive, or no match. |
| `ARCHIVED` is the same as runtime Off | Archived is lifecycle state; the engine maps it to `FLAG_ARCHIVED`. |
| Percentage rollout can be random | It must be stable and deterministic for the same targeting key. |
| Emails are good rollout keys | Use stable non-PII targeting keys. |
| Audit logs are editable records | DB triggers reject audit updates/deletes. |
| Mutate now, audit later is acceptable | Mutation and audit entry must commit in the same transaction. |
| Missing flag should throw for evaluation | Evaluation returns `enabled=false`, `reason=NOT_FOUND`. |

## 20. Before You Modify Code

Ask:

1. Is this control-plane, data-plane, persistence, UI, docs, or tooling?
2. Does this belong to the current roadmap phase?
3. Does it preserve safe default-off behavior?
4. Does it preserve deterministic evaluation?
5. Does it preserve stable non-PII targeting keys?
6. If it mutates config, is `X-Actor` required?
7. If it mutates config, is the audit entry written in the same transaction?
8. If it touches audit entries, does append-only behavior remain intact?
9. If it changes schema, is a migration needed?
10. If it changes seed/demo behavior, is the presentation scenario still clear?
11. Does README, Swagger, or a learning doc need an update?

## 21. What To Build Next

According to `docs/plan/implementation-roadmap.md`, after Phase 4 and Phase 5
the next major phase is **Phase 6 — Early vertical slice**.

Expected Phase 6 work:

1. create or use a demo project,
2. create or use a feature flag,
3. configure at least one rule,
4. evaluate the flag through `POST /v1/evaluate`,
5. display the result in the demo app,
6. verify audit entries are written for setup mutations,
7. use the slice to validate API contracts before expanding UI scope.

Correct progression from here:

```text
Backend APIs complete enough for MVP
-> early vertical slice
-> admin UI
-> demo app
-> quality review and release readiness
```

Do not jump straight into polishing UI before proving the full loop:

```text
configure flag -> persist config -> audit mutation -> evaluate flag -> show result
```

## 22. One-Sentence Summary

This codebase is now a Phase 5 feature flag platform: an npm workspace with a
NestJS backend, Prisma/PostgreSQL persistence, deterministic data-plane
evaluation, control-plane management APIs, append-only audit logging, seed data,
and frontend scaffolds ready for the next vertical-slice integration phase.
