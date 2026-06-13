# Pre-Phase 6 Backend Unit Test Plan

## Purpose

This document is the unit-test plan for backend work completed **before Phase 6**
of `docs/plan/implementation-roadmap.md`. It covers Phase 0 through Phase 5 and
keeps the focus on unit testing only.

Phase 6 is the early vertical slice where the team proves the end-to-end demo
flow. Before starting or relying on Phase 6, the backend should already have
unit tests for the important behavior built in Phases 0-5.

## Scope

This plan covers backend unit tests for:

- Phase 0: MVP scope and API contracts that later became code-level behavior.
- Phase 1: backend scaffold and local workflow foundation.
- Phase 2: data model, migrations, and seed behavior where unit-testable.
- Phase 3: backend foundation utilities, validation, errors, request context,
  transaction helper, audit writer, and repositories.
- Phase 4: evaluation engine and read-only data-plane API.
- Phase 5: management APIs with transactional audit logging.

This plan does **not** cover:

- e2e tests with Supertest,
- integration tests with a real PostgreSQL database,
- live Prisma migration verification,
- browser/UI tests,
- manual smoke tests,
- Phase 6 vertical-slice testing.

## Unit-test rule for this document

A unit test in this plan must:

- test one function, class, or public method at a time,
- mock repositories, Prisma, transaction clients, services, and request context,
- avoid real PostgreSQL,
- avoid HTTP server binding,
- avoid network calls,
- avoid depending on test execution order,
- use deterministic fixtures.

If a test starts the Nest app and calls HTTP endpoints with Supertest, it is not
a unit test. It is e2e or integration testing.

## Commands

Run all backend unit tests:

```bash
npm run test --workspace=@ffp/backend -- --runInBand
```

Run one unit test file:

```bash
npm run test --workspace=@ffp/backend -- evaluation.service.spec.ts
```

Run coverage:

```bash
npm run test --workspace=@ffp/backend -- --coverage
```

## Current baseline

The backend already has unit tests for the pure Phase 4 evaluation engine:

```text
apps/backend/src/evaluation/engine/evaluation-engine.spec.ts
apps/backend/src/evaluation/engine/stable-rollout-hash.spec.ts
```

There is also a starter health/app controller test:

```text
apps/backend/src/app.controller.spec.ts
```

This plan extends coverage across all unit-testable backend behavior from
Phases 0-5.

## Priority order before Phase 6

Implement unit tests in this order:

1. Phase 4 pure evaluation engine and stable rollout hash.
2. Phase 4 evaluation service fail-closed behavior.
3. Phase 5 mutation services with same-transaction audit logging.
4. Phase 5 rule validation and rule replacement behavior.
5. Phase 3 shared foundation utilities used by many services.
6. Phase 5 list/read services with filters, pagination, and sorting.
7. Phase 4 evaluation repository with mocked Prisma.
8. Phase 5 controllers as thin delegation tests.
9. Phase 3 repositories only where mocked Prisma query shape is valuable.
10. Phase 1 health/scaffold tests and low-risk wrappers.
11. Phase 2 seed/data-model helper tests only when logic exists outside Prisma.

The highest-value tests are those that protect safe defaults, deterministic
evaluation, validation contracts, and append-only audit logging.

---

# Part 1: Phase 0 unit-test coverage

Phase 0 was mostly planning and contract definition, so it does not have many
files to unit test directly. However, its decisions became code-level contracts
in later phases. Unit tests should protect those contracts wherever they appear
in code.

## Phase 0 contracts to protect

- `/v1` API base path is a runtime/e2e concern, not a unit-test concern.
- JSON request/response conventions are mostly e2e/API contract concerns.
- Consistent error response shape is unit-testable through error helpers and the
  global exception filter.
- Reason codes are unit-testable through the evaluation engine.
- Key validation rules are unit-testable through DTO validation helper tests or
  controller/e2e tests.
- Pagination shape is unit-testable through `createPageResponse`.
- Audit log event shape is unit-testable through `AuditLogService.record` and
  mutation service tests.

## Recommended unit tests from Phase 0 contracts

### Error helpers

