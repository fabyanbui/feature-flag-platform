# Backend Testing Strategy Tutorial

## Purpose

This document teaches a step-by-step strategy for testing the backend in
`apps/backend/`. The goal is not to test every line of code. The goal is to
prove that the feature flag platform behaves correctly, safely, and
predictably.

The backend is part of a mini feature flag management platform. Tests should
protect the required MVP behavior first:

- project management,
- feature flag lifecycle management,
- rule configuration,
- deterministic evaluation,
- validation and error handling,
- append-only audit logs,
- safe defaults.

## 1. Understand what a unit is

A **unit** is one small piece of code you choose to test by itself.

In this backend, a unit can be:

- a pure function, for example `evaluateFlag(...)`,
- a service method, for example `EvaluationService.evaluate(...)`,
- a controller method, for example `EvaluationController.evaluate(...)`,
- a repository method, for example `EvaluationRepository.findSnapshot(...)`,
- a validation or mapping helper.

A **unit test** checks one unit in isolation. If the unit depends on another
class or external system, mock that dependency.

For example, when testing `EvaluationService`, mock
`EvaluationRepository`. Do not connect to a real database in a unit test.

## 2. Test business behavior, not every method

Do not test every function, method, and class blindly. Focus on the behavior
that matters to the product.

Business/domain behavior in this backend includes:

- missing project or flag returns `enabled=false` with `reason=NOT_FOUND`,
- kill switch always returns off,
- disabled or archived flags do not evaluate as on,
- user allowlist can enable a flag for selected users,
- role targeting can enable a flag for selected roles,
- percentage rollout is deterministic,
- no matching rule returns default off,
- mutations create audit log entries,
- audit log entries capture before and after snapshots,
- invalid input is rejected with consistent errors,
- duplicate keys are rejected,
- list endpoints support pagination.

Good question:

> Does this test prove an important feature flag platform behavior?

Bad question:

> Did I test every file because it exists?

## 3. Know the test layers

Use different test types for different confidence levels.

| Test type | Purpose | Dependency style | Example |
| --- | --- | --- | --- |
| Unit test | Test one unit alone | Mock dependencies | Test `EvaluationService` with mocked repository |
| Integration test | Test multiple units together | Use real or test database when needed | Test repository against test PostgreSQL |
| E2E test | Test app through HTTP | Run app and call endpoints | `POST /v1/evaluate` returns expected response |

For the current backend, start with unit tests. Add integration and e2e tests
later when the MVP behavior is stable.

## 4. Use the backend test commands

Run all backend unit tests from the repository root:

```bash
npm run test --workspace=@ffp/backend
```

Run tests in one file:

```bash
npm run test --workspace=@ffp/backend -- evaluation.service.spec.ts
```

Run tests serially for easier debugging:

```bash
npm run test --workspace=@ffp/backend -- --runInBand
```

Run tests in watch mode:

```bash
npm run test --workspace=@ffp/backend -- --watch
```

Run coverage:

```bash
npm run test --workspace=@ffp/backend -- --coverage
```

Backend test files should use the NestJS/Jest convention:

```text
apps/backend/src/**/*.spec.ts
```

## 5. Use Arrange, Act, Assert

Every test should be readable in three steps.

```ts
it('returns NOT_FOUND when snapshot is missing', async () => {
  // Arrange
  repository.findSnapshot.mockResolvedValue(null);

  // Act
  const result = await service.evaluate({
    projectKey: 'demo-project',
    flagKey: 'new-checkout',
    context: { targetingKey: 'user-1' },
  });

  // Assert
  expect(result.enabled).toBe(false);
  expect(result.reason).toBe(EvaluationReason.NOT_FOUND);
});
```

Use this style for almost every backend test.

## 6. Testing priority for this repo

Test in this order.

### Priority 1: Evaluation engine

Files:

```text
apps/backend/src/evaluation/engine/evaluation-engine.ts
apps/backend/src/evaluation/engine/stable-rollout-hash.ts
```

Why this matters:

Evaluation is the core product behavior. It must be deterministic and safe.

Test these behaviors:

- `notFoundResult(...)` returns `enabled=false`, `variant=off`,
  `reason=NOT_FOUND`, and no matched rule.
