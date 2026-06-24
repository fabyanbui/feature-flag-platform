# Phase 4 Evaluation Response DTO Import Type Fix — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response.

## Original request context

The user was implementing Phase 4 of the feature flag platform: evaluation
engine and data-plane API. The active task was Step 4, adding request and
response DTOs for `POST /v1/evaluate`.

After creating `apps/backend/src/evaluation/dto/evaluate-response.dto.ts`, the
backend build failed with TypeScript error `TS1272`:

```text
A type referenced in a decorated signature must be imported with 'import type'
or a namespace import when 'isolatedModules' and 'emitDecoratorMetadata' are
enabled.
```

The error pointed at this decorated DTO property:

```ts
variant!: EvaluationVariant;
```

The affected file was:

```text
apps/backend/src/evaluation/dto/evaluate-response.dto.ts
```

Relevant repo guardrails:

- Preserve deterministic evaluation and fail-closed defaults.
- Keep the data-plane evaluation response shape stable.
- Evaluation responses must include `projectKey`, `flagKey`, `enabled`,
  `reason`, and the implementation also includes `variant` and
  `matchedRuleId` per API contract.
- Keep Phase 4 focused on the read-only evaluation path.

## Full response reference

The build failure is a TypeScript decorator metadata issue, not an evaluation
logic issue.

`EvaluationVariant` is a type alias:

```ts
export type EvaluationVariant = 'on' | 'off';
```

Because it is only a compile-time type, it must be imported with `import type`
when `isolatedModules` and `emitDecoratorMetadata` are enabled and the type is
used on a decorated class property.

Update this import in:

```text
apps/backend/src/evaluation/dto/evaluate-response.dto.ts
```

Replace:

```ts
import {
    EvaluationReason,
    EvaluationVariant,
} from '../engine/evaluation.types';
```

With:

```ts
import { EvaluationReason } from '../engine/evaluation.types';
import type { EvaluationVariant } from '../engine/evaluation.types';
```

The complete corrected file should be:

```ts
import { ApiProperty } from '@nestjs/swagger';
import { EvaluationReason } from '../engine/evaluation.types';
import type { EvaluationVariant } from '../engine/evaluation.types';

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
    variant!: EvaluationVariant;

    @ApiProperty({
        enum: EvaluationReason,
        example: EvaluationReason.ROLE_MATCH,
    })
    reason!: EvaluationReason;

    @ApiProperty({
        example: 'rule_123',
        nullable: true,
    })
    matchedRuleId!: string | null;
}
```

Then rerun the backend build:

```bash
npm run build --workspace=@ffp/backend
```

Expected result:

```text
No TypeScript errors
```

## Key decisions and rationale

### Keep `EvaluationReason` as a normal import

`EvaluationReason` is an enum used in the Swagger decorator:

```ts
@ApiProperty({
    enum: EvaluationReason,
    example: EvaluationReason.ROLE_MATCH,
})
```

Because decorators run at runtime and Swagger needs the enum value,
`EvaluationReason` must remain a normal value import:

```ts
import { EvaluationReason } from '../engine/evaluation.types';
```

### Import `EvaluationVariant` as type-only

`EvaluationVariant` is a type alias only:

```ts
export type EvaluationVariant = 'on' | 'off';
```

It has no runtime value. Therefore it should be imported as:

```ts
import type { EvaluationVariant } from '../engine/evaluation.types';
```

This satisfies TypeScript with `isolatedModules` and `emitDecoratorMetadata`.

### Do not change the response contract

The fix only changes import syntax. It does not change the API response shape.
The evaluation response remains:

```json
{
  "projectKey": "demo-project",
  "flagKey": "new-checkout",
  "enabled": true,
  "variant": "on",
  "reason": "ROLE_MATCH",
  "matchedRuleId": "rule_123"
}
```

## Commands, files, and artifacts

Affected file:

```text
apps/backend/src/evaluation/dto/evaluate-response.dto.ts
```

Validation command:

```bash
npm run build --workspace=@ffp/backend
```

Related Phase 4 files:

```text
apps/backend/src/evaluation/dto/evaluate-request.dto.ts
apps/backend/src/evaluation/engine/evaluation.types.ts
apps/backend/src/evaluation/engine/evaluation-engine.ts
apps/backend/src/evaluation/engine/evaluation-engine.spec.ts
apps/backend/src/evaluation/engine/stable-rollout-hash.ts
apps/backend/src/evaluation/engine/stable-rollout-hash.spec.ts
```

## Validation checklist

- [ ] `EvaluationReason` is imported normally.
- [ ] `EvaluationVariant` is imported with `import type`.
- [ ] `variant!: EvaluationVariant;` remains unchanged.
- [ ] Swagger `@ApiProperty({ enum: ['on', 'off'] })` remains on `variant`.
- [ ] The response DTO still includes `projectKey`, `flagKey`, `enabled`,
      `variant`, `reason`, and `matchedRuleId`.
- [ ] `npm run build --workspace=@ffp/backend` succeeds.

## Risks and caveats

- Do not convert `EvaluationReason` to `import type`; Swagger needs it at
  runtime for the enum metadata.
- Do not remove the `variant` property. It is part of the Phase 4 evaluation
  response contract.
- This fix addresses only the response DTO build error. It does not implement
  the repository, service, controller, or `POST /v1/evaluate` endpoint.

## Reuse prompts

Use these prompts to continue or recover this work later:

```text
Continue Phase 4 after fixing TS1272 in evaluate-response.dto.ts. The response
DTO should import EvaluationReason normally and EvaluationVariant with import
type. Proceed to implement the read-only EvaluationRepository for loading the
project, default or requested environment, feature flag, flag environment
config, and ordered rules.
```

```text
Review apps/backend/src/evaluation/dto/evaluate-response.dto.ts for correct
TypeScript decorator metadata imports. Ensure enums used in Swagger decorators
are value imports and type aliases are import type.
```
