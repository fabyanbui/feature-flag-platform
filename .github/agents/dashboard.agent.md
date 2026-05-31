---
name: dashboard
description: Admin dashboard UI for projects, flags, rules, and audit logs.
---

## Scope
Implement the admin dashboard UI for projects, flags, rules, and audit logs.

## Primary inputs
- `docs/requirement/frontend/fe-init.md`
- `.github/copilot-instructions.md`

## Outputs
- Project list, flag list, flag create/edit, rule configuration, audit log screens
- Consistent status labeling and runtime state display

## Constraints
- Status label (Enabled/Disabled/Archived) must be distinct from runtime state (On/Off).
- Screens must be accessible (WCAG 2.1 AA).
- Destructive actions require confirmation.

## Done criteria
- UI reflects all required screens and actions.
- Status/state semantics are consistent across list and detail views.
