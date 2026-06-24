# Data Model and Migration Keywords — Step-by-Step Guide

This document explains the important keywords used in the Phase 2 Prisma data
model and PostgreSQL migration from scratch. Read it when you can see the
schema or migration file, but you do not yet understand what each word means.

Primary files:

```text
apps/backend/prisma/schema.prisma
apps/backend/prisma.config.ts
apps/backend/prisma/migrations/20260605133630_init_data_model/migration.sql
apps/backend/prisma/seed.ts
```

## 1. How to Read This Guide

Use this order:

1. Learn what each file does.
2. Learn Prisma schema block keywords.
3. Learn model field keywords.
4. Learn relation and index keywords.
5. Learn PostgreSQL migration SQL keywords.
6. Learn manual constraint keywords.
7. Learn seed/data setup keywords.
8. Practice by decoding one schema model and one SQL table.

The goal is not memorization. The goal is to read the Phase 2 implementation
and explain why each keyword exists.

## 2. File Keywords

### 2.1 `schema.prisma`

`schema.prisma` is Prisma's source-of-truth model file.

It describes:

- which database provider is used,
- what Prisma Client should generate,
- enums,
- models,
- field types,
- relationships,
- indexes,
- unique constraints,
- database table/column mappings.

In this project:

```text
apps/backend/prisma/schema.prisma
```

### 2.2 `prisma.config.ts`

`prisma.config.ts` configures Prisma tooling.

In this project, it tells Prisma:

- where the schema file is,
- where migrations live,
- which seed command to run,
- what database URL to use.

This matters because the project uses Prisma 7-style configuration. The
database URL is configured in `prisma.config.ts`, not inside `schema.prisma`.

### 2.3 `migration.sql`

`migration.sql` is the SQL Prisma applies to PostgreSQL.

It creates real database objects such as:

- enum types,
- tables,
- indexes,
- unique constraints,
- foreign keys,
- triggers,
- functions.

In this project:

```text
apps/backend/prisma/migrations/20260605133630_init_data_model/migration.sql
```

### 2.4 `migration_lock.toml`

`migration_lock.toml` records the database provider used by Prisma Migrate.

Current value:

```toml
provider = "postgresql"
```

Do not edit this manually.

### 2.5 `seed.ts`

`seed.ts` inserts repeatable demo data.

In this project it creates:

- `demo-project`,
- `production`, `staging`, and `development` environments,
- `beta-dashboard` and `new-checkout` flags,
- environment-specific flag configs,
- rules for `new-checkout`,
- sample users,
- initial audit entries.

## 3. Prisma Schema Top-Level Keywords

### 3.1 `generator`

Example:

```prisma
generator client {
  provider = "prisma-client-js"
}
```

Meaning:

> Generate Prisma Client for JavaScript/TypeScript.

Why it matters:

- backend TypeScript code will later import Prisma Client,
- generated types match the schema,
- changing the schema requires regenerating the client.

Command:

```bash
npm run prisma:generate --workspace=@ffp/backend
```

### 3.2 `client`

In:

```prisma
generator client
```

`client` is the name of this generator block. It is conventional.

### 3.3 `provider`

Example:

```prisma
provider = "prisma-client-js"
```

or:

```prisma
provider = "postgresql"
```

Meaning depends on where it appears:

| Location | Meaning |
| --- | --- |
| `generator` | Which Prisma generator to use. |
| `datasource` | Which database type to target. |

### 3.4 `datasource`

Example:

```prisma
datasource db {
  provider = "postgresql"
}
```

Meaning:

> The database source is PostgreSQL.

Why no `url = env("DATABASE_URL")` here?

Because this project uses Prisma 7 configuration through
`apps/backend/prisma.config.ts`.

### 3.5 `db`

In:

```prisma
datasource db
```

`db` is the datasource name. It is conventional and referenced by Prisma
internally.

### 3.6 `enum`

Example:

```prisma
enum RuleType {
  USER_ALLOWLIST
  ROLE_TARGETING
  PERCENTAGE_ROLLOUT
}
```

Meaning:

> A field using this enum can only store one of the listed values.

Why this is useful:

- prevents invalid rule type strings,
- improves generated TypeScript types,
- keeps API and database behavior predictable.

### 3.7 `model`

Example:

