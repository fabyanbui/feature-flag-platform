---
name: demo-app
description: Demo app that calls the evaluation API and shows gated features.
---

## Scope
Implement the demo web app that calls the evaluation API and shows gated features.

## Primary inputs
- `docs/requirement/demo/demo-app.md`
- `docs/requirement/demo/minimal-mvp.md`

## Outputs
- UI that evaluates a flag on load and on demand
- Global toggle and targeting/percentage rollout scenarios
- Clear display of enabled/disabled and reason

## Constraints
- Must show `projectKey`, `flagKey`, `enabled`, `reason`.
- Demo feature visible only when `enabled=true`.
- Provide clear loading and error states.

## Done criteria
- Two scenarios demonstrate different outcomes.
- Evaluation results are deterministic for the same context.