- `errorResult(...)` returns `enabled=false` and `reason=ERROR`.
- archived flag returns `FLAG_ARCHIVED`.
- kill switch returns `KILL_SWITCH`.
- disabled config returns `FLAG_DISABLED`.
- global on returns `GLOBAL_ON`.
- user allowlist returns `USER_ALLOWLIST`.
- role targeting returns `ROLE_MATCH`.
- percentage rollout returns deterministic results.
- missing `targetingKey` for percentage rollout returns `INVALID_CONTEXT`.
- no matching rule returns `DEFAULT_OFF`.
- disabled rules are skipped.
- type precedence is stable: allowlist before role before percentage.

Example test idea:

```ts
it('uses user allowlist before role targeting', () => {
  const result = evaluateFlag(inputForBetaUser, snapshotWithRoleAndAllowlist);

  expect(result.enabled).toBe(true);
  expect(result.reason).toBe(EvaluationReason.USER_ALLOWLIST);
});
```

### Priority 2: Evaluation service

File:

```text
apps/backend/src/evaluation/evaluation.service.ts
```

Why this matters:

The service connects request input, repository lookup, and evaluation logic. It
must fail closed if anything goes wrong.

Mock:

- `EvaluationRepository`,
- `RequestContextService`.

Test these behaviors:

- calls repository with `projectKey`, `environmentKey`, and `flagKey`,
- returns `NOT_FOUND` when repository returns `null`,
- evaluates normally when repository returns a snapshot,
- returns `ERROR` and `enabled=false` when repository throws.

Example test skeleton:

```ts
import { Test } from '@nestjs/testing';
import { EvaluationReason } from './engine/evaluation.types';
import { EvaluationRepository } from './evaluation.repository';
import { EvaluationService } from './evaluation.service';
import { RequestContextService } from '../common/request-context/request-context.service';

describe('EvaluationService', () => {
  let service: EvaluationService;

  const repository = {
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
        { provide: EvaluationRepository, useValue: repository },
        { provide: RequestContextService, useValue: requestContext },
      ],
    }).compile();

    service = moduleRef.get(EvaluationService);
  });

  it('returns NOT_FOUND when snapshot is missing', async () => {
    repository.findSnapshot.mockResolvedValue(null);

    const result = await service.evaluate({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      context: { targetingKey: 'user-1' },
    });

    expect(repository.findSnapshot).toHaveBeenCalledWith({
      projectKey: 'demo-project',
      environmentKey: undefined,
      flagKey: 'new-checkout',
    });
    expect(result.enabled).toBe(false);
    expect(result.reason).toBe(EvaluationReason.NOT_FOUND);
  });
});
```

### Priority 3: Evaluation controller

File:

```text
apps/backend/src/evaluation/evaluation.controller.ts
```

Why this matters:

The controller should be thin. It should pass the request body to the service
and return the service response.

Mock:

- `EvaluationService`.

Test only:

- controller calls `evaluationService.evaluate(body)`,
- controller returns the service result.

Do not retest rule evaluation in controller tests.

### Priority 4: Rule configuration service

File:

```text
apps/backend/src/flag-rules/flag-rules.service.ts
```

Why this matters:

Rule configuration is control-plane behavior. It changes how runtime evaluation
works, so it must be validated and auditable.

Test these behaviors:

- validates rule types and parameters,
- rejects invalid percentage values,
- keeps deterministic order/priority,
- replaces rules for the correct flag and environment,
- writes an audit log when rules change,
- writes mutation and audit log in the same transaction,
- captures before and after snapshots.

Important audit rule:

```text
If rule replacement succeeds, the audit entry must succeed too.
If audit logging fails, the rule replacement should not be committed.
```

### Priority 5: Feature flag service

File:

```text
apps/backend/src/feature-flags/feature-flags.service.ts
```

Test these behaviors:

- creates a flag scoped to a project,
- rejects duplicate flag key inside the same project,
- supports status changes without confusing status with runtime result,
- archives flags safely,
- writes audit logs for create/update/archive/delete,
- validates key/name/status input,
- returns consistent `NOT_FOUND` or `CONFLICT` errors.

Remember:

```text
Enabled/Disabled/Archived = configuration status.
On/Off = runtime evaluation result.
```

### Priority 6: Project service

File:

```text
apps/backend/src/projects/projects.service.ts
```

Test these behaviors:

- creates a project with a unique key,
- rejects duplicate project key,
- does not allow project key mutation,
- supports pagination/filtering,
- prevents unsafe deletion that would orphan flags, or verifies safe cascade,
- writes audit logs for mutations.

