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

For the Docker Compose baseline, check the PostgreSQL health state and logs:

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

## Demo data is missing

Run:

```bash
npm run db:seed --workspace=@ffp/backend
```

Expected seed data:

- project `demo-project`,
- environments `production`, `staging`, and `development`,
- group `customer-experience`, inactive in every seeded environment,
- flags `beta-dashboard` and `new-checkout`,
- both flags assigned to `customer-experience`,
- sample users `demo-user-beta`, `demo-user-regular`, and `demo-user-admin`.

The seed intentionally resets the demo group kill switch to inactive. This
provides a safe, repeatable starting point before demonstrating activation.

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

## Docker Compose backend is unhealthy

Inspect the backend logs and health endpoint:

```bash
docker compose logs backend
curl -i http://localhost:3000/v1/health
```

Confirm all three `DEMO_*_TOKEN` and `DEMO_*_ACTOR` pairs are configured and
that PostgreSQL is healthy. Phase 17 does not automatically apply migrations or
seed data; initialize them explicitly:

```bash
docker compose run --rm backend \
  npm run prisma:migrate:deploy --workspace=@ffp/backend
docker compose run --rm backend \
  npm run db:seed --workspace=@ffp/backend
```

## Demo scenario returns `NOT_FOUND`

If the scenario should use seeded data, run:

```bash
npm run db:seed --workspace=@ffp/backend
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
```

If `markdownlint` is installed:

```bash
markdownlint docs/**/*.md README.md AGENTS.md
```
