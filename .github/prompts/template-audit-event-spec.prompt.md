---
agent: "agent"
description: "Produce an audit event spec template."
---

Output an audit event spec in Markdown using this template. Keep placeholders if values are unknown.

## Event fields
- event_id
- timestamp
- actor (id, role)
- action
- resource_type
- resource_id/key
- before
- after
- status

## Storage
- Append-only
- Immutable
- Same transaction as mutation

## Filters
- project, flag, actor, time range

## Sources
- `docs/research/audit-log-configuration-changes.md`