### Priority 7: Audit log read API

Files:

```text
apps/backend/src/audit-logs/audit-logs.service.ts
apps/backend/src/audit-logs/audit-logs.controller.ts
```

Test these behaviors:

- supports filtering by project,
- supports filtering by flag or target,
- supports filtering by actor,
- supports time range filters,
- supports pagination,
- does not expose mutation endpoints for editing audit entries.

Audit logs are append-only. Backend tests should protect that assumption.

### Priority 8: Repositories

Repository unit tests can be useful, but avoid over-testing Prisma internals.

Use repository unit tests for:

- `null` handling,
- choosing default environment when no `environmentKey` is provided,
- mapping database records into domain snapshots,
- ensuring query filters are passed correctly.

For deep repository correctness, prefer later integration tests with a test
database.

## 7. Mocking strategy

### Mock repositories in service tests

Service tests should not use the real database.

```ts
const repository = {
  findSnapshot: jest.fn(),
};
```

Then control the scenario:

```ts
repository.findSnapshot.mockResolvedValue(null);
repository.findSnapshot.mockRejectedValue(new Error('database down'));
repository.findSnapshot.mockResolvedValue(snapshot);
```

### Mock services in controller tests

Controller tests should not use real business logic.

```ts
const evaluationService = {
  evaluate: jest.fn(),
};
```

### Mock transaction boundaries in mutation tests

For project, flag, and rule mutations, the transaction is part of the business
behavior.

A useful transaction mock shape:

```ts
const transactionService = {
  run: jest.fn(async (callback) => callback(mockTxClient)),
};
```

Then assert:

```ts
expect(transactionService.run).toHaveBeenCalled();
expect(auditLogService.record).toHaveBeenCalledWith(
  expect.objectContaining({
    actor: expect.any(String),
    before: expect.anything(),
    after: expect.anything(),
  }),
  mockTxClient,
);
```

The exact call shape depends on the service implementation, but the principle is
stable: mutation and audit write should share the same transaction/client.

## 8. Test data strategy

Use small deterministic fixtures.

Good test data:

```ts
const baseRequest = {
  projectKey: 'demo-project',
  flagKey: 'new-checkout',
  context: {
    targetingKey: 'demo-user-regular',
    userId: 'demo-user-regular',
    roles: ['user'],
  },
};
```

Avoid random values:

```ts
// Avoid this in unit tests.
const userId = crypto.randomUUID();
```

Use factory helpers when many tests need similar objects:

```ts
function createRule(overrides = {}) {
  return {
    id: 'rule-1',
    type: RuleType.USER_ALLOWLIST,
    priority: 10,
    enabled: true,
    parameters: { userIds: ['demo-user-regular'] },
    ...overrides,
  };
}
```

Factories keep tests readable and reduce repeated setup.

## 9. Naming strategy

Use behavior-focused test names.

Good:

```ts
it('returns NOT_FOUND when repository cannot find an evaluation snapshot')
it('fails closed with ERROR when repository throws')
it('writes an audit log in the same transaction as rule replacement')
it('uses lower priority first within the same rule type')
```

Bad:

```ts
it('works')
it('test service')
it('should be defined')
```

`should be defined` is acceptable only for generated starter tests. It does not
prove product behavior.

## 10. What not to unit test directly

Usually skip direct unit tests for:

- simple NestJS module metadata,
- DTO classes with no custom logic,
- private helper functions if public functions already cover them,
- simple getters/setters,
- framework behavior that NestJS already tests.

If a DTO has important validation decorators, test the validation through
controller/e2e tests or a focused validation helper test.

## 11. Backend behavior checklist

Use this checklist when adding or reviewing backend tests.

### Evaluation checklist

- [ ] Missing project/flag returns `enabled=false` and `reason=NOT_FOUND`.
- [ ] Evaluation errors fail closed with `enabled=false`.
- [ ] Kill switch always wins.
- [ ] Archived flags return off.
- [ ] Disabled configs return off.
- [ ] Global on returns on.
- [ ] User allowlist works.
- [ ] Role targeting works.
- [ ] Percentage rollout is deterministic.
- [ ] Missing targeting key is handled safely.
- [ ] Default result is off.

### API and validation checklist

- [ ] `/v1` routes return JSON.
- [ ] Invalid keys fail validation.
- [ ] Duplicate keys return conflict.
- [ ] Missing resources return not found.
- [ ] List endpoints support pagination.
- [ ] Error codes are consistent.