```prisma
model Project {
  id  String @id @default(cuid())
  key String @unique @db.VarChar(64)
}
```

Meaning:

> A Prisma model maps to a database table.

Usually:

```text
Prisma model Project -> PostgreSQL table projects
```

The exact table name is controlled by `@@map("projects")`.

## 4. Prisma Scalar Type Keywords

Scalar types describe what kind of value a field stores.

### 4.1 `String`

Example:

```prisma
key String @db.VarChar(64)
```

Meaning:

> Text value.

Used for:

- IDs,
- keys,
- names,
- actor,
- request IDs.

### 4.2 `String?`

Example:

```prisma
description String? @db.Text
```

Meaning:

> Optional text value. It may be `null`.

The `?` means nullable/optional.

### 4.3 `Int`

Example:

```prisma
priority Int
```

Meaning:

> Integer number.

Used for:

- rule priority,
- environment sort order.

### 4.4 `Boolean`

Example:

```prisma
killSwitch Boolean @default(false)
```

Meaning:

> True or false.

Used for:

- `isDefault`,
- `killSwitch`,
- rule `enabled`.

### 4.5 `DateTime`

Example:

```prisma
createdAt DateTime @default(now())
```

Meaning:

> Timestamp/date-time value.

Used for:

- `createdAt`,
- `updatedAt`,
- `archivedAt`.

### 4.6 `DateTime?`

Example:

```prisma
archivedAt DateTime? @map("archived_at")
```

Meaning:

> Optional timestamp.

For active flags, `archivedAt` can be null.

### 4.7 `Json`

Example:

```prisma
parameters Json @db.JsonB
```

Meaning:

> Structured JSON data.

Used for:

- rule parameters,
- sample user roles,
- sample user attributes,
- audit before/after snapshots,
- audit metadata.

### 4.8 `Json?`

Example:

```prisma
before Json? @db.JsonB
```

Meaning:

> Optional JSON value.

For create audit entries, `before` can be null. For delete audit entries,
`after` can be null.

### 4.9 Enum types as field types

Example:

```prisma
type RuleType
```

Meaning:

> The field must store a value from the `RuleType` enum.

This appears in:

```prisma
type         RuleType
status       FlagConfigStatus
servingMode  ServingMode
targetType   AuditTargetType
action       AuditAction
```

## 5. Prisma Field Attribute Keywords

Field attributes start with one `@`.

### 5.1 `@id`

Example:

```prisma
id String @id @default(cuid())
```

Meaning:

> This field is the primary key of the table.

Why it matters:

- uniquely identifies each row,
- other tables can reference it,
- Prisma uses it for `findUnique`.

### 5.2 `@default(...)`

Example:

```prisma
isDefault Boolean @default(false)
createdAt DateTime @default(now())
id String @default(cuid())
```

Meaning:

> If the application does not provide a value, use this default.

Common defaults:

| Default | Meaning |
| --- | --- |
| `cuid()` | Generate a unique string ID. |
| `now()` | Use current timestamp. |
| `false` | Default boolean false. |
| `true` | Default boolean true. |
| `DISABLED` | Default enum value. |
| `TARGETED` | Default enum value. |
| `"[]"` | Default empty JSON array. |
| `"{}"` | Default empty JSON object. |

### 5.3 `cuid()`

Example:

```prisma
id String @id @default(cuid())
```

Meaning:

> Generate a collision-resistant string ID.

Why use it:

- safer than exposing sequential IDs,
- works well in distributed systems,
- stable internal identifier.

### 5.4 `now()`

Example:

```prisma
createdAt DateTime @default(now())
```

Meaning:

> Use the current database/application timestamp at creation.

### 5.5 `@updatedAt`

Example:

```prisma
updatedAt DateTime @updatedAt
```

Meaning:

> Prisma updates this field automatically when the row changes.

Used for mutable configuration tables such as projects, environments, flags,
configs, rules, and sample users.

Not used for audit logs because audit entries are append-only and should not be
updated.

### 5.6 `@unique`

Example:

```prisma
key String @unique
```

Meaning:

> No two rows in this table can have the same value for this field.

In this project:

```prisma
Project.key
```

is globally unique.

### 5.7 `@map(...)`

Example:

```prisma
createdAt DateTime @map("created_at")
```

Meaning:

> Use one name in Prisma and another name in PostgreSQL.

Prisma field:

```text
createdAt
```

Database column:

```text
created_at
```

Why:

- TypeScript code prefers camelCase,
- PostgreSQL convention often uses snake_case.

### 5.8 `@db.VarChar(...)`

Example:

```prisma
key String @db.VarChar(64)
```

Meaning:

> Store this string as a PostgreSQL `VARCHAR` with a maximum length.

Why:

- enforces reasonable limits,
- prevents unbounded strings for keys/names,
- supports predictable indexes.

### 5.9 `@db.Text`

Example:

```prisma
description String? @db.Text
```

Meaning:

> Store this string as PostgreSQL `TEXT`.

Use it for longer free-form descriptions.

### 5.10 `@db.JsonB`

Example:

```prisma
parameters Json @db.JsonB
```

Meaning:

> Store JSON using PostgreSQL `JSONB`.

`JSONB` stores parsed binary JSON and is better for querying/indexing than raw
text JSON.

Important:

> JSONB only proves the value is JSON. It does not prove a rule parameter has
> the correct business shape. Backend validation is still required.

### 5.11 `@relation(...)`

Example:

```prisma
project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
```

Meaning:

> This field defines a relationship between two models.

Parts:

| Part | Meaning |
| --- | --- |
| `project Project` | This model has one related `Project`. |
| `fields: [projectId]` | Use this local field as the foreign key. |
| `references: [id]` | It points to the `id` field on `Project`. |
| `onDelete: Cascade` | If the project is deleted, delete these rows too. |

### 5.12 Named relation

Example:

```prisma
flagConfigs FlagEnvironmentConfig[] @relation("ProjectFlagConfigs")
```

Meaning:

> Give this relation a name so Prisma can disambiguate multiple relations
> between similar models.

This is needed when relation paths could otherwise be ambiguous.

## 6. Prisma Model Attribute Keywords

Model attributes start with two `@@`.

### 6.1 `@@map(...)`

Example:

```prisma
@@map("feature_flags")
```

Meaning:

> Map the Prisma model to a specific database table name.

Prisma:

```text
FeatureFlag
```

Database:

```text
feature_flags
```

### 6.2 `@@unique(...)`

Example:

```prisma
@@unique([projectId, key])
```

Meaning:

> The combination of these fields must be unique.

This allows:

```text
project A + flag key new-checkout
project B + flag key new-checkout
```

but prevents:

```text
project A + flag key new-checkout
project A + flag key new-checkout
```

### 6.3 Composite unique key

Example:

```prisma
@@unique([flagConfigId, priority])
```

Meaning:

> `priority` must be unique inside one flag config.

This is how ordered rules remain stable.

### 6.4 `@@index(...)`

Example:

```prisma
@@index([projectId, action, createdAt])
```

Meaning:

> Create a database index to make queries faster.

Indexes are useful for fields used in:

- `WHERE`,
- filtering,
- sorting,
- joins.

### 6.5 Difference between `@@unique` and `@@index`

| Keyword | Prevents duplicates? | Speeds queries? |
| --- | --- | --- |
| `@@unique` | Yes | Usually yes |
| `@@index` | No | Yes |

Use `@@unique` for correctness. Use `@@index` for performance.

## 7. Relation Cardinality Keywords

### 7.1 Single relation

Example:

```prisma
project Project
```

Meaning:

> This row belongs to one project.

### 7.2 List relation

Example:

```prisma
flags FeatureFlag[]
```

Meaning:

> This project has many feature flags.

The `[]` means a list.

### 7.3 Optional relation

Example:

```prisma
environment Environment?
```

Meaning:

> This audit entry may or may not still point to an environment.

It is optional because audit log `environmentId` uses `onDelete: SetNull`.

## 8. Referential Action Keywords

Referential actions decide what happens to child rows when a parent row changes.

### 8.1 `onDelete: Cascade`

Example:

```prisma
project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
```

Meaning:

> If the parent row is deleted, delete child rows too.

Used when child rows have no meaning without the parent.

Example:

```text
Deleting a FlagEnvironmentConfig deletes its FlagRule rows.
```

### 8.2 `onDelete: Restrict`

Example:

```prisma
project Project @relation(fields: [projectId], references: [id], onDelete: Restrict)
```

Meaning:

> Prevent deleting the parent while child rows still reference it.

Used to avoid accidental loss of important configuration or audit history.

