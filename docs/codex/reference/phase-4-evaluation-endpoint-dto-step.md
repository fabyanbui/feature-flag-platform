# Phase 4 Evaluation Endpoint DTO Step — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response.

## Original request context

The user is implementing Phase 4 from
`docs/plan/implementation-roadmap.md` for the feature flag platform. Phase 4 is
the evaluation engine and data-plane API phase. The latest completed Codex
response guided the user through **Step 4: Add DTOs for `POST /v1/evaluate`**.

Minimal earlier context needed:

- Step 1 created evaluation domain types in
  `apps/backend/src/evaluation/engine/evaluation.types.ts`.
- Step 2 created stable SHA-256 percentage rollout hashing helpers.
- Step 3 created the pure evaluation engine and tests.
- The user accepted the current Step 3 implementation for now and asked to
  continue the roadmap without major refactoring.

Repo guardrails relevant to this step:

- Keep control-plane and data-plane concerns separate.
- Evaluation responses must include `enabled`, `reason`, `projectKey`, and
  `flagKey`.
- Missing project or flag must eventually return `enabled=false` with
  `reason=NOT_FOUND`.
- Stable, non-PII rollout and targeting keys must be preserved.
- Phase 4 should prioritize required MVP deliverables before optional
  enhancements.

## Full response reference

Step 4 defines the HTTP request and response DTOs for the evaluation endpoint:

```http
POST /v1/evaluate
```

This step does **not** connect to Prisma yet. It also does **not** add the
controller yet. It only defines validation and Swagger-visible response types.

### Create the DTO folder

From the repository root:

```bash
mkdir -p apps/backend/src/evaluation/dto
```

### Create the request DTO

Create:

```text
apps/backend/src/evaluation/dto/evaluate-request.dto.ts
```

Use this implementation:

```ts
import { Type } from 'class-transformer';
import {
    IsArray,
    IsObject,
    IsOptional,
    IsString,
    Matches,
    ValidateNested,
} from 'class-validator';
import {
    KEY_REGEX,
    KEY_VALIDATION_MESSAGE,
} from '../../common/constants/api.constants';

export class EvaluationContextDto {
    @IsOptional()
    @IsString()
    targetingKey?: string;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    roles?: string[];

    @IsOptional()
    @IsObject()
    attributes?: Record<string, unknown>;
}

export class EvaluateRequestDto {
    @IsString()
    @Matches(KEY_REGEX, {
        message: `projectKey ${KEY_VALIDATION_MESSAGE}`,
    })
    projectKey!: string;

    @IsOptional()
    @IsString()
    @Matches(KEY_REGEX, {
        message: `environmentKey ${KEY_VALIDATION_MESSAGE}`,
    })
    environmentKey?: string;

    @IsString()
    @Matches(KEY_REGEX, {
        message: `flagKey ${KEY_VALIDATION_MESSAGE}`,
    })
    flagKey!: string;

    @IsObject()
    @ValidateNested()
    @Type(() => EvaluationContextDto)
    context!: EvaluationContextDto;
}
```

### Why `environmentKey` is optional

The original Phase 0 evaluation contract only required:

```json
{
  "projectKey": "demo-project",
  "flagKey": "new-checkout",
  "context": {}
}
```

However, the Phase 2 schema added environments. Therefore, for the MVP,
`environmentKey` should be optional:

```ts
environmentKey?: string;
```

Expected professional behavior for later service/repository integration:

- if `environmentKey` is provided, evaluate that environment;
- if `environmentKey` is omitted, use the project default environment;
- if no environment or flag config exists, return `NOT_FOUND`.

This preserves backward compatibility with the original MVP contract while
supporting the environment-aware schema.

### Create the response DTO

Create:

```text
apps/backend/src/evaluation/dto/evaluate-response.dto.ts
```

Use this implementation:

```ts
import { ApiProperty } from '@nestjs/swagger';
import { EvaluationReason } from '../engine/evaluation.types';

export class EvaluateResponseDto {
    @ApiProperty({
        example: 'demo-project',
    })
    projectKey!: string;

    @ApiProperty({
        example: 'new-checkout',
    })
    flagKey!: string;

    @ApiProperty({
        example: true,
    })
    enabled!: boolean;

    @ApiProperty({
        enum: ['on', 'off'],
        example: 'on',
    })
    variant!: 'on' | 'off';

    @ApiProperty({
        enum: EvaluationReason,
        example: EvaluationReason.ROLE_MATCH,
    })
    reason!: EvaluationReason;

    @ApiProperty({
        nullable: true,
        example: 'rule_123',
    })
    matchedRuleId!: string | null;
}
```

