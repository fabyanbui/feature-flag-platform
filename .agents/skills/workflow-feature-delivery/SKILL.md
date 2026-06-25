---
name: workflow-feature-delivery
description: Plan or deliver a feature end-to-end across the stable MVP and active recommended roadmap, including management API, evaluation, persistence, admin/demo UI, SDK, authorization, operations, security, tests, docs, and presentation evidence.
---

## Goal
Deliver the smallest reversible vertical slice while keeping the completed MVP green and satisfying the active recommended phase and stop gate.

## Sequence
1. Read `AGENTS.md`, both roadmaps, and current completion evidence.
2. **architect** confirms scope, contracts, gate prerequisites, and boundaries.
3. **researcher** validates assumptions and requirement gaps.
4. **database-engineer** defines schema, constraints, and migrations.
5. **backend-engineer** implements APIs, evaluation, and audit logging.
6. **frontend-engineer** implements admin/demo UI and SDK integration.
7. **security-reviewer** reviews safety, privacy, and risk mitigations.
8. **test-engineer** implements coverage for critical flows.
9. Update architecture, API, security, release, report, and slide docs affected
   by the enhancement.

## Hand-off artifacts
- API spec updates (request/response shapes)
- Rule order and reason code mapping
- Migration, cache invalidation, metrics, authorization, or Compose contracts
  when applicable
- UI mock or component notes
- Demo scenario expectations

## Definition of done
- Existing MVP regression checks remain green.
- The active roadmap phase acceptance criteria and preceding stop gate pass.
- Audit logging is complete for all mutations.
- Evaluation stays deterministic and fail closed.
- Tests, README/design docs, report/slide notes, and demo evidence are updated.
