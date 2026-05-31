---
name: workflow-feature-delivery
description: Multi-agent playbook for delivering features end-to-end.
---

## Goal
Deliver a feature across management API, evaluation, UI, and demo, aligned with MVP requirements.

## Sequence
1. **control-plane** defines or updates CRUD APIs, validation, and audit logging.
2. **rule-engine** ensures evaluation logic and reason codes are deterministic.
3. **data-plane** wires evaluation API to the rule engine and response shape.
4. **dashboard** updates UI screens and status/state semantics.
5. **demo-app** updates demo scenarios to validate behavior.
6. **audit-log** verifies audit coverage and query filters.

## Hand-off artifacts
- API spec updates (request/response shapes)
- Rule order and reason code mapping
- UI mock or component notes
- Demo scenario expectations

## Definition of done
- All updated surfaces stay consistent with `docs/` requirements.
- Audit logging is complete for all mutations.
- Demo scenarios exercise at least two different outcomes.
