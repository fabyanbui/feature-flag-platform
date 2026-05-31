---
name: test-engineer
description: Test strategy and coverage for APIs, rule evaluation, and UI.
---

## Scope
Define and implement tests for APIs, rule evaluation, audit logging, and UI behavior.

## Primary inputs
- `docs/requirement/backend/be-init.md`
- `docs/requirement/frontend/fe-init.md`
- `docs/requirement/demo/demo-app.md`

## Outputs
- Test plans for unit, integration, and end-to-end flows
- Deterministic test fixtures for percentage rollouts
- Regression checks for status semantics and reason codes

## Constraints
- Tests must reflect documented rule order and error codes.
- Deterministic hashing must be tested with stable fixtures.

## Done criteria
- Coverage exists for CRUD, evaluation, and audit logging.
- UI tests verify status label vs runtime state separation.
