# Phase 12 Group Kill Switch — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a
reference, not a transcript.

## Scope

This session implemented and hardened Phase 12 of
`docs/plan/recommended-enhancements-roadmap.md`: an environment-specific group
kill switch for project-wide feature-flag groups.

The completed vertical slice includes:

- architecture and REST API contracts,
- Prisma models, migration, repositories, and seed data,
- transactional management APIs and append-only audit logging,
- deterministic data-plane evaluation with `GROUP_KILL_SWITCH`,
- admin group management and flag assignment,
- unit, integration, and E2E tests,
- presentation and troubleshooting documentation,
- final Gate A domain review.

## High-signal outcomes

- Added project-scoped `FlagGroup` identity and environment-specific
  `FlagGroupConfig.killSwitch` state.
- Stored optional, project-wide one-group-per-flag membership on
  `FeatureFlag.groupId`; many-to-many and environment-varying membership were
  intentionally rejected.
- Added management endpoints:
  - `GET /v1/projects/{projectKey}/groups`
  - `POST /v1/projects/{projectKey}/groups`
  - `PATCH /v1/projects/{projectKey}/groups/{groupKey}`
  - `PUT /v1/projects/{projectKey}/groups/{groupKey}/config`
  - `PUT /v1/projects/{projectKey}/flags/{flagKey}/group`
  - `DELETE /v1/projects/{projectKey}/flags/{flagKey}/group`
- Group creation initializes an inactive configuration for every existing
  project environment. This prevents project-wide assignment from introducing
  missing group state outside the default environment.
- Evaluation snapshots include optional group state. The terminal precedence is:

  ```text
  FLAG_ARCHIVED
  -> FLAG_DISABLED
  -> GROUP_KILL_SWITCH
  -> KILL_SWITCH
  -> GLOBAL_ON
  -> ordered enabled rules
  -> DEFAULT_OFF
  ```

- Missing expected group configuration is invalid persisted state and fails
  closed with `enabled=false` and `reason=ERROR`.
- Group creation, rename, switch changes, assignment, reassignment, and
  unassignment use the existing transaction and append-only audit model.
- A group switch mutation creates one group audit entry and does not fabricate
  per-flag mutation entries.
- Idempotent group assignments, renames, and switch updates do not write
  misleading duplicate audit events.
- The admin dashboard separates lifecycle/configuration status from runtime
  `On`/`Off`; an active group switch displays runtime `Off` without changing
  the flag's lifecycle status.
- Seed data now includes group `customer-experience`, with `beta-dashboard` and
  `new-checkout` assigned and all seeded environment switches inactive.
- Phase 12 is marked complete and Gate A is recorded as passed.

## Files and artifacts

### Data model and persistence

- `apps/backend/prisma/schema.prisma`
- `apps/backend/prisma/migrations/20260624000000_add_flag_groups/migration.sql`
- `apps/backend/prisma/seed.ts`
- `apps/backend/src/repositories/flag-groups.repository.ts`
- `apps/backend/src/repositories/flag-group-configs.repository.ts`
- `apps/backend/src/repositories/feature-flags.repository.ts`
- `apps/backend/src/repositories/environments.repository.ts`
- Corresponding repository specifications under
  `apps/backend/src/repositories/*.spec.ts`

### Management API and audit behavior

- `apps/backend/src/flag-groups/`
  - DTOs, controllers, module, service, and specifications.
- `apps/backend/src/feature-flags/dto/feature-flag-response.dto.ts`
- `apps/backend/src/feature-flags/feature-flags.service.ts`
- `apps/backend/src/common/dto/key-param.dto.ts`
- `apps/backend/src/app.module.ts`
- `apps/backend/test/phase-12-group-kill-switch.e2e-spec.ts`

The creation audit metadata includes `initializedEnvironmentCount`. Group
switch audit metadata includes `affectedFlagCount`.

### Evaluation data plane

- `apps/backend/src/evaluation/engine/evaluation.types.ts`
- `apps/backend/src/evaluation/engine/evaluation-engine.ts`
- `apps/backend/src/evaluation/engine/evaluation-engine.spec.ts`
- `apps/backend/src/evaluation/evaluation.repository.ts`
- `apps/backend/src/evaluation/evaluation.repository.spec.ts`
- `apps/backend/src/evaluation/evaluation.service.spec.ts`

The evaluation repository loads reusable persisted configuration only. It does
not cache or store user-specific final decisions.

