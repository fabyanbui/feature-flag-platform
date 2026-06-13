# Pre-Phase 6 Backend Integration Test Plan

## Purpose

This document is the focused **integration test plan** for backend work completed
before Phase 6 of `docs/plan/implementation-roadmap.md`.

Use it after reading the broader strategy in
`docs/testing/backend-integration-testing-strategy.md` and the unit-test plan in
`docs/testing/pre-phase-6-backend-unit-test-plan.md`.

Phase 6 is the early vertical slice. Before Phase 6, integration tests should
prove that Phases 0-5 work together below the UI/demo layer:

- database schema and Prisma mappings work,
- services persist the correct rows,
- transactions commit and roll back correctly,
- audit logs are actually written,
- evaluation reads persisted configuration deterministically,
- validation/error infrastructure works when wired through Nest.

## What counts as an integration test here

An integration test checks multiple real backend parts together.

Good examples:

- real `EvaluationRepository` + real `PrismaService` + test PostgreSQL,
- real `EvaluationService` + real repository + real persisted rules,
- real `ProjectsService` + real repositories + real `TransactionService` + real
  `AuditLogService`,
- validation pipe + DTO + exception filter inside a Nest testing module.

Not integration tests:

- a mocked service unit test,
- a browser/UI test,
- a full demo app test,
- a production database smoke test,
- a test that prints or depends on secrets.

## Required test database rule

Pre-Phase 6 integration tests must run against a **dedicated test database**.
Do not run them against production or a shared manual demo database.

Preferred setup:

```text
DATABASE_URL=<dedicated integration test database URL>
```

Do not commit or print the actual URL.

## Isolation strategy

Because audit logs are append-only, use one of these strategies.

### Best strategy: disposable database per run

1. Create test database.
2. Apply migrations.
3. Run integration tests.
4. Drop the whole test database.

This is the cleanest option.

### MVP strategy: persistent test database with unique keys

Use unique test keys and do not delete audit rows.

Example:

```ts
const runId = `int-${Date.now()}-${process.pid}`;
const projectKey = `${runId}-project`;
const flagKey = `${runId}-flag`;
const targetingKey = `${runId}-user`;
```

This matches the repo guardrail that audit logs are append-only.

## Suggested file layout

Add integration tests under a dedicated folder:

```text
apps/backend/test/integration/
```

Suggested files:

```text
apps/backend/test/integration/phase-2-schema.integration-spec.ts
apps/backend/test/integration/phase-3-foundation.integration-spec.ts
apps/backend/test/integration/phase-4-evaluation.integration-spec.ts
apps/backend/test/integration/phase-5-management.integration-spec.ts
apps/backend/test/integration/integration-test-helpers.ts
```

If a file becomes too large, split by domain:

```text
apps/backend/test/integration/projects.integration-spec.ts
apps/backend/test/integration/feature-flags.integration-spec.ts
apps/backend/test/integration/flag-rules.integration-spec.ts
apps/backend/test/integration/evaluation.integration-spec.ts
apps/backend/test/integration/audit-logs.integration-spec.ts
```

## Suggested Jest config

Add only when integration tests are implemented:

```text
apps/backend/test/jest-integration.json
```

Suggested content:

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".integration-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

Suggested package script:

```json
{
  "scripts": {
    "test:integration": "jest --config ./test/jest-integration.json --runInBand"
  }
}
```

Run:

```bash
npm run test:integration --workspace=@ffp/backend
```

Keep integration tests serial first. Parallel database integration tests require
stronger database-per-worker isolation.

---

# Phase 0 integration plan — contracts

Phase 0 mostly defined contracts. Integration tests should prove those contracts
when backend infrastructure is wired together.

## Required integration checks

- validation errors produce consistent JSON shape,
- not-found management errors produce consistent JSON shape,
- conflict errors produce consistent JSON shape,
- list responses use the standard page shape,
- evaluation missing project/flag returns HTTP 200 with evaluation-shaped
  `enabled=false` and `reason=NOT_FOUND`, not a thrown management 404.

## Suggested assertions

For validation errors:

```ts
expect(response.body).toMatchObject({
  code: 'VALIDATION_ERROR',
  requestId: expect.any(String),
});
```

