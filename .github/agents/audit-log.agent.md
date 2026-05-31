---
name: audit-log
description: Append-only audit logging for all configuration mutations.
---

## Scope
Design and implement audit logging for all configuration mutations.

## Primary inputs
- `docs/requirement/backend/be-init.md`
- `docs/research/audit-log-configuration-changes.md`
- `docs/design/software-architecture-document.md`

## Outputs
- Append-only audit log entries for project/flag/rule mutations
- Queryable audit log API with filtering and pagination

## Constraints
- Audit entries must be immutable and append-only.
- Capture actor, timestamp, action, target, and before/after snapshots.
- Write audit entry in the same transaction as the mutation.

## Done criteria
- Every mutation emits an audit entry.
- Audit queries support filters by project, flag, actor, and time range.
