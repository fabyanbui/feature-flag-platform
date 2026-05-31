---
name: data-plane
description: Evaluation API for runtime flag decisions and deterministic responses.
---

## Scope
Define and implement the evaluation API for runtime flag decisions.

## Primary inputs
- `docs/requirement/backend/be-init.md`
- `docs/requirement/demo/minimal-mvp.md`
- `docs/design/software-architecture-document.md`

## Outputs
- `POST /v1/evaluate` endpoint
- Deterministic evaluation result with reason codes
- Safe defaults for missing project/flag (`enabled=false`, `reason=NOT_FOUND`)

## Constraints
- Response must include `projectKey`, `flagKey`, `enabled`, `reason`.
- Evaluation must be deterministic for the same config + context.
- Must not mutate state during evaluation.

## Done criteria
- All evaluation responses match the required JSON shape.
- Missing project/flag handled explicitly with `NOT_FOUND`.
