# Phase 2 Prisma Validation Tooling Fix — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response about fixing Prisma validation failures during Phase 2 data-model setup.

## Original request context

The user was implementing Phase 2 of the Feature Flag Platform roadmap: data model and migrations. They had completed Step 3 by creating `apps/backend/prisma/schema.prisma` and moved to Step 4: validating the Prisma schema.

When running validation, they hit two problems:

```text
npm run prisma:validate --workspace=@ffp/backend
npm error Missing script: "prisma:validate"
```

Then, when running Prisma directly:

```text
cd apps/backend
npx prisma validate --schema prisma/schema.prisma
Unknown error during config file loading: Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'jiti' imported from /home/fabyanbui/drive/feature-flag-platform/node_modules/c12/dist/index.mjs
```

This reference captures the fix so future Codex sessions can continue Phase 2 without needing the chat transcript.

## Full response reference

There are two separate issues to fix before continuing to migrations.

### Issue 1 — Missing `prisma:validate` script

Open:

```text
apps/backend/package.json
```

Inside the `"scripts"` object, add the Prisma scripts if they are missing:

```json
"prisma:validate": "prisma validate --schema prisma/schema.prisma",
"prisma:generate": "prisma generate --schema prisma/schema.prisma",
"prisma:migrate": "prisma migrate dev --schema prisma/schema.prisma",
"prisma:studio": "prisma studio --schema prisma/schema.prisma",
"db:seed": "prisma db seed --schema prisma/schema.prisma"
```

Be careful with JSON commas when editing `package.json`.

### Issue 2 — Missing `jiti`

The error:

```text
Cannot find package 'jiti'
```

means Prisma is trying to load `prisma.config.ts`, but the TypeScript config loader needs `jiti` available in the workspace dependency tree.

From the repository root, run:

```bash
npm install -D jiti --workspace=@ffp/backend
```

### Retry validation

From the repository root, run:

```bash
npm run prisma:validate --workspace=@ffp/backend
```

If that still fails, run Prisma directly from the backend app:

```bash
cd apps/backend
npx prisma validate --schema prisma/schema.prisma
```

Expected successful result:

```text
The schema at prisma/schema.prisma is valid
```

### Improve `prisma.config.ts`

Update:

```text
apps/backend/prisma.config.ts
```

to fail clearly if `DATABASE_URL` is missing:

```ts
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: '../../.env' });
config({ path: '.env', override: true });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Check root .env or apps/backend/.env.');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
```

After installing `jiti` and updating the scripts, try validation again and inspect the result.

## Key decisions and rationale

- The missing `prisma:validate` npm script is a workspace script configuration issue, not a schema issue.
- The missing `jiti` package is a Prisma 7 TypeScript config loading issue. Prisma reads `apps/backend/prisma.config.ts`, and the loader depends on `jiti`.
- `prisma.config.ts` should fail fast with a clear `DATABASE_URL` error rather than letting Prisma fail later with a less obvious migration or datasource error.
- The config loads the root `.env` first, then allows an app-local `apps/backend/.env` to override it. This matches the Phase 1 local workflow and keeps backend configuration flexible.

## Commands, files, and artifacts

Files involved:

```text
apps/backend/package.json
apps/backend/prisma.config.ts
apps/backend/prisma/schema.prisma
.env
```

Commands:

```bash
npm install -D jiti --workspace=@ffp/backend
npm run prisma:validate --workspace=@ffp/backend
```

Fallback direct validation command:

```bash
cd apps/backend
npx prisma validate --schema prisma/schema.prisma
```

Expected success message:

```text
The schema at prisma/schema.prisma is valid
```

## Validation checklist

Before moving to Phase 2 Step 5, confirm:

- `apps/backend/package.json` includes `prisma:validate`.
- `apps/backend/package.json` includes `prisma:generate`.
- `apps/backend/package.json` includes `prisma:migrate`.
- `apps/backend/package.json` includes `prisma:studio`.
- `apps/backend/package.json` includes `db:seed`.
- `jiti` is installed as a backend workspace dev dependency.
- `apps/backend/prisma.config.ts` loads `.env` and throws clearly when `DATABASE_URL` is missing.
- `npm run prisma:validate --workspace=@ffp/backend` succeeds.

Optional follow-up validation:

```bash
npm run prisma:generate --workspace=@ffp/backend
```

## Risks and caveats

- Do not create or apply migrations until schema validation succeeds.
- Do not commit `.env`; it is ignored and may contain local-only configuration.
- If Prisma validation fails after these fixes, inspect the next error carefully. It may then be a real schema issue rather than a tooling/config issue.
- Keep Phase 2 scoped to data model, migrations, PostgreSQL config, audit constraints, and seed data. Do not implement controllers or evaluation APIs yet.

## Reuse prompts

Use these prompts to continue the workflow:

```text
Continue Phase 2 Step 4. Validate the Prisma schema after adding jiti and the prisma:validate script.
```

```text
Review apps/backend/prisma.config.ts and apps/backend/package.json for Prisma 7 compatibility before creating the initial migration.
```

```text
Step 4 validation succeeded. Guide me through Step 5: create the initial migration without applying it yet.
```
