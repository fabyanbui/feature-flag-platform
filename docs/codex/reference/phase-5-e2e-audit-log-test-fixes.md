# Phase 5 E2E Audit Log Test Fixes — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response about fixing Phase 5 end-to-end tests after append-only audit logging, health-route, archive/restore status, and pagination-query issues surfaced.

## Original request context

The user had just implemented Phase 5 management API e2e tests and pasted a failed validation run for:

```bash
npm run test:e2e --workspace=@ffp/backend -- --runInBand
```

The failures included:

1. `DriverAdapterError: audit_log_entries is append-only` from `cleanDatabase()` calling `prisma.auditLogEntry.deleteMany()`.
2. `GET /v1` returning `404 Not Found` in `app.e2e-spec.ts` because the health controller route is `/v1/health`.
3. In sandboxed execution, Supertest local server binding returned `listen EPERM`, requiring e2e validation outside the sandbox.
4. Once e2e tests were run outside the sandbox, two logical test failures remained:
   - `POST /archive` and `POST /restore` returned Nest's default `201 Created` instead of expected `200 OK`.
   - audit-log pagination query params `limit` and `offset` were treated as strings and failed integer validation.

The latest assistant response summarized the fixes that were applied and validated.

## Full response reference

The Phase 5/e2e issues were fixed.

### 1. Append-only audit logs respected

Updated:

```text
apps/backend/test/database-test-utils.ts
```

`cleanDatabase()` is now intentionally a no-op because `audit_log_entries` is append-only by design. Tests must not delete audit logs or parent projects referenced by audit entries.

Instead of deleting test data, e2e tests isolate themselves by generating unique project keys for each test.

### 2. E2E isolation fixed

Updated:

```text
apps/backend/test/phase-5-management.e2e-spec.ts
```

The e2e suite now generates unique values per test for:

- `projectKey`
- `flagKey`
- `requestId`

This prevents uniqueness conflicts without violating append-only audit log constraints.

### 3. Health e2e fixed

Updated:

```text
apps/backend/test/app.e2e-spec.ts
```

The health test route was changed from:

```http
GET /v1
```

to the actual backend route:

```http
GET /v1/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "feature-flag-backend"
}
```

### 4. Archive/restore HTTP status fixed

Updated:

```text
apps/backend/src/feature-flags/feature-flags.controller.ts
```

Added `@HttpCode(HttpStatus.OK)` to:

```http
POST /v1/projects/:projectKey/flags/:flagKey/archive
POST /v1/projects/:projectKey/flags/:flagKey/restore
```

Rationale: these endpoints are action-style mutations returning an updated existing resource, so the expected status is `200 OK`, not Nest's default `201 Created` for `POST`.

### 5. Pagination query conversion fixed

Updated:

```text
apps/backend/src/common/dto/pagination-query.dto.ts
```

Added explicit number conversion:

```ts
@Type(() => Number)
```

to both pagination fields:

```ts
limit
offset
```

Rationale: query string values arrive as strings. Even with global validation transform enabled, explicit `@Type(() => Number)` makes pagination DTO behavior deterministic and prevents validation failures like:

```json
{
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "limit", "message": "limit must be an integer number" },
    { "field": "offset", "message": "offset must be an integer number" }
  ]
}
```

### 6. Validation results

The final validation passed:

```text
unit tests: 3 passed, 32 tests passed
e2e tests: 2 passed, 9 tests passed
build: passed
git diff --check: passed
```

The e2e command was run outside the sandbox because Supertest needs local server binding, which the sandbox blocks.

Locally, the normal command should work:

```bash
npm run test:e2e --workspace=@ffp/backend -- --runInBand
```

Phase 5 became stronger and ready for final review / Phase 6.

## Key decisions and rationale

### Keep audit logs append-only even in tests

Do not bypass or weaken the append-only audit-log guard just to make tests convenient. Append-only audit logging is a non-negotiable project guardrail.

The right test strategy is isolation, not destructive cleanup:

- use unique project keys per test,
- query audit logs by unique project key,
- leave audit entries intact.

This preserves the same safety model in tests and production.