File:

```text
apps/backend/src/common/errors/api-exception.helpers.ts
```

Recommended spec:

```text
apps/backend/src/common/errors/api-exception.helpers.spec.ts
```

Test cases:

- `validationError` returns `BadRequestException` with
  `code=VALIDATION_ERROR`.
- `notFoundError` returns `NotFoundException` with `code=NOT_FOUND`.
- `conflictError` returns `ConflictException` with `code=CONFLICT`.
- details passed to `validationError` are preserved.

### Page response helper

File:

```text
apps/backend/src/common/dto/page-response.dto.ts
```

Recommended spec:

```text
apps/backend/src/common/dto/page-response.dto.spec.ts
```

Test cases:

- returns `items` unchanged.
- returns `limit`, `offset`, and `total`.
- returns `hasNext=true` when `offset + limit < total`.
- returns `hasNext=false` when `offset + limit >= total`.
- works for empty item arrays.

### Key parameter DTO validation

File:

```text
apps/backend/src/common/dto/key-param.dto.ts
```

Recommended spec:

```text
apps/backend/src/common/dto/key-param.dto.spec.ts
```

Test cases:

- accepts valid `projectKey` values.
- accepts valid `flagKey` values.
- rejects whitespace-only keys.
- rejects invalid characters.
- rejects keys outside the allowed format.

Use `class-validator` in a focused DTO unit test if you want fast feedback. Full
HTTP validation can still be covered later by e2e tests.

---

# Part 2: Phase 1 unit-test coverage

Phase 1 is mostly scaffold and local workflow. Most scaffold files do not need
unit tests. Test only behavior that has logic.

## Health service and controller

Files:

```text
apps/backend/src/app.service.ts
apps/backend/src/app.controller.ts
```

Existing or recommended spec:

```text
apps/backend/src/app.controller.spec.ts
apps/backend/src/app.service.spec.ts
```

Test cases:

- `AppService.getHealth()` returns `{ status: 'ok', service:
  'feature-flag-backend' }`.
- `AppController.getHealth()` delegates to `AppService.getHealth()`.

These are low-priority tests. Keep them small.

## What to skip from Phase 1

Usually skip unit tests for:

- `main.ts`,
- Nest module metadata only,
- Swagger bootstrapping,
- npm workspace configuration,
- local environment examples,
- generated build output.

These are better checked through build, lint, and e2e startup tests.

---

# Part 3: Phase 2 unit-test coverage

Phase 2 is mostly Prisma schema, migrations, PostgreSQL setup, and seed data.
Most of this is not unit-testable because it needs database verification.

## What to unit test in Phase 2

Unit test Phase 2 only when logic exists outside Prisma/database execution.

Possible candidates:

- seed data factory functions,
- pure mapping helpers used by seed scripts,
- constants for default demo data,
- functions that normalize sample demo contexts.

If the seed script directly calls Prisma, do not force it into a unit test.
Prefer an integration or seed smoke test later.

## What not to unit test in Phase 2

Do not unit test:

- Prisma schema itself,
- generated Prisma client,
- migrations,
- database constraints,
- real foreign key behavior,
- real uniqueness constraints,
- actual append-only database constraints.

Those require integration/database validation, not unit tests.

## Repository behavior from Phase 2

Repository classes were expanded later, but they depend on the Phase 2 data
model. Unit test repositories only for query/mapping behavior that is easy to
break and easy to mock. Do not try to prove real database constraints with unit
tests.

---

# Part 4: Phase 3 unit-test coverage

Phase 3 created the backend foundation. These units are important because Phase
4 and Phase 5 depend on them.

## Validation and pagination DTOs

Files:

```text
apps/backend/src/common/dto/pagination-query.dto.ts
apps/backend/src/common/dto/time-range-query.dto.ts
```

Recommended specs:

```text
apps/backend/src/common/dto/pagination-query.dto.spec.ts
apps/backend/src/common/dto/time-range-query.dto.spec.ts
```

Test cases:

- default `limit` is `20`.
- default `offset` is `0`.
- default `order` is `desc`.
- `limit` and `offset` are transformed to numbers.
- invalid `limit`, `offset`, or `order` fails validation.
- time range fields accept valid date strings when applicable.

