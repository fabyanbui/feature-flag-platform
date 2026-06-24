# Phase 11 Audit-Backed Configuration History — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a
reference, not a transcript.

## Scope

The session taught and validated Phase 11 of
`docs/plan/recommended-enhancements-roadmap.md`: provide per-flag configuration
history without introducing a second versioning system.

The completed vertical slice covers:

- a paginated control-plane history endpoint,
- audit-backed flag and environment-config filtering,
- backend unit and E2E coverage,
- a responsive admin history panel,
- automatic history refresh after successful rule replacement,
- architecture, API-contract, roadmap, and demo documentation.

## High-signal outcomes

- Added `GET /v1/projects/{projectKey}/flags/{flagKey}/history`.
- Reused append-only `AuditLogEntry` as the single history source of truth.
- Resolved the project and flag before querying history.
- Associated history through immutable feature-flag and flag-config IDs rather
  than relying only on human-readable keys.
- Included flag creation, updates, lifecycle changes, rule replacement, and
  related flag-config events.
- Excluded project, sample-user, unrelated-flag, and runtime evaluation events.
- Used standard offset pagination and stable ordering by `createdAt`, then
  audit-entry ID.
- Reused the existing audit response contract instead of creating a duplicate
  version DTO or frontend model.
- Added a focused history panel near the rule editor with loading, error,
  empty, pagination, refresh, concise summaries, and expandable snapshots.
- Successful rule replacement refreshes history; a secondary history-read
  failure does not change mutation success.
- Added no `FlagConfigVersion` table, revision field, or database migration.

## Files and artifacts

### Backend API and query behavior

- `apps/backend/src/audit-logs/dto/flag-history-query.dto.ts`
  - Restricts sorting to `createdAt`.
  - Inherits pagination and `asc`/`desc` ordering validation.
- `apps/backend/src/audit-logs/flag-history.controller.ts`
  - Exposes the read-only history endpoint.
  - Reuses `ProjectFlagKeyParamDto` and does not require `X-Actor`.
- `apps/backend/src/audit-logs/flag-history.controller.spec.ts`
  - Verifies controller delegation.
- `apps/backend/src/audit-logs/audit-logs.module.ts`
  - Registers `FlagHistoryController`.
- `apps/backend/src/audit-logs/audit-logs.service.ts`
  - Resolves project and flag.
  - Builds the immutable-ID history scope.
  - Returns the standard paginated audit response.
- `apps/backend/src/repositories/audit-logs.repository.ts`
  - Accepts single- or multi-column Prisma ordering.
- `apps/backend/src/audit-logs/audit-logs.service.spec.ts`
  - Covers missing resources, query scope, ordering, response preservation, and
    pagination boundaries.
- `apps/backend/test/phase-11-flag-history.e2e-spec.ts`
  - Proves flag creation, configuration update, and rule replacement appear
    through the HTTP endpoint.
  - Covers isolation, pagination, validation, and `NOT_FOUND`.

### Admin dashboard

- `apps/admin/src/lib/api.ts`
  - Adds typed `ListFlagHistoryQuery` and `listFlagHistory()`.
- `apps/admin/src/components/FlagHistoryPanel.tsx`
  - Displays per-flag audit history and concise change summaries.
  - Supports refresh and loading older entries.
  - Reuses semantic `<time>` and `<details>` elements.
- `apps/admin/src/pages/RuleEditorPage.tsx`
  - Places history beside the configuration workflow.
  - Refreshes history after successful rule replacement.
- `apps/admin/src/App.tsx`
  - Connects the panel to the existing project-wide audit-log screen.
- `apps/admin/src/App.css`
  - Adds responsive pagination styling while reusing existing audit cards,
    panels, metadata lists, and snapshot styles.

### Durable documentation

- `docs/design/mvp-api-and-contracts.md`
  - Authoritative endpoint, pagination, history scope, errors, and initial
    implementation boundary.
- `docs/design/software-architecture-document.md`
  - Defines history as a read-only control-plane projection over audit logs.
- `docs/plan/recommended-enhancements-roadmap.md`
  - Records Phase 11 completion evidence.
- `docs/release/demo-script.md`
  - Adds a presentation flow for focused flag history and project-wide audit
    logs.

## Decisions and guardrails

- Audit logs remain append-only and authoritative.
- Configuration mutations continue writing their audit records in the same
  transaction; Phase 11 adds only a read projection.
- History is a control-plane concern and does not participate in data-plane
  evaluation.
- Human-readable keys are display fields, not the primary ownership link.
- Rule replacement is included because `FLAG_RULES_REPLACED` targets the owning
  feature flag.
- Future granular flag-rule events must retain an immutable association with
  the owning feature flag.
- The history endpoint uses management-style `404 NOT_FOUND` and
  `400 VALIDATION_ERROR`; it must not return an evaluation-shaped fallback.
- Read requests do not send or require `X-Actor`.
- Required MVP stability, deterministic evaluation, safe defaults, non-PII
  rollout keys, and status/runtime-state separation remain unchanged.

## Validation and caveats

Final validation completed:

- backend unit tests: 29 suites, 226 tests passed,
- backend E2E tests: 6 suites, 21 tests passed,
- backend, admin, and demo builds passed,
- admin lint passed,
- Prisma schema validation passed,
- `git diff --check` passed,
- browser validation was reported complete for desktop, tablet, mobile,
  keyboard interaction, save-refresh behavior, loading, and error states.

The first focused E2E attempt failed because the sandbox blocked a local test
server socket with `listen EPERM`. Running the same test with approved local
socket/database access passed; this was an execution-environment limitation,
not an application defect.

No schema migration was required. Do not add a revision field retroactively
unless a later cache-invalidation or concurrency requirement provides a
concrete justification.

## Best reusable next prompt

> Phase 11 audit-backed configuration history is complete. Use `AGENTS.md`,
> `docs/plan/recommended-enhancements-roadmap.md`, and
> `docs/codex/reference/phase-11-audit-backed-configuration-history.md` as
> context. Teach me Phase 12 — Group Kill Switch step by step, starting with
> the scope, membership decision, evaluation precedence, data model, and API
> contract. Preserve deterministic evaluation, same-transaction audit logging,
> environment-specific group state, and the Gate A requirements. Do not start
> cache work.

## Source notes

- Source: the current Codex conversation covering Phase 11 implementation and
  validation.
- Repository guardrails: `AGENTS.md`.
- Product source: `docs/requirement/requirement-init.md`.
- Delivery and evaluation source: `docs/requirement/info-init.md`.
- Active goal: `docs/plan/project-goal.md`.
- Phase plan: `docs/plan/recommended-enhancements-roadmap.md`.
