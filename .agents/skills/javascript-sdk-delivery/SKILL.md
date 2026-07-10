---
name: javascript-sdk-delivery
description: Implement or review the @ffp/js-sdk workspace package and demo migration. Use for evaluate, isEnabled, getVariant, timeout handling, response validation, typed fail-closed client fallback, package tests, and preserving the backend evaluation contract.
---

# JavaScript SDK Delivery

## Workflow

1. Read Phase 15 and Gate B in
   `docs/plan/recommended-enhancements-roadmap.md`.
2. Create or update `packages/js-sdk` as npm workspace package `@ffp/js-sdk`.
3. Accept `baseUrl`, `projectKey`, optional `environmentKey`, optional `fetch`,
   and `timeoutMs`.
4. Implement `evaluate`, `isEnabled`, and `getVariant` against only
   `POST /v1/evaluate`.
5. Validate HTTP status, JSON parsing, and response shape.
6. Return a typed fail-closed result for timeout, network, abort, invalid JSON,
   and invalid response shape.
7. Mark SDK-local failures with `errorSource: 'CLIENT'`; do not add SDK-only
   reasons to the backend `EvaluationReason`.
8. Migrate the demo app from direct fetch without losing visible result fields,
   scenarios, loading/error states, or accessibility.
9. Test stable requests, helpers, timeouts, malformed responses, custom fetch,
   and demo integration.

## Guardrails

- Keep `targetingKey` distinct from optional `userId`.
- Do not store control-plane credentials, secrets, or PII.
- Keep the SDK data-plane only.
- Preserve backend `projectKey`, `flagKey`, `enabled`, `variant`, `reason`, and
  `matchedRuleId` semantics.

## Sources

- `docs/plan/recommended-enhancements-roadmap.md`
- `docs/design/mvp-api-and-contracts.md`
- `docs/requirement/demo/demo-app.md`
- `docs/release/demo-script.md`
