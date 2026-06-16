# Implementation Roadmap

This roadmap prioritizes an MVP that proves the full feature-flag loop:
configure a flag in the control plane, persist it safely, evaluate it
deterministically in the data plane, and demonstrate the result in a demo app.

The roadmap is derived from `docs/requirement/requirement-init.md`,
`docs/requirement/info-init.md`, and the active goal in
`docs/plan/project-goal.md`. Required-level deliverables come before
recommended enhancements.

## Phase 0 — MVP scope and contracts

- Confirm requirement traceability from `docs/requirement/requirement-init.md`
  and `docs/requirement/info-init.md` into goal, vision, plan, architecture,
  API, UI, and presentation docs.
- Confirm `/v1` API base path and JSON request/response conventions.
- Define evaluation request and response contracts.
- Define consistent error response shape and error codes.
- Define reason codes, including `NOT_FOUND` and `DEFAULT_OFF`.
- Define MVP rule types and default evaluation order:
  1. Global disable
  2. User allowlist
  3. Role targeting
  4. Percentage rollout
  5. Default off
- Define key validation rules for `projectKey` and `flagKey`.
- Define pagination and filtering conventions for list endpoints.
- Define audit log event shape, including actor, timestamp, target, action,
  before snapshot, and after snapshot.

## Phase 1 — Project scaffold and local workflow

- Backend app using NestJS.
- Admin app.
- Demo app.
- Shared TypeScript config.
- Local environment configuration.
- PostgreSQL local setup.
- README quickstart commands.

## Phase 2 — Data model and migrations

- Prisma schema.
- PostgreSQL config.
- Projects table.
- Feature flags table.
- Flag rules table.
- Sample user contexts table.
- Audit log entries table.
- Foreign keys and uniqueness constraints.
- Append-only audit log constraints.
- Initial migration.
- Seed data for demo scenarios.

## Phase 3 — Backend foundation

- Validation pipeline and DTO boundaries.
- Consistent error response handling.
- Swagger/OpenAPI setup.
- Transaction helper for mutation flows.
- Audit logging service.
- Repository/data-access layer.
- Correlation ID or request context support for logs.

## Phase 4 — Evaluation engine and data-plane API

- Rule model.
- Rule order implementation.
- Stable percentage rollout hashing.
- Safe default-off behavior.
- `NOT_FOUND` behavior for missing project or flag.
- Reason code mapping.
- `POST /v1/evaluate`.
- Unit tests for deterministic evaluation.

## Phase 5 — Management APIs with transactional audit logging

- Projects API.
- Feature flags API.
- Rules API.
- Sample users API.
- Audit logs API.
- Same-transaction audit writes for project, flag, and rule mutations.
- Before/after snapshots for audited mutations.
- Audit query filters by project, flag/target, actor, and time range.
- Pagination and filtering for list endpoints.
- Integration tests for validation, conflicts, and audit writes.

## Phase 6 — Early vertical slice

- Create a demo project.
- Create a feature flag.
- Configure at least one rule.
- Evaluate the flag through `/v1/evaluate`.
- Display the result in the demo app.
- Verify audit entries are written for setup mutations.
- Use the slice to validate API contracts before expanding UI scope.

**Phase 6 validation note:** The early vertical slice is covered by
`apps/backend/test/phase-6-vertical-slice.e2e-spec.ts` and the demo app now
calls `/v1/evaluate` to display `projectKey`, `flagKey`, `enabled`, and
`reason` for beta-tester and regular-user contexts.

## Phase 7 — Admin UI

- Project list.
- Flag list.
- Flag create/edit.
- Rule editor.
- Audit log page.
- Loading, empty, error, and confirmation states.
- Clear distinction between feature flag status labels
  (`Enabled`/`Disabled`/`Archived`) and runtime state (`On`/`Off`).
- Accessible, text-backed status indicators.

## Phase 8 — Demo app

- Evaluation panel.
- Global toggle scenario.
- Role targeting scenario.
- Percentage rollout scenario.
- Missing project/flag scenario showing `enabled=false` and `reason=NOT_FOUND`.
- Loading/error states with retry.
- Demo-safe defaults with no browser-exposed secrets.

**Phase 8 validation note:** The demo app now provides scenario-based
evaluation for global toggle, role targeting, deterministic percentage rollout
included/excluded users, and missing project/flag fallback. It displays
`projectKey`, `flagKey`, `enabled`, `reason`, targeting context, loading/error
states, and retry behavior while keeping the demo app data-plane only with no
browser-exposed secrets.

## Phase 9 — Quality review and release readiness

- End-to-end test coverage for the main demo flow.
- Evaluation tests for rule order, stable hashing, kill switch, `NOT_FOUND`,
  and default off.
- API tests for validation, pagination, error shapes, and conflicts.
- Audit tests for same-transaction writes and append-only behavior.
- Security review for safe defaults, non-PII targeting keys, CORS, and browser
  exposure.
- README completion with install, migration, seed, run, and test commands.
- Demo script and troubleshooting notes.
- Presentation notes and slides explaining project need, practical value,
  novelty, technology choices, alternatives, and comparison with existing
  solutions.
- Research report polish; slides and report are required final artifacts.
- Notes that make problem-solving, design thinking, and system thinking visible
  in architecture choices, tradeoffs, and demo flow.
- Review any recommended-level requirement only after required MVP stability;
  recommended-level completion is a plus, not a reason to risk MVP delivery.
- Final validation with `git diff --check`.
- Run `markdownlint docs/**/*.md README.md AGENTS.md` if available.
