# Phase 1 Project Scaffold and Local Workflow — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response.

## Original request context

The user asked Codex to teach them step by step how to finish Phase 1 of the
project roadmap. Phase 1 in `docs/plan/implementation-roadmap.md` covers:

- Backend app using NestJS.
- Admin app.
- Demo app.
- Shared TypeScript config.
- Local environment configuration.
- PostgreSQL local setup.
- README quickstart commands.

The response was written for the feature flag platform repository and assumed
Phase 0 API contracts were already documented in
`docs/design/mvp-api-and-contracts.md`.

Inferred local context from the response:

- The root `package.json` existed but still had a default `npm init` shape.
- The repository had not yet been converted into an npm workspace.
- A repository URL in `package.json` contained a secret token. The response
  instructed the user to revoke the token and remove it from committed files.

## Full response reference

Phase 1 is a scaffold and local workflow phase. It should create the project
shell needed for later backend, database, frontend, and demo work, but it
should not implement Prisma schema, migrations, evaluation logic, management
APIs, audit logging, or feature flag rules yet.

The desired Phase 1 repository shape is:

```text
apps/backend   # NestJS API
apps/admin     # Vite React admin dashboard
apps/demo      # Vite React demo app
package.json   # root npm workspace
package-lock.json
tsconfig.base.json
.env.example
README.md quickstart
```

### Step 0 — Fix root package metadata and remove secrets

The first professional cleanup task is to replace the default root
`package.json` with a workspace-aware file and remove any credential-bearing
repository URL.

If a GitHub token or other credential was ever committed or displayed in
`package.json`, revoke it in the provider UI immediately. Do not merely delete
the token from the file and keep using it.

The root `package.json` should be shaped like this:

```json
{
  "name": "feature-flag-platform",
  "version": "0.1.0",
  "private": true,
  "description": "A lightweight feature flag platform for researching and demonstrating safe feature release management in web applications.",
  "workspaces": [
    "apps/*"
  ],
  "scripts": {
    "dev:backend": "npm run start:dev --workspace=@ffp/backend",
    "dev:admin": "npm run dev --workspace=@ffp/admin -- --host 0.0.0.0 --port 5173",
    "dev:demo": "npm run dev --workspace=@ffp/demo -- --host 0.0.0.0 --port 5174",
    "build": "npm run build --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present",
    "test": "npm run test --workspaces --if-present"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/fabyanbui/feature-flag-platform.git"
  },
  "license": "UNLICENSED"
}
```

Rationale:

- `private: true` prevents accidental package publication.
- `workspaces: ["apps/*"]` lets one root install manage all app packages.
- Root scripts create a consistent local workflow for backend, admin, and demo.
- The repository URL must be public-safe and must not contain credentials.

### Step 1 — Create app folders

Create the workspace app directory:

```bash
mkdir -p apps
```

### Step 2 — Scaffold the NestJS backend

From the repository root, run:

```bash
cd apps
npx @nestjs/cli@latest new backend --skip-git --skip-install --strict --package-manager npm
cd ..
```

Then edit `apps/backend/package.json` so the generated package becomes a
workspace package:

```json
{
  "name": "@ffp/backend",
  "private": true
}
```

Keep the generated NestJS scripts such as `start`, `start:dev`, `build`,
`test`, and `lint`.

### Step 3 — Scaffold the admin app

From the repository root, run:

```bash
npm create vite@latest apps/admin -- --template react-ts
```

Then edit `apps/admin/package.json`:

```json
{
  "name": "@ffp/admin",
  "private": true
}
```

The admin app is the future control-plane dashboard for projects, feature
flags, rule editing, and audit-log inspection. In Phase 1 it only needs to
boot.

### Step 4 — Scaffold the demo app

From the repository root, run:

```bash
npm create vite@latest apps/demo -- --template react-ts
```

Then edit `apps/demo/package.json`:

```json
{
  "name": "@ffp/demo",
  "private": true
}
```

The demo app is the future data-plane consumer that calls the evaluation API.
In Phase 1 it only needs to boot.

### Step 5 — Install dependencies from the root

Run all dependency installation from the repository root:

```bash
npm install
```

This should create a single root-level `package-lock.json`.

Do not keep package lock files inside:

```text
apps/backend/package-lock.json
apps/admin/package-lock.json
apps/demo/package-lock.json
```

The root lockfile keeps dependency resolution deterministic across all apps.

### Step 6 — Add shared TypeScript config

Create `tsconfig.base.json` in the repository root:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

The immediate Phase 1 deliverable is that a shared base TypeScript config
exists. Later, each generated app config can extend it while preserving
framework-specific generated compiler options.

### Step 7 — Configure backend `/v1` prefix and safe local CORS

Edit `apps/backend/src/main.ts` so the backend uses the Phase 0 `/v1` API base
path and reads local development ports/origins from environment variables:

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('v1');

  const allowedOrigins = [
    process.env.ADMIN_ORIGIN,
    process.env.DEMO_ORIGIN,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  });

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);
}

bootstrap();
```

Rationale:

- The Phase 0 contracts require the `/v1` base path.
- CORS should be explicit and local-development oriented.
- The backend should not hard-code frontend origins.

### Step 8 — Update environment examples

Replace the root `.env.example` with development-safe placeholders. Do not
commit real `.env` files or secrets.

Example shape:

```bash
# Backend API
DATABASE_URL=postgresql://<dev-user>:<dev-password>@localhost:5432/<dev-db>?schema=public
API_PORT=3000
ADMIN_ORIGIN=http://localhost:5173
DEMO_ORIGIN=http://localhost:5174

# Frontend apps
VITE_API_BASE_URL=http://localhost:3000/v1
VITE_DEFAULT_PROJECT_KEY=demo-project
VITE_DEFAULT_FLAG_KEY=new-checkout
```

The Vite values are intentionally prefixed with `VITE_` because frontend build
tools expose those values to browser code. Never place secrets behind `VITE_`
variables.

### Step 9 — Update `.gitignore`

Use a `.gitignore` that excludes dependencies, build output, coverage output,
and all real environment files while preserving examples:

```gitignore
node_modules/
dist/
coverage/

.env
.env.*
!.env.example

