# Phase 9 Release Readiness Checklist

## Purpose

Use this checklist to finish Phase 9 of the implementation roadmap in a
submission-ready way. Phase 9 is a quality, evidence, documentation, and demo
readiness phase. It should protect the required MVP before any optional
recommended-level enhancements are considered.

Primary sources:

- `docs/plan/implementation-roadmap.md`
- `docs/plan/project-goal.md`
- `docs/requirement/requirement-init.md`
- `docs/requirement/info-init.md`
- `AGENTS.md`

Supporting Phase 9 evidence:

- `docs/plan/phase-9-test-coverage-map.md`

Delivery dates:

- Submission deadline: July 7, 2026.
- Presentation: July 9, 2026.

## 1. Test Coverage

### End-to-end demo flow

- [x] Main demo flow is covered by an E2E test.
- [x] Demo flow proves project creation or seeded project availability.
- [x] Demo flow proves flag creation/configuration or seeded flag availability.
- [x] Demo flow proves runtime evaluation through `POST /v1/evaluate`.
- [x] Demo flow proves at least one enabled result.
- [x] Demo flow proves at least one disabled or fallback result.
- [x] Demo flow proves missing project/flag returns `enabled=false` and
      `reason=NOT_FOUND`.

Evidence files:

- `apps/backend/test/phase-6-vertical-slice.e2e-spec.ts`
- `apps/backend/test/phase-9-demo-flow.e2e-spec.ts`

### Evaluation behavior

- [x] Rule order is tested:
  - global disable / kill switch,
  - user allowlist,
  - role targeting,
  - percentage rollout,
  - default off.
- [x] Stable hashing returns the same bucket for the same stable rollout key.
- [x] Kill switch returns off before any targeting rule can enable the flag.
- [x] Missing project or flag returns `enabled=false` with `reason=NOT_FOUND`.
- [x] No matching rule returns `enabled=false` with `reason=DEFAULT_OFF`.
- [x] Percentage rollout uses stable, non-PII targeting keys.

Evidence files:

- `apps/backend/src/evaluation/engine/evaluation-engine.spec.ts`
- `apps/backend/src/evaluation/engine/stable-rollout-hash.spec.ts`
- `apps/backend/src/evaluation/evaluation.service.spec.ts`
- `apps/backend/test/integration/phase-4-evaluation.integration-spec.ts`

### API behavior

- [x] Validation errors have a consistent API error shape.
- [x] Pagination responses include items and page metadata.
- [x] Conflict cases are tested for duplicate project, flag, or rule keys.
- [x] Missing resources return the documented not-found behavior.
- [x] Mutation endpoints require an actor header where audit logging is needed.
- [x] Unsupported sort/filter inputs are rejected safely.

Evidence files:

- `apps/backend/test/phase-9-api-hardening.e2e-spec.ts`
- `apps/backend/test/phase-5-management.e2e-spec.ts`
- `apps/backend/src/common/filters/api-exception.filter.spec.ts`
- `apps/backend/src/common/dto/pagination-query.dto.spec.ts`
- `apps/backend/src/projects/projects.service.spec.ts`
- `apps/backend/src/feature-flags/feature-flags.service.spec.ts`
- `apps/backend/src/flag-rules/flag-rules.service.spec.ts`

### Audit behavior

- [x] Project mutations write audit entries.
- [x] Feature flag mutations write audit entries.
- [x] Rule replacement writes audit entries.
- [x] Audit entries include actor, target, timestamp, request ID, and
      before/after snapshots.
- [x] Audit writes happen in the same transaction as the mutation.
- [x] Audit logs are append-only from the API perspective.

Evidence files:

- `docs/release/audit-log-release-review.md`
- `apps/backend/src/audit/audit-log.service.spec.ts`
- `apps/backend/src/projects/projects.service.spec.ts`
- `apps/backend/src/feature-flags/feature-flags.service.spec.ts`
- `apps/backend/src/flag-rules/flag-rules.service.spec.ts`
- `apps/backend/test/integration/phase-5-management.integration-spec.ts`

