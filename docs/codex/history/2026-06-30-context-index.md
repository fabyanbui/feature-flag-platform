# Codex Context History — 2026-06-30

Purpose: compact context for future Codex sessions. Use this as an index, not a
transcript.

## Read first

- Active authority: `AGENTS.md`.
- Product/deadline sources: `docs/requirement/requirement-init.md`,
  `docs/requirement/info-init.md`, and `docs/plan/project-goal.md`.
- Submission is due July 7, 2026; presentation is July 9, 2026. Slides and the
  research report remain required.
- `docs/plan/implementation-roadmap.md` is the completed MVP baseline;
  `docs/plan/recommended-enhancements-roadmap.md` is the active enhancement and
  gate source.
- Durable Codex context remains under `docs/codex/`, `.codex/`, and
  `.agents/skills/`.
- Read latest prior indexes first: `2026-06-29`, `2026-06-28`, and
  `2026-06-27` under `docs/codex/history/`.
- Useful release/demo references: `docs/plan/mini-demo-app-implementation-plan.md`,
  `docs/plan/requirement-traceability-matrix.md`, `docs/release/demo-script.md`,
  `docs/release/final-recommended-release-review.md`, and
  `docs/release/troubleshooting.md`.

## Repo guardrails to keep

- Preserve deterministic evaluation, stable percentage hashing, safe defaults,
  and fail-closed `NOT_FOUND` and `ERROR` behavior.
- Authoritative evaluation precedence remains:
  `FLAG_ARCHIVED` -> `FLAG_DISABLED` -> `GROUP_KILL_SWITCH` ->
  `KILL_SWITCH` -> `GLOBAL_ON` -> ordered enabled rules -> `DEFAULT_OFF`.
- Cache only reusable evaluation snapshots; never cache user-specific final
  decisions, raw context, targeting keys, roles, attributes, or matched rule IDs.
- Preserve append-only audit entries with trusted before/after snapshots in the
  same transaction as control-plane mutations.
- Keep server-resolved RBAC authoritative; clients must not elevate by spoofing
  actor or role headers.
- Keep management/control-plane concerns separate from runtime evaluation and
  SDK data-plane concerns.
- Use stable, non-PII identifiers for targeting and rollout keys.
- Keep feature flag lifecycle/configuration status distinct from runtime On/Off
  state.
- Keep Redis optional; the stable demo path must not require Redis.
- Keep `.env.example` aligned with `.env` variable shape using safe placeholders
  only.

## What happened today

- Seven local June 30 session logs had `cwd` set to this repository.
- `codex-history-index` was used to create/update three prior daily indexes:
  - `docs/codex/history/2026-06-27-context-index.md`
  - `docs/codex/history/2026-06-28-context-index.md`
  - `docs/codex/history/2026-06-29-context-index.md`
- A Vietnamese system walkthrough explained the repo at a high level for
  learning/presentation prep: control plane vs data plane, backend modules,
  Prisma persistence, evaluation engine, stable rollout hashing, audit logs,
  RBAC, SDK, admin UI, demo UI, Docker workflow, release docs, and what to
  study next.
- Demo strategy decisions: no full register/login for this coursework; keep
  server-resolved demo RBAC, avoid a distracting production-auth scope, enforce
  permissions in backend guards, and prove feature-flag value through a real
  business feature rather than only raw evaluation API calls.
- `docs/plan/mini-demo-app-implementation-plan.md` was created and refined as
  the implementation plan for upgrading `apps/demo` into a mini checkout app:
  - `new-checkout` controls only the checkout experience,
  - `beta-dashboard` controls only an optional dashboard/panel,
  - metadata and expected outcomes are display-only,
  - stale evaluation state must be cleared on scenario/account changes,
  - loading, missing config, SDK/client failure, and backend Off states must
    keep the safe Classic Checkout fallback.
- Local database and Docker guidance was clarified: Compose reset uses
  `docker compose down --volumes` then `docker compose up --build -d`;
  standalone/local Prisma reset paths were explained without mutating data; a
  Docker port binding error was attributed to host port conflict.
- RBAC and seed-data Q&A clarified durable design:
  - admin/developer/viewer are not DB user rows; they are demo identities from
    environment variables resolved by `apps/backend/src/auth/demo-identity.service.ts`,
  - audit logs record resolved actors after protected mutations,
  - useful seed data should support the demo story: one project, production/
    staging/development, feature groups, `beta-dashboard`, `new-checkout`,
    environment configs, targeting rules, and sample contexts.
- `demo-scenarios` and `frontend-ui-ux-editor` were used to implement and then
  refine a customer-facing demo app:
  - `apps/demo/src/App.tsx` and `apps/demo/src/App.css` were rewritten into a
    storefront/checkout-style UI,
  - demo behavior continued to use `@ffp/js-sdk` and exact backend reason codes,
  - visible customer UI removed prominent feature-flag platform branding,
  - technical diagnostics were hidden/collapsed and later moved to the footer,
  - rollout proof was improved by adding switchable customer accounts instead
    of only a small set of static scenarios,
  - non-user scenarios such as global-toggle and intentionally missing config
    were removed from the main selector to keep the live demo cleaner,
  - the selector was changed to a right-column dropdown with selected user info
    on the left.
