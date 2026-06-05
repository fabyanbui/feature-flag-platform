# Phase 1 Shared TypeScript Configuration — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response.

## Original request context

The user is completing Phase 1 of the Feature Flag Platform implementation
roadmap step by step. Phase 1 covers project scaffold and local workflow:

- Backend app using NestJS.
- Admin app.
- Demo app.
- Shared TypeScript config.
- Local environment configuration.
- PostgreSQL local setup.
- README quickstart commands.

Immediately before this reference was requested, the user had completed Step 2:
scaffolding the NestJS backend in `apps/backend`. The latest Codex response
introduced Step 3: adding a shared TypeScript configuration.

Inferred visible project state at the time of the response:

- `apps/backend` existed.
- `apps/backend/package.json` was named `@ffp/backend`.
- `apps/backend/src/main.ts` and `apps/backend/src/app.module.ts` had been
  aligned to the Phase 1 backend scaffold guidance.
- The next goal was to add repo-level TypeScript strictness without starting
  frontend scaffolding or later API/database implementation phases.

Relevant repo guardrails:

- Keep Phase 1 scoped to scaffold and local workflow.
- Do not implement Prisma schema, migrations, evaluation logic, or management
  APIs in this step.
- Preserve the broader MVP guardrails for deterministic evaluation,
  fail-closed defaults, append-only audit logging, stable non-PII rollout keys,
  and control-plane/data-plane separation when later phases start.

## Full response reference

Step 3 adds a shared TypeScript baseline for the repo.

Goal: create one repo-level TypeScript configuration that the backend, admin,
and demo apps can share.

Do not change business logic in this step.

### 1. Create root `tsconfig.base.json`

At the repo root, create:

```text
tsconfig.base.json
```

Add this content:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "strict": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

This shape is intentional:

- Shared strictness lives at the root.
- The backend can still use `nodenext`.
- Vite apps can later use their own frontend-specific module settings.
- The shared file avoids backend-only or browser-only settings.

### 2. Update backend `tsconfig.json`

Open:

```text
apps/backend/tsconfig.json
```

Replace it with:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "resolvePackageJsonExports": true,
    "isolatedModules": true,
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true
  }
}
```

Keep `module` and `moduleResolution` as `nodenext` because the generated
NestJS project uses that modern setup.

### 3. Validate backend build

Run:

```bash
npm run build --workspace=@ffp/backend
```

Expected result: the backend build succeeds and creates:

```text
apps/backend/dist/
```

That folder should be ignored by git.

Then run:

```bash
npm run test --workspace=@ffp/backend
```

Expected result: generated NestJS tests pass.

Finally run:

```bash
npm run diff:check
```

## Key decisions and rationale

- Use a root `tsconfig.base.json` instead of duplicating strict TypeScript
  options in every app.
- Keep app-specific compiler settings in app-level `tsconfig` files because
  backend and frontend TypeScript environments differ.
- Enable `strict` at the root to keep future backend, admin, demo, and shared
  code safer by default.
- Avoid setting `module` or `moduleResolution` in the shared base file because
  NestJS and Vite should own those separately.
- Keep the backend's generated `nodenext` settings rather than forcing
  CommonJS after scaffold.
- Do not scaffold frontend apps during this step; Step 3 is only the shared
  TypeScript configuration milestone.

## Commands, files, and artifacts

Files created or changed:

```text
tsconfig.base.json
apps/backend/tsconfig.json
```

Validation commands:

```bash
npm run build --workspace=@ffp/backend
npm run test --workspace=@ffp/backend
npm run diff:check
```

Expected generated artifact:

```text
apps/backend/dist/
```

Expected ignored artifact:

```text
apps/backend/dist/
```

## Validation checklist

Step 3 is complete when:

- `tsconfig.base.json` exists at the repo root.
- `apps/backend/tsconfig.json` extends `../../tsconfig.base.json`.
- Backend build passes.
- Backend tests pass.
- TypeScript strictness has not been weakened.
- Frontend apps have not been scaffolded yet.
- No Prisma schema, migrations, real APIs, evaluation engine, admin UI, or demo
  app logic has been started in this step.

## Risks and caveats

- If strict TypeScript settings fail the generated NestJS build, inspect the
  exact compiler error before weakening the base config.
- Do not put `module`, `moduleResolution`, DOM libraries, JSX settings, or
  Node-only settings into `tsconfig.base.json`; those belong in app-specific
  configs.
- Keep build output ignored by git. The `dist/` artifact is useful for local
  validation but should not be committed.
- This step does not prove any business behavior. It only prepares a clean
  TypeScript baseline for later implementation.

## Reuse prompts

- "Continue Phase 1 from the shared TypeScript configuration reference and
  teach me Step 4."
- "Review my `tsconfig.base.json` and `apps/backend/tsconfig.json` against the
  Phase 1 shared TypeScript configuration reference."
- "Explain why the shared TypeScript config should not include Vite-specific
  or NestJS-specific module settings."
- "Create a follow-up reference for Phase 1 admin app scaffolding after Step 4
  is complete."
