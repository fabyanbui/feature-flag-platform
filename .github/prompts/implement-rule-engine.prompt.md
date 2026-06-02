---
agent: "agent"
description: "Implement deterministic rule evaluation logic and reason codes."
---

Implement deterministic evaluation for rule types: global on/off, user allowlist, role targeting, percentage rollout. Apply the default order (global disable -> allowlist -> role -> percentage -> default off). Use stable hashing for percentage rollout. Return explicit reason codes for matched rules.
