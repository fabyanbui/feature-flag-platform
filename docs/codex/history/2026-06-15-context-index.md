# Codex Context History — 2026-06-15

Purpose: compact context for future Codex sessions. Use this as an index, not a transcript.

## Read first

- Active authority: `AGENTS.md`.
- Product and deadline sources:
  - `docs/requirement/requirement-init.md`
  - `docs/requirement/info-init.md`
  - `docs/plan/project-goal.md`
- Current authoritative dates in repo docs:
  - Submission: July 7, 2026.
  - Presentation: July 9, 2026.
- Durable Codex context to prefer before raw logs:
  - `docs/codex/context-map.md`
  - `docs/codex/mcp-tool-selection.md`
  - `docs/codex/history/2026-06-14-context-index.md`
  - `docs/codex/reference/phase-6-e2e-evaluation-step-fix.md`
  - `docs/codex/reference/phase-6-vertical-slice-completion.md`
  - `docs/codex/reference/playwright-mcp-local-browser-cache-fix.md`
  - On local branch `feat/admin-ui` only, until merged:
    `docs/codex/reference/phase-7-admin-dashboard-implementation.md`
- Repo-scoped Codex setup remains in `.codex/agents/` and `.agents/skills/`.

## Repo guardrails to keep

- Prioritize required MVP deliverables before recommended enhancements: research
  report, backend API, admin dashboard, demo app, database, validation/error
  handling, README run instructions, seed data, short design docs, slides, and
  report.
- Preserve deterministic evaluation and stable percentage rollout hashing.
- Preserve safe defaults and fail-closed evaluation; missing project/flag returns
  `enabled=false` with `reason=NOT_FOUND` in evaluation responses.
- Preserve append-only audit logging for project/flag/rule mutations, with
  before/after snapshots written in the same transaction as the mutation.
- Keep management/control-plane APIs separate from runtime data-plane evaluation.
- Use stable, non-PII identifiers for targeting and rollout keys.
- Keep feature flag status labels distinct from runtime On/Off state.
- Never expose secrets or connection strings; keep `.env.example` aligned with
  `.env` variable shape using safe placeholders only.

## What happened today

- Thirty repo-scoped Codex session logs were found under
  `~/.codex/sessions/2026/06/15/`.
- The June 14 handoff was created:
  `docs/codex/history/2026-06-14-context-index.md`.
- Phase 6 early vertical slice was guided, implemented, validated, documented,
  and merged to `develop` through PR #24.
  - Added `apps/backend/test/phase-6-vertical-slice.e2e-spec.ts`.
  - The e2e flow creates a project and `new-checkout` flag, enables targeted
    serving, configures a `ROLE_TARGETING` rule for `beta-tester`, evaluates
    beta and regular contexts, and verifies project/flag/rule audit entries.
  - Connected `apps/demo/src/App.tsx` to the real `/v1/evaluate` endpoint and
    updated `apps/demo/src/App.css` for scenario/result/error/gated-feature UI.
  - Updated `docs/plan/implementation-roadmap.md` with Phase 6 validation notes.
  - Created durable references:
    `docs/codex/reference/phase-6-e2e-evaluation-step-fix.md` and
    `docs/codex/reference/phase-6-vertical-slice-completion.md`.
  - Validation caveat: the Phase 6 e2e test passed after approved escalation;
    Codex sandbox can block Supertest local server binding with `listen EPERM`.
  - Seed/demo caveat from the reference: seeded `demo-project/new-checkout` can
    include percentage rollout, so a regular seeded user may return
    `PERCENTAGE_ROLLOUT` instead of `DEFAULT_OFF` unless demo rules are reset or
    the behavior is documented.
- PR #24 review found two issues that matter for future work:
  - `apps/demo/src/App.tsx` violates `react-hooks/set-state-in-effect` in the
    mount-triggered evaluation path.
  - The demo app source fallback is `phase6-demo`, while `.env.example` points
    to seeded `demo-project`; without env config the fallback may evaluate
    `NOT_FOUND`.
- Phase 7 admin dashboard work was implemented on local branch `feat/admin-ui`
  but is not merged into `develop`.
  - Added typed admin API/types/status/validation helpers under
    `apps/admin/src/lib/`.
  - Added reusable UI state/status/confirmation components under
    `apps/admin/src/components/`.
  - Added project list, flag list, create/edit flag form, rule editor with test
    evaluation panel, and audit log page under `apps/admin/src/pages/`.
  - Preserved status vs runtime semantics: `Enabled`/`Disabled`/`Archived` are
    config labels; runtime display is `On`/`Off`/`Conditional` per context and
    safety state.
  - Admin mutations send an MVP `X-Actor` value for auditability; this is not
    production authentication/authorization.
  - Lint failures in admin pages from `react-hooks/set-state-in-effect` were
    fixed on the branch with deferred `window.setTimeout(..., 0)` initial loads.
  - Branch validation recorded in the Phase 7 reference: admin lint and build
    passed, and Playwright MCP validated create/edit, rule testing, archive /
    restore, and audit-log visibility with no browser console errors.