apps/*/.env
apps/*/.env.*
!apps/*/.env.example

.DS_Store
```

### Step 10 — Start local PostgreSQL

For Phase 1, only prove PostgreSQL can run locally. Do not create the Prisma
schema yet. Do not run migrations yet.

One acceptable local setup is a one-off PostgreSQL container:

```bash
docker run --name ffp-postgres \
  -e POSTGRES_USER=<dev-user> \
  -e POSTGRES_PASSWORD=<dev-password> \
  -e POSTGRES_DB=<dev-db> \
  -p 5432:5432 \
  -d postgres:16
```

Use a matching local `DATABASE_URL` in the developer's uncommitted `.env`.

Prisma schema, database tables, constraints, migrations, and seed data belong
to Phase 2, not Phase 1.

### Step 11 — Run each app

Backend:

```bash
npm run dev:backend
```

Admin:

```bash
npm run dev:admin
```

Demo:

```bash
npm run dev:demo
```

Expected local URLs:

```text
Backend: http://localhost:3000/v1
Admin:   http://localhost:5173
Demo:    http://localhost:5174
```

### Step 12 — Update README quickstart

Add a `Local Development Quickstart` section to `README.md`:

```md
## Local Development Quickstart

Install dependencies:

```bash
npm install
```

Start PostgreSQL locally, then create `.env` from `.env.example`.

Run the backend:

```bash
npm run dev:backend
```

Run the admin app:

```bash
npm run dev:admin
```

Run the demo app:

```bash
npm run dev:demo
```

Local URLs:

- Backend API: `http://localhost:3000/v1`
- Admin app: `http://localhost:5173`
- Demo app: `http://localhost:5174`
```

## Key decisions and rationale

- **Use npm workspaces.** The repo has three applications but should maintain
  one root dependency graph and one lockfile.
- **Use `apps/backend`, `apps/admin`, and `apps/demo`.** This keeps control
  plane, data plane, and presentation/demo concerns separated.
- **Use NestJS for the backend.** This aligns with the documented MVP stack.
- **Use Vite React TypeScript for admin and demo apps.** This provides a fast
  frontend scaffold without overbuilding Phase 1.
- **Use `/v1` immediately in the backend bootstrap.** This prevents later
  endpoint drift from the Phase 0 API contracts.
- **Keep PostgreSQL setup minimal.** Phase 1 needs local infrastructure only;
  Prisma schema and migrations are Phase 2.
- **Do not implement feature flag behavior yet.** Evaluation logic, stable
  hashing, audit logging, validation DTOs, and management APIs are later
  roadmap phases.
- **Remove and revoke leaked tokens.** Any credential embedded in a committed
  file must be treated as compromised.

## Commands, files, and artifacts

Primary commands:

```bash
mkdir -p apps
cd apps
npx @nestjs/cli@latest new backend --skip-git --skip-install --strict --package-manager npm
cd ..
npm create vite@latest apps/admin -- --template react-ts
npm create vite@latest apps/demo -- --template react-ts
npm install
npm run dev:backend
npm run dev:admin
npm run dev:demo
npm run build
git diff --check
```

Primary files to create or update:

```text
package.json
package-lock.json
tsconfig.base.json
.env.example
.gitignore
README.md
apps/backend/package.json
apps/backend/src/main.ts
apps/admin/package.json
apps/demo/package.json
```

Generated app directories:

```text
apps/backend/
apps/admin/
apps/demo/
```

## Validation checklist

Phase 1 is complete when:

- [ ] Root `package.json` is workspace-aware.
- [ ] Root `package.json` contains no credentials.
- [ ] Any exposed token has been revoked.
- [ ] `apps/backend` exists and runs as a NestJS app.
- [ ] `apps/admin` exists and runs as a Vite React TypeScript app.
- [ ] `apps/demo` exists and runs as a Vite React TypeScript app.
- [ ] Workspace package names are `@ffp/backend`, `@ffp/admin`, and
      `@ffp/demo`.
- [ ] One root `package-lock.json` exists.
- [ ] No nested app-level lockfiles are kept.
- [ ] `tsconfig.base.json` exists.
- [ ] Backend bootstrap uses `app.setGlobalPrefix('v1')`.
- [ ] Backend bootstrap reads `API_PORT`, `ADMIN_ORIGIN`, and `DEMO_ORIGIN`.
- [ ] `.env.example` documents local backend and frontend configuration.
- [ ] Real `.env` files are ignored.
- [ ] PostgreSQL local setup is available and documented.
- [ ] README includes install and run commands.
- [ ] `npm run build` succeeds.
- [ ] `git diff --check` succeeds.

## Risks and caveats

- Do not continue using any token that appeared in a committed or displayed
  repository URL. Revoke it first.
- Do not commit real `.env` files.
- Do not put secrets in `VITE_` variables because Vite exposes those values to
  browser code.
- Do not add Prisma schema, migrations, seed data, DTO validation, Swagger,
  audit logging, evaluation logic, or management APIs in Phase 1. Those are
  later roadmap phases.
- Do not add Docker Compose as a required one-command setup in Phase 1. The
  Phase 0 contract marks one-command Docker Compose setup as outside MVP scope
  unless required deliverables are already complete.
- Keep frontend status language clear in later phases: management lifecycle
  status labels such as `Enabled`, `Disabled`, and `Archived` are distinct from
  runtime evaluation state `On` or `Off`.

## Reuse prompts

Use these prompts to continue from this reference:

```text
Review my current repo against docs/codex/reference/phase-1-project-scaffold-local-workflow.md and tell me exactly what Phase 1 tasks remain.
```

```text
Implement the remaining Phase 1 scaffold tasks from docs/codex/reference/phase-1-project-scaffold-local-workflow.md without starting Phase 2.
```

```text
Validate whether Phase 1 is complete using the checklist in docs/codex/reference/phase-1-project-scaffold-local-workflow.md.
```

```text
Now that Phase 1 is complete, teach me how to start Phase 2 while preserving deterministic evaluation, append-only audit logging, and control-plane/data-plane separation.
```
