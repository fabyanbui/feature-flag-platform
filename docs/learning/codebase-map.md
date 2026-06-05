# Codebase Map — Feature Flag Platform

This document explains the current scaffold from scratch, then connects it to
the final MVP architecture. Use it as a learning map before changing code.

## 1. What This Repository Is

This repository is a mini feature flag management platform. The project goal is
to show how software teams can deploy code safely while releasing features
gradually through runtime configuration.

At MVP level, the system must provide:

1. A **backend API** for projects, flags, rules, evaluation, and audit logs.
2. An **admin dashboard** for configuring projects, flags, rules, and audits.
3. A **demo application** that calls the evaluation API and shows or hides a
   feature.
4. A **PostgreSQL database** for persistent projects, flags, rules, sample
   contexts, and append-only audit entries.
5. **Validation, safe errors, deterministic evaluation, seed data, README run
   instructions, and short design documentation**.

The current codebase is in **Phase 1 scaffold state**. It has the backend app,
admin app, demo app, npm workspace, TypeScript configuration, environment
examples, and local PostgreSQL instructions. It does **not yet** have Prisma
schema, migrations, seed data, real feature-flag APIs, rule evaluation, or audit
log persistence.

## 2. Mental Model

Think of the project as three apps around one future database:

```mermaid
graph LR
  Browser[Browser]
  Admin[Admin Dashboard<br/>apps/admin]
  Demo[Demo App<br/>apps/demo]
  Backend[Backend API<br/>apps/backend]
  DB[(PostgreSQL<br/>future Prisma schema)]

  Browser --> Admin
  Browser --> Demo
  Admin -->|Control-plane REST calls| Backend
  Demo -->|Data-plane evaluation call| Backend
  Backend -->|Future Prisma queries| DB
```

The important separation:

- **Control plane**: configuration workflows.
  - Admin dashboard.
  - Project/flag/rule/audit management APIs.
- **Data plane**: runtime decision workflow.
  - Demo app.
  - `POST /v1/evaluate`.
  - Deterministic rule evaluation.

Do not blur these concepts. The admin app configures flags; the demo app
consumes flag decisions.

## 3. Top-Level Repository Map

Current important top-level files and folders:

```text
.
├── AGENTS.md
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.base.json
├── .env.example
├── apps/
│   ├── backend/
│   ├── admin/
│   └── demo/
├── docs/
│   ├── plan/
│   ├── requirement/
│   ├── design/
│   ├── research/
│   ├── competitor-analysis/
│   ├── codex/
│   └── learning/
└── node_modules/
```

### 3.1 `AGENTS.md`

`AGENTS.md` is the active repository guardrail source. It says how code and
documentation should stay aligned with the project goals.

Most important rules to remember:

- Single backend service hosts management and evaluation endpoints.
- MVP stack: NestJS, Prisma, PostgreSQL, REST/Swagger, Jest, in-memory cache.
- Evaluation base path is `/v1`.
- Evaluation responses must include `enabled`, `reason`, `projectKey`, and
  `flagKey`.
- Missing project or flag returns `enabled=false` with `reason=NOT_FOUND`.
- Rule order is:
  1. global disable / kill switch,
  2. user allowlist,
  3. role targeting,
  4. percentage rollout,
  5. default off.
- Percentage rollout must be deterministic.
- Project, flag, and rule mutations must write append-only audit logs in the
  same transaction.
- Use stable, non-PII targeting and rollout keys.
- Feature flag status labels are not the same as runtime On/Off results.

### 3.2 `README.md`

`README.md` is the local onboarding entrypoint. It currently explains:

- project purpose,
- delivery criteria,
- MVP guardrails,
- required docs,
- local prerequisites,
- dependency installation,
- PostgreSQL startup with Docker,
- app run commands,
- validation commands.

When implementation changes, keep README commands accurate.

### 3.3 `package.json`

The root `package.json` defines an npm workspace:

```json
{
  "workspaces": ["apps/*"]
}
```

That means `apps/backend`, `apps/admin`, and `apps/demo` are installed and run
from the root workspace. The root package also provides convenience scripts:

```bash
npm run dev:backend
npm run dev:admin
npm run dev:demo
npm run build
npm run lint
npm run test
npm run diff:check
```

Important habit: install dependencies from the repository root, not from inside
individual apps.

### 3.4 `tsconfig.base.json`

This file stores shared TypeScript strictness for the repo:

- modern `ES2023` target,
- strict type checking,
- consistent casing,
- JSON import support,
- `skipLibCheck` to avoid spending time on dependency declaration internals.