## 2. Security Review

- [x] Safe defaults are documented and tested.
- [x] Evaluation errors fail closed.
- [x] Missing project/flag returns off with `NOT_FOUND`.
- [x] Targeting and rollout examples use stable non-PII keys.
- [x] Demo app does not expose database URLs, backend secrets, admin tokens, or
      actor credentials.
- [x] CORS allows only configured admin and demo origins.
- [x] Control-plane operations stay in the admin app/API.
- [x] Demo app remains data-plane only and calls only evaluation behavior.

Recommended evidence file:

- `docs/release/security-review.md`

## 3. Documentation Readiness

### README

- [x] Root README includes install instructions.
- [x] Root README includes environment setup.
- [x] Root README includes database startup instructions.
- [x] Root README includes migration instructions.
- [x] Root README includes seed instructions.
- [x] Root README includes backend, admin, and demo run instructions.
- [x] Root README includes test, lint, build, and diff-check commands.

Evidence file:

- `README.md`

### Demo support

- [x] Demo script explains the presenter flow.
- [x] Demo script includes global toggle behavior.
- [x] Demo script includes role targeting or percentage rollout behavior.
- [x] Demo script includes missing project/flag safe fallback.
- [x] Demo script includes audit-log proof.
- [x] Troubleshooting notes cover database, seed data, CORS, ports, and app
      startup issues.

Recommended evidence files:

- `docs/release/demo-script.md`
- `docs/release/troubleshooting.md`

### Research report and slides

- [x] Research report explains what feature flags are.
- [x] Research report explains deployment vs. release.
- [x] Research report explains release, experiment, ops/kill-switch, and
      permission flags.
- [x] Research report explains rollout strategies.
- [x] Research report explains audit logging, caching, consistency, defaults,
      and endpoint security.
- [x] Research report compares the project with existing solutions.
- [x] Slide outline explains project need, practical value, novelty, chosen
      technologies, alternatives, and comparison with existing solutions.
- [x] Slides make problem-solving, design thinking, and system thinking visible.

Recommended evidence files:

- `docs/research/feature-flag-platform-research-report.md`
- `docs/presentation/slide-outline.md`

## 4. Final Validation Commands

Run the strongest local validation sequence possible before calling Phase 9
complete:

```bash
npm run lint
npm run test
npm run test:integration --workspace=@ffp/backend
npm run test:e2e --workspace=@ffp/backend
npm run build
npm run diff:check
```

If `markdownlint` is installed, also run:

```bash
markdownlint docs/**/*.md README.md AGENTS.md
```

Optional Prisma validation:

```bash
npm run prisma:validate --workspace=@ffp/backend
```

Latest Phase 9 validation result, completed on June 21, 2026:

- [x] `npm run lint`
- [x] `npm run test`
- [x] `npm run test:integration --workspace=@ffp/backend`
  - Required an unrestricted local run because sandboxed execution could not
    connect to local PostgreSQL or bind local test ports.
- [x] `npm run test:e2e --workspace=@ffp/backend`
  - Required an unrestricted local run because Supertest binds local test
    server ports.
- [x] `npm run build`
- [x] `npm run diff:check`
- [x] `npm run prisma:validate --workspace=@ffp/backend`
- [ ] `markdownlint docs/**/*.md README.md AGENTS.md`
  - Not run because `markdownlint` was not installed in the current shell.

## 5. Phase 9 Definition of Done

Phase 9 is done when:

1. The MVP behavior is covered by tests or documented evidence.
2. Evaluation remains deterministic and safe by default.
3. Control-plane and data-plane responsibilities remain separated.
4. Audit logging is demonstrably append-only and transactionally tied to
   mutations.
5. README, demo script, troubleshooting notes, research report, and slide
   outline are ready for review.
6. Final validation commands pass or any remaining failure is documented with a
   clear reason and fix plan.
7. No recommended-level enhancement is added unless the required MVP is already
   stable.