For evaluation missing resource:

```ts
expect(response.body).toMatchObject({
  projectKey,
  flagKey,
  enabled: false,
  reason: 'NOT_FOUND',
});
```

## Priority

Medium. These checks are valuable because Phase 6 depends on stable API
contracts.

---

# Phase 1 integration plan — scaffold and app wiring

Phase 1 created the backend application scaffold and local workflow.

## Required integration checks

- `AppModule` compiles with real providers,
- health endpoint works through configured app setup,
- global prefix `/v1` is applied in e2e/app-level tests.

## What not to over-test

Do not spend heavy integration effort on:

- module metadata only,
- Swagger setup details,
- `main.ts`,
- npm scripts,
- TypeScript config.

## Priority

Low. Keep Phase 1 integration tests small.

---

# Phase 2 integration plan — schema, migrations, seed data

Phase 2 is database-centered, so integration testing is important here.

## Required integration checks

### Schema existence

Verify required models/tables can be used by Prisma:

- projects,
- environments,
- feature flags,
- flag environment configs,
- flag rules,
- sample user contexts,
- audit log entries.

Do not inspect this by string-matching migration files only. Use real Prisma
operations or read-only database checks in the test database.

### Uniqueness behavior

Test real database constraints:

- duplicate project key is rejected,
- duplicate flag key in the same project is rejected,
- same flag key in different projects is allowed,
- duplicate sample user targeting key in the same project is rejected,
- rule priority uniqueness behaves according to schema design.

### Foreign key behavior

Test that child records cannot point to missing parents:

- flag requires project,
- environment requires project,
- flag config requires project, flag, and environment,
- rule requires flag config,
- audit entry requires project according to current schema design.

### Seed behavior

If seed data is part of the MVP demo, test with a dedicated test database or a
seed smoke suite:

- seed creates a demo project,
- seed creates at least one demo flag,
- seed creates sample user contexts,
- seed creates rules that can be evaluated,
- seed does not use real PII.

## Priority

High for schema constraints that protect data integrity. Medium for seed tests
unless the demo depends heavily on seed data.

---

# Phase 3 integration plan — backend foundation

Phase 3 created the backend infrastructure that Phase 4 and Phase 5 depend on.

## Required integration checks

### Validation pipe + exception filter

Using a configured Nest testing app/module, verify:

- invalid key format returns `VALIDATION_ERROR`,
- unknown route or missing resource returns `NOT_FOUND` where applicable,
- duplicate resource maps to `CONFLICT`,
- response includes request ID,
- unknown internal errors do not expose stack traces.

### Request context

Verify real middleware behavior:

- incoming `X-Request-Id` is returned as response request ID,
- blank/missing request ID generates a safe request ID,
- incoming `X-Actor` is available to mutation services,
- missing `X-Actor` causes mutation endpoints/services to fail validation.

### Transaction helper

With a real database, verify:

- successful transaction commits all writes,
- thrown error rolls back all writes.

### Audit writer

With real Prisma transaction client, verify:

- audit row persists required fields,
- `before` and `after` snapshots persist as JSON/null correctly,
- metadata persists,
- request ID persists.

### Repository mappings

For real repositories, verify:

- find/list/count methods map query arguments correctly,
- transaction client usage works,
- returned shapes include the fields services need.

## Priority

High. Phase 3 integration issues can break Phase 4/5 even if unit tests pass.

---

# Phase 4 integration plan — evaluation data plane

Phase 4 is the most important pre-Phase 6 integration area for the runtime data
plane.

## Required integration checks

### Evaluation repository with real data

Create real rows for project, default environment, flag, config, and rules.
Then verify:

- missing project returns `null`,
- missing environment returns `null`,
- missing flag returns `null`,
- missing flag config returns `null`,
- complete setup returns snapshot,
- snapshot contains lifecycle status,
- snapshot contains environment config status, serving mode, and kill switch,
- snapshot contains rules ordered by priority,
- omitted `environmentKey` uses default environment,
- provided `environmentKey` uses explicit environment.

### Evaluation service with real repository

Using real persisted data, verify:

