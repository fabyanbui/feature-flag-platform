# Pre-Phase 6 Backend Unit Tests — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a reference, not a transcript.

## Scope

This session guided and validated a step-by-step backend unit-test push for the
feature flag platform before Phase 6 vertical-slice work. The work followed
`docs/testing/pre-phase-6-backend-unit-test-plan.md` and the repo guardrails in
`AGENTS.md`: deterministic evaluation, safe defaults, stable non-PII rollout
keys, append-only audit logging, same-transaction audit writes, and clear
control-plane/data-plane separation.

The user implemented each step while Codex supplied the test structure, then
Codex fixed lint/test-quality issues at the end.

## High-signal outcomes

- Expanded backend unit coverage from the existing scaffold/evaluation engine
  tests to a broad pre-Phase 6 unit suite.
- Confirmed the final unit suite passes with:

  ```bash
  npm run test --workspace=@ffp/backend -- --runInBand
  ```

  Final observed result: 28 test suites passed, 198 tests passed.

- Cleaned lint errors and warnings so this command runs cleanly:

  ```bash
  npm run lint --workspace=@ffp/backend
  ```

- Confirmed whitespace validation passes:

  ```bash
  git diff --check
  ```

- Added or validated coverage for:
  - Phase 5 management service behavior.
  - Same-transaction audit logging for mutations.
  - Rule replacement validation and audit snapshots.
  - Evaluation service fail-closed behavior.
  - Evaluation repository snapshot query shape.
  - Request context, exception filtering, DTO validation, and transaction helper.
  - Thin controller delegation tests.

## Files and artifacts

Primary unit-test files created or completed under `apps/backend/src/`:

```text
apps/backend/src/audit-logs/audit-logs.controller.spec.ts
apps/backend/src/audit-logs/audit-logs.service.spec.ts
apps/backend/src/audit/audit-log.service.spec.ts
apps/backend/src/common/dto/key-param.dto.spec.ts
apps/backend/src/common/dto/page-response.dto.spec.ts
apps/backend/src/common/dto/pagination-query.dto.spec.ts
apps/backend/src/common/dto/time-range-query.dto.spec.ts
apps/backend/src/common/errors/api-exception.helpers.spec.ts
apps/backend/src/common/filters/api-exception.filter.spec.ts
apps/backend/src/common/guards/actor-required.guard.spec.ts
apps/backend/src/common/middleware/request-context.middleware.spec.ts
apps/backend/src/common/request-context/request-context.service.spec.ts
apps/backend/src/common/utils/audit-snapshot.util.spec.ts
apps/backend/src/database/transaction.service.spec.ts
apps/backend/src/evaluation/evaluation.controller.spec.ts
apps/backend/src/evaluation/evaluation.repository.spec.ts
apps/backend/src/evaluation/evaluation.service.spec.ts
apps/backend/src/feature-flags/feature-flags.controller.spec.ts
apps/backend/src/feature-flags/feature-flags.service.spec.ts
apps/backend/src/flag-rules/flag-rules.controller.spec.ts
apps/backend/src/flag-rules/flag-rules.service.spec.ts
apps/backend/src/projects/projects.controller.spec.ts
apps/backend/src/projects/projects.service.spec.ts
apps/backend/src/sample-users/sample-users.controller.spec.ts
apps/backend/src/sample-users/sample-users.service.spec.ts
```

Existing tests retained and kept green:

```text
apps/backend/src/app.controller.spec.ts
apps/backend/src/evaluation/engine/evaluation-engine.spec.ts
apps/backend/src/evaluation/engine/stable-rollout-hash.spec.ts
```

Source and tooling files adjusted during final lint cleanup:

```text
apps/backend/eslint.config.mjs
apps/backend/src/common/guards/actor-required.guard.ts
apps/backend/src/common/utils/audit-snapshot.util.ts
apps/backend/src/feature-flags/feature-flags.service.ts
apps/backend/src/flag-rules/flag-rules.service.ts
apps/backend/test/app.e2e-spec.ts
apps/backend/test/create-e2e-app.ts
apps/backend/test/database-test-utils.ts
apps/backend/test/phase-5-management.e2e-spec.ts
```

## Decisions and guardrails

- Unit tests live under `apps/backend/src/**/*.spec.ts` because the backend Jest
  config uses `rootDir: "src"`; e2e/integration tests remain under
  `apps/backend/test/`.
- Unit tests mock repositories, transaction clients, services, Prisma, and
  request context. They do not bind HTTP servers or use real PostgreSQL.
- Controller specs are intentionally thin: only service delegation and parameter
  passing are tested there.
- Service specs carry the important behavior checks:
  - actor required before mutation;
  - duplicate resources return `CONFLICT`;
  - missing resources return `NOT_FOUND`;
  - invalid sort/rule/context inputs return `VALIDATION_ERROR`;
  - mutation repositories and `AuditLogService.record` receive the same `tx`;
  - before/after audit snapshots are asserted for mutation flows.
- `FeatureFlagsService` tests keep lifecycle/config status distinct from runtime
  evaluation `enabled` state.
- `FlagRulesService` tests protect rule validation for user allowlists, role
  targeting, percentage rollout, duplicate priorities, and unsupported rule
  types before persistence starts.
- DTO specs that use decorators/class-transformer need:

  ```ts
  import 'reflect-metadata';
  ```

- `EvaluationService` error-path tests should spy on `Logger.prototype.error`
  to suppress expected fail-closed log noise and assert request ID logging.
- ESLint test overrides were scoped to spec/e2e files for strict test ergonomics:
  `no-unsafe-assignment`, `no-unsafe-call`, `no-unsafe-member-access`,
  `no-unsafe-return`, and `require-await` are disabled only for
  `src/**/*.spec.ts` and `test/**/*.ts`.

## Validation and caveats

Validated successfully during the session:

```bash
npm run test --workspace=@ffp/backend -- --runInBand
npm run lint --workspace=@ffp/backend
git diff --check
```

Coverage command was recommended as part of the final quality gate:

```bash
npm run test --workspace=@ffp/backend -- --coverage --runInBand
```

Known caveats:

- These are unit tests, not database integration tests. They prove service
  behavior, query shapes, and transaction-client propagation, but not real
  PostgreSQL constraints, migrations, or Prisma runtime behavior.
- E2E tests still depend on the configured test database/environment and should
  be handled under the pre-Phase 6 integration-test plan.
- `cleanDatabase` in `apps/backend/test/database-test-utils.ts` remains a no-op
  by design because audit logs are append-only and e2e tests isolate with unique
  project keys.

## Best reusable next prompt

Continue from the completed pre-Phase 6 backend unit-test suite. Use
`docs/testing/pre-phase-6-backend-integration-test-plan.md` and inspect the
current `apps/backend/test/*.ts` e2e files. Help me run and harden the pre-Phase
6 backend integration/e2e tests professionally, preserving append-only audit
logging, same-transaction mutation/audit behavior, deterministic evaluation,
`NOT_FOUND` fail-closed evaluation responses, and safe non-PII targeting keys.
Start by checking the existing e2e test setup, database assumptions, and the
minimum commands needed to validate it.

## Source notes

- Source was the current visible Codex conversation, not a raw local session log.
- Main plan source: `docs/testing/pre-phase-6-backend-unit-test-plan.md`.
- Next likely plan source: `docs/testing/pre-phase-6-backend-integration-test-plan.md`.
- Repo guardrails: `AGENTS.md`.
- Relevant skills used in-session included API design, audit logging, rule
  evaluation, security defaults, UI status semantics, and workflow quality
  review.