These tests are useful because Phase 5 list APIs depend on pagination.

## Global exception filter

File:

```text
apps/backend/src/common/filters/api-exception.filter.ts
```

Recommended spec:

```text
apps/backend/src/common/filters/api-exception.filter.spec.ts
```

Test cases:

- API-shaped `HttpException` response preserves `code`, `message`, and
  `details`.
- generic `BadRequestException` maps to `VALIDATION_ERROR`.
- generic `NotFoundException` maps to `NOT_FOUND`.
- generic `ConflictException` maps to `CONFLICT`.
- unknown errors map to `INTERNAL_ERROR`.
- response includes request ID from `RequestContextService`.
- unknown errors do not expose raw stack traces in response.

Mock the `ArgumentsHost` and Express response object. Do not start the app.

## Request context service

File:

```text
apps/backend/src/common/request-context/request-context.service.ts
```

Recommended spec:

```text
apps/backend/src/common/request-context/request-context.service.spec.ts
```

Test cases:

- returns `unknown` when no context is active.
- returns `undefined` actor when no context is active.
- returns request ID inside `run` callback.
- returns actor inside `run` callback.
- nested or separate runs do not leak context.

## Request context middleware

File:

```text
apps/backend/src/common/middleware/request-context.middleware.ts
```

Recommended spec:

```text
apps/backend/src/common/middleware/request-context.middleware.spec.ts
```

Test cases:

- uses incoming request ID header when present.
- trims incoming request ID.
- generates `req_...` request ID when missing or blank.
- sets response request ID header.
- trims incoming actor header.
- stores `undefined` actor when missing or blank.
- calls `next` inside `RequestContextService.run`.

Use mocks for request, response, and `RequestContextService`. Do not rely on the
actual randomness of `randomUUID`; assert prefix/presence or mock the crypto
function if needed.

## Transaction service

File:

```text
apps/backend/src/database/transaction.service.ts
```

Recommended spec:

```text
apps/backend/src/database/transaction.service.spec.ts
```

Test cases:

- calls `prisma.$transaction`.
- passes transaction client to the callback.
- returns the callback result.
- propagates callback errors.

This is a small wrapper test. Do not test Prisma itself.

## Audit log writer

File:

```text
apps/backend/src/audit/audit-log.service.ts
```

Recommended spec:

```text
apps/backend/src/audit/audit-log.service.spec.ts
```

Test cases:

- writes all required audit fields.
- defaults optional `environmentId`, `environmentKey`, and `targetKey` to
  `null`.
- maps missing `before` to `Prisma.DbNull`.
- maps missing `after` to `Prisma.DbNull`.
- defaults missing metadata to `{ source: 'api' }`.
- passes through request ID.

This is Phase 3 foundation, but it is critical for Phase 5 audit behavior.

## Audit snapshot utility

File:

```text
apps/backend/src/common/utils/audit-snapshot.util.ts
```

Recommended spec:

```text
apps/backend/src/common/utils/audit-snapshot.util.spec.ts
```

Test cases:

- returns `null` for `null` or `undefined` input.
- removes `undefined` object properties.
- removes `undefined` array items.
- converts dates to ISO strings.
- preserves strings, numbers, booleans, arrays, objects, and `null`.
- converts unsupported values to strings.

## Actor required guard

File:

```text
apps/backend/src/common/guards/actor-required.guard.ts
```

Recommended spec:

```text
apps/backend/src/common/guards/actor-required.guard.spec.ts
```

Test cases:

- returns `true` when request context has actor.
- throws `BadRequestException` with `VALIDATION_ERROR` body when actor is
  missing.

## Repository unit tests from Phase 3 foundation

Repository unit tests are optional and lower priority than service tests.

Possible specs:

```text
apps/backend/src/repositories/projects.repository.spec.ts
apps/backend/src/repositories/environments.repository.spec.ts
apps/backend/src/repositories/feature-flags.repository.spec.ts
apps/backend/src/repositories/flag-configs.repository.spec.ts
apps/backend/src/repositories/flag-rules.repository.spec.ts
apps/backend/src/repositories/sample-users.repository.spec.ts
apps/backend/src/repositories/audit-logs.repository.spec.ts
```

