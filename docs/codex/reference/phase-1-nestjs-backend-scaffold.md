# Phase 1 NestJS Backend Scaffold — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response.

## Original request context

The user is implementing Phase 1 from
`docs/plan/implementation-roadmap.md`, after completing Phase 0 in
`docs/design/mvp-api-and-contracts.md`.

The immediate prior workflow was:

1. Step 1 established the root npm workspace package.
2. The user reported `Step 1 done`.
3. Codex provided Step 2 guidance for scaffolding the NestJS backend app.

Relevant Phase 1 deliverables:

- Backend app using NestJS.
- Shared local workflow through the root npm workspace.
- Local environment configuration.
- README quickstart commands later in the phase.

Repo guardrails that apply:

- Keep management/control-plane APIs separate from data-plane evaluation.
- Use `/v1` as the API base path.
- Preserve safe defaults and deterministic evaluation for later phases.
- Do not implement Prisma schema, migrations, database models, real API
  endpoints, or evaluation logic during this scaffold step.

## Full response reference

Step 2 is to scaffold the NestJS backend application under `apps/backend`,
register it as the workspace package `@ffp/backend`, run it locally, and make
it use the `/v1` API prefix required by the Phase 0 API contracts.

### 2.1 Create the backend app

From the repo root:

```bash
mkdir -p apps
cd apps
npx @nestjs/cli@latest new backend --skip-git --skip-install --strict --package-manager npm
cd ..
```

If the Nest CLI asks questions, choose:

```text
Package manager: npm
```

Do not run `npm install` inside `apps/backend`. Dependency installation should
happen from the repository root so the root npm workspace owns the lockfile.

### 2.2 Rename the backend package

Open:

```text
apps/backend/package.json
```

Change:

```json
"name": "backend"
```

to:

```json
"name": "@ffp/backend"
```

Also add:

```json
"private": true
```

The top of `apps/backend/package.json` should look similar to:

```json
{
  "name": "@ffp/backend",
  "version": "0.0.1",
  "private": true
}
```

Preserve the generated NestJS scripts unless there is a clear reason to adjust
them later.

### 2.3 Install dependencies from the root

From the repo root:

```bash
npm install
```

Then install Nest configuration support into the backend workspace:

```bash
npm install @nestjs/config --workspace=@ffp/backend
```

### 2.4 Configure `/v1` and CORS

Open:

```text
apps/backend/src/main.ts
```

Replace it with:

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

This keeps the backend aligned with the documented `/v1` contract while still
leaving real endpoints for later phases.

### 2.5 Load environment variables

Open:

```text
apps/backend/src/app.module.ts
```

Update it to include `ConfigModule`:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

The `envFilePath` order lets the backend read an app-local `.env` first, then
fall back to the repository root `.env`.

### 2.6 Run the backend

From the repo root:

```bash
npm run dev:backend
```

Expected output should include a successful NestJS startup message.

Then test it in another terminal:

```bash
curl http://localhost:3000/v1
```

Expected response:

```text
Hello World!
```

## Key decisions and rationale

- Use `apps/backend` to keep backend code separate from documentation, admin
  frontend code, and demo app code.
- Use npm workspaces so root scripts can run app-specific scripts without
  nested lockfiles.
- Use the package name `@ffp/backend` to make the app identifiable as a
  workspace package and avoid a generic `backend` package name.
- Use `--skip-git` because the repository already has a Git history.
- Use `--skip-install` so dependencies install from the root workspace.
- Use `--strict` to scaffold TypeScript with stricter defaults.
- Set `app.setGlobalPrefix('v1')` immediately because Phase 0 fixed `/v1` as
  the API base path.
- Enable CORS from `ADMIN_ORIGIN` and `DEMO_ORIGIN` only, defaulting to no
  browser origin if those variables are absent.
- Add `@nestjs/config` at scaffold time because local environment loading is a
  Phase 1 deliverable.
- Avoid Prisma, migrations, evaluation rules, audit logging, DTO validation,
  and management endpoints until their roadmap phases.

## Commands, files, and artifacts

Commands:

```bash
mkdir -p apps
cd apps
npx @nestjs/cli@latest new backend --skip-git --skip-install --strict --package-manager npm
cd ..
npm install
npm install @nestjs/config --workspace=@ffp/backend
npm run dev:backend
curl http://localhost:3000/v1
```

Files created or changed:

```text
apps/backend/
apps/backend/package.json
apps/backend/src/main.ts
apps/backend/src/app.module.ts
package-lock.json
```

Root script expected from Step 1:

```json
{
  "dev:backend": "npm run start:dev --workspace=@ffp/backend"
}
```

## Validation checklist

Step 2 is complete when:

- `apps/backend` exists.
- `apps/backend/package.json` has `"name": "@ffp/backend"`.
- `apps/backend/package.json` has `"private": true`.
- Root `npm install` succeeds.
- `@nestjs/config` is installed in the backend workspace.
- `apps/backend/src/main.ts` sets the global prefix to `v1`.
- `apps/backend/src/main.ts` reads `API_PORT`, defaulting to `3000`.
- `apps/backend/src/main.ts` enables CORS only for configured admin/demo
  origins.
- `apps/backend/src/app.module.ts` imports `ConfigModule.forRoot`.
- `npm run dev:backend` starts successfully from the repo root.
- `curl http://localhost:3000/v1` returns `Hello World!`.
- No Prisma schema, database model, real management API, or evaluation engine
  has been added yet.

Recommended repository validation:

```bash
git diff --check
```

## Risks and caveats

- Running `npm install` inside `apps/backend` may create a nested lockfile.
  Prefer root-level installation only.
- If `curl http://localhost:3000/v1` does not return `Hello World!`, verify
  that `app.setGlobalPrefix('v1')` is present and the generated controller is
  still mounted at the root route.
- If `npm run dev:backend` cannot find workspace `@ffp/backend`, verify the
  root `package.json` has `"workspaces": ["apps/*"]` and the backend package
  name is exactly `@ffp/backend`.
- If port `3000` is already occupied, set `API_PORT` to another local port and
  update frontend `VITE_API_BASE_URL` later.
- CORS environment variables are not authentication. Authentication and RBAC
  remain outside MVP scope unless required deliverables are already complete.
- The scaffold's `Hello World!` route is only a temporary health check. It
  should not be mistaken for an MVP API endpoint.

## Reuse prompts

Use these prompts to continue or validate the work:

```text
Review my Phase 1 backend scaffold against docs/design/mvp-api-and-contracts.md
and AGENTS.md. Check that it is scoped to scaffolding only.
```

```text
I finished the Phase 1 NestJS backend scaffold. Teach me Step 3: shared
TypeScript configuration for the backend, admin app, and demo app.
```

```text
Inspect apps/backend/package.json, apps/backend/src/main.ts, and
apps/backend/src/app.module.ts. Tell me whether Step 2 is complete.
```
