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

- [ ] Main demo flow is covered by an E2E test.
- [ ] Demo flow proves project creation or seeded project availability.
- [ ] Demo flow proves flag creation/configuration or seeded flag availability.
- [ ] Demo flow proves runtime evaluation through `POST /v1/evaluate`.
- [ ] Demo flow proves at least one enabled result.
- [ ] Demo flow proves at least one disabled or fallback result.
- [ ] Demo flow proves missing project/flag returns `enabled=false` and
      `reason=NOT_FOUND`.

Evidence files:

- `apps/backend/test/phase-6-vertical-slice.e2e-spec.ts`
- `apps/backend/test/phase-9-demo-flow.e2e-spec.ts` if additional coverage is
  needed.

### Evaluation behavior

- [ ] Rule order is tested:
  - global disable / kill switch,
  - user allowlist,
  - role targeting,
  - percentage rollout,
  - default off.
- [ ] Stable hashing returns the same bucket for the same stable rollout key.
- [ ] Kill switch returns off before any targeting rule can enable the flag.
- [ ] Missing project or flag returns `enabled=false` with `reason=NOT_FOUND`.
- [ ] No matching rule returns `enabled=false` with `reason=DEFAULT_OFF`.
- [ ] Percentage rollout uses stable, non-PII targeting keys.

Evidence files:

- `apps/backend/src/evaluation/engine/evaluation-engine.spec.ts`
- `apps/backend/src/evaluation/engine/stable-rollout-hash.spec.ts`
- `apps/backend/src/evaluation/evaluation.service.spec.ts`
- `apps/backend/test/integration/phase-4-evaluation.integration-spec.ts`

### API behavior

- [ ] Validation errors have a consistent API error shape.
- [ ] Pagination responses include items and page metadata.
- [ ] Conflict cases are tested for duplicate project, flag, or rule keys.
- [ ] Missing resources return the documented not-found behavior.
- [ ] Mutation endpoints require an actor header where audit logging is needed.
- [ ] Unsupported sort/filter inputs are rejected safely.

Evidence files:

- `apps/backend/test/phase-5-management.e2e-spec.ts`
- `apps/backend/src/common/filters/api-exception.filter.spec.ts`
- `apps/backend/src/common/dto/pagination-query.dto.spec.ts`
- `apps/backend/src/projects/projects.service.spec.ts`
- `apps/backend/src/feature-flags/feature-flags.service.spec.ts`
- `apps/backend/src/flag-rules/flag-rules.service.spec.ts`

### Audit behavior

- [ ] Project mutations write audit entries.
- [ ] Feature flag mutations write audit entries.
- [ ] Rule replacement writes audit entries.
- [ ] Audit entries include actor, target, timestamp, request ID, and
      before/after snapshots.
- [ ] Audit writes happen in the same transaction as the mutation.
- [ ] Audit logs are append-only from the API perspective.

Evidence files:

- `apps/backend/src/audit/audit-log.service.spec.ts`
- `apps/backend/src/projects/projects.service.spec.ts`
- `apps/backend/src/feature-flags/feature-flags.service.spec.ts`
- `apps/backend/src/flag-rules/flag-rules.service.spec.ts`
- `apps/backend/test/integration/phase-5-management.integration-spec.ts`

## 2. Security Review

- [ ] Safe defaults are documented and tested.
- [ ] Evaluation errors fail closed.
- [ ] Missing project/flag returns off with `NOT_FOUND`.
- [ ] Targeting and rollout examples use stable non-PII keys.
- [ ] Demo app does not expose database URLs, backend secrets, admin tokens, or
      actor credentials.
- [ ] CORS allows only configured admin and demo origins.
- [ ] Control-plane operations stay in the admin app/API.
- [ ] Demo app remains data-plane only and calls only evaluation behavior.

Recommended evidence file:

- `docs/release/security-review.md`

## 3. Documentation Readiness

### README

- [ ] Root README includes install instructions.
- [ ] Root README includes environment setup.
- [ ] Root README includes database startup instructions.
- [ ] Root README includes migration instructions.
- [ ] Root README includes seed instructions.
- [ ] Root README includes backend, admin, and demo run instructions.
- [ ] Root README includes test, lint, build, and diff-check commands.

Evidence file:

- `README.md`

### Demo support

- [ ] Demo script explains the presenter flow.
- [ ] Demo script includes global toggle behavior.
- [ ] Demo script includes role targeting or percentage rollout behavior.
- [ ] Demo script includes missing project/flag safe fallback.
- [ ] Demo script includes audit-log proof.
- [ ] Troubleshooting notes cover database, seed data, CORS, ports, and app
      startup issues.

Recommended evidence files:

- `docs/release/demo-script.md`
- `docs/release/troubleshooting.md`

### Research report and slides

- [ ] Research report explains what feature flags are.
- [ ] Research report explains deployment vs. release.
- [ ] Research report explains release, experiment, ops/kill-switch, and
      permission flags.
- [ ] Research report explains rollout strategies.
- [ ] Research report explains audit logging, caching, consistency, defaults,
      and endpoint security.
- [ ] Research report compares the project with existing solutions.
- [ ] Slide outline explains project need, practical value, novelty, chosen
      technologies, alternatives, and comparison with existing solutions.
- [ ] Slides make problem-solving, design thinking, and system thinking visible.

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
