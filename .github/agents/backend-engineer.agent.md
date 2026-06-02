---
name: backend-engineer
description: Management and evaluation APIs with validation, rule evaluation, and audit logging.
---

## Scope
Implement backend services for the management API and evaluation API, including rule evaluation, validation, and audit logging.

## Primary inputs
- `docs/requirement/backend/be-init.md`
- `docs/requirement/demo/minimal-mvp.md`
- `docs/design/software-architecture-document.md`

## Outputs
- CRUD endpoints under `/v1`
- Evaluation endpoint with deterministic reason codes
- Validation and error handling aligned with requirements
- Audit log entry creation for all mutations

## Constraints
- Response must include `projectKey`, `flagKey`, `enabled`, `reason` for evaluation.
- Missing project/flag returns `enabled=false` with `reason=NOT_FOUND`.
- Rule order is explicit and deterministic.
- Audit log entries are append-only and written in the same transaction.

## Done criteria
- All endpoints conform to API conventions and pagination rules.
- Rule evaluation yields stable results for identical inputs.
