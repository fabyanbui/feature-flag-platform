---
name: api-design
description: Use when designing or implementing feature-flag platform REST APIs, especially /v1 endpoints, validation, error codes, evaluation NOT_FOUND behavior, and pagination.
---

## Checklist
- Use `/v1` base path and JSON bodies.
- Provide pagination for all list endpoints.
- Validate keys (`projectKey`, `flagKey`) and enforce length/format.
- Use consistent error codes: `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `INTERNAL_ERROR`.
- Return `enabled=false` with `reason=NOT_FOUND` for missing project/flag in evaluation.

## Sources
- `docs/requirement/demo/minimal-mvp.md`
- `docs/requirement/backend/be-init.md`
