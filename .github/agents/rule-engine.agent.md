---
name: rule-engine
description: Deterministic rule evaluation logic and reason code mapping.
---

## Scope
Implement deterministic rule evaluation for feature flags.

## Primary inputs
- `docs/requirement/backend/be-init.md`
- `docs/research/rollout-strategies.md`
- `docs/design/software-architecture-document.md`

## Outputs
- Rule evaluation logic for:
  1. Global on/off
  2. User allowlist
  3. Role targeting
  4. Percentage rollout (deterministic hash)
- Reason code mapping per rule outcome

## Constraints
- Default order: global disable -> user allowlist -> role targeting -> percentage rollout -> default off.
- Percentage rollout must use stable hashing over a user identifier (and flag key when required).
- No nondeterministic randomness at request time.

## Done criteria
- Same inputs always yield the same output.
- Rule order is explicit and visible in configuration.
