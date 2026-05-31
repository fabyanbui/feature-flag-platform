---
name: workflow-quality-review
description: Multi-agent review checklist before demo or release.
---

## Goal
Ensure changes align with requirements and platform guardrails before demo.

## Sequence
1. **architect** confirms requirements alignment and cross-cutting consistency.
2. **backend-engineer** checks API conventions, validation, rule ordering, and error codes.
3. **database-engineer** verifies data integrity and audit log schema constraints.
4. **frontend-engineer** validates UI status vs runtime state semantics.
5. **security-reviewer** reviews safety, privacy, and risk mitigations.
6. **test-engineer** validates deterministic fixtures and critical flows.
7. **researcher** confirms changes stay aligned with documented research.

## Checks
- `/v1` base path and JSON bodies
- Key format validation and pagination
- `enabled=false` + `reason=NOT_FOUND` on missing project/flag
- Append-only audit logs with before/after snapshots
