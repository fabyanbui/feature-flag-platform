# Local Development Workflow — Feature Flag Platform

This document explains how to run, validate, debug, and reason about the local
development workflow from scratch. It is written for the current **Phase 1
scaffold**, then explains how the workflow will expand when Prisma,
PostgreSQL-backed APIs, seed data, and evaluation logic are added.

## 1. What Local Development Means in This Project

Local development means running the whole mini feature flag platform on your
machine so you can build and verify the MVP before the July 7, 2026 submission
and July 9, 2026 presentation.

The intended local loop is:

```text
edit code or docs
-> run the relevant app locally
-> verify behavior in browser/API/terminal
-> run validation commands
-> commit a small, explainable change
```

Current Phase 1 local development includes:

1. npm workspace at the repository root.
2. NestJS backend scaffold.
3. Vite React admin dashboard scaffold.
4. Vite React demo app scaffold.
5. Shared TypeScript configuration.
6. Environment examples.
7. Docker-based PostgreSQL startup instructions.

Current Phase 1 local development does **not** yet include:

1. Prisma schema.
2. Prisma migrations.
3. Seed data.
4. Real management APIs.
5. Real evaluation API.
6. Database reads or writes.
7. Audit logging persistence.

That distinction matters. You can start PostgreSQL now, but the backend does
not yet use it until the data model and Prisma layer are implemented.

## 2. Local Architecture

The current local topology is:

```mermaid
graph LR
  Dev[Developer Terminal]
  Browser[Browser]
  Backend[NestJS Backend<br/>localhost:3000/v1]
  Admin[Vite Admin<br/>localhost:5173]
  Demo[Vite Demo<br/>localhost:5174]
  Pg[(PostgreSQL Docker Container<br/>localhost:5432)]

  Dev --> Backend
  Dev --> Admin
  Dev --> Demo
  Browser --> Admin
  Browser --> Demo
  Admin -. future REST calls .-> Backend
  Demo -. future evaluate call .-> Backend
  Backend -. future Prisma connection .-> Pg
```

Current status:

- Backend starts and serves the placeholder `GET /v1`.
- Admin starts and shows a control-plane placeholder screen.
- Demo starts and shows a data-plane placeholder screen.
- PostgreSQL can be started with Docker but is not yet connected to backend
  code.

Future status:

- Admin will call backend management APIs.
- Demo will call `POST /v1/evaluate`.
- Backend will use Prisma to read and write PostgreSQL.
- Mutations will write append-only audit logs in the same transaction.

## 3. Tools You Need

### 3.1 Required tools

| Tool | Why it is needed |
| --- | --- |
| Git | Branches, commits, diffs, and collaboration. |
| Node.js | Runs NestJS, Vite, TypeScript, and tooling. |
| npm | Installs workspace dependencies and runs scripts. |
| Docker or local PostgreSQL | Provides the database for later phases. |
| Browser | Opens admin and demo apps. |
| Terminal | Runs backend, frontend apps, tests, and validation. |

Recommended Node.js versions from `README.md`:

```text
Node.js 20.19+ or 22.12+
```

Check local versions:

```bash
node --version
npm --version
git --version
docker --version
```

If Docker is unavailable, you can use a local PostgreSQL installation instead,
but the README workflow assumes Docker.

### 3.2 Optional tools

| Tool | Why it helps |
| --- | --- |
| `curl` | Quick API checks from terminal. |
| `psql` | Direct PostgreSQL inspection. |
| `markdownlint` | Documentation quality checks. |
| VS Code or another IDE | Easier navigation and integrated terminals. |

## 4. Important Local Files

```text
.
├── package.json
├── package-lock.json
├── .env.example
├── .env
├── .gitignore
├── tsconfig.base.json
├── apps/backend/package.json
├── apps/admin/package.json
├── apps/demo/package.json
├── apps/admin/.env.example
└── apps/demo/.env.example
```

### 4.1 Root `package.json`

The root package defines the npm workspace:

```json
{
  "workspaces": ["apps/*"]
}
```

This means the root is the control point for dependencies and scripts. The
project uses these root scripts:

