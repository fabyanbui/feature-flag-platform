# Pre-Phase 6 Backend Integration Tests — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a
reference, not a transcript.

## Scope

This session guided the implementation of the pre-Phase 6 backend integration
test suite described by
`docs/testing/pre-phase-6-backend-integration-test-plan.md`.

The work focused on proving that Phase 5 management APIs and Phase 4 evaluation
behavior are correctly wired through real Nest providers, Prisma, PostgreSQL,
transactions, and audit logging before starting the Phase 6 vertical slice.

The session intentionally kept existing e2e tests intact and added a separate
integration-test lane.

## High-signal outcomes

- Added a dedicated integration Jest config and npm script.
- Added shared integration helpers for real `AppModule` bootstrapping,
  deterministic run IDs, and service-level request context.
- Added Phase 5 service-level integration tests for:
  - project creation,
  - default `production` environment creation,
  - `PROJECT_CREATED` audit row persistence,
  - feature flag creation,
  - safe default flag config,
  - `FEATURE_FLAG_CREATED` audit row persistence,
  - rule replacement,
  - old rule removal,
  - new rule persistence,
  - `FLAG_RULES_REPLACED` before/after audit snapshots,
  - rollback when audit logging fails.
- Added Phase 4 service-level integration tests for:
  - missing project evaluation returning `NOT_FOUND`,
  - missing flag evaluation returning `NOT_FOUND`,
  - persisted `ROLE_TARGETING` rule returning `ROLE_MATCH`,
  - persisted `PERCENTAGE_ROLLOUT` rule evaluating deterministically.
- Added focused app-level infrastructure tests for:
  - request ID middleware,
  - error response request IDs,
  - DTO validation shape,
  - HTTP `200` evaluation-shaped `NOT_FOUND`.

## Files and artifacts

Created or updated:

- `apps/backend/package.json`
  - Added `test:integration`.
- `apps/backend/test/jest-integration.json`
  - Runs `*.integration-spec.ts` files.
  - `--runInBand` is intentionally kept in the npm script, not in the Jest
    config file.
- `apps/backend/test/integration/integration-test-helpers.ts`
  - `createIntegrationTestingModule()`.
  - `createUniqueRunId()`.
  - `withRequestContext()`.
- `apps/backend/test/integration/phase-3-foundation.integration-spec.ts`
  - Focused app-level middleware, validation, and evaluation response checks.
- `apps/backend/test/integration/phase-4-evaluation.integration-spec.ts`
  - Service-level persisted evaluation checks.
- `apps/backend/test/integration/phase-5-management.integration-spec.ts`
  - Service-level management, audit, and rollback checks.

Existing e2e tests were preserved:

- `apps/backend/test/app.e2e-spec.ts`
- `apps/backend/test/phase-5-management.e2e-spec.ts`
- `apps/backend/test/create-e2e-app.ts`

## Decisions and guardrails

- Keep integration tests separate from unit and e2e tests.
- Use real backend providers and real database persistence for integration
  tests.
- Use unique, stable, non-PII test keys instead of deleting audit rows.
- Do not print or commit database URLs or `.env` values.
- Keep audit logs append-only unless using a disposable database.
- Keep management/control-plane tests separate from evaluation/data-plane tests.
- Evaluation missing resources must return a normal evaluation response:

  ```ts
  {
    enabled: false,
    reason: 'NOT_FOUND'
  }
  ```

- Feature flag creation must preserve safe defaults:

  ```text
  status = DISABLED
  servingMode = TARGETED
  killSwitch = false
  ```

- Mutation operations must write audit entries in the same transaction as the
  domain write.
- Rollback was tested by overriding `AuditLogService.record()` to throw and
  verifying that project and environment rows were not persisted.
- Evaluation is data-plane/read-only with respect to audit logging; the
  persisted role-rule evaluation test compares audit counts before and after
  evaluation.

## Validation and caveats

The user reported that the full Step 12 validation passed:

```bash
npm run test:integration --workspace=@ffp/backend
npm run test:e2e --workspace=@ffp/backend
npm run test --workspace=@ffp/backend -- --runInBand
npm run diff:check
```

Important caveats for future work:

- Integration tests require `DATABASE_URL` to point to a dedicated test database
  with migrations applied.
- The current isolation strategy is persistent test database plus unique keys,
  not database deletion or audit-log cleanup.
- If parallel integration testing is added later, use stronger isolation such
  as one disposable database per run or per worker.
- Existing e2e coverage remains useful for HTTP-level user journeys. Do not
  collapse it into the integration suite.

## Best reusable next prompt

Continue from the pre-Phase 6 backend integration suite. Review
`docs/codex/reference/pre-phase-6-backend-integration-tests.md`, then add the
next highest-value integration coverage from
`docs/testing/pre-phase-6-backend-integration-test-plan.md`: sample user
create/delete audit tests, audit log filters by action/actor/time range, schema
constraint smoke tests, or seed-data smoke tests. Preserve append-only audit
logging, unique non-PII keys, deterministic evaluation, safe flag defaults, and
control-plane/data-plane separation.

## Source notes

- Source was the current Codex conversation.
- Main planning source:
  `docs/testing/pre-phase-6-backend-integration-test-plan.md`.
- Broader integration strategy:
  `docs/testing/backend-integration-testing-strategy.md`.
- Relevant repo guardrails:
  `AGENTS.md`.
- Skill used:
  `.agents/skills/codex-session-reference/SKILL.md`.
