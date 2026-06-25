---
name: rule-evaluation
description: Implement or test deterministic feature-flag evaluation across lifecycle state, disabled config, group and flag kill switches, global-on mode, ordered targeting rules, stable rollout hashing, variants, caching, and reason codes.
---

## Checklist
- Enforce terminal precedence: `FLAG_ARCHIVED` -> `FLAG_DISABLED` ->
  `GROUP_KILL_SWITCH` -> `KILL_SWITCH` -> `GLOBAL_ON` -> ordered enabled rules
  -> `DEFAULT_OFF`.
- Use stable hashing for percentage rollout; no per-request randomness.
- Provide explicit reason codes for matched rules.
- Ensure same inputs always yield same output.
- Ignore disabled rules and fail closed on missing required context or engine
  errors.
- Cache reusable configuration snapshots only; evaluate every request context
  independently.
- Keep cache hits, metric writes, and SDK wrappers from changing decisions or
  backend reason semantics.

## Sources
- `docs/requirement/backend/be-init.md`
- `docs/research/rollout-strategies.md`
- `docs/plan/recommended-enhancements-roadmap.md`
- `docs/codex/reference/phase-10-evaluation-precedence-contract.md`