### Use unique test data instead of database-wide cleanup

Because `audit_log_entries` references projects with restrictive behavior, deleting projects after audited mutations is not safe. Unique keys avoid conflicts while preserving audit history.

This pattern is appropriate for integration tests that run against a persistent local database.

### Match tests to actual API routes

The backend health controller is mounted at:

```http
/v1/health
```

A test for `/v1` was wrong after global prefixing because the root app controller is not mounted at `/`.

### Explicitly set status codes for action-style POST endpoints

Nest defaults `POST` to `201 Created`. For archive/restore, the platform is not creating a new resource; it is changing the lifecycle state of an existing feature flag. Returning `200 OK` is clearer and matches the test expectation.

### Explicit query param conversion is safer than relying on implicit conversion alone

Pagination is a cross-cutting control-plane API behavior. Adding `@Type(() => Number)` directly to `PaginationQueryDto` improves all list endpoints, including projects, flags, rules, sample users, and audit logs.

## Commands, files, and artifacts

### Files changed

```text
apps/backend/test/database-test-utils.ts
apps/backend/test/phase-5-management.e2e-spec.ts
apps/backend/test/app.e2e-spec.ts
apps/backend/src/feature-flags/feature-flags.controller.ts
apps/backend/src/common/dto/pagination-query.dto.ts
```

### Commands used

Format:

```bash
npm run format --workspace=@ffp/backend
```

Unit tests:

```bash
npm run test --workspace=@ffp/backend -- --runInBand
```

Build:

```bash
npm run build --workspace=@ffp/backend
```

E2E tests:

```bash
npm run test:e2e --workspace=@ffp/backend -- --runInBand
```

Whitespace validation:

```bash
git diff --check
```

### Sandbox caveat

In the Codex sandbox, e2e tests failed with local server binding errors:

```text
listen EPERM: operation not permitted 0.0.0.0
```

The e2e tests were therefore rerun outside the sandbox with escalation. This is an environment limitation, not an application failure.

## Validation checklist

Use this checklist after applying or reviewing similar changes:

- [ ] `cleanDatabase()` does not delete `audit_log_entries`.
- [ ] E2E tests use unique `projectKey` values per test.
- [ ] E2E audit-log assertions scope by unique `projectKey` and target fields.
- [ ] Health e2e checks `GET /v1/health`.
- [ ] Archive and restore endpoints return `200 OK`.
- [ ] `PaginationQueryDto.limit` uses `@Type(() => Number)`.
- [ ] `PaginationQueryDto.offset` uses `@Type(() => Number)`.
- [ ] Unit tests pass.
- [ ] Backend build passes.
- [ ] E2E tests pass locally or outside sandbox.
- [ ] `git diff --check` passes.

## Risks and caveats

### Persistent e2e test data

Because audit logs are append-only, e2e test data can accumulate in a persistent development database. This is acceptable for MVP if:

- test keys are clearly prefixed, for example `e2e-phase5-*`,
- audit queries are scoped by project key,
- development cleanup does not bypass production append-only behavior.

A future improvement could use an isolated disposable test database rather than deleting audit rows.

### Do not disable the append-only trigger casually

Disabling audit append-only protections in tests would weaken confidence in one of the platform's central guardrails. If a disposable database is used, prefer recreating the database or schema rather than deleting protected audit rows inside normal application tests.

### Sandbox e2e limitations

Supertest may need to bind an ephemeral local server. If sandbox policy blocks listening, the e2e suite may fail in sandbox even when it passes locally. In that case, run e2e validation in the normal developer terminal.

## Reuse prompts

Use these prompts to continue or reuse this context:

```text
Review the Phase 5 e2e test strategy for append-only audit logs and suggest improvements before Phase 6.
```

```text
Help me convert Phase 5 e2e tests to use an isolated disposable test database instead of persistent unique keys.
```

```text
Check whether all Phase 5 management APIs use PaginationQueryDto correctly after adding @Type(() => Number).
```

```text
Proceed to Phase 6 early vertical slice using the completed Phase 5 management APIs and e2e validation.
```
