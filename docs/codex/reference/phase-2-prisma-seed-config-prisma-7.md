# Phase 2 Prisma Seed Config for Prisma 7 — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response about fixing `prisma db seed` for the Feature Flag Platform backend after Prisma reported that no seed command was configured.

## Original request context

During Phase 2 data-model and seed setup, the user ran:

```bash
npm run db:seed --workspace=@ffp/backend
```

The backend workspace script executed:

```bash
prisma db seed --schema prisma/schema.prisma
```

Prisma loaded `apps/backend/prisma.config.ts`, then returned:

```text
No seed command configured

To seed your database, add a seed property to the migrations section in your Prisma config file.
```

The latest Codex response explained that this is a Prisma 7 configuration change and showed how to update `apps/backend/prisma.config.ts`.

## Full response reference

This is a **Prisma 7** behavior change. The seed command is no longer read from `package.json` for this workflow. It must be configured in `prisma.config.ts` under the `migrations` section.

### Fix seed config

Open:

```text
apps/backend/prisma.config.ts
```

Change this existing configuration:

```ts
migrations: {
  path: 'prisma/migrations',
},
```

to this:

```ts
migrations: {
  path: 'prisma/migrations',
  seed: 'tsx prisma/seed.ts',
},
```

The full `apps/backend/prisma.config.ts` should look like:

```ts
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: '../../.env' });
config({ path: '.env', override: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
```

Then rerun:

```bash
npm run db:seed --workspace=@ffp/backend
```

Expected output includes:

```text
Seed data created successfully.
```

After that, rerun the seed count checks for the Phase 2 demo data.

## Key decisions and rationale

- **Use Prisma 7 config conventions.** In this repository, Prisma loaded `prisma.config.ts`; therefore the seed command belongs in `migrations.seed` rather than relying on the older `package.json` Prisma seed property.
- **Keep the seed command workspace-local.** The command `tsx prisma/seed.ts` assumes execution from `apps/backend`, matching the existing backend workspace scripts and Prisma config paths.
- **Preserve environment loading.** The config loads root `.env` first and then backend `.env` with override support, matching previous Phase 2 setup.
- **Do not change the schema or migration for this error.** The error is only seed command discovery; the validated schema, migration, and database constraints are separate concerns.

## Commands, files, and artifacts

### File to edit

```text
apps/backend/prisma.config.ts
```

### Required config fragment

```ts
migrations: {
  path: 'prisma/migrations',
  seed: 'tsx prisma/seed.ts',
},
```

### Seed command

```bash
npm run db:seed --workspace=@ffp/backend
```

### Related seed file

```text
apps/backend/prisma/seed.ts
```

The seed file should create the Phase 2 demo data for:

- `demo-project`
- `production`, `staging`, and `development` environments
- `beta-dashboard` and `new-checkout` feature flags
- environment-specific flag configs
- allowlist, role targeting, and percentage rollout rules
- sample users using stable non-PII keys
- initial append-only audit entries

## Validation checklist

After updating `apps/backend/prisma.config.ts`:

1. Run the seed command:

   ```bash
   npm run db:seed --workspace=@ffp/backend
   ```

2. Confirm output includes:

   ```text
   Seed data created successfully.
   ```

3. Verify minimum seed counts in PostgreSQL, using the `psql` URL without Prisma's `?schema=public` parameter:

   ```bash
   psql "postgresql://ffp:ffp_dev_password@localhost:5432/ffp_dev" -c "SELECT COUNT(*) FROM projects;"
   psql "postgresql://ffp:ffp_dev_password@localhost:5432/ffp_dev" -c "SELECT COUNT(*) FROM environments;"
   psql "postgresql://ffp:ffp_dev_password@localhost:5432/ffp_dev" -c "SELECT COUNT(*) FROM feature_flags;"
   psql "postgresql://ffp:ffp_dev_password@localhost:5432/ffp_dev" -c "SELECT COUNT(*) FROM flag_environment_configs;"
   psql "postgresql://ffp:ffp_dev_password@localhost:5432/ffp_dev" -c "SELECT COUNT(*) FROM flag_rules;"
   psql "postgresql://ffp:ffp_dev_password@localhost:5432/ffp_dev" -c "SELECT COUNT(*) FROM sample_user_contexts;"
   psql "postgresql://ffp:ffp_dev_password@localhost:5432/ffp_dev" -c "SELECT COUNT(*) FROM audit_log_entries;"
   ```

4. Expected minimum counts from the Phase 2 seed plan:

   ```text
   projects: 1
   environments: 3
   feature_flags: 2
   flag_environment_configs: 6
   flag_rules: 3
   sample_user_contexts: 3
   audit_log_entries: 7
   ```

5. Run repository whitespace validation for this reference when changed:

   ```bash
   git diff --check -- docs/codex/reference/phase-2-prisma-seed-config-prisma-7.md
   ```

## Risks and caveats

- This reference assumes the backend is using Prisma 7 and `prisma.config.ts`. Older Prisma versions may read seed configuration from `package.json` instead.
- Do not include secrets in this document. The database URL shown here uses the local development value already used in Phase 2 examples; avoid copying real production secrets into docs.
- If `tsx` is missing, install it in the backend workspace before seeding:

  ```bash
  npm install -D tsx --workspace=@ffp/backend
  ```

- If `@prisma/adapter-pg` or `pg` is missing, the seed script may fail because Prisma 7 client usage for this project requires the PostgreSQL adapter.
- Seed data must remain aligned with the MVP guardrails: deterministic evaluation support, append-only audit logging, stable non-PII targeting keys, and clear control-plane/data-plane separation.

## Reuse prompts

Use these prompts in future Codex sessions:

```text
Continue Phase 2 after fixing Prisma 7 seed config. Verify db:seed, seed counts, and append-only audit constraints.
```

```text
Review apps/backend/prisma.config.ts for Prisma 7 compatibility and confirm migrations.seed points to tsx prisma/seed.ts.
```

```text
Troubleshoot Prisma db seed in the backend workspace using docs/codex/reference/phase-2-prisma-seed-config-prisma-7.md as context.
```
