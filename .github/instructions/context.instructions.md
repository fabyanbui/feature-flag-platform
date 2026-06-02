---
applyTo: "**"
---

# Project context (truth in present)

## Repository status
- This repo currently contains documentation only (`docs/`, `.github/`, `README.md`) and no implementation code.

## Product scope (MVP)
- Control plane: admin dashboard + management API for projects, flags, rules, and audit logs.
- Data plane: evaluation API with deterministic rule evaluation and reason codes.
- Demo app: web UI that calls the evaluation API to show runtime gating.
- Storage: PostgreSQL (SQLite allowed for local demo).

## Architecture baseline
- Single backend service hosts both management and evaluation endpoints.
- Admin and demo UIs are static web apps.
- Tech stack (MVP): NestJS, Prisma, PostgreSQL, REST, Swagger, Jest, in-memory cache.

## Rule evaluation
- Default rule order: global disable -> user allowlist -> role targeting -> percentage rollout -> default off.
- Percentage rollout must be deterministic using stable hashing.

## Evaluation response
- Always return `enabled`, `reason`, `projectKey`, `flagKey`.
- Missing project/flag returns `enabled=false` with `reason=NOT_FOUND`.

## Audit logging
- Every mutation (projects, flags, rules) must write an append-only audit entry with before and after snapshots in the same transaction.

## UI semantics
- Status label (Enabled/Disabled/Archived) is distinct from runtime state (On/Off) and must be displayed consistently.

## Domain glossary
- Feature flag: runtime control point that enables/disables or targets functionality without redeploying.
- Control plane: management UI/API for projects, flags, rules, and audit logs.
- Data plane: runtime evaluation path (evaluation API).
- Rule: ordered condition that determines flag enablement for a user context.
- Kill switch: global disable rule used for incident rollback.
- Reason code: explanation of which rule or default determined the evaluation outcome.
- Audit log: append-only record of configuration mutations with before/after snapshots.
- User context: inputs for evaluation (userId, roles, attributes).
