---
name: security-defaults
description: Review feature-flag security and privacy across evaluation, caching, aggregate metrics, JavaScript SDKs, demo RBAC, frontend exposure, Docker configuration, fail-closed defaults, and secret handling.
---

## Checklist
- Fail closed: default to off for high-risk features.
- Avoid exposing sensitive flags via client-side evaluation.
- Send only required context attributes; avoid PII where possible.
- Cache configuration snapshots, not raw user context or final decisions.
- Store aggregate metrics only; exclude targeting keys, roles, attributes, and
  raw evaluation requests.
- Resolve demo bearer tokens on the backend and never trust a client role
  header.
- Keep privileged tokens, database URLs, and secrets out of browser bundles,
  committed Compose files, logs, docs, and responses.
- Keep SDK timeout/network/shape failures explicitly client-local and
  fail-closed.

## Sources
- `docs/research/feature-flag-key-considerations.md`
- `docs/plan/recommended-enhancements-roadmap.md`
- `docs/release/security-review.md`
