# Phase 5 Sample Users API Hardening Review — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response.

## Original request context

The user asked Codex to turn the immediately preceding response into a reusable
reference using the `codex-latest-response-reference` skill. The preceding
response confirmed that Step 6 hardening improvements for the Sample Users API
had been applied and validated.

Minimal project context needed to reuse this reference:

- The repository is a mini feature flag platform.
- Phase 5 focuses on management APIs with transactional audit logging.
- Step 6 implements the Sample Users API used by the demo application.
- Sample users are demo evaluation contexts, not authentication users or real
  production identities.
- Stable non-PII targeting keys must be preserved.
- Mutations should keep audit logging append-only and safe.

## Full response reference

Codex confirmed that the Step 6 Sample Users API hardening work was completed.
The changes targeted validation, role normalization, Swagger documentation
accuracy, and privacy-aware API descriptions.

The updated files were:

- `apps/backend/src/sample-users/dto/create-sample-user.dto.ts`
- `apps/backend/src/sample-users/sample-users.service.ts`
- `apps/backend/src/sample-users/sample-users.controller.ts`

The response stated that the following improvements were applied.

### DTO validation hardening

The create DTO for sample users now rejects whitespace-only values for:

- `displayName`
- `targetingKey`

The DTO was strengthened so these fields are not merely strings with a maximum
length, but meaningful non-empty values for the demo workflow.

### PII guidance in Swagger descriptions

The Swagger metadata for `targetingKey` and `userId` now explicitly discourages
using personally identifiable information.

The intended guidance is:

- `targetingKey` should be a stable non-PII key used for percentage rollout.
- Do not use emails, phone numbers, real names, or other personally
  identifiable information.
- `userId`, when provided, should also be a synthetic demo identifier rather
  than a real user ID, email address, or other PII.

This keeps the Sample Users API aligned with the platform guardrail that
targeting and rollout keys must be stable and non-PII.

### Role normalization

The Sample Users service now normalizes `roles` before persistence.

The service behavior is:

- trim every role value,
- remove empty role values,
- deduplicate role values.

For example, this input:

```json
["admin", " admin ", ""]
```

is normalized to:

```json
["admin"]
```

This prevents accidental duplicate or empty role entries in demo contexts and
makes role-targeting demonstrations more predictable.

### Input normalization before persistence

The service now trims:

- `displayName`
- `targetingKey`
- `userId`

The service rejects whitespace-only `userId` when it is provided, while still
allowing `userId` to be omitted.

For delete flows, the service trims `targetingKey` before lookup and deletion.
This prevents accidental misses caused by surrounding whitespace in the path
parameter.

### Swagger response shape fix

The Sample Users list endpoint returns a paginated response:

```ts
PageResponse<SampleUserResponseDto>
```

The previous Swagger annotation documented the response as a raw array:

```ts
@ApiOkResponse({ type: SampleUserResponseDto, isArray: true })
```

That did not match the actual API shape.

The controller now documents the actual paginated object with:

- `items`
- `page.limit`
- `page.offset`
- `page.total`
- `page.hasNext`

This is important because the Admin UI and future API readers should see the
same response structure that the backend actually returns.

### Validation status

Codex reported that validation passed:

```text
tests: 32 passed
build: passed
git diff --check: passed
```

The final conclusion was:

> Step 6 is now in better shape. You’re ready to continue with Step 7 / final
> Phase 5 cleanup.

## Key decisions and rationale

### Keep Sample Users demo-only and non-PII

Sample users are not production users. They exist to support deterministic demo
scenarios and future demo UI flows. Strengthening descriptions and trimming
input helps prevent accidental use of emails, phone numbers, or real user data.

### Normalize roles instead of rejecting the whole request

Role normalization makes the API more ergonomic for a dashboard form while still
keeping persisted data clean. Trimming, filtering, and deduplication are safe
because role order is not meaningful for the MVP role-targeting rule.

### Preserve stable targeting keys

The service trims `targetingKey` but does not currently lower-case it or force
the platform key regex. This keeps the behavior conservative: it fixes obvious
whitespace problems without introducing a breaking normalization decision that
could alter rollout identity semantics.

If stricter targeting-key rules are added later, they should be documented
because percentage rollout hashing depends on stable key values.

### Fix OpenAPI accuracy before UI work

