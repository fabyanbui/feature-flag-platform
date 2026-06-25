---
name: data-modeling
description: Design or review Prisma/PostgreSQL models for the stable feature-flag platform and recommended enhancements, including environments, groups, aggregate evaluation metrics, demo identities when needed, migrations, indexes, and integrity constraints.
---

## Checklist
- Start from current Prisma model names; do not create parallel concepts.
- Core models include `Project`, `Environment`, `FeatureFlag`,
  `FlagEnvironmentConfig`, `FlagRule`, `SampleUserContext`, and
  `AuditLogEntry`.
- Recommended domain models use `FlagGroup` and `FlagGroupConfig`.
- Statistics use aggregate time-bucket rows and never raw evaluation context.
- Add demo identity persistence only if the active RBAC design requires it;
  static server-side mapping is acceptable.
- Enforce unique keys and foreign key relationships.
- Keep audit logs append-only.
- Persist rule order explicitly (priority/sequence).
- Design cache invalidation around committed mutations; do not persist
  context-specific cached decisions.
- Update migrations, seed data, repository code, tests, and schema docs
  together.

## Sources
- `apps/backend/prisma/schema.prisma`
- `docs/design/software-architecture-document.md`
- `docs/plan/recommended-enhancements-roadmap.md`
