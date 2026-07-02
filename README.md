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
   evaluation, audit logs, and aggregate evaluation statistics.
3. An admin dashboard for project, flag, rule, audit-log, and statistics
   workflows.
4. A demo application that calls the evaluation API and shows or hides a demo
   feature based on flag results.
5. A typed JavaScript SDK that provides evaluation helpers, response
   validation, timeout handling, and fail-closed client fallback.

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
  system thinking. The stable MVP is the release baseline, and recommended
  enhancements provide additional evidence when their roadmap gates pass.

## Platform Guardrails

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
- Completed MVP roadmap: `docs/plan/implementation-roadmap.md`
- Active recommended roadmap:
  `docs/plan/recommended-enhancements-roadmap.md`
- Requirement traceability matrix:
  `docs/plan/requirement-traceability-matrix.md`
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
- Final recommended release review:
  `docs/release/final-recommended-release-review.md`
- Slide outline: `docs/presentation/slide-outline.md`
- JavaScript SDK guide: `packages/js-sdk/README.md`

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

The backend caches reusable evaluation configuration snapshots. Memory cache is
the default provider, `none` disables caching, and Redis is an optional Phase 18
provider for Docker/demo validation:

```env
EVALUATION_CACHE_PROVIDER=memory
EVALUATION_CACHE_TTL_MS=30000
REDIS_URL=redis://localhost:6379
```

The cache does not store user context or final evaluation decisions. Cache
read or write failures, including Redis outages, preserve safe
repository-backed evaluation.

For browser apps, copy app-specific examples only when you need local overrides:

```bash
cp apps/admin/.env.example apps/admin/.env
cp apps/demo/.env.example apps/demo/.env
```

Configure three unique presentation-only bearer tokens in the root `.env`, then
copy the same values into the matching `VITE_DEMO_*_TOKEN` variables in
`apps/admin/.env`. The backend resolves each token to the fixed
`demo-admin`, `demo-developer`, or `demo-viewer` identity and role.

Only browser-safe `VITE_*` values belong in frontend `.env` files. Do not put
database URLs or production secrets in `apps/admin/.env` or `apps/demo/.env`.
The Phase 16 tokens are intentionally browser-visible local demo credentials;
never reuse them for a deployed or production system.

### Start PostgreSQL with Docker

The following standalone PostgreSQL container remains available for the normal
npm-local workflow:

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

Seed data creates missing demo records without resetting existing demo edits.
On a clean database it creates:

- project `demo-project`,
- environments `production`, `staging`, and `development`,
- groups `customer-experience`, `checkout-experience`, and `recommendations`,
  with kill switches inactive when created,
- core flags `beta-dashboard` and `new-checkout`,
  where `beta-dashboard` is standalone and `new-checkout` belongs to the
  checkout experience,
- demo feature flags `express-payment`, `shipping-progress-meter`,
  `coupon-engine`, `personalized-recommendations`, `trending-products`,
  `holiday-promo-banner`, and `live-support-widget`,
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

Staging demo app on a second port:

```bash
npm run dev:demo:staging
```

Local URLs:

```text
Backend API: http://localhost:3000/v1
Admin app:   http://localhost:5173
Demo app:    http://localhost:5174  (production environment)
Demo app:    http://localhost:5175  (staging environment)
Swagger UI:  http://localhost:3000/docs
```

The production and staging demo apps use the same React code and the same
backend. They differ only by the SDK `environmentKey` embedded by Vite:
`production` on port `5174` and `staging` on port `5175`. This lets you show
the same feature flag resolving differently across environments without adding
environment-management UI.

To build a staging bundle without Docker Compose, run:

```bash
npm run build:demo:staging
npm run preview:demo:staging
```

Then open `http://localhost:4175`. Vite embeds `VITE_ENVIRONMENT_KEY` at build
time, so rebuild after changing the target environment.

### Docker Compose demo workflow

Phase 19 provides the final local Docker workflow for PostgreSQL, committed
migrations, repeatable demo seed data, the backend API, the admin dashboard,
and the demo application. The normal npm-local workflow above remains fully
supported.

Copy and review the environment example before building:

```bash
cp .env.example .env
```

Keep `DATABASE_URL` for npm-local development. Compose uses
`COMPOSE_DATABASE_URL`, where the database host is the Compose service name
`postgres`. Browser-facing `VITE_API_BASE_URL` must continue to use
`http://localhost:3000/v1`; a browser cannot resolve the internal `backend`
service name.

Compose starts two demo frontends by default:

- `demo` at `http://localhost:5174` with `VITE_ENVIRONMENT_KEY=production`
- `demo-staging` at `http://localhost:5175` with
  `VITE_ENVIRONMENT_KEY=staging`

The backend CORS allowlist must include both browser origins. The example env
file provides `DEMO_ORIGIN=http://localhost:5174` and
`DEMO_STAGING_ORIGIN=http://localhost:5175`. If you change
`DEMO_STAGING_HOST_PORT`, also change `DEMO_STAGING_ORIGIN` to the matching
browser URL before restarting the backend/Compose stack.

Start the complete demo path from a clean environment:

```bash
docker compose up --build
```

For detached mode:

```bash
docker compose up --build -d
docker compose ps -a
```

The dependency order is:

```text
postgres healthy
-> migrate exits 0
-> demo-seed exits 0
-> backend healthy
-> admin, demo, and demo-staging healthy
```

