# Troubleshooting — Feature Flag Platform

## Backend does not start

Check that dependencies are installed:

```bash
npm install
```

Check that `.env` exists:

```bash
cp .env.example .env
```

Check the backend port:

```text
API_PORT=3000
```

If port `3000` is already in use, stop the other process or change `API_PORT`.

## PostgreSQL connection fails

Start the local container:

```bash
docker start ffp-postgres
```

If the container does not exist, create it:

```bash
docker run --name ffp-postgres \
  -e POSTGRES_USER=ffp \
  -e POSTGRES_PASSWORD=ffp_dev_password \
  -e POSTGRES_DB=ffp_dev \
  -p 5432:5432 \
  -d postgres:16
```

Verify the database:

```bash
docker exec ffp-postgres psql -U ffp -d ffp_dev -c "select current_database(), current_user;"
```

For the Docker Compose workflow, check the PostgreSQL health state and logs:

```bash
docker compose ps
docker compose logs postgres
```

If host port `5432` is already used by a local database, keep the Compose
database internal port unchanged and publish it on a different host port:

```bash
POSTGRES_HOST_PORT=55432 docker compose up -d postgres
```

The npm-local backend uses a `DATABASE_URL` host such as `localhost`. The
containerized backend uses `COMPOSE_DATABASE_URL` with the Compose service host
`postgres`. Using `localhost` inside the backend container points back to that
container rather than PostgreSQL.

## Tables or Prisma client are missing

Run:

```bash
npm run prisma:generate --workspace=@ffp/backend
npm run prisma:migrate --workspace=@ffp/backend
```

## Prisma Studio cannot open the Compose database

Start the optional tools-profile service:

```bash
docker compose --profile tools up --build prisma-studio
```

Then open `http://localhost:5555`. If the port is already in use, set a
different host port while keeping the container port unchanged:

```bash
PRISMA_STUDIO_HOST_PORT=5556 docker compose --profile tools up --build prisma-studio
```

The service uses `COMPOSE_DATABASE_URL` with the internal `postgres` hostname
and waits for the one-shot `migrate` and `demo-seed` services to complete.
Check startup logs if it does not become healthy:

```bash
docker compose ps -a
docker compose logs migrate
docker compose logs demo-seed
docker compose logs prisma-studio
```

## Demo data is missing

Run:

```bash
npm run db:seed --workspace=@ffp/backend
```

Expected seed data on a clean database:

- project `demo-project`,
- environments `production`, `staging`, and `development`,
- group `customer-experience`, inactive when first created,
- flags `beta-dashboard` and `new-checkout`, assigned to
  `customer-experience` when first created,
- sample users `demo-user-beta`, `demo-user-regular`, and `demo-user-admin`.

The Phase 19 seed is non-destructive. It creates missing demo records but does
not reset existing flag state, rules, group kill switches, or sample users on
every Compose restart.

## Demo app cannot call the backend

Check the demo app environment:

```env
VITE_API_BASE_URL=http://localhost:3000/v1
```

Restart the demo app after changing `.env`:

```bash
npm run dev:demo
```

Check backend CORS values in root `.env`:

```env
ADMIN_ORIGIN=http://localhost:5173
DEMO_ORIGIN=http://localhost:5174
```

Restart the backend after changing CORS settings:

```bash
npm run dev:backend
```

For Compose, rebuild frontend images after changing any `VITE_*` value because
Vite embeds these values during the image build:

```bash
docker compose build admin demo
docker compose up -d admin demo
```

Do not set `VITE_API_BASE_URL` to `http://backend:3000/v1`. That hostname is
only resolvable between containers, while frontend API requests originate in
the user's browser.

## Admin control-plane request is unauthorized

Check that each frontend demo token matches the corresponding backend token:

```env
DEMO_ADMIN_TOKEN=replace-with-local-admin-demo-token
VITE_DEMO_ADMIN_TOKEN=replace-with-local-admin-demo-token
```

For npm-local development, the `VITE_DEMO_*_TOKEN` values belong in
`apps/admin/.env`. For Compose, the image build receives the backend
`DEMO_*_TOKEN` values as browser-visible build arguments. These are
presentation-only credentials and must never be reused in production.

## Docker Compose build fails because Buildx is missing

If `docker compose up --build` fails with a message similar to
`docker-buildx: no such file or directory`, either install the Docker Buildx
plugin or use Docker's legacy builder for the local validation run:

```bash
COMPOSE_DOCKER_CLI_BUILD=0 DOCKER_BUILDKIT=0 docker compose up --build
```

This does not change the application images or runtime behavior; it only
selects the local Docker builder implementation.

## Docker Compose backend is unhealthy

Inspect all startup services, including the one-shot migration and seed jobs:

```bash
docker compose ps -a
docker compose logs postgres
docker compose logs migrate
docker compose logs demo-seed
docker compose logs backend
curl -i http://localhost:3000/v1/health
```

Expected startup order:

```text
postgres healthy
-> migrate exits 0
-> demo-seed exits 0
-> backend healthy
-> admin and demo healthy
```

Confirm all three `DEMO_*_TOKEN` and `DEMO_*_ACTOR` pairs are configured and
that PostgreSQL is healthy. `migrate` must complete successfully before
`demo-seed`, and `demo-seed` must complete successfully before the backend
starts.

If frontend environment values changed, rebuild the images because Vite embeds
`VITE_*` values at build time:

```bash
docker compose build admin demo
docker compose up -d admin demo
```

Use Docker Compose v2 with support for `service_completed_successfully`. If a
one-shot service is stuck with stale state during local testing, recreate it:

```bash
docker compose up --build --force-recreate migrate demo-seed backend admin demo
```

## Demo scenario returns `NOT_FOUND`

If the scenario should use seeded data in the npm-local workflow, run:

```bash
npm run db:seed --workspace=@ffp/backend
```

For Compose, confirm the one-shot seed job completed:

```bash
docker compose ps -a
docker compose logs demo-seed
```

Then evaluate again.

The Missing Project / Flag scenario is expected to return:

```text
enabled=false
reason=NOT_FOUND
```

## Percentage rollout result is unexpected

Percentage rollout is deterministic for a given combination of:

- `projectKey`,
- `flagKey`,
- `targetingKey`.

Changing any of these values can change the rollout bucket. Use the provided
demo scenarios for predictable presentation outcomes.

## Statistics remain unchanged after evaluation

Statistics writes are best-effort and eventually consistent.

1. Refresh the statistics page.
2. Confirm the selected environment matches the evaluated environment.
3. Reset custom time filters to use the previous 24 hours.
4. Check backend logs for `Evaluation metric write failed`.
5. Confirm the latest Prisma migration is applied:

   ```bash
   npx prisma migrate status --config apps/backend/prisma.config.ts
   ```

6. Confirm the metric table exists and the backend uses the expected database.

Evaluation may still work correctly when metric persistence fails. This is an
intentional availability boundary.

## E2E tests fail with local port permission errors in a sandbox

Supertest-backed E2E tests may need permission to bind a local test server.
Run them from a normal local shell:

```bash
npm run test:e2e --workspace=@ffp/backend
```

## Final validation commands

Run:

```bash
npm run lint
npm run test
npm run test:integration --workspace=@ffp/backend
npm run test:e2e --workspace=@ffp/backend
npm run build
npm run diff:check
npm run prisma:validate --workspace=@ffp/backend
```

If `markdownlint` is installed:

```bash
markdownlint docs/**/*.md README.md AGENTS.md
```
