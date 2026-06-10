# Backend API Exception Filter Unsafe Enum Comparison Fix — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response.

## Original request context

The backend lint command failed after Phase 4 evaluation work:

```bash
npm run lint --workspace=@ffp/backend
git diff --check
```

ESLint reported six errors in:

```text
apps/backend/src/common/filters/api-exception.filter.ts
```

The errors were from `@typescript-eslint/no-unsafe-enum-comparison` on switch
cases comparing `HttpStatus.*` enum members against a `number` returned by
`HttpException#getStatus()`.

This issue is not caused by the Phase 4 evaluation endpoint directly. It is an
existing backend filter typing issue exposed by the lint gate.

## Full response reference

This lint error is not from Phase 4. It is from the existing file:

```text
apps/backend/src/common/filters/api-exception.filter.ts
```

The problematic pattern is:

```ts
const status = exception.getStatus(); // number

switch (status) {
    case HttpStatus.BAD_REQUEST:
```

`exception.getStatus()` returns `number`, but `HttpStatus.BAD_REQUEST` is an
enum value. ESLint wants both sides to share the same enum type.

### Fix

Open:

```text
apps/backend/src/common/filters/api-exception.filter.ts
```

Find this method:

```ts
private handleHttpException(
    exception: HttpException,
    response: Response,
    requestId: string,
) {
    const status = exception.getStatus();
```

Change:

```ts
const status = exception.getStatus();
```

to:

```ts
const status = exception.getStatus() as HttpStatus;
```

Then change this function signature:

```ts
private mapHttpStatusToErrorCode(status: number): ApiErrorCode {
```

to:

```ts
private mapHttpStatusToErrorCode(status: HttpStatus): ApiErrorCode {
```

And change this signature:

```ts
private mapHttpStatusToMessage(status: number): string {
```

to:

```ts
private mapHttpStatusToMessage(status: HttpStatus): string {
```

### Expected final shape

The relevant parts of `api-exception.filter.ts` should look like this:

```ts
private handleHttpException(
    exception: HttpException,
    response: Response,
    requestId: string,
) {
    const status = exception.getStatus() as HttpStatus;
    const body = exception.getResponse();

    if (typeof body === 'object' && body !== null) {
        const typedBody = body as ExceptionBody;

        if (typedBody.code) {
            return response.status(status).json({
                code: typedBody.code,
                message: typedBody.message ?? exception.message,
                details: typedBody.details,
                requestId,
            });
        }
    }

    return response.status(status).json({
        code: this.mapHttpStatusToErrorCode(status),
        message: this.mapHttpStatusToMessage(status),
        requestId,
    });
}

private mapHttpStatusToErrorCode(status: HttpStatus): ApiErrorCode {
    switch (status) {
        case HttpStatus.BAD_REQUEST:
            return ApiErrorCode.VALIDATION_ERROR;
        case HttpStatus.NOT_FOUND:
            return ApiErrorCode.NOT_FOUND;
        case HttpStatus.CONFLICT:
            return ApiErrorCode.CONFLICT;
        default:
            return ApiErrorCode.INTERNAL_ERROR;
    }
}

private mapHttpStatusToMessage(status: HttpStatus): string {
    switch (status) {
        case HttpStatus.BAD_REQUEST:
            return 'Request validation failed.';
        case HttpStatus.NOT_FOUND:
            return 'Resource not found.';
        case HttpStatus.CONFLICT:
            return 'Resource conflict.';
        default:
            return 'An unexpected error occurred.';
    }
}
```

### Rerun checks

After applying the change, rerun:

```bash
npm run lint --workspace=@ffp/backend
git diff --check
npm run test --workspace=@ffp/backend
npm run build --workspace=@ffp/backend
```

The lint error should clear.

## Key decisions and rationale

- `HttpException#getStatus()` is typed as `number`; ESLint therefore treats
  direct `switch` comparisons against `HttpStatus` enum members as unsafe enum
  comparisons.
- Casting once at the API boundary keeps the rest of the exception filter
  strongly typed as `HttpStatus`.
- The fallback `default` branch remains important because the assertion does
  not prove the status value is one of the specifically handled enum members.
- The fix preserves the existing error-response contract:
  - `400` maps to `VALIDATION_ERROR`.
  - `404` maps to `NOT_FOUND`.
  - `409` maps to `CONFLICT`.
  - Other statuses map to `INTERNAL_ERROR`.
- This change supports Phase 4 validation indirectly by keeping the global
  exception filter lint-clean while preserving the `/v1/evaluate` validation
  behavior.

## Commands, files, and artifacts

Primary file:

```text
apps/backend/src/common/filters/api-exception.filter.ts
```

Validation commands:

```bash
npm run lint --workspace=@ffp/backend
git diff --check
npm run test --workspace=@ffp/backend
npm run build --workspace=@ffp/backend
```

Related Phase 4 files that rely on the exception filter for validation errors:

```text
apps/backend/src/evaluation/dto/evaluate-request.dto.ts
apps/backend/src/evaluation/evaluation.controller.ts
apps/backend/src/evaluation/evaluation.module.ts
apps/backend/src/evaluation/evaluation.service.ts
```

## Validation checklist

- [ ] `api-exception.filter.ts` casts `exception.getStatus()` to `HttpStatus`.
- [ ] `mapHttpStatusToErrorCode` accepts `HttpStatus`, not `number`.
- [ ] `mapHttpStatusToMessage` accepts `HttpStatus`, not `number`.
- [ ] `npm run lint --workspace=@ffp/backend` passes.
- [ ] `git diff --check` passes.
- [ ] `npm run test --workspace=@ffp/backend` passes.
- [ ] `npm run build --workspace=@ffp/backend` passes.
- [ ] Evaluation endpoint validation still returns `400 VALIDATION_ERROR` for
  malformed keys.

## Risks and caveats

- The `as HttpStatus` assertion is a pragmatic lint/type fix. Runtime values
  can still be uncommon HTTP status numbers. Keep the `default` branch to avoid
  unsafe behavior for unhandled statuses.
- Do not change the global error shape while applying this lint fix; Phase 3
  established consistent error handling and Phase 4 depends on that contract.
- This fix does not change data-plane safe fallback behavior. Valid missing
  projects or flags in `/v1/evaluate` should still return an evaluation-shaped
  `200 OK` response with `reason=NOT_FOUND`, not a global exception response.

## Reuse prompts

Use these prompts to continue or reuse this reference:

```text
Apply the backend API exception filter unsafe enum comparison fix from
docs/codex/reference/backend-api-exception-filter-unsafe-enum-comparison-fix.md
and rerun backend lint, tests, and build.
```

```text
Review apps/backend/src/common/filters/api-exception.filter.ts for consistency
with the project error-response contract after fixing no-unsafe-enum-comparison.
```

```text
Check that POST /v1/evaluate still returns VALIDATION_ERROR for invalid key
formats and NOT_FOUND evaluation responses for valid missing project or flag
keys after the exception-filter lint fix.
```
