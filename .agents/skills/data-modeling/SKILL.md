---
name: data-modeling
description: Use when designing or reviewing the MVP database model for projects, feature flags, ordered rules, sample user contexts, audit logs, uniqueness, foreign keys, and persistence constraints.
---

## Checklist
- Tables: projects, feature_flags, flag_rules, sample_user_contexts, audit_log_entries.
- Enforce unique keys and foreign key relationships.
- Keep audit logs append-only.
- Persist rule order explicitly (priority/sequence).

## Sources
- `docs/requirement/demo/minimal-mvp.md`
- `docs/design/software-architecture-document.md`
