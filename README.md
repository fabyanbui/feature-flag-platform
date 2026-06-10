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
- Research report: `docs/requirement/feature-flag-research.md`

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
```

### Validate the scaffold

```bash
npm run build
npm run test
npm run diff:check
```

### Phase 1 scope note

Phase 1 scaffolds the backend, admin app, demo app, shared TypeScript
configuration, local environment, PostgreSQL setup, and README workflow.
Database schema, Prisma migrations, seed data, APIs, and evaluation logic are
implemented in later roadmap phases.

## Documentation Validation

For documentation-only changes, run:

```bash
git diff --check
```

If `markdownlint` is installed, also run:

```bash
markdownlint docs/**/*.md README.md AGENTS.md
```
