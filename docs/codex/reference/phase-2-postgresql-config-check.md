# Phase 2 PostgreSQL Config Check — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response about
Step 2 of Phase 2: verifying PostgreSQL configuration before creating the
Prisma schema, migration, append-only audit log constraints, and seed data.

## Original request context

The user is implementing Phase 2 of `docs/plan/implementation-roadmap.md` for
the Feature Flag Platform after completing Phase 1 setup. Phase 2 covers the
Prisma schema, PostgreSQL configuration, required database tables, constraints,
append-only audit logs, the initial migration, and seed data.

The immediately preceding user message was:

```text
Step 1 done
```

This meant Step 1, installing Prisma-related backend dependencies and adding
backend Prisma scripts, was complete. Codex then guided the user through
**Step 2 — PostgreSQL config check**.

Relevant repo guardrails from `AGENTS.md` and the project requirements:

- The MVP stack uses NestJS, Prisma, PostgreSQL, REST/Swagger, Jest, and
  in-memory cache.
- Phase 2 must establish persistent storage for projects, feature flags, flag
  rules, sample user contexts, and audit log entries.
- Future mutations for projects, flags, and rules must write append-only audit
  log entries.
- Safe defaults, deterministic evaluation, stable non-PII targeting keys, and
  control-plane/data-plane separation must be preserved.

## Full response reference

### Step 2 goal

Confirm the backend can connect to PostgreSQL using the local development
`DATABASE_URL` configured for Prisma.

The project environment should use this shape:

```env
DATABASE_URL=postgresql://ffp:<local-dev-password>@localhost:5432/ffp_dev?schema=public
```

The concrete local example used in the setup instructions was:

```env
DATABASE_URL=postgresql://ffp:ffp_dev_password@localhost:5432/ffp_dev?schema=public
```

This value belongs in the local `.env` file and must not be committed.

### 2.1 Check PostgreSQL is installed

Run:

```bash
psql --version
```

Expected example:

```text
psql (PostgreSQL) 16.x
```

The exact major version may differ. PostgreSQL 14+ is acceptable for this MVP
because Phase 2 only needs standard PostgreSQL capabilities such as tables,
foreign keys, unique constraints, JSON fields, indexes, and triggers.

If `psql` is not found, PostgreSQL client tools are not installed or are not on
`PATH`. Stop and resolve that before continuing.

### 2.2 Check PostgreSQL is running

Run:

```bash
pg_isready
```

Expected output should indicate PostgreSQL is accepting connections, for
example:

```text
/var/run/postgresql:5432 - accepting connections
```

or:

```text
localhost:5432 - accepting connections
```

If PostgreSQL is not running on a Linux/Ubuntu environment, try:

```bash
sudo service postgresql start
```

Then check again:

```bash
pg_isready
```

Do not continue to Prisma schema or migrations until PostgreSQL is accepting
connections.

### 2.3 Confirm the root `.env`

Open the repo root `.env` file:

```text
.env
```

It should contain the backend database and local CORS/app configuration:

```env
DATABASE_URL=postgresql://ffp:<local-dev-password>@localhost:5432/ffp_dev?schema=public
API_PORT=3000
ADMIN_ORIGIN=http://localhost:5173
DEMO_ORIGIN=http://localhost:5174
```

The local concrete example is:

```env
DATABASE_URL=postgresql://ffp:ffp_dev_password@localhost:5432/ffp_dev?schema=public
API_PORT=3000
ADMIN_ORIGIN=http://localhost:5173
DEMO_ORIGIN=http://localhost:5174
```

Do not commit `.env`. The repository `.gitignore` excludes root `.env` and app
`.env` files.

### 2.4 Create the database role and database if needed

First, try connecting manually:

```bash
psql "postgresql://ffp:<local-dev-password>@localhost:5432/ffp_dev"
```

For the local example:

```bash
psql "postgresql://ffp:ffp_dev_password@localhost:5432/ffp_dev"
```

If it works, exit `psql` with:

```sql
\q
```

If the connection fails because the role or database does not exist, open the
PostgreSQL admin shell:

```bash
sudo -u postgres psql
```

Then run:

```sql
CREATE USER ffp WITH PASSWORD '<local-dev-password>';
CREATE DATABASE ffp_dev OWNER ffp;
GRANT ALL PRIVILEGES ON DATABASE ffp_dev TO ffp;
\q
```

For the local example:

```sql
CREATE USER ffp WITH PASSWORD 'ffp_dev_password';
CREATE DATABASE ffp_dev OWNER ffp;
GRANT ALL PRIVILEGES ON DATABASE ffp_dev TO ffp;
\q
```

Then test the connection again:

```bash
psql "postgresql://ffp:<local-dev-password>@localhost:5432/ffp_dev"
```

### Important note about `?schema=public`

Use the Prisma-compatible URL with `?schema=public` in `.env`.

