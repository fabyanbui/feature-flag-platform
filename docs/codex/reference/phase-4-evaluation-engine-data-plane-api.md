# Phase 4 Evaluation Engine Data-Plane API — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a reference, not a transcript.

## Scope

This session coached the user step by step through Phase 4 from
`docs/plan/implementation-roadmap.md`: **Evaluation engine and data-plane API**.
Phase 3 backend foundation was already implemented. The session focused on a
professional, layered implementation for `POST /v1/evaluate` using NestJS,
Prisma, and a pure deterministic rule engine.

The work was guided by these project guardrails:

- Keep control-plane management APIs separate from the data-plane evaluation
  API.
- Preserve deterministic evaluation and safe default-off behavior.
- Use stable non-PII rollout keys for percentage rollout hashing.
- Missing project, environment, flag, or flag config should return
  `enabled=false` with `reason=NOT_FOUND`, not a management-style `404`.
- Evaluation must be read-only and must not write audit logs.
- Feature flag status/config labels are distinct from runtime On/Off state.

## High-signal outcomes

The session produced a complete Phase 4 implementation plan and guided the user
through these steps:

1. Defined pure evaluation domain types and reason codes.
2. Added stable SHA-256 percentage rollout hashing.
3. Implemented a pure evaluation engine with deterministic rule order.
4. Added DTOs for `POST /v1/evaluate` request and response validation.
5. Added a read-only Prisma repository that loads evaluation snapshots.
6. Added an orchestration service that maps missing snapshots to `NOT_FOUND`
   and unexpected failures to safe `ERROR` responses.
7. Added the NestJS controller/module exposing `POST /v1/evaluate`.
8. Hardened dependency injection by introducing `CommonModule` for shared
   request context and exception filter providers.
9. Reviewed final Phase 4 acceptance behavior and manual smoke tests.
10. Diagnosed a backend lint issue in the global exception filter caused by
    unsafe enum comparison between `number` and `HttpStatus`.

## Files and artifacts

Primary Phase 4 files created or edited during the workstream:

```text
apps/backend/src/evaluation/engine/evaluation.types.ts
apps/backend/src/evaluation/engine/stable-rollout-hash.ts
apps/backend/src/evaluation/engine/stable-rollout-hash.spec.ts
apps/backend/src/evaluation/engine/evaluation-engine.ts
apps/backend/src/evaluation/engine/evaluation-engine.spec.ts
apps/backend/src/evaluation/dto/evaluate-request.dto.ts
apps/backend/src/evaluation/dto/evaluate-response.dto.ts
apps/backend/src/evaluation/evaluation.repository.ts
apps/backend/src/evaluation/evaluation.service.ts
apps/backend/src/evaluation/evaluation.controller.ts
apps/backend/src/evaluation/evaluation.module.ts
apps/backend/src/common/common.module.ts
apps/backend/src/app.module.ts
```

Related lint-fix artifact:

```text
apps/backend/src/common/filters/api-exception.filter.ts
docs/codex/reference/backend-api-exception-filter-unsafe-enum-comparison-fix.md
```

Related reference docs already created during the broader Phase 4 work:

```text
docs/codex/reference/phase-4-evaluation-endpoint-dto-step.md
docs/codex/reference/phase-4-evaluation-response-dto-import-type-fix.md
```

## Decisions and guardrails

### Evaluation API contract

The implemented endpoint is:

```http
POST /v1/evaluate
```

The response must include:

```text
projectKey
flagKey
enabled
variant
reason
matchedRuleId
```

Valid missing records return an evaluation-shaped `200 OK` response with
`reason=NOT_FOUND`. Invalid request shape or invalid key format still uses the
Phase 3 global validation/error contract and returns `400 VALIDATION_ERROR`.

### Environment handling

The original Phase 0 contract did not include environments, but the Phase 2
schema is environment-aware. The session chose this backward-compatible MVP
behavior:

- `environmentKey` is optional in `EvaluateRequestDto`.
- If provided, load that project environment.
- If omitted, load the project default environment.
- Missing environment or missing flag environment config maps to
  `reason=NOT_FOUND`.

A follow-up documentation update should add this note to
`docs/design/mvp-api-and-contracts.md`.

### Engine purity

The rule engine under `apps/backend/src/evaluation/engine/` should stay pure:

- no NestJS decorators,
- no HTTP request/response types,
- no PrismaService,
- no database queries,
- no audit logging.

It accepts `EvaluationInput` plus `EvaluationSnapshot` and returns an
`EvaluationResult`.

### Required evaluation order

The engine applies this order:

1. Archived flag -> `FLAG_ARCHIVED`
2. Kill switch -> `KILL_SWITCH`
3. Disabled config -> `FLAG_DISABLED`
4. Global serving mode -> `GLOBAL_ON`
5. User allowlist -> `USER_ALLOWLIST`
6. Role targeting -> `ROLE_MATCH`
7. Percentage rollout -> `PERCENTAGE_ROLLOUT` or `INVALID_CONTEXT`
8. No match -> `DEFAULT_OFF`