### 8.3 `onDelete: SetNull`

Example:

```prisma
environment Environment? @relation(fields: [environmentId], references: [id], onDelete: SetNull)
```

Meaning:

> If the parent environment is deleted, keep the audit entry but set
> `environmentId` to null.

Why:

- audit entries must survive,
- historical `environmentKey` still remains for readability.

### 8.4 `onUpdate: Cascade`

In migration SQL, you will see:

```sql
ON UPDATE CASCADE
```

Meaning:

> If a referenced key changes, update dependent foreign keys too.

Primary IDs should rarely change, but this keeps referential behavior explicit.

## 9. Project-Specific Model Keywords

### 9.1 `Project`

Top-level container.

Owns:

- environments,
- feature flags,
- flag configs,
- sample user contexts,
- audit log entries.

### 9.2 `Environment`

Runtime context such as:

- `production`,
- `staging`,
- `development`.

Allows one feature flag to behave differently per environment.

### 9.3 `FeatureFlag`

Stable identity of a flag:

- key,
- name,
- lifecycle status.

Does not directly store per-environment runtime behavior.

### 9.4 `FlagEnvironmentConfig`

Runtime configuration for one flag in one environment:

- status,
- serving mode,
- kill switch,
- rules.

This is the bridge between `FeatureFlag` and `Environment`.

### 9.5 `FlagRule`

One targeting rule attached to a flag config.

Rule types:

- user allowlist,
- role targeting,
- percentage rollout.

### 9.6 `SampleUserContext`

Demo context used to test evaluation.

Not a login user. Not an authentication identity.

### 9.7 `AuditLogEntry`

Append-only record of a configuration mutation.

Used for:

- traceability,
- debugging,
- presentation explanation,
- safety.

## 10. PostgreSQL SQL Keywords in the Migration

The migration file is SQL. Prisma generates most of it, and this project adds
manual SQL for critical constraints.

### 10.1 `CREATE TYPE`

Example:

```sql
CREATE TYPE "RuleType" AS ENUM ('USER_ALLOWLIST', 'ROLE_TARGETING', 'PERCENTAGE_ROLLOUT');
```

Meaning:

> Create a PostgreSQL enum type.

This corresponds to a Prisma `enum`.

### 10.2 `AS ENUM`

Meaning:

> The type can only contain one of these values.

Example values:

```text
USER_ALLOWLIST
ROLE_TARGETING
PERCENTAGE_ROLLOUT
```

### 10.3 `CREATE TABLE`

Example:

```sql
CREATE TABLE "projects" (
  "id" TEXT NOT NULL,
  CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);
```

Meaning:

> Create a database table.

### 10.4 Quoted identifiers

Example:

```sql
"projects"
"created_at"
"FeatureFlagLifecycleStatus"
```

Meaning:

> The name is treated exactly as written.

PostgreSQL lowercases unquoted identifiers, so Prisma quotes names to preserve
exact generated names.

### 10.5 `TEXT`

Example:

```sql
"id" TEXT NOT NULL
```

Meaning:

> Variable-length text.

Prisma `String` often maps to `TEXT` unless a specific database type is given.

### 10.6 `VARCHAR(64)`

Example:

```sql
"key" VARCHAR(64) NOT NULL
```

Meaning:

> Text with maximum length 64.

Used for keys and readable identifiers.

### 10.7 `TIMESTAMP(3)`

Example:

```sql
"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
```

Meaning:

> Timestamp with millisecond precision.

`(3)` means three digits of fractional seconds.

### 10.8 `BOOLEAN`

Example:

```sql
"is_default" BOOLEAN NOT NULL DEFAULT false
```

Meaning:

> True/false value.

### 10.9 `INTEGER`

Example:

```sql
"priority" INTEGER NOT NULL
```

Meaning:

> Whole number.

### 10.10 `JSONB`

Example:

```sql
"parameters" JSONB NOT NULL
```

Meaning:

> Binary JSON storage in PostgreSQL.

Used for flexible data like rule parameters and audit snapshots.

### 10.11 `NOT NULL`

Example:

```sql
"name" VARCHAR(120) NOT NULL
```

Meaning:

> This column must always have a value.

If a column does not have `NOT NULL`, it can be null.

### 10.12 `DEFAULT`

Example:

```sql
"enabled" BOOLEAN NOT NULL DEFAULT true
```

Meaning:

> Use this value if insert does not provide one.

### 10.13 `CURRENT_TIMESTAMP`

Example:

```sql
DEFAULT CURRENT_TIMESTAMP
```

Meaning:

> Use the current timestamp when the row is inserted.

### 10.14 `CONSTRAINT`

Example:

```sql
CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
```

Meaning:

> Give a database rule a name.

Named constraints are easier to debug when errors occur.

### 10.15 `PRIMARY KEY`

Example:

```sql
PRIMARY KEY ("id")
```

Meaning:

> This column uniquely identifies every row in the table.

Primary keys are unique and not null.

## 11. Index and Uniqueness SQL Keywords

### 11.1 `CREATE INDEX`

Example:

```sql
CREATE INDEX "feature_flags_project_id_idx" ON "feature_flags"("project_id");
```

Meaning:

> Create a lookup structure to speed up queries.

### 11.2 `CREATE UNIQUE INDEX`

Example:

```sql
CREATE UNIQUE INDEX "projects_key_key" ON "projects"("key");
```

Meaning:

> Create an index that also prevents duplicate values.

### 11.3 Composite index

Example:

```sql
CREATE INDEX "audit_log_entries_project_id_action_created_at_idx"
ON "audit_log_entries"("project_id", "action", "created_at");
```

Meaning:

> Index multiple columns together.

This supports queries such as:

```text
Find audit logs for a project filtered by action and ordered by createdAt.
```

### 11.4 Partial unique index

Example:

```sql
CREATE UNIQUE INDEX "environments_one_default_per_project"
ON "environments" ("project_id")
WHERE "is_default" = true;
```

Meaning:

> Enforce uniqueness only for rows matching the `WHERE` condition.

In plain English:

```text
For rows where is_default is true,
each project_id may appear only once.
```

This allows:

```text
one default environment per project
many non-default environments per project
```

### 11.5 `WHERE` in an index

In a partial index:

```sql
WHERE "is_default" = true
```

Meaning:

> Only rows where this condition is true are included in the index.

## 12. Foreign Key SQL Keywords

### 12.1 `ALTER TABLE`

Example:

```sql
ALTER TABLE "environments" ADD CONSTRAINT ...
```

Meaning:

> Change an existing table.

Prisma creates tables first, then adds foreign keys with `ALTER TABLE`.

### 12.2 `ADD CONSTRAINT`

Meaning:

> Add a named rule to a table.

### 12.3 `FOREIGN KEY`

Example:

```sql
FOREIGN KEY ("project_id") REFERENCES "projects"("id")
```

Meaning:

> Values in this column must match rows in another table.

This prevents orphan rows.

### 12.4 `REFERENCES`

Example:

```sql
REFERENCES "projects"("id")
```

Meaning:

> The foreign key points to this table and column.

### 12.5 Composite foreign key

Example:

```sql
FOREIGN KEY ("project_id", "flag_id")
REFERENCES "feature_flags"("project_id", "id")
```

Meaning:

> The pair of local values must match a pair of values in the referenced table.

Why this project uses it:

- ensures flag config links a flag from the same project,
- prevents cross-project configuration mistakes.

### 12.6 `ON DELETE CASCADE`

Meaning:

> Delete child rows automatically when parent row is deleted.

Use with care.

### 12.7 `ON DELETE RESTRICT`

Meaning:

> Block parent deletion while child rows exist.

Used to protect important configuration and audit history.

### 12.8 `ON DELETE SET NULL`

Meaning:

> Keep the child row but set the foreign key to null.

Used for audit logs so history survives.

### 12.9 `ON UPDATE CASCADE`

Meaning:

> If referenced key values change, update child foreign key values too.

## 13. Manual Audit Trigger Keywords

Audit logs must be append-only. Prisma cannot fully express this as a schema
attribute, so the migration uses manual PostgreSQL trigger SQL.

### 13.1 `CREATE OR REPLACE FUNCTION`

Example:

```sql
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log_entries is append-only';
END;
$$ LANGUAGE plpgsql;
```

Meaning:

> Create a database function, or replace it if it already exists.

This function rejects audit updates/deletes.

### 13.2 `prevent_audit_log_mutation`

This is the custom function name.

Meaning:

> If someone tries to update or delete an audit row, throw an error.