- Playwright MCP local setup was repaired and documented on `develop`.
  - `.codex/config.toml` now has a project-scoped Playwright MCP command that
    sources `.env` if present, defaults `CHROMIUM_BROWSER_PATH` to the ignored
    repo-local `.playwright-browsers/chromium-1228/.../chrome`, checks it is
    executable, and runs `@playwright/mcp@latest` with `--headless`,
    `--no-sandbox`, and `--isolated`.
  - `.env.example` documents optional `CHROMIUM_BROWSER_PATH`.
  - `.gitignore` ignores `.playwright-browsers/` and `.playwright-mcp/`.
  - Created `docs/codex/reference/playwright-mcp-local-browser-cache-fix.md`.
  - Tooling caveat: restart Codex/MCP after config edits; an already-running MCP
    server can keep stale browser path/profile settings.
  - Later smoke tests navigated with Playwright MCP to `example.com`, Wikipedia,
    Playwright docs, and a local `data:` page; a Chrome profile lock was also
    observed in one run and resolved by using/restarting the isolated MCP setup.

## Current observed working tree notes

- Current filesystem inspection while writing this file reports:
  - Branch: `develop`.
  - Tracking: `develop...origin/develop`.
  - Working tree before writing this file: clean.
  - `HEAD`: `d3ab9dc` (`chore: update Playwright MCP configuration to be
    project-scoped with repo-local browser caching and add documentation for the
    setup.`).
- `develop` currently includes Phase 6 and Playwright MCP documentation, but not
  Phase 7 admin UI branch changes.
- Local branch `feat/admin-ui` is ahead of `develop` with Phase 7 admin files and
  `docs/codex/reference/phase-7-admin-dashboard-implementation.md`.
- Validation run during this summary:
  - `npm run lint --workspace=@ffp/demo` fails on current `develop` because
    `apps/demo/src/App.tsx` calls `evaluateFlag()` directly in an effect and
    triggers `react-hooks/set-state-in-effect` at line 93.
  - `npm run lint --workspace=@ffp/admin` passes on current `develop`.
- Ignored local artifacts observed and should not be committed:
  `.env`, `.playwright-browsers/`, `.playwright-mcp/`, workspace `dist/`,
  `node_modules/`, backend `coverage/`, and app-local `.env` files.
- Local Codex session metadata can contain sensitive remote/config details; do
  not copy raw `session_meta`, raw command output, tokens, or connection strings
  into history docs.

## Best next prompt for Codex

Continue on `develop`. Read `AGENTS.md`, `docs/plan/project-goal.md`,
`docs/plan/implementation-roadmap.md`,
`docs/codex/history/2026-06-15-context-index.md`,
`docs/codex/reference/phase-6-vertical-slice-completion.md`, and
`docs/codex/reference/playwright-mcp-local-browser-cache-fix.md`. First fix the
current demo lint failure in `apps/demo/src/App.tsx` without changing evaluation
semantics, and align the source fallback project key with safe seeded demo
behavior or document the required env. Then review/merge or continue local branch
`feat/admin-ui` for Phase 7, preserving status-vs-runtime semantics,
append-only audit visibility, MVP-only `X-Actor` caveat, stable non-PII rollout
keys, and control-plane/data-plane separation.

## Session index, compressed

- `019ec9d2-66c3-7630-87c6-ea0cdf26f08a` (12:47 ICT): used
  `codex-history-index` to create
  `docs/codex/history/2026-06-14-context-index.md`.
- `019ec9d2-cf61-76b2-ae7b-8f2b2d3aa311`,
  `019eca02-3370-7431-8a69-e41ef00c6a9f`, and
  `019eca04-87a6-7861-b7fd-267a9ab18486` (12:48-13:42 ICT): guided and fixed
  Phase 6 e2e/demo implementation; produced Phase 6 references and completion
  notes.
- `019ec9e5-3f92-72e1-98a3-e7a2bcc05ce7` (13:08 ICT): recommended branch names
  for Phase 6 and Phase 7; actual branches used included
  `feat/early-vertical-slice` and `feat/admin-ui`.
- `019eca57-9012-78a3-929e-93f9783764c0` and
  `019eca5d-0043-7661-9400-3efa70fad4a0` (15:13-15:19 ICT): created/reviewed
  PR #24; review found demo lint and fallback-project-key issues.
- `019eca64-b6d0-74b0-82b7-9efc0e145b94`,
  `019eca71-88a0-7ec0-846c-bce4727efdc8`,
  `019ecaa9-69aa-70b0-82cb-ca9c1d211ea1`,
  `019ecb1d-5fbf-7c91-a512-daa095962e69`,
  `019ecb2e-6cf3-7b12-9c72-b603af8b2626`,
  `019ecb34-9f1c-7882-904d-d1901054e072`,
  `019ecb36-a2cc-79f0-b2a9-fdb5bbe05408`, and
  `019ecb3b-86c4-74e0-9dff-872be8e5200b` (15:27-19:22 ICT): implemented and
  validated Phase 7 admin UI on `feat/admin-ui`.
- `019ecaad-a8fc-7c00-b42d-6bd488be8bd1` through
  `019ecadf-8575-7fc1-bf07-70ac9abaeeb1` (16:47-17:41 ICT): repeatedly tested
  Playwright MCP and diagnosed browser-cache/profile launch issues.
- `019ecae3-3027-7d21-93a9-8dc55de12a2e` (17:45 ICT): completed the useful
  Playwright MCP fix, including repo-local browser cache, ignored generated
  files, global stale config cleanup, and reference documentation.
- `019ecbfe-7e1b-7010-9dee-793e8dda9567` through
  `019ecc30-77ee-7021-9e07-fe13681a55c1` (22:55-23:49 ICT): retested
  Playwright MCP/browser navigation after restarts and profile-lock issues;
  final local `data:` page navigation/snapshot/click test passed.
- `019ecc36-bc6b-7d53-9ddd-0f7f566ba05d` (23:56 ICT): started this June 15
  `codex-history-index` update.
