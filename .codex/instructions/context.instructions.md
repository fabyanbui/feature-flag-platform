# Project Context

## Repository Status
- This repo currently contains documentation and project-specific Codex configuration, with no implementation code yet.
- Core planning, requirements, research, and design artifacts live under `docs/`.

## Product Scope
- Control plane: admin dashboard plus management API for projects, flags, rules, and audit logs.
- Data plane: evaluation API with deterministic rule evaluation and reason codes.
- Demo app: web UI that calls the evaluation API to show runtime gating.
- Storage: PostgreSQL, with SQLite acceptable for local demo work.

## Architecture Baseline
- Single backend service hosts both management and evaluation endpoints.
- Admin and demo UIs are static web apps.
- MVP stack: NestJS, Prisma, PostgreSQL, REST, Swagger, Jest, and in-memory cache.

## Rule Evaluation
- Default rule order: global disable -> user allowlist -> role targeting -> percentage rollout -> default off.
- Percentage rollout must be deterministic using stable hashing.

## Evaluation Response
- Always return `enabled`, `reason`, `projectKey`, and `flagKey`.
- Missing project or flag returns `enabled=false` with `reason=NOT_FOUND`.

## Audit Logging
- Every mutation for projects, flags, and rules must write an append-only audit entry with before and after snapshots in the same transaction.

## UI Semantics
- Status label (Enabled/Disabled/Archived) is distinct from runtime state (On/Off) and must be displayed consistently.

## Domain Glossary
- Feature flag: runtime control point that enables, disables, or targets functionality without redeploying.
- Control plane: management UI/API for projects, flags, rules, and audit logs.
- Data plane: runtime evaluation path through the evaluation API.
- Rule: ordered condition that determines flag enablement for a user context.
- Kill switch: global disable rule used for incident rollback.
- Reason code: explanation of which rule or default determined the evaluation outcome.
- Audit log: append-only record of configuration mutations with before and after snapshots.
- User context: inputs for evaluation, such as userId, roles, and attributes.
