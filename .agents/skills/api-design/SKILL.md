---
name: api-design
description: Design or implement feature-flag platform REST APIs across the stable MVP and recommended enhancements. Use for /v1 management and evaluation endpoints, history, groups, statistics, RBAC errors, validation, pagination, and SDK-facing contracts.
---

## Workflow
- Read `AGENTS.md`, `docs/design/mvp-api-and-contracts.md`, and the active
  phase in `docs/plan/recommended-enhancements-roadmap.md`.
- Preserve existing contracts unless the active phase explicitly changes them.
- Update Swagger, tests, and presentation-facing docs with API changes.

## Checklist
- Use `/v1` base path and JSON bodies.
- Provide pagination for all list endpoints.
- Validate project, environment, flag, and group keys.
- Use consistent errors, including `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`,
  `UNAUTHORIZED`, `FORBIDDEN`, and `INTERNAL_ERROR` where applicable.
- Return `enabled=false` with `reason=NOT_FOUND` for missing project/flag in evaluation.
- Keep SDK-local failures out of the backend reason enum.
- Keep evaluation statistics read APIs aggregate and free of user context.

## Sources
- `docs/requirement/requirement-init.md`
- `docs/requirement/backend/be-init.md`
- `docs/plan/recommended-enhancements-roadmap.md`
- `docs/design/mvp-api-and-contracts.md`
