# Backend Integration Testing Strategy

> **Phase 16 update:** Request-context tests now resolve actors from configured
> bearer identities. Older `X-Actor` examples are historical MVP coverage, not
> the active authorization contract.

## Purpose

This document explains how to design **integration tests** for
`apps/backend/`. It is an advanced companion to:

- `docs/testing/backend-testing-strategy.md`
- `docs/testing/pre-phase-6-backend-unit-test-plan.md`

Unit tests prove one unit in isolation. Integration tests prove that multiple
backend parts work together correctly, especially when real persistence,
transactions, validation configuration, and repository mappings are involved.

For this feature flag platform, integration tests should prove that the backend
can safely persist configuration, evaluate flags from persisted data, and record
auditable changes without relying on mocks for the core path being tested.

## Integration test definition for this repo

An integration test checks a small group of real components together.

Examples:

- `EvaluationRepository` + real `PrismaService` + real PostgreSQL.
- `EvaluationService` + real `EvaluationRepository` + real database + real
  evaluation engine.
- `ProjectsService` + real repositories + real transaction service + real audit
  writer + real database.
- Validation pipe + DTOs + exception filter inside a Nest testing module.

An integration test may use a real test database. It should still avoid real
external services, production data, and browser automation.

## Integration vs unit vs e2e

| Test type | What it proves | Uses real DB? | Uses HTTP server? | Example |
| --- | --- | --- | --- | --- |
| Unit | One class/function works alone | No | No | `EvaluationService` with mocked repository |
| Integration | Real backend components work together | Usually yes | Usually no | `ProjectsService` writes project + audit row |
| E2E | Full API behavior through HTTP | Usually yes | Yes | `POST /v1/projects` with Supertest |

This repo already has e2e-style tests under:

```text
apps/backend/test/*.e2e-spec.ts
```

Those tests are valuable, but they are not the same as focused integration
tests. Integration tests should be narrower, faster, and easier to diagnose
than e2e tests.

## What integration tests should protect

Prioritize integration tests for behavior that mocks cannot prove well:

- Prisma query mappings are correct.
- Database uniqueness and foreign key constraints work.
- Transactions commit all required writes together.
- Transactions roll back when an error happens.
- Audit log rows are actually persisted with before/after snapshots.
- Evaluation reads real persisted projects, environments, flags, configs, and
  rules.
- List filters, pagination, and sorting work with real rows.
- DTO validation and exception formatting work together when a Nest app/module
  is configured.

## What integration tests should not do

Avoid integration tests that:

- hit production or shared development databases,
- depend on test execution order,
- use real user PII,
- delete append-only audit rows in a shared database,
- print connection strings or secrets,
- test every small method that unit tests already cover,
- duplicate all e2e tests through HTTP.

## Recommended integration test layers

Use three integration layers. Do not put every test into the heaviest layer.

### Layer 1: Repository integration tests

Goal: prove Prisma queries and database mappings.

Recommended for:

- `EvaluationRepository`
- `ProjectsRepository`
- `FeatureFlagsRepository`
- `FlagRulesRepository`
- `AuditLogsRepository`

Characteristics:

- real PostgreSQL,
- real Prisma client,
- no HTTP server,
- minimal Nest module setup or direct service instantiation.

Example file names:

```text
apps/backend/test/integration/evaluation.repository.integration-spec.ts
apps/backend/test/integration/repositories.integration-spec.ts
```

### Layer 2: Service integration tests

Goal: prove service orchestration with real repositories, real transactions,
and real audit writes.

Recommended for:

- `ProjectsService.create/update`
- `FeatureFlagsService.create/update/archive/restore`
- `FlagRulesService.replace`
- `SampleUsersService.create/delete`
- `EvaluationService.evaluate`

Characteristics:

- real PostgreSQL,
- real repositories,
- real transaction service,
- real audit writer,
- request context may be real or controlled through a test helper,
- no HTTP server.

Example file names:

```text
apps/backend/test/integration/projects.service.integration-spec.ts
apps/backend/test/integration/feature-flags.service.integration-spec.ts
apps/backend/test/integration/flag-rules.service.integration-spec.ts
apps/backend/test/integration/evaluation.service.integration-spec.ts
```

### Layer 3: App-module integration tests without broad user journeys

Goal: prove Nest configuration works for specific infrastructure behavior.

Recommended for:

- validation pipe + DTO behavior,
- exception filter formatting,
- request context middleware wiring,
- dependency injection boundaries.

If this layer uses Supertest through HTTP, it becomes e2e-style. Keep it small
and targeted.

## Test database strategy

Integration tests must use a dedicated test database.

Recommended environment variable:

```text
DATABASE_URL=postgresql://.../feature_flag_platform_test
```

Never use production. Never print the database URL in logs or documentation.

### Best option: disposable database per run

The cleanest strategy is:

1. Create a new test database for the run.
2. Apply migrations.
3. Run integration tests.
4. Drop the test database.

Benefits:

- strongest isolation,
- no leftover audit rows,
- safe to test uniqueness and foreign keys,
- parallelizable with per-worker database names.

Tradeoff:

- more setup complexity.

### Good MVP option: dedicated persistent test database with unique keys

If disposable databases are not available yet, use a dedicated persistent test
database and unique keys per test run.

Example key pattern:

```ts
const runId = `it-${Date.now()}-${process.pid}`;
const projectKey = `${runId}-project`;
const flagKey = `${runId}-flag`;
```

Benefits:

- simple,
- compatible with append-only audit behavior,
- matches current e2e isolation style.

Tradeoff:

- database grows over time,
- periodic manual reset is needed on the dedicated test database.

### Avoid deleting audit rows in shared databases

Audit logs are append-only by project guardrail. In shared or persistent
databases, tests should isolate with unique project keys instead of deleting
audit logs.

In a fully disposable test database, dropping the entire database after a run is
acceptable because the whole database exists only for that test run.

## Suggested Jest integration config

The backend currently has unit tests through Jest config in `package.json` and
e2e config at:

```text
apps/backend/test/jest-e2e.json
```

For integration tests, add a separate config when implementation begins:

```text
apps/backend/test/jest-integration.json
```