Recommended cases:

- repository calls the expected Prisma model method.
- repository uses the passed transaction client when provided.
- repository falls back to `PrismaService` when no transaction client is
  provided.
- find/count methods pass `where`, `orderBy`, `limit`, and `offset`.
- create/update/delete methods pass expected data shape.

Do not spend too much time here. E2E/integration tests are better for proving
real Prisma behavior.

---

# Part 5: Phase 4 unit-test coverage

Phase 4 added the read-only evaluation path. These are high-priority unit tests.

## Evaluation engine unit tests

Files:

```text
apps/backend/src/evaluation/engine/evaluation-engine.ts
apps/backend/src/evaluation/engine/stable-rollout-hash.ts
```

Spec files:

```text
apps/backend/src/evaluation/engine/evaluation-engine.spec.ts
apps/backend/src/evaluation/engine/stable-rollout-hash.spec.ts
```

These tests should remain pure. Do not import NestJS testing utilities or
PrismaService.

### Required evaluation behavior

- `notFoundResult` returns `enabled=false`, `variant=off`,
  `reason=NOT_FOUND`, `matchedRuleId=null`.
- `errorResult` returns `enabled=false`, `variant=off`, `reason=ERROR`.
- archived flag returns `FLAG_ARCHIVED`.
- kill switch returns `KILL_SWITCH`.
- disabled config returns `FLAG_DISABLED`.
- global serving mode returns `GLOBAL_ON`.
- user allowlist returns `USER_ALLOWLIST`.
- role targeting returns `ROLE_MATCH`.
- percentage rollout returns `PERCENTAGE_ROLLOUT` when bucket is inside the
  rollout.
- missing `targetingKey` for percentage rollout returns `INVALID_CONTEXT`.
- no matching rule returns `DEFAULT_OFF`.
- disabled rules are skipped.
- rule type precedence wins before numeric priority across types.
- numeric priority applies within the same rule type.

### Stable hash behavior

- same input gives same bucket.
- bucket is always `>= 0` and `< 100`.
- surrounding whitespace is trimmed from `targetingKey`.
- case is preserved.
- valid percentages are accepted.
- invalid percentages are rejected.
- string percentages are rejected.

## Evaluation service unit tests

File:

```text
apps/backend/src/evaluation/evaluation.service.ts
```

Recommended spec:

```text
apps/backend/src/evaluation/evaluation.service.spec.ts
```

### Unit under test

```ts
EvaluationService.evaluate(request)
```

### Mock dependencies

- `EvaluationRepository`
- `RequestContextService`

### Test cases

| Case | Arrange | Assert |
| --- | --- | --- |
| Repository called correctly | request has `projectKey`, `flagKey`, optional `environmentKey` | `findSnapshot` receives same keys |
| Missing snapshot | `findSnapshot` resolves `null` | response is `enabled=false`, `reason=NOT_FOUND` |
| Valid snapshot | `findSnapshot` resolves snapshot | returns engine result |
| Repository throws | `findSnapshot` rejects | response is `enabled=false`, `reason=ERROR` |
| Error logging context | request context returns request ID | failure path asks for request ID |

### Skeleton

```ts
const evaluationRepository = {
  findSnapshot: jest.fn(),
};

const requestContext = {
  getRequestId: jest.fn().mockReturnValue('test-request-id'),
};

beforeEach(async () => {
  jest.clearAllMocks();

  const moduleRef = await Test.createTestingModule({
    providers: [
      EvaluationService,
      { provide: EvaluationRepository, useValue: evaluationRepository },
      { provide: RequestContextService, useValue: requestContext },
    ],
  }).compile();

  service = moduleRef.get(EvaluationService);
});
```

Do not mock `evaluateFlag` unless there is a specific reason. Using a small
snapshot is still a unit test because no database or HTTP server is involved.

## Evaluation repository unit tests

File:

```text
apps/backend/src/evaluation/evaluation.repository.ts
```

