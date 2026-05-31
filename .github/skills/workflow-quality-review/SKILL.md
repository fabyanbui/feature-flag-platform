---
name: workflow-quality-review
description: Multi-agent review checklist before demo or release.
---

## Goal
Ensure changes align with requirements and platform guardrails before demo.

## Sequence
1. **control-plane** checks API conventions, validation, and error codes.
2. **rule-engine** verifies deterministic evaluation and rule ordering.
3. **audit-log** verifies audit trails for all mutations.
4. **dashboard** validates UI status vs runtime state semantics.
5. **demo-app** validates demo scenarios and evaluation outputs.

## Checks
- `/v1` base path and JSON bodies
- Key format validation and pagination
- `enabled=false` + `reason=NOT_FOUND` on missing project/flag
- Append-only audit logs with before/after snapshots
