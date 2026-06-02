---
name: audit-logging
description: Append-only audit logging requirements and query filters.
---

## Checklist
- Log every configuration mutation (projects, flags, rules).
- Append-only storage; no edits.
- Capture actor, timestamp, action, target, and before/after snapshots.
- Write audit log entry in the same transaction as the mutation.
- Provide query filters (project, flag, actor, time range) with pagination.

## Sources
- `docs/requirement/backend/be-init.md`
- `docs/research/audit-log-configuration-changes.md`