Recommended spec:

```text
apps/backend/src/evaluation/evaluation.repository.spec.ts
```

### Mock dependency

- `PrismaService`

### Test cases

| Case | Mock setup | Expected result |
| --- | --- | --- |
| Project missing | `project.findUnique` resolves `null` | returns `null` |
| Default environment missing | project exists, `environment.findFirst` resolves `null` | returns `null` |
| Explicit environment missing | input has `environmentKey`, environment missing | returns `null` |
| Flag missing | project/environment exist, flag missing | returns `null` |
| Config missing | project/environment/flag exist, config missing | returns `null` |
| Complete snapshot | all records exist | returns `EvaluationSnapshot` |
| Default environment query | no `environmentKey` | query includes `isDefault: true` |
| Explicit environment query | has `environmentKey` | query includes that key |
| Rule order request | config query selects rules ordered by priority asc | `orderBy.priority` is `asc` |

## Evaluation controller unit tests

File:

```text
apps/backend/src/evaluation/evaluation.controller.ts
```

Recommended spec:

```text
apps/backend/src/evaluation/evaluation.controller.spec.ts
```

Test cases:

- passes request body to `evaluationService.evaluate`.
- returns the service response unchanged.

Controller tests should be intentionally small. Do not retest rule evaluation
here.

---

# Part 6: Phase 5 unit-test coverage

Phase 5 added management/control-plane APIs. Unit tests should focus on service
behavior, validation, pagination, and same-transaction audit logging.

## Projects service unit tests

File:

```text
apps/backend/src/projects/projects.service.ts
```

Recommended spec:

```text
apps/backend/src/projects/projects.service.spec.ts
```

### Mock dependencies

- `ProjectsRepository`
- `EnvironmentsRepository`
- `TransactionService`
- `AuditLogService`
- `RequestContextService`

### Test cases

#### List and get

- `list` builds search filter across `key` and `name`.
- `list` returns page response with `items`, `limit`, `offset`, `total`,
  `hasNext`.
- `list` rejects unsupported sort field.
- `get` returns project response when found.
- `get` throws `NOT_FOUND` when project does not exist.

#### Create

- rejects missing actor before mutation.
- rejects duplicate project key with `CONFLICT`.
- creates project and default `production` environment in one transaction.
- writes `PROJECT_CREATED` audit entry in the same transaction.
- audit entry has `before=null` and `after` project snapshot.
- audit metadata includes `defaultEnvironmentKey`.
- response does not expose internal transaction/client details.

#### Update

- rejects missing actor before mutation.
- throws `NOT_FOUND` when project does not exist.
- updates name/description only; key remains immutable.
- writes `PROJECT_UPDATED` audit entry in the same transaction.
- audit entry includes before and after snapshots.

## Feature flags service unit tests

File:

```text
apps/backend/src/feature-flags/feature-flags.service.ts
```

Recommended spec:

```text
apps/backend/src/feature-flags/feature-flags.service.spec.ts
```

### Mock dependencies

- `ProjectsRepository`
- `EnvironmentsRepository`
- `FeatureFlagsRepository`
- `FlagConfigsRepository`
- `TransactionService`
- `AuditLogService`
- `RequestContextService`

### Test cases

#### List and get

- `list` throws `NOT_FOUND` when project is missing.
- `list` supports search by flag `key` and `name`.
- `list` can filter by lifecycle status.
- `list` can filter by config status.
- `list` rejects unsupported sort field.
- `get` throws `NOT_FOUND` for missing project.
- `get` throws `NOT_FOUND` for missing flag.
- `get` maps default environment config into response.

#### Create

- requires actor.
- throws `NOT_FOUND` for missing project.
- rejects duplicate flag key with `CONFLICT`.
- requires default environment.
- creates flag plus default environment config in one transaction.
- default config uses safe defaults:
  - `status=DISABLED`,
  - `servingMode=TARGETED`,
  - `killSwitch=false`.
- writes `FEATURE_FLAG_CREATED` audit entry in the same transaction.
- audit `before=null`; audit `after` includes status/config snapshot.