Frontend TypeScript configs extend this base. Backend uses NestJS-generated
configs but should remain aligned with strict, readable TypeScript.

### 3.5 `.env.example`

This file documents expected environment variables. Current app-related values:

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
- Do not commit real `.env` secrets.
- Keep browser-exposed values safe. Any `VITE_*` value is visible to frontend
  users after build.

## 4. App Map

### 4.1 Backend App — `apps/backend`

Purpose: the backend will become the single NestJS service for both
management APIs and evaluation APIs.

Current structure:

```text
apps/backend/
├── package.json
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── eslint.config.mjs
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

#### 4.1.1 Backend bootstrap: `src/main.ts`

`main.ts` is the application entrypoint.

Current responsibilities:

1. Create the Nest app from `AppModule`.
2. Set global route prefix to `/v1`.
3. Enable CORS for configured admin and demo origins.
4. Read `API_PORT`, defaulting to `3000`.
5. Start the HTTP server.
6. Log and exit if startup fails.

Important current behavior:

```text
Root route becomes: http://localhost:3000/v1
```

This matters because all MVP APIs should live under `/v1`.

#### 4.1.2 Backend root module: `src/app.module.ts`

`AppModule` is the root NestJS module.

Current responsibilities:

- load environment variables with `@nestjs/config`,
- make config global,
- register the placeholder controller and service.

Environment lookup currently checks:

```text
.env
../../.env
```

This allows running the backend from its own app folder or from the root
workspace context.

#### 4.1.3 Backend placeholder controller/service

Current placeholder route:

```text
GET /v1
```

Current response:

```text
Hello World!
```

This is only a scaffold health check. It is not yet the feature flag API.

#### 4.1.4 Backend package scripts

From root:

```bash
npm run dev:backend
```

Inside workspace, this maps to:

```bash
npm run start:dev --workspace=@ffp/backend
```

Backend-specific useful scripts:

```bash
npm run build --workspace=@ffp/backend
npm run test --workspace=@ffp/backend
npm run test:e2e --workspace=@ffp/backend
npm run lint --workspace=@ffp/backend
```

#### 4.1.5 Future backend module map

The backend should evolve from the current placeholder into modules like:

```text
apps/backend/src/
├── main.ts
├── app.module.ts
├── common/
│   ├── errors/
│   ├── validation/
│   ├── request-context/
│   └── pagination/
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── projects/
├── flags/
├── rules/
├── evaluation/
│   ├── evaluation.controller.ts
│   ├── evaluation.service.ts
│   ├── rule-engine/
│   └── hashing/
├── audit/
└── sample-users/
```

Do not invent this structure casually in controllers. Phase 2 should design the
Prisma model first; Phase 3 should add validation/errors/audit foundations;
Phase 4 should add the evaluation engine.

### 4.2 Admin App — `apps/admin`

Purpose: the admin dashboard is the **control-plane UI**.

Current structure:

```text
apps/admin/
├── package.json
├── vite.config.ts
├── index.html
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.css
│   └── index.css
└── public/
```

Current `App.tsx` is a dashboard placeholder. It displays:

- API base URL,
- default project key,
- reminder that runtime state is not evaluated in admin scaffold.

This distinction is intentional. Admin should manage configuration; it should
not pretend to be the runtime evaluator.

Future admin screens:

```text
Project list
Flag list
Create/edit flag
Rule configuration
Audit log
```

Future admin technical map:

```text
apps/admin/src/
├── main.tsx
├── App.tsx
├── api/
│   ├── client.ts
│   ├── projects.ts
│   ├── flags.ts
│   ├── rules.ts
│   └── audit-logs.ts
├── pages/
├── components/
├── styles/
└── types/
```

Important UI rule: feature flag status labels such as `Enabled`, `Disabled`,
and `Archived` are configuration status labels. Runtime results such as `On`
or `Off` come from evaluation and must be displayed separately.

### 4.3 Demo App — `apps/demo`

Purpose: the demo app is the **data-plane client** that proves runtime
evaluation.

Current structure:

```text
apps/demo/
├── package.json
├── vite.config.ts
├── index.html
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.css
│   └── index.css
└── public/
```

Current `App.tsx` is a demo placeholder. It displays:

- evaluation API URL,
- project key,
- flag key,
- reminder that runtime state is not evaluated in Phase 1.

Future demo behavior:

1. Select or show a sample context.
2. Send `POST /v1/evaluate`.
3. Display `projectKey`, `flagKey`, `enabled`, `variant`, `reason`, and loading
   or error state.
4. Show/hide a demo feature based on `enabled`.
5. Demonstrate:
   - global enable/disable,
   - role targeting,
   - percentage rollout,
   - `NOT_FOUND` safe fallback.

Future demo technical map:

```text
apps/demo/src/
├── main.tsx
├── App.tsx
├── api/
│   └── evaluation.ts
├── components/
│   ├── EvaluationPanel.tsx
│   ├── DemoFeature.tsx
│   └── ResultBadge.tsx
├── sample-contexts/
└── types/
```

## 5. Documentation Map

The codebase is intentionally documentation-heavy because the project must be
presentation-ready.

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

### 5.1 `docs/requirement/`

Product and evaluation source.

Important files:

- `requirement-init.md`: required and recommended deliverables.
- `info-init.md`: dates and mentor evaluation criteria.
- `feature-flag-research.md`: research report artifact.
- `use-case-specification.md`: use-case grounding.

Use these files to answer: **What must the project deliver?**

### 5.2 `docs/plan/`

Planning and sequencing.

Important files:

- `project-goal.md`: concise active goal and acceptance criteria.
- `implementation-roadmap.md`: phase-by-phase execution order.
- `project-plan.md`: broader project planning.
- `vision.md`: high-level direction.

Use these files to answer: **What should we build next, and why now?**

### 5.3 `docs/design/`

Architecture and implementation contracts.

Important files:

- `software-architecture-document.md`: architectural baseline.
- `mvp-api-and-contracts.md`: API, evaluation, error, pagination, and audit
  contracts.

Use these files to answer: **How should the system behave?**

### 5.4 `docs/research/`

Research supporting engineering decisions.

Useful topics:

- feature flags,
- rollout strategies,
- kill switches,
- audit logs,
- feature flag key considerations,
- API design.

Use these files to answer: **Why is this design credible?**

### 5.5 `docs/competitor-analysis/`

Comparison with existing tools such as LaunchDarkly, Unleash, Flagsmith,
ConfigCat, and Split.

Use these files to answer presentation questions like:

- How is this mini platform different from mature SaaS/open-source products?
- What is intentionally simplified for MVP?
- What practical value does this project still demonstrate?

### 5.6 `docs/codex/`

Reusable Codex context and task references. For example,
`docs/codex/reference/phase-1-project-scaffold-local-workflow.md` explains the
scaffold history and what Phase 1 intentionally did not implement.

Use these files to recover project context quickly before asking Codex to make
new changes.

### 5.7 `docs/learning/`

This folder is for personal learning and relearning notes. Keep these notes
clear, factual, and separate from formal requirements.

Suggested future files:

```text
docs/learning/local-dev-workflow.md
docs/learning/backend-request-flow.md
docs/learning/postgresql-and-docker.md
docs/learning/nestjs-basics.md
docs/learning/react-vite-basics.md
docs/learning/unlearn-list.md
```

## 6. Runtime Ports and Local URLs

Current local defaults:

| Piece | URL / value | Source |
| --- | --- | --- |
| Backend API | `http://localhost:3000/v1` | `API_PORT`, backend `setGlobalPrefix('v1')` |
| Admin app | `http://localhost:5173` | root `dev:admin` script |
| Demo app | `http://localhost:5174` | root `dev:demo` script |
| PostgreSQL host port | `localhost:5432` | Docker `-p 5432:5432` |
| Database | `ffp_dev` | `.env.example` |
| Database user | `ffp` | `.env.example` and README Docker command |

