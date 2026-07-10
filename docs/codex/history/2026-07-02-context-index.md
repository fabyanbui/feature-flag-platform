# Codex Context History — 2026-07-02

Purpose: compact context for future Codex sessions. Use this as an index, not a transcript.

## Read first

- Active authority: `AGENTS.md`.
- Product and deadline sources:
  - `docs/requirement/requirement-init.md`
  - `docs/requirement/info-init.md`
  - `docs/plan/project-goal.md`
- Submission is due July 7, 2026; presentation is July 9, 2026. Slides and the
  research report remain required final artifacts.
- `docs/plan/implementation-roadmap.md` is the completed MVP regression
  baseline.
- `docs/plan/recommended-enhancements-roadmap.md` is the active source for
  recommended phase completion evidence and Gate A/B/C sequencing.
- Durable Codex context remains under `docs/codex/`, `.codex/`, and
  `.agents/skills/`.
- Latest prior history index present before this update:
  - `docs/codex/history/2026-06-30-context-index.md`
- Current release/demo references to keep in sync:
  - `README.md`
  - `docs/plan/requirement-traceability-matrix.md`
  - `docs/release/demo-script.md`
  - `docs/release/final-recommended-release-review.md`
  - `docs/release/troubleshooting.md`

## Repo guardrails to keep

- Preserve deterministic evaluation, stable percentage hashing, safe defaults,
  and fail-closed `NOT_FOUND` and `ERROR` behavior.
- Authoritative evaluation precedence remains:
  `FLAG_ARCHIVED` -> `FLAG_DISABLED` -> `GROUP_KILL_SWITCH` ->
  `KILL_SWITCH` -> `GLOBAL_ON` -> ordered enabled rules -> `DEFAULT_OFF`.
- Use stable, non-PII rollout keys. The current backend hash is based on
  `projectKey`, `flagKey`, and request `targetingKey`.
- Preserve append-only audit entries with trusted before/after snapshots in the
  same transaction as control-plane mutations.
- Keep server-resolved RBAC authoritative; clients must not elevate by spoofing
  actor or role headers.
- Keep management/control-plane concerns separate from runtime evaluation and
  SDK data-plane concerns.
- Keep feature flag lifecycle/configuration status distinct from runtime On/Off
  state.
- Keep Redis optional; the stable demo path must not require Redis.
- Keep `.env.example` aligned with `.env` variable shape using safe placeholders
  only.

## What happened today

- Seven July 2 session logs had `cwd` set to this repository.
- Targeting-key design was clarified:
  - `targetingKey` is per evaluation request, not permanently tied to a user.
  - One flag may roll out by user/account while another rolls out by
    organization.
  - Current demo app chooses the rollout unit in application code; a future
    platform design could move rollout-unit selection into flag configuration.
- Demo app rollout behavior was refactored:
  - `apps/demo/src/App.tsx` added a per-feature rollout-unit map.
  - `live-support-widget` evaluates with organization-level targeting.
  - Other seeded demo features evaluate with user/account targeting.
  - Evaluation still passes user ID, role, and attributes; only `targetingKey`
    controls percentage rollout hashing today.
- Demo account data was simplified and aligned for presentation:
  - customer wording changed to user/account wording while keeping
    `Continue as guest`,
  - demo roles standardized to `shop-admin`, `beta-customer`, and
    `regular-customer`,
  - old standalone beta/regular/admin preview users were removed,
  - redundant fields such as `accountGroup`, expected outcome/reason,
    presenter notes, and title were removed,
  - `organizationName` was added beside existing organization IDs,
  - backend seed rules and admin placeholders were updated to the standardized
    role names.
- Admin rule-editor UI was adjusted:
  - rule section header/actions use a responsive two-column layout,
  - add-rule buttons move to the right/second column on desktop.
- Flag-group deletion was implemented:
  - backend delete endpoint allows deletion only when no flags are assigned,
  - existing cascade behavior removes `FlagGroupConfig` rows,
  - `FLAG_GROUP_DELETED` audit action and migration were added,
  - admin Flag Groups page gained a delete action and later a redesigned group
    card layout,
  - audit log filters later gained flag-group target/action coverage.
- A staging demo application path was added:
  - root scripts now include `dev:demo:staging`, `build:demo:staging`, and
    `preview:demo:staging`,
  - `apps/demo` reads `VITE_ENVIRONMENT_KEY` and sends it as SDK
    `environmentKey`,
  - Docker Compose includes a `demo-staging` service,
  - README documents production demo on port `5174` and staging on `5175`.
- Project and feature-flag delete behavior was added after design discussion:
  - projects support soft delete when empty,
  - feature flags support soft delete with restore from a deleted-flags table,
  - normal project/flag lists hide soft-deleted records,
  - evaluation treats deleted project/flag state as not found,
  - `PROJECT_DELETED` and `FEATURE_FLAG_DELETED` audit actions and project/flag
    soft-delete fields were added.