#### Update

- requires actor.
- throws `NOT_FOUND` for missing project or flag.
- updates metadata and default config.
- preserves separation between lifecycle status and runtime state.
- writes `FEATURE_FLAG_UPDATED` audit entry in the same transaction.
- audit entry includes before and after snapshots.

#### Archive and restore

- `archive` writes `FEATURE_FLAG_ARCHIVED`.
- `restore` writes `FEATURE_FLAG_RESTORED`.
- archive sets lifecycle status to `ARCHIVED` and `archivedAt` to a date.
- restore sets lifecycle status to `ACTIVE` and `archivedAt` to `null`.
- both operations write audit entries in the same transaction.

### Important domain guardrail

Do not write tests that treat flag status as runtime result.

Correct distinction:

```text
Config/lifecycle status: ENABLED, DISABLED, ACTIVE, ARCHIVED
Runtime evaluation result: enabled=true or enabled=false
```

## Flag rules service unit tests

File:

```text
apps/backend/src/flag-rules/flag-rules.service.ts
```

Recommended spec:

```text
apps/backend/src/flag-rules/flag-rules.service.spec.ts
```

### Mock dependencies

- `ProjectsRepository`
- `FeatureFlagsRepository`
- `FlagRulesRepository`
- `TransactionService`
- `AuditLogService`
- `RequestContextService`

### Test cases

#### List

- throws `NOT_FOUND` when project is missing.
- throws `NOT_FOUND` when flag is missing.
- throws `NOT_FOUND` when default config is missing.
- filters by rule type when provided.
- defaults sort to `priority` ascending.
- rejects unsupported sort field.
- returns page response.

#### Replace validation

- accepts empty rules array for clearing rules.
- rejects duplicate priorities.
- rejects user allowlist with missing, empty, or whitespace-only `userIds`.
- rejects role targeting with missing, empty, or whitespace-only `roles`.
- rejects percentage below `0`.
- rejects percentage above `100`.
- rejects percentage with more than two decimals.
- rejects percentage supplied as a string.
- rejects unsupported rule type.

#### Replace transaction and audit

- requires actor.
- loads project and flag inside transaction.
- deletes existing rules by config ID.
- creates new rules only when `body.rules.length > 0`.
- fetches before snapshot before delete.
- fetches after snapshot after create.
- writes `FLAG_RULES_REPLACED` audit entry in the same transaction.
- audit metadata includes `replacedRuleCount`.
- response maps final persisted rules, not raw request body.

## Sample users service unit tests

File:

```text
apps/backend/src/sample-users/sample-users.service.ts
```

Recommended spec:

```text
apps/backend/src/sample-users/sample-users.service.spec.ts
```

### Mock dependencies

- `ProjectsRepository`
- `SampleUsersRepository`
- `TransactionService`
- `AuditLogService`
- `RequestContextService`

### Test cases

#### List

- throws `NOT_FOUND` when project is missing.
- supports search across display name, targeting key, and user ID.
- trims role filter before using it.
- rejects unsupported sort field.
- returns page response.

#### Create

- trims display name.
- rejects whitespace-only display name.
- trims targeting key.
- rejects whitespace-only targeting key.
- trims optional user ID.
- rejects whitespace-only user ID when provided.
- deduplicates and trims roles.
- defaults attributes to `{}`.
- requires actor.
- throws `NOT_FOUND` when project is missing.
- rejects duplicate targeting key with `CONFLICT`.
- creates sample user in a transaction.
- writes `SAMPLE_USER_CREATED` audit entry in the same transaction.

#### Delete

- trims targeting key before lookup.
- requires actor.
- throws `NOT_FOUND` when project is missing.
- throws `NOT_FOUND` when sample user is missing.
- deletes sample user in transaction.
- writes `SAMPLE_USER_DELETED` audit entry in the same transaction.
- audit `before` contains sample user snapshot and `after=null`.

## Audit logs service unit tests

File:

```text
apps/backend/src/audit-logs/audit-logs.service.ts
```

Recommended spec:

```text
apps/backend/src/audit-logs/audit-logs.service.spec.ts
```