Suggested shape:

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".integration-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "runInBand": true
}
```

Suggested package script later:

```json
{
  "scripts": {
    "test:integration": "jest --config ./test/jest-integration.json --runInBand"
  }
}
```

Run command after adding the script:

```bash
npm run test:integration --workspace=@ffp/backend
```

Keep integration tests serial at first. Parallel database tests need stronger
isolation.

## Integration test setup helper

Create a helper only when you start implementing integration tests.

Suggested file:

```text
apps/backend/test/integration/create-integration-module.ts
```

Responsibilities:

- load `AppModule` or focused feature modules,
- provide real `PrismaService`,
- apply the same global validation/filter configuration if needed,
- expose helpers for request context actor/request ID,
- never print secrets.

For service/repository integration tests, prefer focused modules over the full
app when possible. A smaller testing module is faster and easier to debug.

## Data setup strategy

Use helper functions that create real database rows through Prisma or through
real services.

Recommended helpers:

```text
createProjectFixture
createFlagFixture
createDefaultEnvironmentFixture
createFlagConfigFixture
createRuleFixture
createSampleUserFixture
```

Use stable non-PII values:

```ts
const projectKey = `${runId}-demo-project`;
const flagKey = `${runId}-new-checkout`;
const targetingKey = `${runId}-demo-user`;
const actor = 'integration-test@example.local';
```

Do not use real emails, real customer IDs, or names that look like production
users.

## Transaction testing strategy

Unit tests can verify that the same mocked transaction client is passed around.
Integration tests should prove real transaction behavior.

Important transaction integration cases:

- project creation persists project, default environment, and audit log
  together,
- feature flag creation persists flag, default config, and audit log together,
- rule replacement deletes old rules, creates new rules, and writes audit log
  together,
- if audit writing fails, the mutation rolls back,
- if validation fails before transaction, no database writes happen.

Rollback tests require controlled failure injection. Do not corrupt production
code just for tests. Use a testing module override or a purposely mocked audit
writer inside a service integration test while keeping real repositories and a
real transaction service.

Example idea:

```ts
.overrideProvider(AuditLogService)
.useValue({
  record: jest.fn().mockRejectedValue(new Error('audit failed')),
})
```

Then assert the project/flag/rules were not persisted.

## Phase-based integration test plan

## Phase 0 integration coverage

Phase 0 is mostly contracts. Integration coverage should be through later API or
service tests.

Recommended checks:

- error responses use the expected shape when validation fails,
- pagination responses use the expected shape for real list data,
- evaluation missing records return evaluation-shaped `NOT_FOUND`, not a thrown
  management `404`.

## Phase 1 integration coverage

Low priority.

Recommended checks:

- health endpoint works in e2e tests,
- application module can compile with real providers.

Do not spend much integration effort here.

## Phase 2 integration coverage

High value because Phase 2 is database-centered.

Recommended tests:

- migrations create required tables,
- project key uniqueness is enforced,
- flag key uniqueness is scoped by project,
- rule priority uniqueness is enforced where the schema requires it,
- foreign keys prevent orphaned child rows,
- audit rows can reference project/flag targets,
- seed data creates demo project, flags, sample users, and rules.

These are database integration tests. They should run only against a dedicated
test database.

## Phase 3 integration coverage

Recommended tests:

- validation pipe + exception filter produce consistent error response bodies,
- request context middleware stores `X-Request-Id` and `X-Actor`,
- transaction service commits successful operations,
- transaction service rolls back failed operations,
- audit writer persists nullable JSON snapshots correctly,
- repositories use real Prisma mappings correctly.

## Phase 4 integration coverage

Phase 4 integration tests should prove the evaluation data plane against real
persisted data.

Recommended tests:

### Evaluation repository

- returns `null` when project is missing,
- returns `null` when default environment is missing,
- returns `null` when flag is missing,
- returns `null` when flag config is missing,
- returns snapshot with flag lifecycle, config, and ordered rules,
- uses explicit environment key when provided,
- uses project default environment when environment key is omitted.

### Evaluation service

- missing project returns `enabled=false` and `reason=NOT_FOUND`,
- missing flag returns `enabled=false` and `reason=NOT_FOUND`,
- disabled config returns `FLAG_DISABLED`,
- archived flag returns `FLAG_ARCHIVED`,
- kill switch returns `KILL_SWITCH`,
- user allowlist persisted in DB evaluates to `USER_ALLOWLIST`,
- role targeting persisted in DB evaluates to `ROLE_MATCH`,
- percentage rollout persisted in DB is deterministic across repeated calls,
- evaluation does not write audit logs.

This is one of the most important integration areas before demo.

## Phase 5 integration coverage

Phase 5 integration tests should prove real persistence and audit behavior for
control-plane APIs and services.

### Projects

- creating a project creates the default `production` environment,
- creating a project writes `PROJECT_CREATED` audit row,
- duplicate project key fails with conflict,
- updating a project writes `PROJECT_UPDATED` audit row,
- audit row has before/after snapshots.

### Feature flags

- creating a flag creates default environment config with safe defaults:
  - `status=DISABLED`,
  - `servingMode=TARGETED`,
  - `killSwitch=false`.
- creating a flag writes `FEATURE_FLAG_CREATED` audit row,
- updating a flag writes `FEATURE_FLAG_UPDATED` audit row,
- archiving writes `FEATURE_FLAG_ARCHIVED` audit row,
- restoring writes `FEATURE_FLAG_RESTORED` audit row,
- archived flag evaluates off through Phase 4 evaluation service.

### Rules

- replacing rules persists exactly the new rule set,
- replacing rules removes old rules for that flag config,
- rule replacement writes `FLAG_RULES_REPLACED` audit row,
- audit `before` contains previous rules,
- audit `after` contains new rules,
- evaluation result changes after rule replacement.

### Sample users

- creating sample user persists normalized targeting key, user ID, roles, and
  attributes,
- duplicate targeting key in same project fails,
- delete removes the sample user context,
- create/delete writes audit rows.

### Audit logs API/service

- list filters by target type,
- list filters by target key,
- list filters by actor,
- list filters by action,
- list filters by time range,
- pagination returns correct total and `hasNext`,
- invalid time range fails validation.

## Recommended integration test matrix

| Area | Unit tests prove | Integration tests prove |
| --- | --- | --- |
| Evaluation engine | pure rule logic | persisted rules/configs produce correct results |
| Evaluation repository | mocked query flow | real Prisma mapping and null behavior |
| Project creation | service calls tx/audit | project + environment + audit row persisted |
| Flag creation | safe defaults passed to repo | flag + config + audit row persisted |
| Rule replacement | validation and tx call order | old rules replaced and audit snapshots persisted |
| Audit logs | response mapping/filter object | filters work against real stored rows |
| Pagination | `hasNext` helper | totals/limits/offsets correct with real rows |
| Validation | DTO decorators/helpers | validation pipe + exception filter cooperate |

## Example: repository integration test shape

```ts
describe('EvaluationRepository integration', () => {
  let prisma: PrismaService;
  let repository: EvaluationRepository;
  let runId: string;

  beforeAll(async () => {
    // Create testing module with real PrismaService and EvaluationRepository.
  });

  beforeEach(() => {
    runId = `it-${Date.now()}`;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('loads an evaluation snapshot with ordered rules', async () => {
    const projectKey = `${runId}-project`;
    const flagKey = `${runId}-flag`;

    // Arrange real project, environment, flag, config, and rules.

    const snapshot = await repository.findSnapshot({
      projectKey,
      flagKey,
    });

    expect(snapshot).toMatchObject({
      flag: { lifecycleStatus: 'ACTIVE' },
      config: {
        status: 'ENABLED',
        servingMode: 'TARGETED',
        killSwitch: false,
      },
    });
    expect(snapshot?.rules.map((rule) => rule.priority)).toEqual([10, 20]);
  });
});
```

## Example: service integration test shape

```ts
it('creates project, default environment, and audit row together', async () => {
  const projectKey = `${runId}-project`;

  requestContext.run(
    { requestId: `${runId}-request`, actor: 'integration-test@example.local' },
    async () => {
      await projectsService.create({
        key: projectKey,
        name: 'Integration Project',
      });
    },
  );

  const project = await prisma.project.findUnique({
    where: { key: projectKey },
  });
  const environment = await prisma.environment.findFirst({
    where: { projectId: project?.id, key: 'production', isDefault: true },
  });
  const audit = await prisma.auditLogEntry.findFirst({
    where: { projectKey, action: 'PROJECT_CREATED' },
  });

  expect(project).toBeTruthy();
  expect(environment).toBeTruthy();
  expect(audit).toBeTruthy();
  expect(audit?.before).toBeNull();
  expect(audit?.after).toBeTruthy();
});
```

## Integration test isolation checklist

Before writing any integration test, confirm:

- [ ] It uses a dedicated test database.
- [ ] It never prints `DATABASE_URL`.
- [ ] It uses unique project/flag keys.
- [ ] It does not delete audit rows in a shared database.
- [ ] It can run repeatedly without manual cleanup.
- [ ] It does not depend on test order.
- [ ] It avoids real PII.
- [ ] It can run with `--runInBand`.

## Integration test priority before submission

If time is limited, prioritize these integration tests:

1. Project creation persists project, default environment, and audit row.
2. Feature flag creation persists safe default config and audit row.
3. Rule replacement persists rules and before/after audit snapshots.
4. Evaluation service evaluates from real persisted rules.
5. Missing project/flag evaluation returns `enabled=false` and
   `reason=NOT_FOUND`.
6. Audit log filters return expected persisted audit entries.
7. Validation pipe + exception filter produce consistent error responses.

These tests best support the project demo and mentor evaluation because they
prove the full feature-flag backend loop below the HTTP layer.

## Relationship with MCP database tools

Automated integration tests should not depend on MCP tools. They should run from
Jest against a dedicated test database.

Use repository files, Prisma schema, migrations, seed scripts, and tests first.
Only use the PostgreSQL readonly MCP for manual read-only inspection when local
files/tests are not enough, for example to inspect schema, seed rows, or audit
rows in a configured database. Never use the readonly MCP for writes or schema
changes.

Use Prisma MCP only for explicitly approved Prisma Postgres control-plane tasks,
such as database discovery or connection-string management. Do not expose
secrets in test output or documentation.

## Definition of done for integration testing

Integration testing is mature enough for the MVP when:

- integration tests run against a dedicated database,
- migrations/schema are applied before tests,
- tests isolate data with unique keys or disposable databases,
- Phase 4 evaluation reads real persisted config and returns correct reasons,
- Phase 5 mutations persist audit rows in the same transaction,
- rollback behavior is tested for at least one mutation flow,
- audit log filters are tested against real audit rows,
- validation/error formatting is tested through configured Nest infrastructure,
- the suite can be run separately from unit and e2e tests.

## Final guidance

Use unit tests to prove local behavior quickly. Use integration tests to prove
that your real backend pieces work together with PostgreSQL and Prisma.

For this repo, integration tests should protect this promise:

> Persisted feature flag configuration can be managed safely, audited reliably,
> and evaluated deterministically without relying on mocks for the critical data
> path.
