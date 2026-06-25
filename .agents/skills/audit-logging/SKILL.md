---
name: audit-logging
description: Add or review append-only audit logging and audit-backed configuration history for MVP and recommended control-plane mutations, including flags, rules, groups, group assignments, kill switches, and RBAC-resolved actors.
---

## Checklist
- Log every control-plane configuration mutation, including project, flag,
  environment config, rule, group, group assignment, and group kill-switch
  changes.
- Append-only storage; no edits.
- Capture actor, timestamp, action, target, and before/after snapshots.
- Write audit log entry in the same transaction as the mutation.
- Provide query filters (project, flag, actor, time range) with pagination.
- Build configuration history from audit rows rather than duplicating history.
- Resolve the audited actor from trusted backend identity context once RBAC is
  active; do not trust a client-supplied role header.
- Do not treat aggregate evaluation metrics as configuration audit events.

## Sources
- `docs/requirement/backend/be-init.md`
- `docs/research/audit-log-configuration-changes.md`
- `docs/plan/recommended-enhancements-roadmap.md`
