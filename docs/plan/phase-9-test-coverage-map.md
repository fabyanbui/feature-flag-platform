# Phase 9 Test Coverage Map

## Purpose

This map connects Phase 9 release-readiness requirements to the tests that
already exist in the repository. Use it before adding new tests so Phase 9
improves confidence without duplicating coverage blindly.

Related checklist:

- `docs/plan/phase-9-release-readiness-checklist.md`

## Summary

The backend already has strong coverage for evaluation behavior, management API
flows, audit logging, and integration paths. Phase 9 now includes a
presentation-shaped demo-flow E2E test that directly proves the Phase 8 demo
scenarios, including the missing project/flag fallback, in one place.

Recommended next test work:

1. Add one explicit evaluation-engine test proving kill switch/global disable
   wins even when targeting rules would otherwise match.
2. Optionally add a compact API-hardening E2E test only if final review needs a
   single file proving validation, error shape, pagination, and conflict
   behavior together.

## Phase 9 Requirement Coverage

| Requirement | Current status | Existing evidence | Gap / next action |
| --- | --- | --- | --- |
| Main demo flow E2E coverage | Covered | `apps/backend/test/phase-6-vertical-slice.e2e-spec.ts` creates a project, creates a flag, configures role targeting, evaluates enabled and default-off results, and verifies audit entries. `apps/backend/test/phase-9-demo-flow.e2e-spec.ts` mirrors Phase 8 demo scenarios and includes `NOT_FOUND`. | Keep as release-readiness evidence. |
| Runtime evaluation through `POST /v1/evaluate` | Covered | `apps/backend/test/phase-6-vertical-slice.e2e-spec.ts`; `apps/backend/test/integration/phase-4-evaluation.integration-spec.ts`; `apps/backend/test/integration/phase-3-foundation.integration-spec.ts` | Keep as evidence. |
| Enabled evaluation result | Covered | Phase 6 E2E checks `ROLE_MATCH`; Phase 4 integration checks persisted role targeting; evaluation engine checks `GLOBAL_ON`, `USER_ALLOWLIST`, `ROLE_MATCH`, and `PERCENTAGE_ROLLOUT`. | Keep as evidence. |
| Disabled/default-off evaluation result | Covered | Phase 6 E2E checks regular user `DEFAULT_OFF`; evaluation engine checks `DEFAULT_OFF`; Phase 4 integration checks deterministic percentage behavior. | Keep as evidence. |
| Missing project/flag returns `enabled=false`, `reason=NOT_FOUND` | Covered | `apps/backend/src/evaluation/engine/evaluation-engine.spec.ts`; `apps/backend/src/evaluation/evaluation.service.spec.ts`; `apps/backend/test/integration/phase-4-evaluation.integration-spec.ts`; `apps/backend/test/integration/phase-3-foundation.integration-spec.ts`; `apps/backend/test/phase-9-demo-flow.e2e-spec.ts` | Keep as evidence. |
| Rule order: kill switch/global disable first | Mostly covered | Evaluation engine tests `KILL_SWITCH`, `FLAG_DISABLED`, `GLOBAL_ON`, and rule precedence among rule types. | Add explicit test that kill switch wins even when an allowlist/role rule would match. |
| Rule order: user allowlist before role targeting | Covered | `apps/backend/src/evaluation/engine/evaluation-engine.spec.ts` has `uses type precedence before priority across different rule types`. | Keep as evidence. |
| Rule order: priority within same type | Covered | `apps/backend/src/evaluation/engine/evaluation-engine.spec.ts` has `uses lower priority first within the same rule type`. | Keep as evidence. |
| Stable hashing deterministic | Covered | `apps/backend/src/evaluation/engine/stable-rollout-hash.spec.ts`; `apps/backend/src/evaluation/engine/evaluation-engine.spec.ts`; `apps/backend/test/integration/phase-4-evaluation.integration-spec.ts` | Keep as evidence. |
| Invalid percentage/context safety | Covered | `apps/backend/src/evaluation/engine/evaluation-engine.spec.ts`; `apps/backend/src/flag-rules/flag-rules.service.spec.ts` | Keep as evidence. |
| API validation error shape | Covered | `apps/backend/src/common/filters/api-exception.filter.spec.ts`; `apps/backend/test/integration/phase-3-foundation.integration-spec.ts`; DTO specs under `apps/backend/src/common/dto/` | Optional: add compact E2E proof if needed. |
| Pagination response shape | Covered | `apps/backend/src/common/dto/page-response.dto.spec.ts`; `apps/backend/src/projects/projects.service.spec.ts`; `apps/backend/src/feature-flags/feature-flags.service.spec.ts`; `apps/backend/src/audit-logs/audit-logs.service.spec.ts`; `apps/backend/test/phase-5-management.e2e-spec.ts` | Keep as evidence. |
| Conflict behavior | Covered | `apps/backend/test/phase-5-management.e2e-spec.ts`; `apps/backend/src/projects/projects.service.spec.ts`; `apps/backend/src/feature-flags/feature-flags.service.spec.ts`; `apps/backend/src/flag-rules/flag-rules.service.spec.ts` | Keep as evidence. |
| Missing actor rejected for mutations | Covered | `apps/backend/src/common/guards/actor-required.guard.spec.ts`; `apps/backend/test/phase-5-management.e2e-spec.ts`; management service specs | Keep as evidence. |
| Unsupported sort/filter rejected safely | Covered | Project, feature flag, flag rules, sample users, and audit log service specs | Keep as evidence. |
| Project audit writes | Covered | `apps/backend/src/projects/projects.service.spec.ts`; `apps/backend/test/phase-5-management.e2e-spec.ts`; `apps/backend/test/integration/phase-5-management.integration-spec.ts` | Keep as evidence. |
| Feature flag audit writes | Covered | `apps/backend/src/feature-flags/feature-flags.service.spec.ts`; `apps/backend/test/phase-5-management.e2e-spec.ts`; `apps/backend/test/integration/phase-5-management.integration-spec.ts` | Keep as evidence. |
| Rule replacement audit writes | Covered | `apps/backend/src/flag-rules/flag-rules.service.spec.ts`; `apps/backend/test/phase-5-management.e2e-spec.ts`; `apps/backend/test/integration/phase-5-management.integration-spec.ts`; Phase 6 E2E | Keep as evidence. |
| Same-transaction audit behavior | Covered | Service specs verify audit calls use transaction clients; `apps/backend/test/integration/phase-5-management.integration-spec.ts` includes rollback when audit logging fails. | Keep as evidence. |
| Append-only audit behavior | Partially covered | There are create-only audit service flows and audit retrieval tests. No update/delete audit API exists in the app surface. | Document explicitly in `docs/release/security-review.md` or a release audit note. |

