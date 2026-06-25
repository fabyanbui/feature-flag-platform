---
name: workflow-quality-review
description: Review the stable MVP and recommended enhancements before a phase gate, demo, or release, covering contracts, evaluation, cache, metrics, SDK, RBAC, Docker, data integrity, audit logging, UI semantics, security, docs, and tests.
---

## Goal
Ensure the completed MVP remains stable and the active recommended phase is
safe, testable, documented, and presentation-ready.

## Sequence
1. **architect** confirms requirements alignment and cross-cutting consistency.
2. **backend-engineer** checks API conventions, validation, rule ordering, and error codes.
3. **database-engineer** verifies data integrity and audit log schema constraints.
4. **frontend-engineer** validates UI status vs runtime state semantics.
5. **security-reviewer** reviews safety, privacy, and risk mitigations.
6. **test-engineer** validates deterministic fixtures and critical flows.
7. **researcher** confirms changes stay aligned with documented research.

## Checks
- Active roadmap phase acceptance criteria and stop-gate evidence
- `/v1` base path and JSON bodies
- Key format validation and pagination
- `enabled=false` + `reason=NOT_FOUND` on missing project/flag
- Append-only audit logs with before/after snapshots
- Authoritative evaluation precedence and deterministic fixtures
- Snapshot-cache isolation, TTL, invalidation, and fallback
- Aggregate metrics privacy and best-effort failure behavior
- SDK fail-closed client errors without backend enum drift
- Server-resolved RBAC identities and complete permission coverage
- Docker health, migration/seed ordering, safe reruns, CORS, and secret handling
- Accessible lifecycle/runtime/authorization UI semantics
- README, design docs, research report, slides, and demo script traceability