| Command | What it does |
| --- | --- |
| `npm run dev:backend` | Starts the NestJS backend in watch mode. |
| `npm run dev:admin` | Starts the admin Vite app on port `5173`. |
| `npm run dev:demo` | Starts the demo Vite app on port `5174`. |
| `npm run build` | Builds all workspaces that have a build script. |
| `npm run lint` | Runs linting in all workspaces that have a lint script. |
| `npm run test` | Runs tests in all workspaces that have a test script. |
| `npm run diff:check` | Runs `git diff --check` for whitespace validation. |

### 4.2 `package-lock.json`

The lockfile records exact dependency versions. Commit it when dependencies
change. Do not manually edit it.

### 4.3 `.env.example` and `.env`

`.env.example` is committed as the safe template. `.env` is local-only and is
ignored by Git.

Create local env:

```bash
cp .env.example .env
```

Current app-related variables:

| Variable | Used by | Meaning |
| --- | --- | --- |
| `DATABASE_URL` | Future backend Prisma layer | PostgreSQL connection string. |
| `API_PORT` | Backend | HTTP port, default `3000`. |
| `ADMIN_ORIGIN` | Backend CORS | Allowed admin browser origin. |
| `DEMO_ORIGIN` | Backend CORS | Allowed demo browser origin. |
| `VITE_API_BASE_URL` | Admin and demo | Browser-visible API base URL. |
| `VITE_DEFAULT_PROJECT_KEY` | Admin and demo | Demo project key. |
| `VITE_DEFAULT_FLAG_KEY` | Admin and demo | Demo flag key. |

Important security rule:

> Any `VITE_*` variable is exposed to frontend browser code. Never put secrets
> in `VITE_*` variables.

### 4.4 `.gitignore`

Current ignore rules protect local/generated files:

```text
node_modules/
dist/
coverage/
.env
.env.*
apps/*/.env
apps/*/.env.*
```

`.env.example` files are explicitly allowed so safe templates can be committed.

## 5. First-Time Setup From Scratch

Use this if you just cloned the repository or switched to a fresh machine.

### 5.1 Enter the repository

```bash
cd /home/fabyanbui/drive/feature-flag-platform
```

Confirm you are in the right place:

```bash
pwd
git status --short
```

### 5.2 Install dependencies

Run from the repository root:

```bash
npm install
```

Why root only:

- the root workspace owns all apps under `apps/*`,
- root `package-lock.json` should stay the single lockfile,
- installing inside individual apps can create confusing duplicated lockfiles
  or dependency states.

### 5.3 Configure environment

```bash
cp .env.example .env
```

Then inspect:

```bash
sed -n '1,120p' .env
```

For normal local development, the default values are enough:

```text
Backend API: http://localhost:3000/v1
Admin app:   http://localhost:5173
Demo app:    http://localhost:5174
Database:    postgresql://ffp:ffp_dev_password@localhost:5432/ffp_dev?schema=public
```

### 5.4 Start PostgreSQL

Create the local PostgreSQL container:

```bash
docker run --name ffp-postgres \
  -e POSTGRES_USER=ffp \
  -e POSTGRES_PASSWORD=ffp_dev_password \
  -e POSTGRES_DB=ffp_dev \
  -p 5432:5432 \
  -d postgres:16
```

If the container already exists:

```bash
docker start ffp-postgres
```

Verify:

```bash
docker exec ffp-postgres psql -U ffp -d ffp_dev -c "select current_database(), current_user;"
```

Expected idea:

```text
current_database = ffp_dev
current_user     = ffp
```

Note: exact table formatting may differ by terminal.

### 5.5 Start backend

Use a dedicated terminal:

```bash
npm run dev:backend
```

Then check the placeholder route:

```bash
curl http://localhost:3000/v1
```

Current Phase 1 expected response:

```text
Hello World!
```

If you see this response, the NestJS backend scaffold is running.

### 5.6 Start admin dashboard

Use a second terminal:

```bash
npm run dev:admin
```

Open:

```text
http://localhost:5173
```

Expected Phase 1 screen:

- title: Admin Dashboard,
- API base URL,
- default project key,
- note that runtime state is not evaluated in the admin scaffold.

### 5.7 Start demo app

Use a third terminal:

```bash
npm run dev:demo
```

Open:

```text
http://localhost:5174
```

Expected Phase 1 screen:

- title: Demo Application,
- evaluation API URL,
- project key,
- flag key,
- note that runtime state is not evaluated in Phase 1.