## Test Files by Responsibility

### Evaluation engine and data-plane behavior

- `apps/backend/src/evaluation/engine/evaluation-engine.spec.ts`
- `apps/backend/src/evaluation/engine/stable-rollout-hash.spec.ts`
- `apps/backend/src/evaluation/evaluation.service.spec.ts`
- `apps/backend/src/evaluation/evaluation.repository.spec.ts`
- `apps/backend/test/integration/phase-4-evaluation.integration-spec.ts`

### API validation, pagination, and error shape

- `apps/backend/src/common/filters/api-exception.filter.spec.ts`
- `apps/backend/src/common/dto/key-param.dto.spec.ts`
- `apps/backend/src/common/dto/page-response.dto.spec.ts`
- `apps/backend/src/common/dto/pagination-query.dto.spec.ts`
- `apps/backend/src/common/dto/time-range-query.dto.spec.ts`
- `apps/backend/test/integration/phase-3-foundation.integration-spec.ts`

### Management API and audit behavior

- `apps/backend/src/projects/projects.service.spec.ts`
- `apps/backend/src/feature-flags/feature-flags.service.spec.ts`
- `apps/backend/src/flag-rules/flag-rules.service.spec.ts`
- `apps/backend/src/sample-users/sample-users.service.spec.ts`
- `apps/backend/src/audit/audit-log.service.spec.ts`
- `apps/backend/src/audit-logs/audit-logs.service.spec.ts`
- `apps/backend/test/phase-5-management.e2e-spec.ts`
- `apps/backend/test/phase-6-vertical-slice.e2e-spec.ts`
- `apps/backend/test/integration/phase-5-management.integration-spec.ts`

## Principal Engineer Notes

Do not add tests just to increase file count. For Phase 9, each new test should
answer one release-risk question:

1. Can we demonstrate the same scenarios the presenter will show?
2. Can a risky flag be shut off even if targeting rules match?
3. Do invalid API requests fail consistently and safely?
4. Are mutation and audit writes transactionally tied?
5. Can we explain the evidence quickly during review?

The highest-value next step is a dedicated Phase 9 demo-flow E2E test because
it creates a single, reviewer-friendly proof that the MVP scenario works from
the API level.