The `migrate` service runs `prisma migrate deploy`. The `demo-seed` service
creates missing demo records and is safe to rerun; it does not truncate data or
reset existing flag state, rules, group kill switches, or sample users on every
restart.

If port `5432` is already used by a local PostgreSQL service, set
`POSTGRES_HOST_PORT` to another host port. The backend still reaches PostgreSQL
through the internal `postgres:5432` address:

```bash
POSTGRES_HOST_PORT=55432 docker compose up --build
```

The optional Redis cache provider is not part of the stable demo requirement.
To run the same stack with Redis-backed evaluation snapshot caching, enable the
`redis` profile and select the provider:

```bash
EVALUATION_CACHE_PROVIDER=redis docker compose --profile redis up --build
```

The backend reaches Redis through `REDIS_URL=redis://redis:6379` in Compose. If
Redis is stopped or unavailable, evaluation falls back to PostgreSQL/no-cache
behavior and remains fail-closed on repository or engine errors. Use
`EVALUATION_CACHE_PROVIDER=none` when you want to validate evaluation with the
cache disabled.

Verify the public endpoints:

```bash
curl http://localhost:3000/v1/health
curl --head http://localhost:5173
curl --head http://localhost:5174
curl --head http://localhost:5175
```

Open the Compose database with Prisma Studio when you need a local
data-inspection UI:

```bash
docker compose --profile tools up --build prisma-studio
```

Then open `http://localhost:5555`. The `prisma-studio` service is in the
optional `tools` profile so it does not start during the default demo workflow.
It uses `COMPOSE_DATABASE_URL`, waits for migration and seed to complete, and
publishes the UI through `PRISMA_STUDIO_HOST_PORT` when a different host port
is needed. For npm-local development, use
`npm run prisma:studio --workspace=@ffp/backend`.

Stop the stack while preserving PostgreSQL data:

```bash
docker compose down
```

To remove the Compose database volume as well, use
`docker compose down --volumes`. This is destructive and should only be used
for an intentional clean-environment test.

#### Demo RBAC

The admin navigation includes a **Viewing as** selector:

- `ADMIN` can perform every control-plane action.
- `DEVELOPER` can manage flags, rules, and group assignments.
- `VIEWER` has read-only access to projects, flags, groups, history, audit logs,
  and statistics.

All control-plane requests use `Authorization: Bearer <demo-token>`. Roles and
audit actors are resolved on the backend; `X-Actor` and `X-Actor-Role` cannot
grant permissions. Health and `POST /v1/evaluate` remain public so the demo app
and JavaScript SDK stay data-plane-only.

#### Evaluation statistics

```http
GET /v1/projects/{projectKey}/stats/flags
GET /v1/projects/{projectKey}/flags/{flagKey}/stats
```

Statistics are aggregate, UTC-hour based, eventually consistent, and contain no
raw evaluation context. The admin dashboard exposes environment and time-range
filters plus total, On, Off, percentage, and top-reason summaries.

#### JavaScript SDK

The `@ffp/js-sdk` workspace package is a data-plane-only client for
`POST /v1/evaluate`. It provides `evaluate`, `isEnabled`, and `getVariant`,
validates backend responses, and returns a typed Off fallback for client-local
transport or response failures.

```ts
const client = createFeatureFlagClient({
  baseUrl: 'http://localhost:3000/v1',
  projectKey: 'demo-project',
  environmentKey: 'production',
})
```

The SDK does not contain control-plane APIs, credentials, local rule
evaluation, or user-specific decision caching.

### Validate the project

```bash
npm run lint
npm run test
npm run test:integration --workspace=@ffp/backend
npm run test:e2e --workspace=@ffp/backend
npm run build
npm run diff:check
npm run prisma:validate --workspace=@ffp/backend
```

For Phase 20 final release review, record these results in
`docs/release/final-recommended-release-review.md`. `npm run test` already
runs the JavaScript SDK tests through the workspace test script; use
`npm run test --workspace=@ffp/js-sdk` only when you want a focused SDK check.

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

For a targeted Phase 13 cache consistency check:

```bash
npm run test:e2e --workspace=@ffp/backend -- \
  phase-12-group-kill-switch.e2e-spec.ts \
  phase-13-evaluation-cache.e2e-spec.ts \
  --runInBand
```

For a targeted Phase 14 statistics check:

```bash
npm run test:e2e --workspace=@ffp/backend -- \
  phase-14-evaluation-stats.e2e-spec.ts \
  --runInBand
```

### Demo flow

Use the seeded data for a local presentation:

1. Start PostgreSQL, backend, admin app, and demo app.
2. Open the admin dashboard and inspect `demo-project`.
3. Show flags `new-checkout`, `coupon-engine`, and `live-support-widget`.
4. Open **Groups**, activate the `checkout-experience` production kill switch,
   and confirm assigned checkout flags evaluate `Off` with
   `reason=GROUP_KILL_SWITCH`.
5. Deactivate the group switch to restore normal evaluation.
6. Open the demo app and evaluate:
   - Global Toggle,
   - Role Targeting — Beta Tester,
   - Percentage Rollout — Included User,
   - Percentage Rollout — Excluded User,
   - Missing Project / Flag.
7. Point out that the demo is using `@ffp/js-sdk`, and that backend decisions
   are distinct from typed client-local fail-closed results.
8. Open **Statistics** and show aggregate evaluation requests, On/Off outcomes,
   and top reasons without user context.
9. Return to the audit log screen and show entries for group and flag changes.

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
