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

## Admin app mutation fails with validation error

Mutating configuration requires actor identity for audit logging.

Check:

```env
VITE_ADMIN_ACTOR=admin@example.local
```

This value belongs in the admin app environment only. Do not add it to the demo
app.

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
