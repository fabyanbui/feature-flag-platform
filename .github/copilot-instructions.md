# Copilot instructions

## Project context
- This repository currently contains product requirements, research, and architecture docs for a feature-flag platform (see `docs/`).

## High-level architecture
- **Control plane**: Admin dashboard + Management API for project/flag/rule CRUD and audit log viewing.
- **Data plane**: Evaluation API for runtime flag decisions, backed by a deterministic rule engine with reason codes.
- **Storage**: PostgreSQL for projects, feature flags, ordered rules, and append-only audit logs.
- **Demo app**: Calls the evaluation API to demonstrate runtime gating.
- **Deployment**: Single backend service hosts both management and evaluation endpoints; admin and demo UIs are static web apps.

## Key conventions
- **Rule types and order**: Global disable → user allowlist → role targeting → percentage rollout → default off. Rule evaluation is deterministic using stable hashing over a user identifier (and flag key where needed).
- **Evaluation response**: Always return `enabled` plus `reason`, `projectKey`, and `flagKey`; missing project/flag yields `enabled=false` with `reason=NOT_FOUND`.
- **Audit logging**: Every mutation (projects, flags, rules) writes an append-only audit entry with before/after snapshots in the same transaction.
- **API conventions**: Versioned endpoints under `/v1/`, JSON request/response bodies, consistent error codes (`NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`), and pagination for list endpoints.
- **Keys and safety**: Project keys are unique/immutable; deleting projects must not silently orphan flags; rule order is explicit and persisted.
- **UI semantics**: Feature flag **status label** (Enabled/Disabled/Archived) is distinct from **runtime state** (On/Off) and should be displayed consistently.
