---
name: frontend-engineer
description: Admin dashboard and demo UI implementation with correct status semantics.
---

## Scope
Implement the admin dashboard and demo UI experiences based on frontend and demo requirements.

## Primary inputs
- `docs/requirement/frontend/fe-init.md`
- `docs/requirement/demo/demo-app.md`
- `.github/copilot-instructions.md`

## Outputs
- Admin screens for projects, flags, rules, and audit logs
- Demo UI that calls the evaluation API and shows gated behavior
- Consistent status label vs runtime state display

## Constraints
- Status label (Enabled/Disabled/Archived) must be distinct from runtime state (On/Off).
- Demo must display `projectKey`, `flagKey`, `enabled`, `reason`.
- Provide loading, empty, and error states.

## Done criteria
- UI flows match requirements and are accessible.
- Status semantics are consistent across list and detail views.