### Validation behavior provided by the DTO

This request is valid:

```json
{
  "projectKey": "demo-project",
  "flagKey": "new-checkout",
  "context": {
    "targetingKey": "demo-user-regular",
    "userId": "demo-user-regular",
    "roles": ["user"],
    "attributes": {
      "plan": "free"
    }
  }
}
```

This request should fail validation:

```json
{
  "projectKey": "Demo Project",
  "flagKey": "new_checkout",
  "context": "not-an-object"
}
```

The expected error type after the endpoint is wired into the existing global
validation and exception handling is:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed.",
  "requestId": "..."
}
```

### Keep DTO validation limited to shape validation

DTO validation should check request shape only:

- required fields,
- string fields,
- key format,
- arrays,
- object context.

DTO validation should **not** check business logic:

- whether the project exists,
- whether the flag exists,
- whether rollout percentage is valid,
- whether targeting key is present for percentage rollout.

Those responsibilities belong in the service, repository, or pure evaluation
engine flow.

### Build validation

From the backend folder:

```bash
cd apps/backend
npm run build
```

If NestJS, Prisma, and TypeScript types are current, the build should pass.

## Key decisions and rationale

1. **DTOs are HTTP boundary objects only.** They define request/response shapes
   and validation but do not perform database or rule-evaluation work.
2. **`environmentKey` is optional.** This keeps the Phase 0 API contract usable
   while supporting the Phase 2 environment-aware data model.
3. **Business decisions stay outside DTOs.** Existence checks and runtime
   evaluation behavior belong in the service/repository/engine layers.
4. **Response fields mirror the data-plane contract.** The response DTO
   includes `projectKey`, `flagKey`, `enabled`, `variant`, `reason`, and
   `matchedRuleId`.
5. **Reason codes are sourced from `EvaluationReason`.** This keeps the API
   response vocabulary aligned with the pure evaluation engine.

## Commands, files, and artifacts

Files to create:

```text
apps/backend/src/evaluation/dto/evaluate-request.dto.ts
apps/backend/src/evaluation/dto/evaluate-response.dto.ts
```

Command to create the DTO folder:

```bash
mkdir -p apps/backend/src/evaluation/dto
```

Validation command:

```bash
cd apps/backend
npm run build
```

Related existing files:

```text
apps/backend/src/common/constants/api.constants.ts
apps/backend/src/evaluation/engine/evaluation.types.ts
apps/backend/src/evaluation/engine/evaluation-engine.ts
```

## Validation checklist

Step 4 is complete when:

- [ ] `apps/backend/src/evaluation/dto/evaluate-request.dto.ts` exists.
- [ ] `apps/backend/src/evaluation/dto/evaluate-response.dto.ts` exists.
- [ ] `projectKey` uses `KEY_REGEX`.
- [ ] `flagKey` uses `KEY_REGEX`.
- [ ] `environmentKey` is optional and uses `KEY_REGEX` when provided.
- [ ] `context` is required and must be an object.
- [ ] Response includes `projectKey`, `flagKey`, `enabled`, `variant`,
      `reason`, and `matchedRuleId`.
- [ ] `npm run build` passes.

## Risks and caveats

- This step alone does not make `POST /v1/evaluate` available. The controller,
  service, repository, and module wiring still need to be added in later steps.
- `environmentKey` behavior is only represented in the request shape here. The
  repository/service must later enforce the default-environment fallback.
- `EvaluationReason` should later be verified against the Phase 0 API contract
  to avoid drift in names such as `USER_ALLOWLIST` or `PERCENTAGE_ROLLOUT`.
- `INVALID_CONTEXT` remains as currently implemented for now; possible
  simplification to `DEFAULT_OFF` was noted as a non-blocking follow-up.

## Reuse prompts

Continue Phase 4 from Step 4 with:

```text
Step 4 done. Continue with Step 5: create the read-only evaluation repository
that loads project, environment/default environment, flag, flag config, and
ordered rules from Prisma.
```

Ask for a review of the DTOs with:

```text
Review my Phase 4 evaluate request/response DTOs for contract alignment,
validation boundaries, and environmentKey behavior. Do not refactor unrelated
Step 3 engine code.
```

Ask to finish endpoint integration with:

```text
Using the existing Phase 4 engine and DTOs, guide me through wiring
EvaluationRepository, EvaluationService, EvaluationController, and
EvaluationModule for POST /v1/evaluate.
```