- missing project returns `enabled=false`, `reason=NOT_FOUND`,
- missing flag returns `enabled=false`, `reason=NOT_FOUND`,
- disabled config returns `reason=FLAG_DISABLED`,
- archived flag returns `reason=FLAG_ARCHIVED`,
- kill switch returns `reason=KILL_SWITCH`,
- global on returns `enabled=true`, `reason=GLOBAL_ON`,
- user allowlist rule returns `USER_ALLOWLIST`,
- role targeting rule returns `ROLE_MATCH`,
- percentage rollout is deterministic across repeated calls,
- no rule match returns `DEFAULT_OFF`,
- evaluation path does not create audit log entries.

## Required data-plane guardrails

- Evaluation must be read-only.
- Missing records must not throw a management-style 404.
- Same input must return the same result.
- Stable non-PII targeting keys must be used in fixtures.

## Priority

Very high. Phase 6 demo depends on this.

---

# Phase 5 integration plan — management APIs and audit logging

Phase 5 is the most important pre-Phase 6 integration area for the control
plane.

## Projects integration checks

Using real services/repositories/database, verify:

- project creation persists project,
- project creation creates default `production` environment,
- project creation writes `PROJECT_CREATED` audit row,
- audit row has `before=null`,
- audit row has `after` project snapshot,
- duplicate project key fails,
- project update writes `PROJECT_UPDATED` audit row,
- project update audit row includes before and after snapshots.

## Feature flags integration checks

Verify:

- flag creation persists flag under project,
- flag creation creates default flag environment config,
- default config is safe:
  - `status=DISABLED`,
  - `servingMode=TARGETED`,
  - `killSwitch=false`,
- flag creation writes `FEATURE_FLAG_CREATED` audit row,
- duplicate flag key in same project fails,
- flag update writes `FEATURE_FLAG_UPDATED` audit row,
- archive writes `FEATURE_FLAG_ARCHIVED` audit row,
- restore writes `FEATURE_FLAG_RESTORED` audit row,
- archived flag evaluates off through Phase 4 evaluation service.

## Flag rules integration checks

Verify:

- rule replacement persists exactly the new rules,
- replacing with empty array clears existing rules,
- old rules are removed for that flag config,
- rule replacement writes `FLAG_RULES_REPLACED` audit row,
- audit `before` contains old rules,
- audit `after` contains new rules,
- audit metadata includes replaced rule count,
- invalid duplicate priorities fail before persistence,
- invalid percentage fails before persistence,
- evaluation result changes after valid rule replacement.

## Sample users integration checks

Verify:

- sample user creation persists normalized display name, targeting key, user ID,
  roles, and attributes,
- duplicate targeting key in the same project fails,
- sample user create writes `SAMPLE_USER_CREATED` audit row,
- sample user delete removes the row,
- sample user delete writes `SAMPLE_USER_DELETED` audit row,
- deleted sample user's audit `before` snapshot is retained.

## Audit logs integration checks

Verify audit log listing filters with real audit rows:

- filter by target type,
- filter by target key,
- filter by actor,
- filter by action,
- filter by time range,
- pagination with `limit` and `offset`,
- sort order,
- invalid time range fails validation.

## Transaction rollback checks

At least one pre-Phase 6 integration test should prove rollback behavior.

Recommended cases:

- project creation rolls back if audit write fails,
- flag creation rolls back if config creation or audit write fails,
- rule replacement rolls back if audit write fails.

Use a test-only provider override to force failure while keeping real
repositories and real `TransactionService`.

Example concept:

```ts
.overrideProvider(AuditLogService)
.useValue({
  record: jest.fn().mockRejectedValue(new Error('forced audit failure')),
})
```

Then assert the project/flag/rule mutation did not persist.

## Priority

Very high. Phase 6 demo setup depends on management APIs writing trustworthy
configuration and audit rows.

---

# Recommended pre-Phase 6 integration test sequence

Implement tests in this order:

1. Test database setup and helper functions.
2. Phase 2 schema/constraint smoke tests.
3. Phase 3 transaction commit/rollback and audit writer tests.
4. Phase 5 project creation with default environment and audit row.
5. Phase 5 flag creation with default config and audit row.
6. Phase 5 rule replacement with before/after audit snapshot.
7. Phase 4 evaluation from real persisted flag/rule data.
8. Phase 4 missing project/flag `NOT_FOUND` evaluation result.
9. Phase 5 audit log filters and pagination.
10. Phase 3 validation/error formatting through configured Nest app.