## 6. Daily Development Loop

For everyday work, use this loop:

```text
1. git status --short
2. start or verify PostgreSQL if database work is needed
3. start the relevant app(s)
4. make a small change
5. manually verify behavior
6. run targeted validation
7. run broader validation before commit
8. commit with a specific imperative message
```

### 6.1 Start only what you need

| Work type | Start these |
| --- | --- |
| Backend route or service work | Backend, PostgreSQL if DB is involved. |
| Admin UI-only work | Admin, backend if API integration is involved. |
| Demo UI-only work | Demo, backend if evaluation integration is involved. |
| Evaluation API work | Backend, PostgreSQL, optionally demo. |
| Documentation-only work | No app required; run doc validation. |

### 6.2 Keep terminals predictable

Recommended terminal layout:

| Terminal | Command |
| --- | --- |
| 1 | `npm run dev:backend` |
| 2 | `npm run dev:admin` |
| 3 | `npm run dev:demo` |
| 4 | Git, Docker, tests, curl, notes |

### 6.3 Save and observe

Current tools have watch/HMR behavior:

- NestJS `start:dev` watches backend TypeScript files.
- Vite updates admin and demo quickly in the browser.

If a change does not appear:

1. Check the terminal for compile errors.
2. Refresh the browser.
3. Confirm you edited the correct app.
4. Restart the dev server if needed.

## 7. Validation Workflow

Validation should become stricter as code moves closer to MVP.

### 7.1 Documentation-only changes

Run:

```bash
npm run diff:check
```

Equivalent:

```bash
git diff --check
```

If available:

```bash
markdownlint docs/**/*.md README.md AGENTS.md
```

### 7.2 Backend changes

Run targeted backend checks:

```bash
npm run build --workspace=@ffp/backend
npm run test --workspace=@ffp/backend
npm run lint --workspace=@ffp/backend
```

If e2e tests are relevant:

```bash
npm run test:e2e --workspace=@ffp/backend
```

### 7.3 Admin changes

Run:

```bash
npm run build --workspace=@ffp/admin
npm run lint --workspace=@ffp/admin
```

Then manually verify:

```text
http://localhost:5173
```

### 7.4 Demo changes

Run:

```bash
npm run build --workspace=@ffp/demo
npm run lint --workspace=@ffp/demo
```

Then manually verify:

```text
http://localhost:5174
```

### 7.5 Before committing

For a broad check:

```bash
npm run build
npm run test
npm run lint
npm run diff:check
```

If lint has auto-fix behavior, inspect the diff after running it:

```bash
git diff --stat
git diff
```

## 8. Understanding Each Script

### 8.1 Root scripts

```json
{
  "dev:backend": "npm run start:dev --workspace=@ffp/backend",
  "dev:admin": "npm run dev --workspace=@ffp/admin -- --host 0.0.0.0 --port 5173",
  "dev:demo": "npm run dev --workspace=@ffp/demo -- --host 0.0.0.0 --port 5174",
  "build": "npm run build --workspaces --if-present",
  "lint": "npm run lint --workspaces --if-present",
  "test": "npm run test --workspaces --if-present",
  "diff:check": "git diff --check"
}
```

Explanation:

- `--workspace=@ffp/backend` tells npm to run a script inside one workspace.
- `--workspaces --if-present` tells npm to run the script in every workspace
  that has that script.
- `-- --host 0.0.0.0 --port 5173` forwards arguments to Vite.

### 8.2 Backend scripts

| Script | Meaning |
| --- | --- |
| `start:dev` | Start NestJS in watch mode. |
| `build` | Compile backend into `dist/`. |
| `test` | Run Jest unit tests under backend `src/`. |
| `test:e2e` | Run backend e2e tests from `apps/backend/test`. |
| `lint` | Run ESLint, currently with auto-fix. |

### 8.3 Frontend scripts

Admin and demo share the same Vite-style scripts:

| Script | Meaning |
| --- | --- |
| `dev` | Start Vite dev server with HMR. |
| `build` | Run TypeScript build and Vite production build. |
| `lint` | Run ESLint. |
| `preview` | Preview a production build locally. |

## 9. Environment Loading Model

### 9.1 Backend environment