## 7. Local Development Flow From Scratch

### 7.1 Install dependencies

Run from repository root:

```bash
npm install
```

This installs root workspace dependencies and app dependencies.

### 7.2 Create local environment

```bash
cp .env.example .env
```

Do not commit `.env`.

### 7.3 Start PostgreSQL with Docker

Current README uses a single Docker container:

```bash
docker run --name ffp-postgres \
  -e POSTGRES_USER=ffp \
  -e POSTGRES_PASSWORD=ffp_dev_password \
  -e POSTGRES_DB=ffp_dev \
  -p 5432:5432 \
  -d postgres:16
```

If it already exists:

```bash
docker start ffp-postgres
```

Verify:

```bash
docker exec ffp-postgres psql -U ffp -d ffp_dev -c "select current_database(), current_user;"
```

### 7.4 Start each app

Use separate terminals:

```bash
npm run dev:backend
npm run dev:admin
npm run dev:demo
```

### 7.5 Validate scaffold

```bash
npm run build
npm run test
npm run diff:check
```

If available:

```bash
markdownlint docs/**/*.md README.md AGENTS.md
```

## 8. How Docker and PostgreSQL Fit

Docker is currently only used to run PostgreSQL locally. The application itself
is run with npm scripts on the host machine.

The flow is:

```mermaid
sequenceDiagram
  participant Dev as Developer terminal
  participant Docker as Docker engine
  participant Pg as PostgreSQL container
  participant Backend as NestJS backend

  Dev->>Docker: docker run postgres:16
  Docker->>Pg: start ffp-postgres
  Dev->>Backend: npm run dev:backend
  Backend->>Pg: future Prisma connection using DATABASE_URL
```

Current state:

- PostgreSQL can run.
- `DATABASE_URL` is defined.
- Backend does not yet connect to PostgreSQL because Prisma is not implemented.

Future Phase 2 adds:

- `prisma/schema.prisma`,
- migrations,
- generated Prisma client,
- seed script,
- database access module in backend.

## 9. Future Database Conceptual Map

The MVP database should eventually look like:

```mermaid
erDiagram
  PROJECT ||--o{ FEATURE_FLAG : contains
  FEATURE_FLAG ||--o{ FLAG_RULE : has
  PROJECT ||--o{ SAMPLE_USER_CONTEXT : has
  PROJECT ||--o{ AUDIT_LOG_ENTRY : records

  PROJECT {
    string id
    string key
    string name
    string description
    datetime createdAt
    datetime updatedAt
  }

  FEATURE_FLAG {
    string id
    string projectId
    string key
    string name
    string status
    boolean killSwitch
    datetime createdAt
    datetime updatedAt
  }

  FLAG_RULE {
    string id
    string flagId
    string type
    int priority
    json parameters
  }

  SAMPLE_USER_CONTEXT {
    string id
    string projectId
    string targetingKey
    json roles
    json attributes
  }

  AUDIT_LOG_ENTRY {
    string id
    string projectId
    string actor
    string targetType
    string action
    json before
    json after
    datetime createdAt
  }
```

Exact fields should be finalized in Phase 2 using the architecture and API
contracts. The guardrails are more important than the exact names:

- project keys are stable,
- flag keys are unique within a project,
- rule priority is unique within a flag,
- audit entries are append-only,
- targeting keys are stable and non-PII.

## 10. Future Request Flows

### 10.1 Control-plane mutation flow

Example: admin edits a flag rule.

```mermaid
sequenceDiagram
  participant Admin as Admin Dashboard
  participant API as Backend Management API
  participant DB as PostgreSQL

  Admin->>API: PUT /v1/projects/{projectKey}/flags/{flagKey}/rules
  API->>API: Validate DTO and X-Actor
  API->>DB: Begin transaction
  API->>DB: Read before snapshot
  API->>DB: Persist rule changes
  API->>DB: Append audit log with before/after
  API->>DB: Commit transaction
  API-->>Admin: Updated rule configuration
```

Key learning:

- Mutations are not just CRUD.
- Every project/flag/rule mutation must produce an audit entry.
- The audit entry must be written in the same transaction as the mutation.

### 10.2 Data-plane evaluation flow

Example: demo app checks whether `new-checkout` is enabled.

```mermaid
sequenceDiagram
  participant Demo as Demo App
  participant Eval as Backend Evaluation API
  participant DB as PostgreSQL
  participant Engine as Rule Engine

  Demo->>Eval: POST /v1/evaluate
  Eval->>Eval: Validate projectKey, flagKey, context shape
  Eval->>DB: Load project, flag, ordered rules
  Eval->>Engine: Evaluate deterministically
  Engine-->>Eval: enabled, reason, matchedRuleId
  Eval-->>Demo: projectKey, flagKey, enabled, variant, reason
```

Default evaluation order:

```text
1. Flag disabled / archived / kill switch => Off
2. User allowlist match => On
3. Role match => On
4. Percentage rollout match => On
5. No match => Off
```

Safe fallback examples:

| Case | Response behavior |
| --- | --- |
| Missing project | `enabled=false`, `reason=NOT_FOUND` |
| Missing flag | `enabled=false`, `reason=NOT_FOUND` |
| Percentage rule reached without targeting key | `enabled=false`, `reason=INVALID_CONTEXT` |
| No rule matched | `enabled=false`, `reason=DEFAULT_OFF` |
| Unexpected recoverable evaluation error | `enabled=false`, `reason=ERROR` |

## 11. Build Artifacts and Files to Ignore Mentally

You may see generated or installed folders:

```text
node_modules/
apps/*/node_modules/
apps/*/dist/
apps/*/coverage/
```

Do not study these first. They are dependency/build output, not source of
truth. Focus on:

- source files under `apps/*/src`,
- app `package.json` files,
- root config files,
- `docs/`,
- future `prisma/` files when added.

## 12. Learning Path Through This Codebase

Use this order:

### Step 1 — Root workspace

Read:

- `package.json`
- `README.md`
- `.env.example`
- `tsconfig.base.json`

Goal: understand how the three apps are installed, configured, and started.

### Step 2 — Backend scaffold

Read:

- `apps/backend/src/main.ts`
- `apps/backend/src/app.module.ts`
- `apps/backend/src/app.controller.ts`
- `apps/backend/src/app.service.ts`
- `apps/backend/package.json`

Goal: understand NestJS bootstrap, modules, controllers, providers, CORS, and
global `/v1` prefix.

### Step 3 — Admin scaffold

Read:

- `apps/admin/src/main.tsx`
- `apps/admin/src/App.tsx`
- `apps/admin/src/App.css`
- `apps/admin/vite.config.ts`
- `apps/admin/package.json`

Goal: understand Vite React entrypoint and control-plane placeholder.

### Step 4 — Demo scaffold

Read:

- `apps/demo/src/main.tsx`
- `apps/demo/src/App.tsx`
- `apps/demo/src/App.css`
- `apps/demo/vite.config.ts`
- `apps/demo/package.json`

Goal: understand Vite React entrypoint and data-plane placeholder.

### Step 5 — Architecture and contracts

Read:

- `docs/plan/project-goal.md`
- `docs/plan/implementation-roadmap.md`
- `docs/design/software-architecture-document.md`
- `docs/design/mvp-api-and-contracts.md`

Goal: understand where the scaffold must go next.

### Step 6 — Database and Docker

Run and explain:

```bash
docker start ffp-postgres
docker exec ffp-postgres psql -U ffp -d ffp_dev -c "select current_database(), current_user;"
```

Goal: understand that Docker hosts PostgreSQL, and future Prisma code will use
`DATABASE_URL` to connect to it.

## 13. Learn / Relearn / Unlearn Checklist

### Learn

- Learn npm workspaces.
- Learn how NestJS starts from `main.ts` and `AppModule`.
- Learn how Vite React starts from `main.tsx`.
- Learn what environment variables are used by backend versus frontend.
- Learn why the project separates control plane and data plane.

### Relearn

- Rebuild the mental model from a clean clone:
  1. install,
  2. configure env,
  3. start PostgreSQL,
  4. start backend,
  5. start admin,
  6. start demo,
  7. run validation commands.
- Rewrite one request flow in your own words.
- Explain why `/v1/evaluate` is safer than frontend-only flag logic.

### Unlearn

| Wrong assumption | Correct understanding |
| --- | --- |
| The admin app turns features On/Off at runtime | The admin app configures flags; evaluation decides runtime On/Off |
| `Enabled` always means the user sees the feature | Status and runtime result are separate |
| Percentage rollout can use `Math.random()` | Rollout must use stable deterministic hashing |
| Email is a good rollout key | Use stable non-PII targeting keys |
| Missing flags should throw client errors | Evaluation returns safe `enabled=false`, `reason=NOT_FOUND` |
| Audit logs can be added later casually | Mutations must write audit entries in the same transaction |
| Docker means the whole app is containerized | Currently Docker only runs PostgreSQL |
| Prisma already exists | Phase 2 will add Prisma schema, migrations, and seed data |

## 14. Before You Modify Code

Ask these questions:

1. Is this change for control plane, data plane, or shared foundation?
2. Does it belong to the current roadmap phase?
3. Does it preserve deterministic evaluation?
4. Does it preserve safe default-off behavior?
5. If it mutates configuration, where is the audit log written?
6. Does it expose PII or secrets to the frontend?
7. Does README need to be updated?
8. Does a test or future test case need to cover it?

## 15. What To Build Next After This Scaffold

According to the roadmap, the next major implementation phase is **Phase 2 —
Data model and migrations**:

1. Add Prisma.
2. Design `schema.prisma`.
3. Add PostgreSQL-backed models.
4. Add uniqueness and foreign-key constraints.
5. Add append-only audit log structure.
6. Add initial migration.
7. Add seed data for demo scenarios.

Do not skip directly to UI screens before the data model and API foundations are
clear. The MVP is strongest when the full loop works:

```text
Admin configures flag
-> Backend validates and persists
-> Audit log records mutation
-> Demo calls evaluation API
-> Rule engine returns deterministic result
-> Demo shows feature On/Off with reason
```

## 16. One-Sentence Summary

This codebase is currently a Phase 1 monorepo scaffold with a NestJS backend,
React admin dashboard, React demo app, shared TypeScript configuration, and
PostgreSQL local workflow; the next learning focus is understanding how these
pieces will evolve into a deterministic, auditable feature flag platform.
