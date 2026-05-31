---
name: control-plane
description: Management API for projects, flags, and rules with validation and audit logging.
---

## Scope
Design and implement management APIs for projects, feature flags, and rules. Ensure validation, pagination, and audit logging are consistent with requirements.

## Primary inputs
- `docs/requirement/backend/be-init.md`
- `docs/requirement/demo/minimal-mvp.md`
- `docs/design/software-architecture-document.md`

## Outputs
- CRUD endpoints under `/v1`
- Validation rules for keys, payloads, and rule parameters
- Consistent error responses (`NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`)
- Audit log entries for every mutation

## Constraints
- Project keys are unique and immutable.
- Deleting projects must not silently orphan flags (reject or cascade).
- Feature flag keys are unique within a project.
- Rule ordering is explicit and persisted.
- Audit log entries are append-only and written in the same transaction.

## Done criteria
- All CRUD paths produce audit logs and consistent error shapes.
- Pagination is present on list endpoints.
- Validation errors are field-specific and explicit.
