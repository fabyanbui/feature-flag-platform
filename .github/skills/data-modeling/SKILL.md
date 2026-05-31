---
name: data-modeling
description: MVP data model and integrity constraints.
---

## Checklist
- Tables: projects, feature_flags, flag_rules, sample_user_contexts, audit_log_entries.
- Enforce unique keys and foreign key relationships.
- Keep audit logs append-only.
- Persist rule order explicitly (priority/sequence).

## Sources
- `docs/requirement/demo/minimal-mvp.md`
- `docs/design/software-architecture-document.md`
