# Feature Flag Platform

A lightweight feature flag platform for researching and demonstrating safe
feature release management in web applications.

## Project Goal

Build a mini feature flag management platform that separates code deployment
from feature release. The system provides:

1. A research report explaining feature flags, rollout strategies, kill
   switches, audit logs, API integration, caching, consistency, defaults, and
   endpoint security.
2. Backend REST APIs for projects, feature flags, rule configuration,
   evaluation, and audit logs.
3. An admin dashboard for project, flag, rule, and audit-log workflows.
4. A demo application that calls the evaluation API and shows or hides a demo
   feature based on flag results.

The active goal is documented in `docs/plan/project-goal.md` and is derived
from `docs/requirement/requirement-init.md` plus the submission/presentation
criteria in `docs/requirement/info-init.md`.

## Delivery Criteria

- Submission deadline: July 7, 2026.
- Presentation: July 9, 2026.
- The project must be demonstrable and easy to explain.
- Slides and the research report are required delivery artifacts, not optional
  polish.
- The team must be able to explain why the project is needed, what practical
  value or novelty it has, which technologies were used, why those technologies
  were chosen over alternatives, and how the platform compares with existing
  feature flag solutions.
- The presentation should demonstrate problem-solving, design thinking, and
  system thinking; recommended-level requirements are a plus only after the MVP
  is stable.

## MVP Guardrails

- Keep management/dashboard flows (control plane) separate from runtime
  evaluation (data plane).
- Evaluate rules deterministically using stable hashing for percentage rollout.
- Use safe defaults: missing project/flag returns `enabled=false` with
  `reason=NOT_FOUND`; unresolved matches fall back to default off.
- Write append-only audit entries for project, flag, and rule mutations with
  before/after snapshots in the same transaction.
- Keep feature flag status labels distinct from runtime state.

## Core Documentation

- Initial requirement: `docs/requirement/requirement-init.md`
- Additional project criteria: `docs/requirement/info-init.md`
- Project goal: `docs/plan/project-goal.md`
- Vision: `docs/plan/vision.md`
- Project plan: `docs/plan/project-plan.md`
- Roadmap: `docs/plan/implementation-roadmap.md`
- Architecture: `docs/design/software-architecture-document.md`
- Backend requirements: `docs/requirement/backend/be-init.md`
- Frontend requirements: `docs/requirement/frontend/fe-init.md`
- Demo app requirements: `docs/requirement/demo/demo-app.md`
- Final research report:
  `docs/research/feature-flag-platform-research-report.md`
- Demo script: `docs/release/demo-script.md`
- Troubleshooting notes: `docs/release/troubleshooting.md`
- Security review: `docs/release/security-review.md`
- Audit log release review: `docs/release/audit-log-release-review.md`
- Slide outline: `docs/presentation/slide-outline.md`

## Local Development

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm
- Docker, or a local PostgreSQL installation

### Install dependencies

```bash
npm install
```

### Configure environment

Copy the example environment file:

```bash
cp .env.example .env
```

The default local database URL is:

```bash
postgresql://ffp:ffp_dev_password@localhost:5432/ffp_dev?schema=public
```

For browser apps, copy app-specific examples only when you need local overrides:

```bash
cp apps/admin/.env.example apps/admin/.env
cp apps/demo/.env.example apps/demo/.env
```

Only browser-safe `VITE_*` values belong in frontend `.env` files. Do not put
database URLs or backend secrets in `apps/admin/.env` or `apps/demo/.env`.

### Start PostgreSQL with Docker

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

Verify the database:

```bash
docker exec ffp-postgres psql -U ffp -d ffp_dev -c "select current_database(), current_user;"
```

### Apply migrations and seed data

Apply the Prisma migration:

```bash
npm run prisma:migrate --workspace=@ffp/backend
```

Generate the Prisma client if needed:

```bash
npm run prisma:generate --workspace=@ffp/backend
```

Seed demo data:

```bash
npm run db:seed --workspace=@ffp/backend
```

Seed data creates:

- project `demo-project`,
- environments `production`, `staging`, and `development`,
- group `customer-experience`, with its kill switch inactive in every seeded
  environment,
- flags `beta-dashboard` and `new-checkout`,
- both flags assigned to `customer-experience`,
- sample users for beta, regular, and admin scenarios,
- audit entries for seeded setup.

### Run the apps

Backend API:

```bash
npm run dev:backend
```

Admin dashboard:

```bash
npm run dev:admin
```

Demo app:

```bash
npm run dev:demo
```

Local URLs:

```text
Backend API: http://localhost:3000/v1
Admin app:   http://localhost:5173
Demo app:    http://localhost:5174
Swagger UI:  http://localhost:3000/docs
```

### Validate the project

```bash
npm run lint
npm run build
npm run test
npm run test:integration --workspace=@ffp/backend
npm run test:e2e --workspace=@ffp/backend
npm run diff:check
```

Optional Prisma schema validation:

```bash
npm run prisma:validate --workspace=@ffp/backend
```

### Continuous integration

GitHub Actions runs `.github/workflows/ci.yml` for pull requests and pushes to
`develop` or `main`, and it can also be started manually. The workflow uses
Node.js 22.22.2 and an ephemeral PostgreSQL 16 service to run:

1. dependency installation with `npm ci`,
2. Prisma schema validation and client generation,
3. lint checks, unit tests, and workspace builds,
4. database migrations and repeatable seed validation,
5. backend integration and end-to-end tests,
6. a committed-change whitespace check.

No repository database secret is required for CI. The workflow creates a
temporary database that exists only for the job.

GitHub-hosted runner and action versions are pinned for reproducibility, action
credentials are not persisted after checkout, and the workflow token has
read-only repository access. Dependabot checks npm and GitHub Actions updates
weekly through `.github/dependabot.yml`.

Use `npm run lint:fix` locally when you want ESLint to apply automatic fixes.

For a targeted Phase 9 release-readiness check:

```bash
npm run test:e2e --workspace=@ffp/backend -- phase-9-api-hardening.e2e-spec.ts phase-9-demo-flow.e2e-spec.ts
```

### Demo flow

Use the seeded data for a local presentation:

1. Start PostgreSQL, backend, admin app, and demo app.
2. Open the admin dashboard and inspect `demo-project`.
3. Show flags `beta-dashboard` and `new-checkout`.
4. Open **Groups**, activate the `customer-experience` production kill switch,
   and confirm both assigned flags evaluate `Off` with
   `reason=GROUP_KILL_SWITCH`.
5. Deactivate the group switch to restore normal evaluation.
6. Open the demo app and evaluate:
   - Global Toggle,
   - Role Targeting — Beta Tester,
   - Percentage Rollout — Included User,
   - Percentage Rollout — Excluded User,
   - Missing Project / Flag.
7. Return to the admin dashboard and show audit log entries for group and flag
   changes.

Detailed presenter notes are in `docs/release/demo-script.md`.

## Documentation Validation

For documentation-only changes, run:

```bash
git diff --check
```

If `markdownlint` is installed, also run:

```bash
markdownlint docs/**/*.md README.md AGENTS.md
```
