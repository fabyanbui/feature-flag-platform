---
name: evaluation-runtime-reliability
description: Implement or review evaluation snapshot caching and privacy-preserving aggregate statistics. Use for cache keys, TTL, invalidation, repository fallback, metric aggregation, stats APIs/dashboard, and tests proving runtime enhancements never alter deterministic fail-closed decisions.
---

# Evaluation Runtime Reliability

## Workflow

1. Read Phases 13–14 and Gate B in
   `docs/plan/recommended-enhancements-roadmap.md`.
2. Keep evaluation order and response contracts unchanged.
3. Cache reusable `EvaluationSnapshot` configuration by project, environment
   scope, and flag; never cache request context or final decisions.
4. Invalidate only after successful mutation commit. Cover lifecycle, config,
   rules, group assignment, and group-switch changes.
5. Fall back to repository access on cache read/write failure.
6. Aggregate every completed evaluation decision, including
   cache hits. Metric failure must not alter the response.
7. Store only project/environment/flag, time bucket, reason, enabled, and count.
8. Add stats APIs/UI with environment and time filters where practical.
9. Prove TTL, invalidation, context isolation, cached counting, privacy, and
   best-effort failure behavior with unit and E2E tests.

## Guardrails

- Preserve deterministic hashing and authoritative precedence.
- Do not cache `NOT_FOUND`, validation failures, or engine errors.
- Do not store user IDs, targeting keys, roles, attributes, or raw contexts in
  cache keys, cached values, metrics, logs, or stats responses.
- Keep cache/metric internals out of the public evaluation response.

## Sources

- `docs/plan/recommended-enhancements-roadmap.md`
- `docs/codex/reference/phase-13-in-memory-evaluation-snapshot-cache.md`
- `docs/design/software-architecture-document.md`
- `docs/release/security-review.md`
