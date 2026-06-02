---
name: demo-scenarios
description: Use when building or reviewing demo app scenarios that call the evaluation API and display projectKey, flagKey, enabled, reason, loading, errors, and multiple rollout outcomes.
---

## Checklist
- Global toggle scenario with fixed user context.
- Targeting/percentage scenario with at least two user contexts producing different outcomes.
- Always display `projectKey`, `flagKey`, `enabled`, `reason`.
- Provide clear loading and error states.

## Sources
- `docs/requirement/demo/demo-app.md`
