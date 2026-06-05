# Phase 2 PostgreSQL Config Check — Full Codex Response Reference

Purpose: standalone reference expanded from Codex responses about PostgreSQL
setup during Phase 2 data model and migrations work.

## Original request context

The user is implementing Phase 2 of `docs/plan/implementation-roadmap.md` for
the Feature Flag Platform after completing Phase 1 setup. Phase 2 focuses on
the Prisma schema, PostgreSQL configuration, initial migration, database
constraints, append-only audit logs, and seed data.

During Step 2, the user worked through local PostgreSQL setup. Earlier context
included `psql` not being installed and then PostgreSQL `14.23` being available
on Ubuntu. Later, the user ran:

```bash
sudo -u postgres psql
```

The terminal showed this warning:

```text
could not change directory to "/home/fabyanbui/drive/feature-flag-platform": Permission denied
```

Inside `psql`, the user attempted to create the local database role and
database. PostgreSQL reported that both already existed:

```text
ERROR:  role "ffp" already exists
ERROR:  database "ffp_dev" already exists
GRANT
```

The user then tested a connection with the Prisma-style URL that includes
`?schema=public`, and `psql` returned:

```text
psql: error: invalid URI query parameter: "schema"
```

## Full response reference

### The `sudo -u postgres psql` directory warning is harmless

This warning is not a database failure:

```text
could not change directory ... Permission denied
```

It happens because Linux switched from the normal user to the `postgres` system
user. The `postgres` user does not have permission to access the project
working directory. PostgreSQL still opened correctly if the prompt changed to:

```text
postgres=#
```

No project action is needed for this warning.

### Existing role and database are acceptable

If these commands report that the role or database already exists:

```sql
CREATE USER ffp WITH PASSWORD '<local-dev-password>';
CREATE DATABASE ffp_dev OWNER ffp;
```

then the local database setup is already partly done. Do not delete the role or
database just because they already exist. For Phase 2, it is enough that the
backend can connect and Prisma can later run migrations.

If there is any chance the password is wrong, reset it rather than recreating
the user:

```bash
sudo -u postgres psql
```

Then inside `psql`:

```sql
ALTER USER ffp WITH PASSWORD '<local-dev-password>';
GRANT ALL PRIVILEGES ON DATABASE ffp_dev TO ffp;
\q
```

### `?schema=public` is valid for Prisma, not for manual `psql`

The connection test failed with:

```text
invalid URI query parameter: "schema"
```

This is expected when using the `psql` command-line client. The Prisma
connection string may include `?schema=public`, but manual `psql` connection
checks should omit that Prisma-specific query parameter.

Use this shape for manual `psql` testing:

```bash
psql "postgresql://ffp:<local-dev-password>@localhost:5432/ffp_dev"
```

If it connects, verify the active database, user, and schema:

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

The exact table formatting may vary by terminal width.

### Keep the Prisma environment URL unchanged

The application `.env` should keep the Prisma-compatible database URL shape,
including the schema query parameter:

```env
DATABASE_URL=postgresql://ffp:<local-dev-password>@localhost:5432/ffp_dev?schema=public
```

Only the manual `psql` test removes `?schema=public`.

### PostgreSQL 14.23 compatibility

PostgreSQL `14.23` is acceptable for this MVP. PostgreSQL `16.x` is not
required.

Prisma supports PostgreSQL 14, and the Phase 2 data model only needs standard
PostgreSQL capabilities that are available in PostgreSQL 14:

- tables
- foreign keys
- unique constraints
- JSON/JSONB fields
- enums
- indexes
- triggers for append-only audit logs
- Prisma migrations

Continue with PostgreSQL `14.23` if that is the installed version.

## Key decisions and rationale

- The `sudo -u postgres psql` directory warning can be ignored because it is a
  filesystem permission warning for the switched system user, not a database
  setup failure.
- Existing local `ffp` role and `ffp_dev` database are acceptable. Reset the
  password if needed; do not delete local database state unnecessarily.
- Manual `psql` connection checks must omit Prisma's `?schema=public` query
  parameter.
- Prisma should still use the `?schema=public` URL in environment
  configuration.
- PostgreSQL `14.23` is acceptable for the Phase 2 MVP database model.
- This setup supports later Phase 2 work: Prisma schema creation, initial
  migration, append-only audit log triggers, and seed data.

## Commands, files, and artifacts

Useful commands:

```bash
psql --version
pg_isready
sudo -u postgres psql
psql "postgresql://ffp:<local-dev-password>@localhost:5432/ffp_dev"
```

Useful SQL:

```sql
ALTER USER ffp WITH PASSWORD '<local-dev-password>';
GRANT ALL PRIVILEGES ON DATABASE ffp_dev TO ffp;
SELECT current_database(), current_user, current_schema();
\q
```

Relevant file:

```text
.env
```

Expected Prisma environment URL shape:

```env
DATABASE_URL=postgresql://ffp:<local-dev-password>@localhost:5432/ffp_dev?schema=public
```

## Validation checklist

- [ ] `psql --version` prints an installed PostgreSQL version.
- [ ] `pg_isready` reports that PostgreSQL is accepting connections.
- [ ] The `ffp` database role exists.
- [ ] The `ffp_dev` database exists and is owned by or usable by `ffp`.
- [ ] If needed, the `ffp` password has been reset with `ALTER USER`.
- [ ] The following manual `psql` connection succeeds without
      `?schema=public`:

  ```bash
  psql "postgresql://ffp:<local-dev-password>@localhost:5432/ffp_dev"
  ```

- [ ] Inside `psql`, this query returns database `ffp_dev`, user `ffp`, and
      schema `public`:

  ```sql
  SELECT current_database(), current_user, current_schema();
  ```

- [ ] The application `.env` keeps the Prisma-compatible URL shape with
      `?schema=public`.
- [ ] PostgreSQL `14.23` is treated as acceptable for the MVP.

## Risks and caveats

- Do not treat the `sudo -u postgres psql` directory warning as a PostgreSQL
  failure if the `postgres=#` prompt opens.
- Do not use the Prisma URL verbatim for manual `psql` testing; remove
  `?schema=public` for `psql`.
- Do not remove `?schema=public` from the Prisma environment URL unless the
  project intentionally changes how Prisma scopes schemas.
- If the role or database already exists, do not delete it unnecessarily. Use
  `ALTER USER` for password correction and keep the database if it is already
  usable.
- `.env` must not be committed. The repository `.gitignore` excludes it.
- This reference covers PostgreSQL setup only. It does not create the Prisma
  schema, migrations, or seed data.

## Reuse prompts

- "Continue Phase 2 from PostgreSQL config check and teach me Step 3: create
  the Prisma schema."
- "Help me verify my local PostgreSQL user/database for the Feature Flag
  Platform."
- "PostgreSQL is installed but Prisma cannot connect; troubleshoot my
  `DATABASE_URL`."
- "Explain why manual `psql` rejects `?schema=public` but Prisma accepts it."
- "Explain why PostgreSQL 14.23 is acceptable for this Prisma Phase 2 MVP."
