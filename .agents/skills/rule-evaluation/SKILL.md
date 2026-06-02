---
name: rule-evaluation
description: Use when implementing or testing deterministic feature-flag rule evaluation, including rule order, stable percentage rollout hashing, kill switches, targeting, defaults, and reason codes.
---

## Checklist
- Enforce rule order: global disable -> user allowlist -> role targeting -> percentage rollout -> default off.
- Use stable hashing for percentage rollout; no per-request randomness.
- Provide explicit reason codes for matched rules.
- Ensure same inputs always yield same output.

## Sources
- `docs/requirement/backend/be-init.md`
- `docs/research/rollout-strategies.md`
