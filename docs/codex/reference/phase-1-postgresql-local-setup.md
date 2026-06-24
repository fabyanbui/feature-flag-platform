# Phase 1 PostgreSQL Local Setup — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response about
finishing Phase 1 local PostgreSQL setup for the Feature Flag Platform.

## Original request context

The user was progressing through Phase 1 of
`docs/plan/implementation-roadmap.md` step by step. They had just completed the
local environment and `.gitignore` cleanup step and asked to continue. The
latest response provided Step 7: PostgreSQL local setup.

Relevant Phase 1 scope:

- Backend app using NestJS.
- Admin app.
- Demo app.
- Shared TypeScript config.
- Local environment configuration.
- PostgreSQL local setup.
- README quickstart commands.

Important inferred context from earlier steps:

- The repo uses npm workspaces with `apps/backend`, `apps/admin`, and
  `apps/demo`.
- The root `.env.example` should document backend/frontend local app config.
- Real `.env` files must remain untracked.
- Prisma schema and migrations belong to Phase 2, not Phase 1.

## Full response reference

The Step 7 guidance started by checking the previous local-env step. The
`.gitignore` was considered correct, but the root `.env.example` still included
unrelated Codex/browser tooling values. The response instructed removing those
tooling lines and keeping only app-specific configuration.

After that correction, Step 7 focused on local PostgreSQL setup.

Goal:

- Have a local PostgreSQL database ready for Phase 2.
- Do not create Prisma schema or migrations yet.

Recommended path:

1. Use a one-off Docker PostgreSQL container for local development.
2. Confirm Docker is installed.
3. Start a container named `ffp-postgres`.
4. Create a local database named `ffp_dev`.
5. Create/use a local database user named `ffp`.
6. Expose PostgreSQL on local port `5432`.
7. Verify the connection with `psql`.
8. Confirm the root environment connection string points at that local
   database, without committing real secrets.

If the Docker container already exists, the response recommended starting the
existing container rather than recreating it.

The response also explicitly warned not to run Prisma commands yet:

```bash
npx prisma init
npx prisma migrate dev
```

Those commands belong to Phase 2, where the database model and migrations will
be implemented.

## Key decisions and rationale

### PostgreSQL setup is included in Phase 1

Phase 1 requires PostgreSQL local setup so later data modeling work has a known
database target. This does not mean tables, migrations, Prisma schema, seed
data, repositories, or application database access should be implemented yet.

### Docker one-off container is preferred for this step

The guidance used a one-off Docker container instead of a committed
`docker-compose.yml` because the MVP contract marks a one-command Docker
Compose setup as out of MVP scope. A simple local container is enough to prove
PostgreSQL availability for Phase 1.

### Environment values should remain examples, not secrets

The latest response used local-development database settings. For reusable
documentation, treat those values as placeholders. Do not document real
passwords, private connection strings, personal tokens, or private URLs.

### Prisma remains out of scope

Phase 2 owns:

- Prisma schema.
- PostgreSQL config connected to the application model.
- Projects table.
- Feature flags table.
- Flag rules table.
- Sample user contexts table.
- Audit log entries table.
- Migrations.
- Seed data.

Phase 1 only proves the local database can run and be reached.

## Commands, files, and artifacts

### Files involved

```text
.env
.env.example
.gitignore
apps/admin/.env.example
apps/demo/.env.example
```

### Correction before PostgreSQL setup

Remove unrelated Codex/browser tooling lines from the root `.env.example`.
Keep only project runtime configuration for the backend and frontend apps.

Do not include personal tokens, browser-tooling exports, private URLs, or real
secrets in `.env.example`.

### Check Docker availability

```bash
docker --version
```

### Start PostgreSQL with Docker

Use a one-off container named `ffp-postgres`. Replace
`<local-dev-password>` with the same non-secret local placeholder used in the
developer's private `.env` and public `.env.example`.

```bash
docker run --name ffp-postgres \
  -e POSTGRES_USER=ffp \
  -e POSTGRES_PASSWORD=<local-dev-password> \
  -e POSTGRES_DB=ffp_dev \
  -p 5432:5432 \
  -d postgres:16
```

If the container already exists:

```bash
docker start ffp-postgres
```

### Verify database connectivity

```bash
docker exec ffp-postgres psql -U ffp -d ffp_dev -c "select current_database(), current_user;"
```

Expected shape:

```text
current_database | current_user
-----------------+--------------
ffp_dev          | ffp
```

### Confirm connection-string shape

The root `.env` and `.env.example` should use the local PostgreSQL database
shape below. Keep the password as a local-development placeholder, not a real
secret.

```bash
DATABASE_URL=postgresql://ffp:<local-dev-password>@localhost:5432/ffp_dev?schema=public
```

## Validation checklist

Step 7 is complete when:

- PostgreSQL container `ffp-postgres` is running.
- Database `ffp_dev` exists.
- User `ffp` can connect to the database.
- The local `DATABASE_URL` shape points to the running local database.
- Root `.env.example` contains only project local app config.
- Real `.env` files remain ignored by git.
- No Prisma schema exists yet.
- No Prisma migration has been created yet.

Suggested validation commands:

```bash
docker exec ffp-postgres psql -U ffp -d ffp_dev -c "select current_database(), current_user;"
git status --short
npm run diff:check
```

## Risks and caveats

- Do not commit real `.env` values, database passwords, personal tokens, or
  private service URLs.
- Do not start Phase 2 work early by adding Prisma schema, migrations, tables,
  or seed data during this step.
- If port `5432` is already in use, PostgreSQL may fail to start. Resolve the
  local port conflict or map the container to a different host port and update
  the private local `DATABASE_URL` accordingly.
- If Docker is unavailable, native PostgreSQL can be used instead, but it must
  still provide a local database named for development and a connection string
  compatible with the future Prisma setup.
- The database user and database name in this reference are local-development
  conventions only. Production credentials and deployment configuration are
  outside Phase 1 scope.

## Reuse prompts

- "Continue Phase 1 after PostgreSQL local setup and teach me Step 8: README
  quickstart commands."
- "Review my Phase 1 local environment, `.gitignore`, and PostgreSQL setup for
  readiness before moving to Phase 2."
- "Help me verify that no real `.env` values or private tokens are tracked in
  this feature flag platform repo."
- "Start Phase 2 data modeling, but preserve the Phase 0 contracts for
  deterministic evaluation, append-only audit logs, stable non-PII keys, and
  control-plane/data-plane separation."
