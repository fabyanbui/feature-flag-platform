---
name: ui-status-semantics
description: Design or review admin/demo status displays across lifecycle, runtime evaluation reasons, group kill switches, history, statistics, cache-independent outcomes, and RBAC-disabled controls while keeping indicators accessible.
---

## Checklist
- Show **status label** (Enabled/Disabled/Archived) distinctly from **runtime state** (On/Off).
- Status indicators are text-backed, not color-only.
- Consistent status rendering across list and detail views.
- Explain runtime-off causes such as `GROUP_KILL_SWITCH`, `KILL_SWITCH`, and
  `DEFAULT_OFF` without relabeling lifecycle status.
- Show authorization-disabled actions with a reason and preserve keyboard/focus
  behavior.
- Label statistics as aggregate evaluation activity, not unique users.

## Sources
- `docs/requirement/frontend/fe-init.md`
- `docs/plan/recommended-enhancements-roadmap.md`
- `AGENTS.md`