Correct Swagger response schemas matter before the Admin UI and demo app depend
on these endpoints. The list endpoint returns a paginated object, not a bare
array.

### Keep audit and transaction guardrails intact

The hardening work did not change the existing Sample Users audit behavior:

- create writes `SAMPLE_USER_CREATED`,
- delete writes `SAMPLE_USER_DELETED`,
- audit entries are written through the existing audit service,
- control-plane mutation behavior remains consistent with Phase 5.

## Commands, files, and artifacts

### Files changed

```text
apps/backend/src/sample-users/dto/create-sample-user.dto.ts
apps/backend/src/sample-users/sample-users.service.ts
apps/backend/src/sample-users/sample-users.controller.ts
```

### Validation commands

The response reported these validations:

```bash
npm run format --workspace=@ffp/backend
npm run test --workspace=@ffp/backend -- --runInBand
npm run build --workspace=@ffp/backend
git diff --check
```

### Relevant API endpoint

```http
GET    /v1/projects/:projectKey/sample-users
POST   /v1/projects/:projectKey/sample-users
DELETE /v1/projects/:projectKey/sample-users/:targetingKey
```

### Relevant response shape

`GET /v1/projects/:projectKey/sample-users` returns:

```json
{
  "items": [
    {
      "id": "sample_user_id",
      "projectKey": "demo-project",
      "displayName": "Beta User",
      "targetingKey": "demo-user-beta",
      "userId": "demo-user-beta",
      "roles": ["beta-tester"],
      "attributes": {
        "plan": "pro"
      },
      "createdAt": "2026-06-01T00:00:00.000Z",
      "updatedAt": "2026-06-01T00:00:00.000Z"
    }
  ],
  "page": {
    "limit": 20,
    "offset": 0,
    "total": 1,
    "hasNext": false
  }
}
```

## Validation checklist

Use this checklist when reviewing or continuing the Step 6 Sample Users API:

- [ ] `displayName` rejects empty or whitespace-only values.
- [ ] `targetingKey` rejects empty or whitespace-only values.
- [ ] `userId`, if provided, rejects whitespace-only values.
- [ ] `roles` are trimmed before persistence.
- [ ] empty role values are removed before persistence.
- [ ] duplicate role values are removed before persistence.
- [ ] `targetingKey` is trimmed before create conflict checks.
- [ ] `targetingKey` is trimmed before delete lookup.
- [ ] Swagger documents `GET /sample-users` as a paginated object.
- [ ] Swagger descriptions discourage PII in `targetingKey` and `userId`.
- [ ] create still writes `SAMPLE_USER_CREATED`.
- [ ] delete still writes `SAMPLE_USER_DELETED`.
- [ ] backend format, test, build, and diff checks pass.

## Risks and caveats

### Targeting-key casing is not normalized

The response did not claim that targeting keys are lower-cased. This is
intentional for now. Percentage rollout hashing may preserve case, so changing
case normalization later can change rollout buckets.

If the team decides to enforce a key regex for sample `targetingKey`, update:

- DTO validation,
- service normalization,
- seed data,
- demo app assumptions,
- any documentation explaining stable rollout keys.

### PII detection is guidance, not automatic enforcement

The hardening added stronger descriptions discouraging PII, but it did not add
automatic PII detection. That is acceptable for the MVP, but demos and seed data
should continue using synthetic values such as `demo-user-beta`.

### Swagger schema is manually defined

The paginated Swagger schema for Sample Users is manually described. If other
paginated endpoints need the same accuracy, consider a reusable Swagger helper
for `PageResponse<T>` after the required MVP is stable.

## Reuse prompts

Use these prompts to continue or verify this work in future Codex sessions:

```text
Review the Sample Users API hardening against docs/codex/reference/phase-5-sample-users-api-hardening-review.md and verify validation, role normalization, Swagger pagination schema, and non-PII guidance still hold.
```

```text
Continue Phase 5 after Sample Users API hardening. Implement or review Audit Logs API filters and pagination while preserving append-only audit log behavior.
```

```text
Add integration tests for Sample Users API: whitespace validation, role normalization, duplicate targetingKey conflict, paginated list shape, and audit writes for create/delete.
```

```text
Check whether sample user targetingKey should adopt stricter key rules. If yes, update DTO validation, service normalization, seed data, and demo assumptions without breaking deterministic rollout semantics.
```