- Stable hashing was explained from code:
  - implemented in `apps/backend/src/evaluation/engine/stable-rollout-hash.ts`,
  - called from `apps/backend/src/evaluation/engine/evaluation-engine.ts`,
  - tests live in `apps/backend/src/evaluation/engine/stable-rollout-hash.spec.ts`,
  - percentage rollout must be deterministic from stable, non-PII rollout keys.
- A full July 9 presentation scenario list was drafted: Docker startup,
  two-plane architecture, seeded project/flags/groups, management UI, global
  toggle, role targeting, percentage rollout across accounts, group/flag kill
  switches, audit/history/statistics, JS SDK, fail-closed behavior, RBAC denial
  states, troubleshooting, and backup Q&A proof.
- Validation reported in June 30 sessions included repeated successful
  `npm run lint --workspace=@ffp/demo`, `npm run build --workspace=@ffp/demo`,
  and `git diff --check` runs on changed demo/release-doc paths.
- Browser checks were run for desktop and mobile layouts. A recurring CORS note
  appeared when Vite used `localhost:5175` while backend CORS was configured for
  the expected demo origin; this was treated as a local port/origin mismatch, not
  a layout failure.

## Current observed working tree notes

- Date interpreted for this file: June 30, 2026 in ICT (`+0700`); this update
  was performed on July 1, 2026.
- Current branch while writing this file: `develop`.
- Current `HEAD` while writing this file: `cf19f7b`; `develop` is even with
  `origin/develop`.
- `docs/codex/history/2026-06-30-context-index.md` did not exist before this
  update.
- Current roadmap records Phases 12 through 20 complete; no next recommended
  phase or unpassed gate is listed after Phase 20.
- Current filesystem already contains the June 30 demo-app direction: the demo
  app imports `data/demoAccounts` and `services/commerceDb`, shows ShopEase /
  Premium Audio Store checkout UI, and evaluates the `beta-dashboard` and
  `new-checkout` experiences through `@ffp/js-sdk`.
- Session logs said `docs/release/demo-app-debugging.md` was created, but the
  current filesystem does not contain that file. Trust the filesystem.
- `docs/plan/mini-demo-app-implementation-plan.md` and `docs/release/demo-script.md`
  are tracked and present.
- `.codex/` and `.agents/skills/` remain repo-scoped Codex context sources.
- `markdownlint` availability should still be checked per context-index update;
  it has been absent in nearby history-index updates.

## Best next prompt for Codex

Continue from current `develop`. Read `AGENTS.md`,
`docs/codex/history/2026-06-30-context-index.md`,
`docs/codex/history/2026-06-29-context-index.md`,
`docs/plan/mini-demo-app-implementation-plan.md`,
`docs/plan/recommended-enhancements-roadmap.md`,
`docs/plan/requirement-traceability-matrix.md`,
`docs/release/demo-script.md`, and
`docs/release/final-recommended-release-review.md`. Preserve the completed MVP
baseline and Phase 20 recommended release posture. Before changing the demo or
seed, inspect the current filesystem and current diff. Keep deterministic
evaluation, stable non-PII rollout keys, append-only audit logging,
server-resolved demo RBAC, fail-closed SDK behavior, optional Redis, and Docker
Compose delivery intact. Prefer small reversible increments and run relevant
npm, diff, and browser checks.

## Session index, compressed

- `10:12-10:19 ICT`: Used `codex-history-index` to create/update the June 27,
  June 28, and June 29 context indexes; noted `markdownlint` was not installed.
- `13:38-16:58 ICT`: Vietnamese learning/demo strategy thread. Explained whole
  system architecture, demo RBAC vs full auth, developer permissions, demo app
  value, multi-user rollout proof, and created/refined
  `docs/plan/mini-demo-app-implementation-plan.md`.
- `15:34 ICT`: Answered how to reset local PostgreSQL safely for Docker,
  standalone container, and direct local Prisma workflows; no data was changed.
- `15:38-16:34 ICT`: Answered PostgreSQL without Docker, Docker purpose, where
  demo RBAC identities live, how audit logs record actors, and what seed data
  should support the presentation.
- `17:02-17:41 ICT`: Implemented the initial mini checkout demo app and refined
  it so normal UI is customer-facing while exact technical diagnostics are
  hidden/collapsed; updated demo docs and validated demo lint/build/diff.
- `21:27-23:26 ICT`: Expanded rollout demo UX with multiple switchable users,
  explained stable hashing, diagnosed Docker port conflict, moved diagnostics
  to the footer, removed non-user selector options, and changed selection to a
  right-column dropdown with selected-user info on the left.
- `23:51-23:52 ICT`: Produced a complete July 9 presentation scenario list,
  including main live path and backup/Q&A proof points.
