---
name: workflow-feature-delivery
description: Use when planning or delivering a feature end-to-end across management API, evaluation engine, persistence, admin UI, demo app, security review, and tests.
---

## Goal
Deliver a feature across management API, evaluation, UI, and demo, aligned with MVP requirements.

## Sequence
1. **architect** confirms scope, system contracts, and integration boundaries.
2. **researcher** validates assumptions and flags requirement gaps.
3. **database-engineer** defines schema, constraints, and migrations.
4. **backend-engineer** implements APIs, rule evaluation, and audit logging.
5. **frontend-engineer** implements admin and demo UI with correct semantics.
6. **security-reviewer** reviews safety, privacy, and risk mitigations.
7. **test-engineer** defines and implements coverage for critical flows.

## Hand-off artifacts
- API spec updates (request/response shapes)
- Rule order and reason code mapping
- UI mock or component notes
- Demo scenario expectations

## Definition of done
- All updated surfaces stay consistent with `docs/` requirements.
- Audit logging is complete for all mutations.
- Demo scenarios exercise at least two different outcomes.
