---
name: security-defaults
description: Use when reviewing feature-flag safety, privacy-aware targeting, client-side exposure risks, fail-closed defaults, and minimization of user context or PII.
---

## Checklist
- Fail closed: default to off for high-risk features.
- Avoid exposing sensitive flags via client-side evaluation.
- Send only required context attributes; avoid PII where possible.

## Sources
- `docs/research/feature-flag-key-considerations.md`
