---
applyTo: "**"
---

# Project memory (decisions and guardrails)

## Decisions
- Single backend service hosts management and evaluation endpoints.
- PostgreSQL is the primary relational database (SQLite acceptable for local demo).
- MVP tech stack: NestJS + Prisma, REST APIs with Swagger, Jest for testing, in-memory cache.
- Deterministic rule order: global disable -> user allowlist -> role targeting -> percentage rollout -> default off.
- Audit logging is append-only and written in the same transaction as the mutation.

## Guardrails
- Default behavior should be safe (usually off) and explicit.
- Evaluation must be deterministic for the same config and context.
- A global kill switch provides the fastest rollback path and must be reliable.
- Configuration changes must be fully traceable with immutable audit logs.
- Use stable, non-PII identifiers for targeting and rollout keys.