### Mock dependencies

- `ProjectsRepository`
- `AuditLogsRepository`

### Test cases

- throws `NOT_FOUND` when project is missing.
- filters by `targetType`.
- filters by `targetKey`.
- filters by `actor`.
- filters by `action`.
- filters by `from` and `to` time range.
- rejects time range when `from > to`.
- rejects unsupported sort field.
- defaults sort to `createdAt desc`.
- returns page response with mapped audit entries.
- preserves `before`, `after`, `metadata`, and `requestId` in response.

The audit logs API is read-only. Unit tests should not imply that audit entries
can be updated or deleted.

## Phase 5 controller unit tests

Controllers should have light delegation tests only.

Recommended specs:

```text
apps/backend/src/projects/projects.controller.spec.ts
apps/backend/src/feature-flags/feature-flags.controller.spec.ts
apps/backend/src/flag-rules/flag-rules.controller.spec.ts
apps/backend/src/sample-users/sample-users.controller.spec.ts
apps/backend/src/audit-logs/audit-logs.controller.spec.ts
```

For each controller method, test:

- it calls the correct service method,
- it passes path params, query, and body correctly,
- it returns the service result unchanged.

Do not repeat service validation, audit logging, or evaluation logic in
controller unit tests.

---

# Part 7: Unit test implementation patterns

## Mock factory pattern

Create small local factory functions inside each spec file.

```ts
function createProject(overrides = {}) {
  return {
    id: 'project-1',
    key: 'demo-project',
    name: 'Demo Project',
    description: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}
```

Use fixed dates and stable IDs. Do not use `Math.random()` or current time
unless you mock time.

## Transaction assertion pattern

For Phase 5 mutation tests, always prove that audit logging receives the same
transaction client as the mutation repositories.

```ts
const tx = { kind: 'tx' } as never;

transactionService.run.mockImplementation(async (callback) => callback(tx));

expect(projectsRepository.create).toHaveBeenCalledWith(
  expect.any(Object),
  tx,
);
expect(auditLogService.record).toHaveBeenCalledWith(
  tx,
  expect.objectContaining({ actor: 'mentor@example.com' }),
);
```

## Error assertion pattern

When checking custom error helpers, inspect the exception response.

```ts
await expect(service.get('missing-project')).rejects.toMatchObject({
  response: expect.objectContaining({
    code: ApiErrorCode.NOT_FOUND,
  }),
});
```

Use exact messages only when the wording is part of the contract. Otherwise,
assert the error code and key fields.

## Page response assertion pattern

For list methods, assert both returned data and pagination metadata.

```ts
expect(result).toEqual({
  items: expect.any(Array),
  page: {
    limit: 20,
    offset: 0,
    total: 1,
    hasNext: false,
  },
});
```

## Controller assertion pattern

```ts
await expect(controller.list(params, query)).resolves.toBe(serviceResult);
expect(service.list).toHaveBeenCalledWith(params.projectKey, query);
```

Keep controller tests boring. That is a good sign.

## DTO validation pattern

For DTO unit tests, use `plainToInstance` and `validate`.

```ts
const dto = plainToInstance(PaginationQueryDto, { limit: '20', offset: '0' });
const errors = await validate(dto);

expect(errors).toHaveLength(0);
expect(dto.limit).toBe(20);
```

Do this only for DTOs whose validation protects important API behavior.

---

# Part 8: Pre-Phase 6 coverage checklist

Use this checklist before starting or relying on Phase 6.

## Phase 0 checklist

- [ ] Error helper tests protect error codes.
- [ ] Page response tests protect pagination shape.
- [ ] Key validation tests protect project/flag key format where useful.
- [ ] Reason-code behavior is covered by evaluation engine tests.
- [ ] Audit event shape is covered by audit writer and mutation service tests.

## Phase 1 checklist

- [ ] Health service/controller tests exist or are intentionally skipped as low
  value.
- [ ] No unit tests are wasted on module metadata or `main.ts`.

## Phase 2 checklist

- [ ] Pure seed/data helper logic is tested if it exists.
- [ ] Prisma schema, migrations, and DB constraints are reserved for
  integration/database validation.