### 13.3 `RETURNS trigger`

Meaning:

> This function is designed to run as a trigger.

### 13.4 `AS $$ ... $$`

Meaning:

> The function body is inside the dollar-quoted block.

Dollar quotes let PostgreSQL store multi-line function bodies without escaping
every quote.

### 13.5 `BEGIN` and `END`

Meaning:

> Start and end the function body.

### 13.6 `RAISE EXCEPTION`

Example:

```sql
RAISE EXCEPTION 'audit_log_entries is append-only';
```

Meaning:

> Stop the operation and return an error.

This is why audit updates/deletes fail.

### 13.7 `LANGUAGE plpgsql`

Meaning:

> The function is written in PostgreSQL's PL/pgSQL procedural language.

### 13.8 `CREATE TRIGGER`

Example:

```sql
CREATE TRIGGER audit_log_entries_no_update
BEFORE UPDATE ON "audit_log_entries"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_mutation();
```

Meaning:

> Register a function to run automatically when a database event happens.

### 13.9 `BEFORE UPDATE`

Meaning:

> Run the trigger before an update happens.

Because the function raises an exception, the update never completes.

### 13.10 `BEFORE DELETE`

Meaning:

> Run the trigger before a delete happens.

Because the function raises an exception, the delete never completes.

### 13.11 `FOR EACH ROW`

Meaning:

> Run the trigger once for every affected row.

### 13.12 `EXECUTE FUNCTION`

Meaning:

> Call this trigger function.

## 14. Prisma Config Keywords

The file:

```text
apps/backend/prisma.config.ts
```

uses TypeScript to configure Prisma tooling.

### 14.1 `import`

Example:

```ts
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';
```

Meaning:

> Load code from another package.

### 14.2 `config({ path: ... })`

Example:

```ts
config({ path: '../../.env' });
config({ path: '.env', override: true });
```

Meaning:

> Load environment variables from `.env` files.

Why two paths:

- root `.env`,
- backend workspace `.env`.

### 14.3 `override: true`

Meaning:

> If the same env variable exists already, replace it with this file's value.

This lets backend-specific `.env` override root values.

### 14.4 `process.env.DATABASE_URL`

Meaning:

> Read the `DATABASE_URL` environment variable.

This is how Prisma knows which PostgreSQL database to use.

### 14.5 `defineConfig`

Meaning:

> Create a typed Prisma configuration object.

### 14.6 `schema`

Example:

```ts
schema: 'prisma/schema.prisma'
```

Meaning:

> Location of the Prisma schema relative to `apps/backend`.

### 14.7 `migrations.path`

Example:

```ts
migrations: {
  path: 'prisma/migrations'
}
```

Meaning:

> Location of migration folders.

### 14.8 `migrations.seed`

Example:

```ts
seed: 'tsx prisma/seed.ts'
```

Meaning:

> Command Prisma should run for database seeding.

### 14.9 `datasource.url`

Example:

```ts
datasource: {
  url: databaseUrl
}
```

Meaning:

> Database connection URL for Prisma commands.

## 15. Seed Script Keywords

The seed script is TypeScript that uses Prisma Client.

### 15.1 `PrismaClient`

Meaning:

> TypeScript client used to query and mutate the database.

### 15.2 `PrismaPg`

Meaning:

> PostgreSQL adapter used by Prisma Client in this Prisma 7 setup.

### 15.3 `new PrismaClient({ adapter })`

Meaning:

> Create a Prisma Client instance connected through the PostgreSQL adapter.

### 15.4 `upsert`

Example:

```ts
await prisma.project.upsert({
  where: { key: 'demo-project' },
  update: { name: 'Demo Project' },
  create: { key: 'demo-project', name: 'Demo Project' },
});
```

Meaning:

> Update the row if it exists; otherwise create it.

Why seed uses it:

- running seed multiple times should not duplicate demo data,
- demo setup stays repeatable.

### 15.5 `where`

Meaning:

> How Prisma finds an existing row.

Example:

```ts
where: { key: 'demo-project' }
```

### 15.6 `update`

Meaning:

> Data to write if the row already exists.

### 15.7 `create`

Meaning:

> Data to insert if the row does not exist.

### 15.8 Compound unique selector

Example:

```ts
where: {
  projectId_key: {
    projectId: project.id,
    key: 'production',
  },
}
```