This sequence builds confidence from persistence foundation to full feature flag
backend behavior.

---

# Minimum pre-Phase 6 integration suite

If time is limited before Phase 6, implement at least these tests:

```text
1. Project creation persists project + default environment + audit row.
2. Feature flag creation persists flag + safe default config + audit row.
3. Rule replacement persists rules + before/after audit row.
4. Evaluation service reads persisted role rule and returns ROLE_MATCH.
5. Evaluation service returns NOT_FOUND for missing project/flag.
6. Duplicate project key or flag key fails through real database/service path.
7. One rollback test proves mutation and audit are atomic.
```

This minimum set proves the backend can support the Phase 6 vertical slice.

---

# Integration test helper checklist

Create helpers only when implementing the tests. Useful helpers:

```text
createIntegrationTestingModule
createUniqueRunId
createProjectFixture
createFlagFixture
createEnabledFlagConfigFixture
createRuleFixture
createSampleUserFixture
findAuditEntry
```

Helper rules:

- keep helpers deterministic,
- use stable non-PII identifiers,
- do not hide important assertions inside helpers,
- do not print secrets,
- keep audit logs append-only unless using a disposable database.

---

# Data fixture conventions

Use predictable, non-PII fixture values:

```ts
const actor = 'integration-test@example.local';
const requestId = `${runId}-request`;
const projectKey = `${runId}-project`;
const flagKey = `${runId}-new-checkout`;
const targetingKey = `${runId}-user-regular`;
const betaRole = 'beta-tester';
```

Avoid:

- real customer emails,
- real employee identifiers,
- random values that make failures hard to reproduce,
- shared project keys across tests.

---

# Pre-Phase 6 integration checklist

## Database and isolation

- [ ] Dedicated test database is configured.
- [ ] Tests never print database URLs.
- [ ] Migrations are applied before tests.
- [ ] Tests use unique project/flag keys.
- [ ] Append-only audit logs are respected.
- [ ] Tests can run repeatedly.

## Phase 0-3 foundation

- [ ] API error shape is verified through configured Nest infrastructure.
- [ ] Pagination shape is verified with real list data.
- [ ] Request context handles request ID and actor.
- [ ] Transactions commit and roll back correctly.
- [ ] Audit writer persists JSON snapshots correctly.
- [ ] Core repository mappings work with real Prisma.

## Phase 4 data plane

- [ ] Evaluation repository loads real snapshots.
- [ ] Missing persisted records map to `NOT_FOUND` evaluation result.
- [ ] Kill switch, disabled config, archived flag, and global on are verified
  from real persisted config.
- [ ] User allowlist, role targeting, and percentage rollout are verified from
  real persisted rules.
- [ ] Repeated percentage evaluations are deterministic.
- [ ] Evaluation does not write audit logs.

## Phase 5 control plane

- [ ] Project mutations write audit logs.
- [ ] Feature flag mutations write audit logs.
- [ ] Rule replacement writes audit logs with before/after snapshots.
- [ ] Sample user mutations write audit logs.
- [ ] Audit log filters work with real rows.
- [ ] At least one rollback test proves audit and mutation atomicity.

---

# Done criteria before Phase 6

Pre-Phase 6 integration testing is sufficient when:

- the integration suite runs separately from unit and e2e tests,
- it uses a dedicated test database,
- it proves real persistence for projects, flags, configs, rules, sample users,
  and audit rows,
- it proves evaluation reads real persisted configuration,
- it proves missing project/flag evaluation returns `enabled=false` with
  `reason=NOT_FOUND`,
- it proves same-transaction audit behavior for at least the critical mutation
  path,
- it proves validation/error infrastructure works when wired through Nest,
- it can run before Phase 6 without manual cleanup.

## Final reminder

Before Phase 6, integration tests should answer this question:

> Can the backend persist feature flag configuration, audit every important
> change, and evaluate the persisted configuration safely and deterministically?

If yes, Phase 6 can focus on the demo vertical slice instead of discovering
backend foundation bugs.
