---
name: api-design
description: API conventions for /v1 endpoints, validation, error codes, and pagination.
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