### Admin dashboard

- `apps/admin/src/pages/FlagGroupPage.tsx`
- `apps/admin/src/pages/FlagForm.tsx`
- `apps/admin/src/pages/FlagListPage.tsx`
- `apps/admin/src/components/ConfirmDialog.tsx`
- `apps/admin/src/lib/api.ts`
- `apps/admin/src/lib/types.ts`
- `apps/admin/src/lib/status.ts`
- `apps/admin/src/App.tsx`
- `apps/admin/src/App.css`

The Groups page supports creation, rename, assigned-flag counts, switch state,
and confirmed activation/deactivation. Flag forms support assignment and
unassignment.

### Durable documentation

- `docs/design/software-architecture-document.md`
- `docs/design/mvp-api-and-contracts.md`
- `docs/plan/recommended-enhancements-roadmap.md`
- `docs/release/demo-script.md`
- `docs/release/troubleshooting.md`
- `README.md`

The design documents freeze the Phase 13 cache invalidation contract:

| Mutation | Future invalidation |
| --- | --- |
| Assign, reassign, or unassign flag | That flag in every environment |
| Toggle group switch | Every assigned flag in the affected environment |
| Create or rename group | No evaluation invalidation |

Invalidation must occur only after the mutation transaction commits.

## Decisions and guardrails

- Required MVP stability remains higher priority than later recommended
  enhancements.
- Group identity and environment runtime state remain separate models.
- Group keys are immutable and unique within a project.
- Group deletion remains deferred to avoid ambiguous membership and historical
  audit behavior.
- Cross-project membership is blocked by composite foreign keys and
  project-scoped API lookup.
- Switches default to inactive and missing required group state fails closed.
- Evaluation remains deterministic; stable non-PII identifiers remain required
  for targeting and rollout.
- Control-plane group management remains separate from data-plane evaluation.
- Audit snapshots contain stable resource keys and configuration state, not
  secrets or unnecessary user data.
- Cache work was intentionally not implemented during Phase 12. Only its
  invalidation requirements were documented.
- The user requested that later checks avoid Playwright MCP and the frontend
  UI skill because of token cost. Do not use Playwright unless requested again.

## Validation and caveats

Final Phase 12 validation completed:

- backend unit tests: 37 suites and 273 tests passed,
- backend integration tests: 3 suites and 11 tests passed,
- backend E2E tests: 7 suites and 24 tests passed,
- focused Phase 12 E2E tests: 3 tests passed,
- backend, admin, and demo builds passed,
- backend, admin, and demo lint passed,
- Prisma schema validation passed,
- the idempotent seed ran twice successfully,
- read-only database verification confirmed two assigned flags, inactive group
  switches in production, staging, and development, and unique seed audits,
- `git diff --check` passed.

The PostgreSQL test driver emitted a non-failing deprecation warning about
calling `client.query()` while another query is executing. This did not affect
test results but can be investigated separately before upgrading to `pg` 9.

`markdownlint` was not installed, so Markdown linting was skipped. Final Step
10 validation intentionally did not use Playwright. The existing user change in
`.codex/config.toml` was not modified by Phase 12 work.

## Best reusable next prompt

> Phase 12 and Gate A are complete. Use `AGENTS.md`,
> `docs/plan/recommended-enhancements-roadmap.md`,
> `docs/design/software-architecture-document.md`,
> `docs/design/mvp-api-and-contracts.md`, and
> `docs/codex/reference/phase-12-group-kill-switch.md` as context. Teach and
> implement Phase 13 — In-Memory Evaluation-Snapshot Cache step by step,
> starting with the cache interface, key, bounded eviction policy, TTL,
> observability, and after-commit invalidation boundaries. Cache reusable
> snapshots only, never user-specific final decisions. Preserve deterministic
> evaluation, safe failures, append-only audit logging, and all Gate A
> contracts. Do not use Playwright unless I explicitly re-enable it.

## Source notes

- Source: the current Codex conversation covering Phase 12 Steps 1–10.
- Repository guardrails: `AGENTS.md`.
- Product source: `docs/requirement/requirement-init.md`.
- Delivery and evaluation source: `docs/requirement/info-init.md`.
- Active goal: `docs/plan/project-goal.md`.
- Phase plan: `docs/plan/recommended-enhancements-roadmap.md`.
- Prior context:
  `docs/codex/reference/phase-11-audit-backed-configuration-history.md`.