- Admin filtering/UI refinements landed:
  - quick time-range shortcuts were added for Statistics and Audit Logs,
  - Refresh moved to a second toolbar column on Statistics and Audit Logs,
  - Apply/Reset controls were right-aligned,
  - infinite-loading bugs on Apply filters were fixed for Statistics, Audit
    Logs, and Feature Flags,
  - Feature Flags table gained compact fixed-layout columns and equal-width row
    actions,
  - Feature Flags filter row now uses three full-width columns for Search,
    Status label, and Lifecycle.
- Audit Logs page was completed for the demo:
  - actor is visible on each audit entry,
  - actor filter placeholder now suggests `demo-admin` or `demo-developer`,
  - seed audit rows are now produced as `demo-admin` rather than `system`,
  - docs were aligned to the presentation admin actor,
  - already-created append-only local audit rows with actor `system` remain
    until the local database is reset/reseeded.
- Local workflow guidance captured during troubleshooting:
  - when running backend by npm without Compose, PostgreSQL must still be
    running at the configured host/port,
  - after schema changes, apply migrations before seeding,
  - workspace Prisma scripts load repo env config; direct `npx prisma ...`
    commands may fail if the datasource URL is not injected.

## Current observed working tree notes

- Date interpreted for this file: July 2, 2026 in Asia/Saigon, because the user
  asked on July 3, 2026 to update "yesterday's" index.
- Current branch while writing this file: `develop`.
- Working tree was clean before this history file was added.
- `docs/codex/history/2026-07-02-context-index.md` did not exist before this
  update.
- Current `HEAD` includes July 3 commits after the July 2 logs, including a
  merge and project-list/editing changes. This index summarizes July 2 session
  work; trust the current filesystem before editing.
- Current roadmap records Phases 10 through 20 complete and Gate A/B/C passed;
  no new gated recommended phase is pending.
- Current Prisma migrations include:
  - `apps/backend/prisma/migrations/20260702000000_add_flag_group_deleted_audit_action/`
  - `apps/backend/prisma/migrations/20260702010000_add_project_soft_delete/`
- The current feature-flag delete implementation is soft-delete plus restore,
  not a hard physical delete. Inspect current services/tests before changing
  semantics.
- Playwright MCP was repeatedly avoided because the user explicitly requested
  not to use it for the July 2 UI work.
- `markdownlint` availability should still be checked per context-index update;
  it has been absent in nearby history-index updates.

## Best next prompt for Codex

Continue from current `develop`. Read `AGENTS.md`,
`docs/codex/history/2026-07-02-context-index.md`,
`docs/codex/history/2026-06-30-context-index.md`,
`docs/plan/recommended-enhancements-roadmap.md`,
`docs/plan/requirement-traceability-matrix.md`, `README.md`,
`docs/release/demo-script.md`, and
`docs/release/final-recommended-release-review.md`. Preserve the completed MVP
and recommended release baseline. Before changing delete behavior, inspect
current project/flag/group services, Prisma schema, migrations, and admin pages
because July 2 added soft delete/restore and group deletion. Keep deterministic
evaluation, stable non-PII targeting keys, append-only audit logging,
server-resolved demo RBAC, fail-closed SDK behavior, environment-scoped demo
evaluation, optional Redis, and Docker Compose delivery intact. Prefer small
reversible increments and run relevant npm, Prisma, diff, and browser checks.

## Session index, compressed

- `01:17-03:24 ICT`: Clarified targeting-key design; refactored the demo app so
  `live-support-widget` rolls out by organization while other features roll out
  by user/account; converted demo terminology from customer to user and aligned
  demo roles.
- `12:26-12:48 ICT`: Simplified demo account seed/model fields, added
  organization names, updated admin/backend role examples, and moved rule-editor
  actions to the second column.
- `13:15-13:35 ICT`: Implemented delete for unassigned flag groups with cascade
  config deletion, audit action, migration, tests, and admin UI; redesigned flag
  group cards.
- `17:11-18:30 ICT`: Added staging demo app/environment-key workflow; discussed
  delete semantics; implemented project soft delete and feature-flag soft
  delete/restore with admin UI and audit logging.
- `18:54-22:51 ICT`: Optimized and then refined admin UI filters, quick time
  ranges, toolbar alignment, fixed Feature Flags Apply loading behavior, and
  made row action buttons equal width.
- `22:50-23:33 ICT`: Completed audit-log UI coverage for actors, flag groups,
  target/action filters, deep links from Flag Groups, and filter state
  persistence.
- `23:33-23:45 ICT`: Changed seeded audit actor from `system` to `demo-admin`,
  updated the Audit Logs actor placeholder, aligned docs, and validated without
  Playwright MCP.
