# Phase 5 Sample Users Prisma JSON Typing Fix — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response.

## Original request context

During Phase 5 implementation of the Feature Flag Platform backend, the
Sample Users API was added under `apps/backend/src/sample-users/`. The user ran
backend formatting, unit tests, build, and whitespace validation:

```bash
npm run format --workspace=@ffp/backend
npm run test --workspace=@ffp/backend -- --runInBand
npm run build --workspace=@ffp/backend
git diff --check
```

Formatting and Jest unit tests passed, but the NestJS build failed in
`apps/backend/src/sample-users/sample-users.service.ts` because Prisma rejected
the TypeScript type of the `attributes` JSON field:

```text
src/sample-users/sample-users.service.ts:136:11 - error TS2322:
Type 'Record<string, unknown>' is not assignable to type
'JsonNull | InputJsonValue | undefined'.
```

The failing assignment was:

```ts
roles: body.roles ?? [],
attributes: body.attributes ?? {},
```

This happened while implementing the Phase 5 Sample Users API:

```http
GET    /v1/projects/:projectKey/sample-users
POST   /v1/projects/:projectKey/sample-users
DELETE /v1/projects/:projectKey/sample-users/:targetingKey
```

## Full response reference

The build failure is a Prisma JSON typing issue.

`body.attributes` is typed by the request DTO as:

```ts
Record<string, unknown>
```

Prisma JSON fields require:

```ts
Prisma.InputJsonValue
```

TypeScript cannot prove that a `Record<string, unknown>` contains only
JSON-safe values. The object could theoretically contain functions, symbols,
class instances, or other values that are not valid JSON.

The immediate fix is to cast the attributes object to Prisma's JSON input type
when creating a `SampleUserContext`.

Open:

```text
apps/backend/src/sample-users/sample-users.service.ts
```

Find:

```ts
roles: body.roles ?? [],
attributes: body.attributes ?? {},
```

Change it to:

```ts
roles: body.roles ?? [],
attributes: (body.attributes ?? {}) as Prisma.InputJsonValue,
```

The corrected create block should look like this:

```ts
const sampleUser = await this.sampleUsersRepository.create(
  {
    project: {
      connect: {
        id: project.id,
      },
    },
    displayName: body.displayName,
    targetingKey: body.targetingKey,
    userId: body.userId ?? null,
    roles: body.roles ?? [],
    attributes: (body.attributes ?? {}) as Prisma.InputJsonValue,
  },
  tx,
);
```

An optional cleaner version is to centralize the cast in a private helper in
`SampleUsersService`:

```ts
private toInputJsonObject(value: Record<string, unknown> | undefined) {
  return (value ?? {}) as Prisma.InputJsonValue;
}
```

Then the create call can use:

```ts
attributes: this.toInputJsonObject(body.attributes),
```

Either approach is acceptable for the MVP. The helper is preferable if more
JSON request fields are added later because it keeps the Prisma JSON boundary
explicit and easy to audit.

After applying the fix, rerun:

```bash
npm run format --workspace=@ffp/backend
npm run test --workspace=@ffp/backend -- --runInBand
npm run build --workspace=@ffp/backend
git diff --check
```

If the build passes, Phase 5 Step 6, Sample Users API, can be considered
complete.

## Key decisions and rationale

- Keep the Sample Users API as a control-plane/demo-support API, not an auth
  user system.
- Preserve non-PII targeting: `targetingKey`, `userId`, `roles`, and
  `attributes` should be demo-safe identifiers and context fields.
- Keep Prisma JSON casting at the API-to-database boundary rather than
  weakening DTO types globally.
- Do not change the Prisma schema for this issue; the schema already correctly
  stores `roles` and `attributes` as JSON.
- Do not use `any`; use `Prisma.InputJsonValue` so the intended database field
  type remains visible.

## Commands, files, and artifacts

Primary file:

```text
apps/backend/src/sample-users/sample-users.service.ts
```

Related files from Phase 5 Step 6:

```text
apps/backend/src/sample-users/dto/create-sample-user.dto.ts
apps/backend/src/sample-users/dto/sample-user-query.dto.ts
apps/backend/src/sample-users/dto/sample-user-response.dto.ts
apps/backend/src/sample-users/sample-users.controller.ts
apps/backend/src/sample-users/sample-users.module.ts
apps/backend/src/repositories/sample-users.repository.ts
apps/backend/src/app.module.ts
```

Validation commands:

```bash
npm run format --workspace=@ffp/backend
npm run test --workspace=@ffp/backend -- --runInBand
npm run build --workspace=@ffp/backend
git diff --check
```

## Validation checklist

- `npm run format --workspace=@ffp/backend` completes.
- `npm run test --workspace=@ffp/backend -- --runInBand` passes.
- `npm run build --workspace=@ffp/backend` passes.
- `git diff --check` reports no whitespace errors.
- Creating a sample user stores `attributes` as JSON.
- Creating a sample user still stores `roles` as JSON array data.
- Sample user mutations still require `X-Actor`.
- Sample user create/delete audit entries still use append-only audit logging.

## Risks and caveats

- A type cast does not deeply validate that every nested `attributes` value is
  JSON-safe. The MVP accepts this because requests arrive as JSON and NestJS
  parses the body from JSON-compatible input.
- If future code accepts non-HTTP objects or computed attributes, add stricter
  JSON sanitization before casting.
- Do not store secrets, raw emails, phone numbers, government IDs, or other PII
  in sample user `attributes`.
- If Prisma JSON filter typing fails for role filtering, change
  `array_contains: query.role` to `array_contains: [query.role]` in the sample
  user listing query.

## Reuse prompts

- "Continue Phase 5 after fixing the Sample Users Prisma JSON typing error."
- "Review the Sample Users API for non-PII targeting and audit logging."
- "Help me validate Phase 5 Sample Users API build errors involving Prisma
  JSON fields."
- "Proceed to Phase 5 Step 7: Audit Logs API with filters and pagination."