Backend uses `@nestjs/config` in `apps/backend/src/app.module.ts`.

It currently loads env files from:

```text
.env
../../.env
```

Why two paths:

- When running from the repository root, `.env` can resolve to root `.env`.
- When running from inside `apps/backend`, `../../.env` can resolve to root
  `.env`.

Backend reads:

- `API_PORT`,
- `ADMIN_ORIGIN`,
- `DEMO_ORIGIN`,
- future `DATABASE_URL`.

### 9.2 Frontend environment

Admin and demo are Vite apps. Vite exposes only variables prefixed with:

```text
VITE_
```

Current frontend variables:

```text
VITE_API_BASE_URL=http://localhost:3000/v1
VITE_DEFAULT_PROJECT_KEY=demo-project
VITE_DEFAULT_FLAG_KEY=new-checkout
```

If frontend env changes do not appear, restart the Vite dev server. Vite often
requires restart for env file changes.

## 10. Docker and PostgreSQL Workflow

### 10.1 What Docker does right now

Docker currently runs only the database:

```text
container name: ffp-postgres
image:          postgres:16
host port:      5432
database:       ffp_dev
user:           ffp
password:       ffp_dev_password
```

The backend, admin, and demo apps run directly with npm on your host machine.

### 10.2 Useful Docker commands

List containers:

```bash
docker ps
docker ps -a
```

Start existing database container:

```bash
docker start ffp-postgres
```

Stop database container:

```bash
docker stop ffp-postgres
```

View logs:

```bash
docker logs ffp-postgres
```

Open `psql` command:

```bash
docker exec -it ffp-postgres psql -U ffp -d ffp_dev
```

Run a one-off query:

```bash
docker exec ffp-postgres psql -U ffp -d ffp_dev -c "select now();"
```

### 10.3 Current database limitation

There are no application tables yet. Before Prisma migrations, commands like
`\dt` may show no relations.

That is expected in Phase 1.

Future Phase 2 will add:

```text
prisma/schema.prisma
prisma/migrations/
seed data
Prisma client
backend Prisma module/service
```

## 11. Browser and API Checks

### 11.1 Backend health check

Current Phase 1:

```bash
curl http://localhost:3000/v1
```

Expected:

```text
Hello World!
```

Future MVP:

- `GET /v1` may become a structured health or info response.
- real endpoints should include `/v1/projects`, `/v1/evaluate`, and audit log
  routes.

### 11.2 Admin page check

Open:

```text
http://localhost:5173
```

Check:

- Does the page load?
- Does it show the expected API base URL?
- Does it communicate control-plane responsibility?

### 11.3 Demo page check

Open:

```text
http://localhost:5174
```

Check:

- Does the page load?
- Does it show the expected evaluation API URL?
- Does it show the expected project and flag keys?
- Does it communicate data-plane responsibility?

## 12. Common Problems and Fixes

### 12.1 `EADDRINUSE` or port already in use

Meaning: another process is already using the port.

Common ports:

```text
3000 backend
5173 admin
5174 demo
5432 PostgreSQL
```

Fix options:

1. Stop the existing process.
2. Change the relevant port.
3. Restart the app.

### 12.2 Backend CORS issue

Symptoms:

- browser console says request blocked by CORS,
- API works with `curl` but not from admin/demo.

Check `.env`:

```text
ADMIN_ORIGIN=http://localhost:5173
DEMO_ORIGIN=http://localhost:5174
```

Then restart backend.

### 12.3 Frontend cannot see updated env values

Fix:

```text
Stop Vite dev server
Start it again
Refresh browser
```

Reason: Vite env variables are loaded at dev-server startup.

### 12.4 Docker says container name already exists

If this fails:

```bash
docker run --name ffp-postgres ...
```

Use:

```bash
docker start ffp-postgres
```

The container already exists; it only needs to be started.

### 12.5 PostgreSQL port conflict

If port `5432` is already used, either stop the other PostgreSQL instance or map
the container to another host port. If you change the host port, update
`DATABASE_URL`.

Example if using host port `5433`:

```text
DATABASE_URL=postgresql://ffp:ffp_dev_password@localhost:5433/ffp_dev?schema=public
```

### 12.6 `node_modules` confusion

If dependencies feel inconsistent:

1. Check that you are running commands from the root.
2. Avoid manual dependency edits.
3. Prefer one root lockfile.
4. Re-run `npm install` from root.

Do not commit generated `node_modules/` or `dist/`.

### 12.7 Build passes but browser behavior is old

Try:

1. refresh browser,
2. restart Vite,
3. clear browser cache if needed,
4. confirm you are opening the right port,
5. confirm you changed `apps/admin` versus `apps/demo` correctly.

## 13. Git Workflow for Local Development

### 13.1 Start clean

Before a new task:

```bash
git status --short
```

Understand every changed file before editing more.

### 13.2 Suggested branch naming

For learning docs:

```bash
docs/local-dev-workflow-learning
```

For implementation:

```bash
feat/backend-prisma-schema
feat/evaluation-api
feat/admin-flag-list
```

For fixes:

```bash
fix/backend-cors-config
fix/demo-evaluation-error-state
```

### 13.3 Commit style

Use short imperative subjects:

```text
Add local development workflow notes
Document PostgreSQL startup workflow
Map backend evaluation request flow
```

Before commit:

```bash
git diff --stat
git diff --check
```

## 14. How the Workflow Will Change in Later Phases

### 14.1 Phase 2: Prisma and migrations

Expected new commands may include:

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npx prisma studio
```

Learning goal:

- understand how `DATABASE_URL` connects Prisma to PostgreSQL,
- understand migrations as versioned database changes,
- understand seed data as repeatable demo setup.

### 14.2 Phase 3: Backend foundation

Workflow adds checks for:

- validation pipe,
- error response shape,
- request ID,
- actor header,
- audit logging service,
- transaction helper.

Mutation tests become important.

### 14.3 Phase 4: Evaluation engine

Workflow adds deterministic evaluation tests:

```text
same projectKey + flagKey + targetingKey
-> same result every time
```

Key tests:

- rule order,
- kill switch,
- user allowlist,
- role targeting,
- percentage rollout,
- `NOT_FOUND`,
- `DEFAULT_OFF`,
- `INVALID_CONTEXT`.

### 14.4 Phase 5 and later: full vertical slice

The local workflow should prove this full loop:

```text
Admin creates/updates config
-> Backend validates request
-> PostgreSQL persists config
-> Audit log records before/after
-> Demo calls evaluation API
-> Rule engine returns deterministic decision
-> Demo displays runtime On/Off and reason
```

## 15. Safe Defaults During Local Development

Local development must preserve production-like safety principles:

1. Do not expose secrets in frontend env variables.
2. Do not use emails or phone numbers as rollout keys.
3. Do not make percentage rollout random per request.
4. Do not skip audit logging for mutations once mutation APIs exist.
5. Do not make missing flags crash the demo app.
6. Do not mix admin status labels with runtime evaluation results.
7. Do not add optional enhancements before required MVP flows work.

## 16. Local Workflow Checklist

Use this checklist before saying a local change is ready:

```text
[ ] I understand whether the change affects docs, backend, admin, demo, DB, or all.
[ ] I ran the smallest useful validation command.
[ ] I manually checked the affected local URL or API endpoint if applicable.
[ ] I preserved control-plane/data-plane separation.
[ ] I did not commit real .env secrets.
[ ] I did not commit node_modules, dist, or coverage output.
[ ] I ran git diff --check.
[ ] README commands still match reality, or I updated README.
```

## 17. One Good Practice Session

To learn the local workflow deeply, do this once:

1. Start from a clean terminal.
2. Run `git status --short`.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Start or verify `ffp-postgres`.
6. Start backend and call `curl http://localhost:3000/v1`.
7. Start admin and open `http://localhost:5173`.
8. Start demo and open `http://localhost:5174`.
9. Change one visible sentence in admin.
10. Observe Vite hot reload.
11. Revert the sentence.
12. Run `npm run build`.
13. Run `npm run test`.
14. Run `npm run diff:check`.
15. Write a short note explaining what each command did.

If you can explain every step above, you understand the current local workflow.

## 18. One-Sentence Summary

The local dev workflow is a root npm workspace that runs a NestJS backend, a
Vite admin dashboard, a Vite demo app, and a Docker-hosted PostgreSQL database
locally, with validation through build, test, lint, browser/API checks, and
`git diff --check`.