Meaning:

> Find a row using a composite unique key.

This corresponds to:

```prisma
@@unique([projectId, key])
```

### 15.9 `Prisma.DbNull`

Example:

```ts
before: Prisma.DbNull
```

Meaning:

> Store a database null in a Prisma JSON field.

Used for audit `before` snapshots during create-style seed events.

### 15.10 `$disconnect`

Meaning:

> Close the Prisma database connection when the script finishes.

## 16. Command Keywords

### 16.1 `prisma validate`

Command:

```bash
npm run prisma:validate --workspace=@ffp/backend
```

Meaning:

> Check schema syntax and Prisma validity.

### 16.2 `prisma generate`

Command:

```bash
npm run prisma:generate --workspace=@ffp/backend
```

Meaning:

> Generate Prisma Client for TypeScript.

Run after changing `schema.prisma`.

### 16.3 `prisma migrate dev`

Command:

```bash
npm run prisma:migrate --workspace=@ffp/backend
```

Meaning:

> Create/apply development migrations.

Use during local development, not as a blind production deploy command.

### 16.4 `prisma db seed`

Command:

```bash
npm run db:seed --workspace=@ffp/backend
```

Meaning:

> Run the configured seed script.

### 16.5 `prisma studio`

Command:

```bash
npm run prisma:studio --workspace=@ffp/backend
```

Meaning:

> Open a local web UI for inspecting database rows.

Use carefully. Do not edit audit rows; database triggers should reject
update/delete, but the safest habit is to treat audit data as read-only.

## 17. Decode Real Examples Step by Step

### 17.1 Decode a simple model field

Line:

```prisma
key String @unique @db.VarChar(64)
```

Step-by-step:

| Part | Meaning |
| --- | --- |
| `key` | Field name used in Prisma/TypeScript. |
| `String` | Text value. |
| `@unique` | No duplicate project keys. |
| `@db.VarChar(64)` | PostgreSQL stores max 64 characters. |

Plain English:

> Every project has a text key of max 64 characters, and no two projects can
> share the same key.

### 17.2 Decode a timestamp field

Line:

```prisma
createdAt DateTime @default(now()) @map("created_at")
```

Step-by-step:

| Part | Meaning |
| --- | --- |
| `createdAt` | TypeScript/Prisma field name. |
| `DateTime` | Timestamp value. |
| `@default(now())` | Fill with current time on insert. |
| `@map("created_at")` | Database column is `created_at`. |

Plain English:

> Prisma code uses `createdAt`, PostgreSQL stores `created_at`, and new rows
> automatically get the current timestamp.

### 17.3 Decode a relation

Line:

```prisma
project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
```

Step-by-step:

| Part | Meaning |
| --- | --- |
| `project` | Relation field name. |
| `Project` | Related model. |
| `fields: [projectId]` | Local FK column. |
| `references: [id]` | Target column on `Project`. |
| `onDelete: Cascade` | Delete child rows if project is deleted. |

Plain English:

> This row belongs to a project through `projectId`. If that project is
> deleted, this row is deleted too.

### 17.4 Decode a composite unique constraint

Line:

```prisma
@@unique([flagConfigId, priority])
```

Step-by-step:

| Part | Meaning |
| --- | --- |
| `@@unique` | Model-level uniqueness rule. |
| `flagConfigId` | Scope field. |
| `priority` | Ordered rule value. |

Plain English:

> Inside one flag config, two rules cannot have the same priority.

### 17.5 Decode a SQL table column

Line:

```sql
"status" "FlagConfigStatus" NOT NULL DEFAULT 'DISABLED'
```

Step-by-step:

| Part | Meaning |
| --- | --- |
| `"status"` | Column name. |
| `"FlagConfigStatus"` | PostgreSQL enum type. |
| `NOT NULL` | Must always have a value. |
| `DEFAULT 'DISABLED'` | New rows default to disabled. |

Plain English:

> Every flag config has a status, and if no status is provided, it starts
> disabled.

### 17.6 Decode the append-only audit trigger

Lines:

```sql
CREATE TRIGGER audit_log_entries_no_delete
BEFORE DELETE ON "audit_log_entries"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_mutation();
```

Step-by-step:

| Part | Meaning |
| --- | --- |
| `CREATE TRIGGER` | Register automatic DB behavior. |
| `audit_log_entries_no_delete` | Trigger name. |
| `BEFORE DELETE` | Run before delete happens. |
| `ON "audit_log_entries"` | Applies to audit table. |
| `FOR EACH ROW` | Runs for each row being deleted. |
| `EXECUTE FUNCTION` | Calls the rejection function. |

Plain English:

> Any attempt to delete an audit row calls a function that raises an exception,
> so the delete fails.

## 18. Learn These Keywords in Order

### Step 1 — Basic Prisma shape

Learn:

```text
generator
datasource
provider
enum
model
```

### Step 2 — Field basics

Learn:

```text
String
String?
Int
Boolean
DateTime
DateTime?
Json
Json?
```

### Step 3 — Field attributes

Learn:

```text
@id
@default
cuid()
now()
@updatedAt
@unique
@map
@db.VarChar
@db.Text
@db.JsonB
@relation
```

### Step 4 — Model attributes

Learn:

```text
@@map
@@unique
@@index
```

### Step 5 — Relations

Learn:

```text
fields
references
onDelete
Cascade
Restrict
SetNull
[]
?
```

### Step 6 — Migration SQL

Learn:

```text
CREATE TYPE
AS ENUM
CREATE TABLE
CONSTRAINT
PRIMARY KEY
CREATE INDEX
CREATE UNIQUE INDEX
ALTER TABLE
FOREIGN KEY
REFERENCES
ON DELETE
ON UPDATE
```

### Step 7 — Manual constraints

Learn:

```text
partial unique index
WHERE
CREATE OR REPLACE FUNCTION
RETURNS trigger
RAISE EXCEPTION
LANGUAGE plpgsql
CREATE TRIGGER
BEFORE UPDATE
BEFORE DELETE
FOR EACH ROW
EXECUTE FUNCTION
```

### Step 8 — Seed script

Learn:

```text
PrismaClient
PrismaPg
upsert
where
update
create
compound unique selector
Prisma.DbNull
$disconnect
```

## 19. Project Guardrail Keywords

These are not syntax keywords, but they are project-critical.

### 19.1 Append-only

Meaning:

> Audit rows can be inserted but not updated or deleted.

Why:

- preserves history,
- supports accountability,
- helps presentation and debugging.

### 19.2 Deterministic

Meaning:

> Same input and same flag configuration must produce the same result.

Why:

- percentage rollout cannot use randomness,
- users should not randomly move in/out of a rollout.

### 19.3 Stable non-PII key

Meaning:

> Use a persistent identifier that is not sensitive personal information.

Example:

```text
demo-user-beta
```

Avoid:

```text
email address
phone number
national ID
real name
```

### 19.4 Control plane

Meaning:

> Configuration side of the system.

Examples:

- admin dashboard,
- project API,
- flag API,
- rule API,
- audit API.

### 19.5 Data plane

Meaning:

> Runtime evaluation side of the system.

Example:

```text
POST /v1/evaluate
```

### 19.6 Safe default

Meaning:

> If evaluation cannot safely return On, return Off.

Example:

```text
missing flag -> enabled=false, reason=NOT_FOUND
```

## 20. Practice Checklist

Use this checklist to test your understanding:

```text
[ ] I can explain the difference between model and table.
[ ] I can explain the difference between @map and @@map.
[ ] I can explain the difference between @unique and @@unique.
[ ] I can explain why FeatureFlag and FlagEnvironmentConfig are separate.
[ ] I can explain why rules belong to FlagEnvironmentConfig.
[ ] I can explain why priority is unique within one flag config.
[ ] I can explain why sample users use targetingKey.
[ ] I can explain what JSONB stores and what it does not validate.
[ ] I can explain why audit logs have triggers.
[ ] I can explain what a partial unique index does.
[ ] I can explain Cascade, Restrict, and SetNull.
[ ] I can decode one migration CREATE TABLE block.
[ ] I can decode one ALTER TABLE foreign key block.
[ ] I can decode one CREATE TRIGGER block.
```

## 21. One-Sentence Summary

The Phase 2 data model uses Prisma keywords to describe domain models,
relationships, indexes, and mappings, then Prisma migrations turn those
keywords into PostgreSQL tables, enums, constraints, foreign keys, indexes, and
manual triggers that protect feature-flag configuration and append-only audit
history.