Rule priority orders rules within the same broad type; it must not allow a
percentage rule to outrank user allowlist or role targeting.

### Stable rollout hashing

Percentage rollout uses SHA-256 over:

```text
${projectKey}:${flagKey}:${targetingKey}
```

The algorithm takes the first eight bytes as an unsigned big-endian integer,
computes `% 10000`, and divides by `100` to produce a bucket from `0.00` to
`99.99`. Matching uses:

```ts
bucketPercentage < percentage
```

Do not use randomness. Do not coerce string percentages into numbers.

### Repository and service boundaries

`EvaluationRepository` is read-only. It loads only the fields needed for
runtime evaluation:

- project ID by `projectKey`,
- environment ID by `environmentKey` or `isDefault=true`,
- flag lifecycle status by `projectId + flagKey`,
- flag environment config by `flagId + environmentId`,
- rules ordered by `priority`.

It returns `null` if any record is missing. `EvaluationService` converts this to
`notFoundResult(input)`. Unexpected service/repository errors are logged with
request ID and converted to `errorResult(input)` so the data plane fails closed.

### Dependency injection hardening

The session introduced `CommonModule` to avoid duplicating
`RequestContextService` providers across modules. `CommonModule` exports:

```text
RequestContextService
ApiExceptionFilter
```

`AppModule` and `EvaluationModule` should import `CommonModule`; they should not
create separate `RequestContextService` instances.

### Decorator metadata import issue

`EvaluationVariant` is a type alias and must be imported with `import type` in
`evaluate-response.dto.ts` when used on a decorated DTO property under
`isolatedModules` and `emitDecoratorMetadata`:

```ts
import { EvaluationReason } from '../engine/evaluation.types';
import type { EvaluationVariant } from '../engine/evaluation.types';
```

`EvaluationReason` remains a normal runtime import because Swagger decorators
use it as a value.

### Global exception filter lint fix

Backend lint exposed an existing `@typescript-eslint/no-unsafe-enum-comparison`
issue in `api-exception.filter.ts`. The intended fix is to treat the status as
`HttpStatus` before switching on enum members:

```ts
const status = exception.getStatus() as HttpStatus;
```

Then type helper methods as:

```ts
private mapHttpStatusToErrorCode(status: HttpStatus): ApiErrorCode
private mapHttpStatusToMessage(status: HttpStatus): string
```

Keep default branches for unhandled status values.

## Validation and caveats

Commands used or recommended during the session:

```bash
npm run test --workspace=@ffp/backend -- evaluation
npm run test --workspace=@ffp/backend
npm run build --workspace=@ffp/backend
npm run lint --workspace=@ffp/backend
git diff --check
```

Manual smoke-test examples for the endpoint:

```bash
curl -i -X POST http://localhost:3000/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "projectKey": "demo-project",
    "environmentKey": "production",
    "flagKey": "beta-dashboard",
    "context": {
      "targetingKey": "demo-user-regular",
      "userId": "demo-user-regular",
      "roles": ["user"]
    }
  }'
```

Expected: `enabled=true`, `variant=on`, `reason=GLOBAL_ON`.

```bash
curl -i -X POST http://localhost:3000/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "projectKey": "demo-project",
    "environmentKey": "production",
    "flagKey": "missing-flag",
    "context": {
      "targetingKey": "demo-user-regular"
    }
  }'
```

Expected: `200 OK`, `enabled=false`, `variant=off`, `reason=NOT_FOUND`.

Known caveats and follow-ups:

- Confirm the lint fix in `api-exception.filter.ts` is applied before treating
  final Phase 4 validation as complete.
- Add or update `docs/design/mvp-api-and-contracts.md` to document optional
  `environmentKey` defaulting behavior.
- Phase 4 intentionally does not add management APIs or audit writes; those are
  Phase 5 concerns.
- Evaluation tests should remain deterministic and should not depend on live
  database state.

## Best reusable next prompt

```text
Continue from docs/codex/reference/phase-4-evaluation-engine-data-plane-api.md.
Verify the Phase 4 evaluation implementation in apps/backend by checking the
pure engine tests, repository/service/controller boundaries, CommonModule DI,
and the api-exception.filter.ts unsafe enum comparison lint fix. Then run
backend test/build/lint and update docs/design/mvp-api-and-contracts.md with the
optional environmentKey evaluation behavior if it is not already documented.
Preserve deterministic evaluation, safe default-off behavior, read-only
data-plane evaluation, and no audit writes in evaluation.
```

## Source notes

Source was the current Codex conversation. The session was not summarized from a
raw local `~/.codex/sessions` JSONL file. The summary intentionally excludes raw
transcript text, long command output, secrets, and environment values.