- [ ] Repository unit tests do not pretend to prove real database constraints.

## Phase 3 checklist

- [ ] Pagination DTO defaults/transforms are tested.
- [ ] Exception filter maps known and unknown errors safely.
- [ ] Request context service isolates request ID and actor.
- [ ] Request context middleware handles headers and generated request IDs.
- [ ] Transaction service delegates to Prisma transaction callback.
- [ ] Audit writer maps nullable JSON fields correctly.
- [ ] Audit snapshot utility normalizes JSON-safe snapshots.
- [ ] Actor guard rejects missing actor.

## Phase 4 checklist

- [ ] Stable hash has deterministic tests.
- [ ] Percentage validation rejects strings and invalid decimals.
- [ ] Engine tests cover every reason code.
- [ ] Engine tests cover rule precedence.
- [ ] Engine tests cover disabled rules.
- [ ] Evaluation service maps missing snapshot to `NOT_FOUND` result.
- [ ] Evaluation service maps unexpected error to safe `ERROR` result.
- [ ] Evaluation repository returns `null` for missing
  project/environment/flag/config.
- [ ] Evaluation repository selects default environment when environment key is
  absent.
- [ ] Evaluation controller delegates to service.

## Phase 5 checklist

- [ ] Projects service create/update require actor and write audit logs.
- [ ] Project creation creates default production environment.
- [ ] Feature flag creation uses safe default config.
- [ ] Feature flag update/archive/restore write audit logs.
- [ ] Rules replacement validates rule parameters.
- [ ] Rules replacement writes before/after audit snapshots.
- [ ] Sample user creation/deletion writes audit logs.
- [ ] Sample users normalize whitespace and roles.
- [ ] Audit log listing validates time ranges.
- [ ] List methods validate supported sort fields.
- [ ] List methods return consistent page responses.
- [ ] Controllers delegate only.

## Minimum recommended pre-Phase 6 unit-test file set

If time is limited before the July 7, 2026 submission deadline, prioritize these
files first:

```text
apps/backend/src/evaluation/engine/evaluation-engine.spec.ts
apps/backend/src/evaluation/engine/stable-rollout-hash.spec.ts
apps/backend/src/evaluation/evaluation.service.spec.ts
apps/backend/src/flag-rules/flag-rules.service.spec.ts
apps/backend/src/feature-flags/feature-flags.service.spec.ts
apps/backend/src/projects/projects.service.spec.ts
apps/backend/src/common/utils/audit-snapshot.util.spec.ts
apps/backend/src/audit/audit-log.service.spec.ts
apps/backend/src/common/dto/page-response.dto.spec.ts
apps/backend/src/common/errors/api-exception.helpers.spec.ts
apps/backend/src/common/guards/actor-required.guard.spec.ts
```

Then add:

```text
apps/backend/src/evaluation/evaluation.repository.spec.ts
apps/backend/src/evaluation/evaluation.controller.spec.ts
apps/backend/src/sample-users/sample-users.service.spec.ts
apps/backend/src/audit-logs/audit-logs.service.spec.ts
apps/backend/src/common/request-context/request-context.service.spec.ts
apps/backend/src/common/filters/api-exception.filter.spec.ts
apps/backend/src/*/*.controller.spec.ts
```

## Definition of done before Phase 6

Pre-Phase 6 unit testing is complete enough when:

- all high-priority service and engine unit tests pass,
- mutation unit tests prove same-transaction audit logging,
- evaluation unit tests prove safe default-off behavior,
- rule unit tests prove deterministic validation and ordering assumptions,
- shared foundation tests protect error, pagination, request context, and audit
  snapshot behavior,
- list unit tests prove pagination/sort/filter behavior,
- controller unit tests do not duplicate service logic,
- the following command passes:

```bash
npm run test --workspace=@ffp/backend -- --runInBand
```

## Final reminder

For this repo, pre-Phase 6 unit tests should protect this promise:

> The backend foundation is stable, evaluation is deterministic and safe,
> management changes are auditable, and control-plane APIs cannot silently
> corrupt data-plane behavior.