For manual `psql` connection tests, omit `?schema=public` if your `psql` client
rejects it. Prisma understands this query parameter, but some `psql` clients do
not accept it in a connection URI.

So:

```env
# Keep this for Prisma/application configuration
DATABASE_URL=postgresql://ffp:<local-dev-password>@localhost:5432/ffp_dev?schema=public
```

but test manually with:

```bash
psql "postgresql://ffp:<local-dev-password>@localhost:5432/ffp_dev"
```

After connecting, verify the database, user, and schema:

```sql
SELECT current_database(), current_user, current_schema();
\q
```

Expected meaning:

```text
current_database = ffp_dev
current_user     = ffp
current_schema   = public
```

### 2.5 Stop point before Step 3

Step 2 is complete when:

- PostgreSQL client tools are installed.
- PostgreSQL is running and accepting connections.
- Root `.env` contains a Prisma-compatible `DATABASE_URL`.
- The `ffp` role exists.
- The `ffp_dev` database exists.
- A manual `psql` connection as user `ffp` succeeds.

The user should then reply:

```text
Step 2 done
```

If anything fails, the user should paste the exact terminal output before
moving on.

## Key decisions and rationale

- PostgreSQL must be verified before Prisma schema work because migrations need
  a reachable database.
- The local database role is named `ffp` and the local database is named
  `ffp_dev` to match the project `.env.example` convention.
- Root `.env` is the local source for `DATABASE_URL`; it must remain untracked.
- The Prisma URL includes `?schema=public` so Prisma scopes generated database
  objects to the intended PostgreSQL schema.
- Manual `psql` tests may need the same URL without `?schema=public` because
  `psql` is not Prisma.
- Creating the role/database is only necessary if the connection test fails due
  to missing local PostgreSQL objects.
- This step intentionally does not create application tables yet. Tables are
  created by Prisma migration in later Phase 2 steps.

## Commands, files, and artifacts

Primary commands:

```bash
psql --version
pg_isready
sudo service postgresql start
sudo -u postgres psql
psql "postgresql://ffp:<local-dev-password>@localhost:5432/ffp_dev"
```

SQL commands for setup if needed:

```sql
CREATE USER ffp WITH PASSWORD '<local-dev-password>';
CREATE DATABASE ffp_dev OWNER ffp;
GRANT ALL PRIVILEGES ON DATABASE ffp_dev TO ffp;
\q
```

SQL command for verification:

```sql
SELECT current_database(), current_user, current_schema();
\q
```

Relevant files:

```text
.env
.env.example
apps/backend/package.json
```

Expected `.env` shape:

```env
DATABASE_URL=postgresql://ffp:<local-dev-password>@localhost:5432/ffp_dev?schema=public
API_PORT=3000
ADMIN_ORIGIN=http://localhost:5173
DEMO_ORIGIN=http://localhost:5174
```

## Validation checklist

- [ ] `psql --version` prints an installed PostgreSQL client version.
- [ ] `pg_isready` reports that PostgreSQL is accepting connections.
- [ ] Root `.env` contains `DATABASE_URL`, `API_PORT`, `ADMIN_ORIGIN`, and
      `DEMO_ORIGIN`.
- [ ] The `ffp` role exists, or has been created.
- [ ] The `ffp_dev` database exists, or has been created.
- [ ] `GRANT ALL PRIVILEGES ON DATABASE ffp_dev TO ffp;` has been applied if
      setup was required.
- [ ] Manual connection succeeds with:

  ```bash
  psql "postgresql://ffp:<local-dev-password>@localhost:5432/ffp_dev"
  ```

- [ ] Inside `psql`, this query confirms the expected database, user, and
      schema:

  ```sql
  SELECT current_database(), current_user, current_schema();
  ```

- [ ] `.env` remains untracked and is not committed.

## Risks and caveats

- Do not proceed to Prisma migrations while PostgreSQL is not accepting
  connections.
- Do not commit `.env` or expose local passwords in documentation or commits.
- If `CREATE USER ffp` reports that the role already exists, do not delete it
  unnecessarily. Reset the password with `ALTER USER` only if needed.
- If `CREATE DATABASE ffp_dev` reports that the database already exists, do not
  delete it unless intentionally resetting local development state.
- If manual `psql` rejects `?schema=public`, remove that query parameter only
  for the manual `psql` test. Keep it in the Prisma `DATABASE_URL`.
- This reference covers PostgreSQL configuration only. It does not define the
  Prisma data model, migration SQL, audit-log triggers, or seed data.

## Reuse prompts

- "Continue Phase 2 from PostgreSQL config check and teach me Step 3: create
  the Prisma schema."
- "Help me verify whether my `ffp` PostgreSQL role and `ffp_dev` database are
  configured correctly."
- "PostgreSQL is accepting connections, but Prisma cannot connect; troubleshoot
  my `DATABASE_URL`."
- "Explain why the Prisma connection string uses `?schema=public`."
- "After Step 2, guide me through writing `apps/backend/prisma/schema.prisma`."
