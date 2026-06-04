# Phase 1 Project Scaffold and Local Workflow — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a reference, not a transcript.

## Scope

This session guided completion of Phase 1 from
`docs/plan/implementation-roadmap.md`: project scaffold and local workflow for
the Feature Flag Platform MVP.

Phase 1 scope covered:

- NestJS backend scaffold.
- Vite React admin dashboard scaffold.
- Vite React demo app scaffold.
- npm workspace setup.
- Shared TypeScript configuration.
- Local environment examples.
- PostgreSQL local setup.
- README quickstart workflow.

The session intentionally avoided Phase 2+ work: no Prisma schema, migrations,
seed data, real management APIs, evaluation engine, or database persistence
logic were added.

## High-signal outcomes

- Root npm workspace was established in `package.json` with `apps/*` workspaces.
- Backend app was scaffolded under `apps/backend` and named `@ffp/backend`.
- Admin dashboard app was scaffolded under `apps/admin` and named `@ffp/admin`.
- Demo app was scaffolded under `apps/demo` and named `@ffp/demo`.
- Backend startup was aligned to Phase 0 API conventions:
  - global route prefix is `/v1`;
  - `API_PORT` defaults to `3000`;
  - CORS origins are read from `ADMIN_ORIGIN` and `DEMO_ORIGIN`.
- Backend uses `@nestjs/config` with `.env` lookup from app/root paths.
- Root `tsconfig.base.json` was introduced and app TypeScript configs extend it.
- Admin and demo placeholders were shaped to distinguish their responsibilities:
  - admin is the control-plane dashboard shell;
  - demo is the data-plane client shell.
- Local PostgreSQL setup uses a simple Docker container named `ffp-postgres`.
- README was expanded with local development prerequisites, install, env,
  PostgreSQL, app run, and validation commands.

## Files and artifacts

Key files created or updated during the Phase 1 workstream:

- `package.json`
- `package-lock.json`
- `.gitignore`
- `.env.example`
- `README.md`
- `tsconfig.base.json`
- `apps/backend/package.json`
- `apps/backend/src/main.ts`
- `apps/backend/src/app.module.ts`
- `apps/backend/tsconfig.json`
- `apps/backend/tsconfig.build.json`
- `apps/backend/nest-cli.json`
- `apps/admin/package.json`
- `apps/admin/.env.example`
- `apps/admin/src/App.tsx`
- `apps/admin/src/App.css`
- `apps/admin/tsconfig.app.json`
- `apps/admin/tsconfig.json`
- `apps/admin/tsconfig.node.json`
- `apps/admin/vite.config.ts`
- `apps/demo/package.json`
- `apps/demo/.env.example`
- `apps/demo/src/App.tsx`
- `apps/demo/src/App.css`
- `apps/demo/tsconfig.app.json`
- `apps/demo/tsconfig.json`
- `apps/demo/tsconfig.node.json`
- `apps/demo/vite.config.ts`

Related step references already present under `docs/codex/reference/`:

- `phase-1-nestjs-backend-scaffold.md`
- `phase-1-shared-typescript-configuration.md`
- `phase-1-admin-dashboard-scaffold.md`
- `phase-1-demo-app-scaffold.md`
- `phase-1-postgresql-local-setup.md`

## Decisions and guardrails

- Keep a single root npm workspace and root lockfile; do not install from inside
  individual apps.
- Use workspace package names:
  - `@ffp/backend`
  - `@ffp/admin`
  - `@ffp/demo`
- Keep admin/dashboard work as the control plane and demo/evaluation work as the
  data plane.
- Preserve `/v1` as the backend base path.
- Keep Phase 1 limited to scaffold/local workflow. Prisma schema, migrations,
  seed data, audit persistence, evaluation rules, and real API contracts belong
  to later roadmap phases.
- Use safe environment handling:
  - commit `.env.example`;
  - ignore real `.env` files;
  - do not commit real tokens or secrets.
- The user intentionally keeps optional Codex/local assistant setup placeholders
  at the top of `.env.example`; future edits should keep them clearly marked as
  optional and unrelated to app runtime config.
- Root app runtime defaults:
  - backend: `http://localhost:3000/v1`
  - admin: `http://localhost:5173`
  - demo: `http://localhost:5174`
  - PostgreSQL database: `ffp_dev`

## Validation and caveats

Validation commands used or requested during the session:

```bash
npm run build
npm run test
npm run lint
npm run diff:check
```

Runtime checks requested:

```bash
npm run dev:backend
curl http://localhost:3000/v1
npm run dev:admin
npm run dev:demo
docker exec ffp-postgres psql -U ffp -d ffp_dev -c "select current_database(), current_user;"
```

Caveats for future Codex sessions:

- Do not remove the optional Codex setup placeholders from `.env.example`
  without asking the user; they requested to keep them.
- Do not treat `.env.example` placeholders as secrets.
- Do not start Phase 2 by inventing schema fields in controllers. Use
  `docs/design/mvp-api-and-contracts.md`,
  `docs/design/software-architecture-document.md`, and the data-modeling skill
  before writing Prisma models.
- If `npm run lint` reports generated scaffold formatting or lint issues,
  resolve them without weakening project-level TypeScript strictness.

## Best reusable next prompt

Use the data-modeling and audit-logging skills. Start Phase 2 from
`docs/plan/implementation-roadmap.md` and `docs/design/mvp-api-and-contracts.md`.
Design the Prisma schema for projects, feature flags, ordered flag rules,
sample user contexts, and append-only audit log entries. Keep rule priority
unique within a flag, project keys globally unique, flag keys unique within a
project, stable non-PII targeting keys, and audit entries append-only. Teach me
step by step before implementing migrations.

## Source notes

Source was the current visible Codex conversation in this repository. The
session followed project guardrails from `AGENTS.md`, including deterministic
evaluation, safe defaults, append-only audit logging, stable non-PII rollout
keys, and clear control-plane/data-plane separation.
