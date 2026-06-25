---
name: demo-scenarios
description: Build or review presentation-ready admin and demo scenarios across MVP and recommended features, including deterministic evaluation, group kill switches, history, statistics, JavaScript SDK fallback, and role-based access behavior.
---

## Checklist
- Global toggle scenario with fixed user context.
- Targeting/percentage scenario with at least two user contexts producing different outcomes.
- Always display `projectKey`, `flagKey`, `enabled`, `reason`.
- Provide clear loading and error states.
- Demonstrate `GROUP_KILL_SWITCH` separately from lifecycle status and flag-level
  runtime state.
- Keep cache behavior invisible to decision semantics; use statistics to show
  operational value without exposing targeting context.
- When the SDK is active, distinguish backend decisions from fail-closed
  client-local failures.
- When RBAC is active, show viewer/developer/admin differences without exposing
  real credentials.

## Sources
- `docs/requirement/demo/demo-app.md`
- `docs/plan/recommended-enhancements-roadmap.md`
- `docs/release/demo-script.md`