### Audit checklist

- [ ] Project mutations write audit logs.
- [ ] Feature flag mutations write audit logs.
- [ ] Rule mutations write audit logs.
- [ ] Audit entries include actor.
- [ ] Audit entries include target type and target id.
- [ ] Audit entries include before and after snapshots.
- [ ] Audit write happens in the same transaction as the mutation.
- [ ] Audit logs are append-only.

### Security and safety checklist

- [ ] Evaluation defaults to off when uncertain.
- [ ] Rollout uses stable non-PII targeting keys.
- [ ] Sensitive implementation errors are not exposed as raw responses.
- [ ] Control-plane mutations require actor context.
- [ ] Data-plane evaluation remains safe and idempotent.

## 12. Recommended workflow for adding a new test

Follow this workflow every time.

### Step 1: Identify the behavior

Write the behavior in plain English first.

Example:

```text
When the evaluation repository returns null, the service returns NOT_FOUND and
does not throw.
```

### Step 2: Identify the unit

Choose the smallest public unit that owns that behavior.

Example:

```text
Unit: EvaluationService.evaluate
```

### Step 3: Identify dependencies to mock

Example:

```text
Mock EvaluationRepository.findSnapshot
Mock RequestContextService.getRequestId
```

### Step 4: Create deterministic input

Use stable values:

```ts
projectKey: 'demo-project'
flagKey: 'new-checkout'
targetingKey: 'demo-user-regular'
```

### Step 5: Arrange the mock scenario

Example:

```ts
repository.findSnapshot.mockResolvedValue(null);
```

### Step 6: Act once

Example:

```ts
const result = await service.evaluate(request);
```

### Step 7: Assert output and important calls

Example:

```ts
expect(result.enabled).toBe(false);
expect(result.reason).toBe(EvaluationReason.NOT_FOUND);
expect(repository.findSnapshot).toHaveBeenCalledWith(...);
```

### Step 8: Run the narrow test

```bash
npm run test --workspace=@ffp/backend -- evaluation.service.spec.ts
```

### Step 9: Run all backend tests

```bash
npm run test --workspace=@ffp/backend -- --runInBand
```

### Step 10: Refactor only after tests are green

If setup becomes repetitive, extract local test helpers. Keep helpers in the
same spec file unless multiple spec files truly need them.

## 13. Common mistakes to avoid

### Mistake 1: Testing implementation instead of behavior

Weak assertion:

```ts
expect(repository.findSnapshot).toHaveBeenCalledTimes(1);
```

Better assertion:

```ts
expect(result.reason).toBe(EvaluationReason.NOT_FOUND);
expect(result.enabled).toBe(false);
```

Call assertions are useful, but they should support behavior assertions.

### Mistake 2: Repeating the same logic in every layer

Do not test every evaluation rule again in controller tests. The controller only
needs to prove that it delegates to the service.

### Mistake 3: Using randomness

Feature flag tests should be deterministic. Avoid `Math.random()`, current time,
or generated IDs unless you explicitly control them.

### Mistake 4: Connecting unit tests to real infrastructure

Do not use real PostgreSQL, external APIs, or network calls in unit tests.

### Mistake 5: Ignoring failure paths

For this project, failure paths are important because safe defaults matter.
Always test off/default behavior when data is missing or errors happen.

## 14. Definition of done for backend test work

A backend change is testing-ready when:

- critical business behavior has unit tests,
- success and failure paths are covered,
- tests are deterministic,
- dependencies are mocked at the correct boundary,
- audit behavior is tested for mutations,
- validation/error behavior is tested for user-facing APIs,
- `npm run test --workspace=@ffp/backend -- --runInBand` passes.

Before demo or submission, also run:

```bash
npm run lint --workspace=@ffp/backend
npm run build --workspace=@ffp/backend
```

If documentation changed, also run Markdown linting when available.

## 15. The senior developer mindset

Testing is not about proving that code exists. Testing is about protecting the
promise of the product.

For this backend, the promise is:

> Admins can configure flags safely, applications can evaluate flags
> deterministically, risky features default to off, and every important
> configuration change is auditable.

When deciding whether to add a test, ask:

> If this behavior breaks, would the platform become unsafe, confusing, or hard
> to demonstrate?

If yes, write the test.
