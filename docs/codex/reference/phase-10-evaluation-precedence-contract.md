# Phase 10 Evaluation Precedence Contract — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a
reference, not a transcript.

## Scope

The session completed Phase 10 of
`docs/plan/recommended-enhancements-roadmap.md`: lock deterministic evaluation
behavior and its test evidence before group kill switch, caching, statistics,
SDK, or RBAC work begins.

Work was completed on branch `test/evaluation-contract` as a sequence of
test-first commits.

## High-signal outcomes

- Corrected terminal-condition precedence from:

  ```text
  FLAG_ARCHIVED -> KILL_SWITCH -> FLAG_DISABLED
  ```

  to:

  ```text
  FLAG_ARCHIVED
  -> FLAG_DISABLED
  -> KILL_SWITCH
  -> GLOBAL_ON
  -> ordered enabled rules
  -> DEFAULT_OFF
  ```

- Reserved `GROUP_KILL_SWITCH` between `FLAG_DISABLED` and `KILL_SWITCH` for
  Phase 12, without adding it to the current `EvaluationReason` enum.
- Added combination tests proving the exact terminal precedence.
- Expanded coverage for multiple same-type rules, disabled rules, percentage
  boundaries at `0`, `1`, `50`, and `100`, missing and whitespace-only
  `targetingKey`, deterministic buckets, deterministic variants and complete
  results, and fail-closed `ERROR` behavior.
- Kept percentage matching as `bucketPercentage < percentage`, never `<=`.
- Kept error handling at the evaluation service boundary rather than adding
  scattered `try/catch` blocks inside the pure evaluation engine.
- Aligned the learning guide, API contract, and coverage map with the tested
  behavior.

## Files and artifacts

Changed implementation and tests:

- `apps/backend/src/evaluation/engine/evaluation-engine.ts`
- `apps/backend/src/evaluation/engine/evaluation-engine.spec.ts`
- `apps/backend/src/evaluation/engine/stable-rollout-hash.spec.ts`
- `apps/backend/src/evaluation/evaluation.service.spec.ts`

Changed or created documentation:

- `docs/design/mvp-api-and-contracts.md`
- `docs/learning/data-plane-api-and-evaluation-engine.md`
- `docs/plan/phase-10-recommended-test-coverage-map.md`

The coverage map is the concise evidence source connecting each Phase 10
requirement to an automated test name.

## Decisions and guardrails

- Missing project, environment, flag, or configuration remains a safe
  `enabled=false`, `reason=NOT_FOUND` decision.
- Unexpected repository or engine-path failures remain
  `enabled=false`, `variant=off`, `reason=ERROR`.
- Percentage rollout continues to use deterministic SHA-256 hashing over
  `projectKey`, `flagKey`, and a stable non-PII `targetingKey`.
- Rule-type precedence still outranks cross-type numeric priority:
  user allowlist, then role targeting, then percentage rollout.
- Numeric priority orders rules only within the same rule type.
- Disabled rules are filtered before rule evaluation and cannot shadow enabled
  rules.
- Phase 10 made no Prisma, migration, frontend, cache, metrics, SDK, or RBAC
  changes.
- Do not expose `GROUP_KILL_SWITCH` until Phase 12 implements group state,
  evaluation behavior, audit logging, and tests.
- Preserve control-plane/data-plane separation and fail-closed runtime
  behavior in subsequent recommended phases.

## Validation and caveats

Final verified results:

```text
Backend unit tests: 28 suites passed, 219 tests passed
Backend build: passed
git diff --check: passed
Working tree after Phase 10 commits: clean
```

The backend evaluation source contains no `GROUP_KILL_SWITCH` reason. The
planned position appears only in documentation for Phase 12.

The Phase 10 work was committed locally on `test/evaluation-contract`. Pushing
the branch and merging it into `develop` are repository workflow actions, not
part of the implementation validation recorded here.

## Best reusable next prompt

> Continue from the completed Phase 10 evaluation precedence contract. Review
> Phase 11 in `docs/plan/recommended-enhancements-roadmap.md` and teach me
> step-by-step to implement audit-backed per-flag configuration history. Start
> by inspecting the existing `AuditLogEntry` model, audit APIs, target types,
> pagination conventions, and transactional audit records. Reuse audit logs as
> the history source; do not create a separate version table unless repository
> evidence proves it is necessary. Preserve append-only audit logging,
> control-plane/data-plane separation, and the completed Phase 10 contract.

## Source notes

This reference summarizes the current Codex conversation and the resulting
repository state. Durable source documents:

- `AGENTS.md`
- `docs/plan/recommended-enhancements-roadmap.md`
- `docs/plan/phase-10-recommended-test-coverage-map.md`
- `docs/design/mvp-api-and-contracts.md`
- `docs/learning/data-plane-api-and-evaluation-engine.md`
