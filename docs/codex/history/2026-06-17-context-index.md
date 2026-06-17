# Codex Context History — 2026-06-17

Purpose: compact context for future Codex sessions. Use this as an index, not a transcript.

## Read first

- Active authority: `AGENTS.md`.
- Product and deadline sources:
  - `docs/requirement/requirement-init.md`
  - `docs/requirement/info-init.md`
  - `docs/plan/project-goal.md`
- Required final artifacts still matter: research report and slides, with
  submission due July 7, 2026 and presentation due July 9, 2026.
- Durable Codex context to prefer before raw logs:
  - `docs/codex/context-map.md`
  - `docs/codex/mcp-tool-selection.md`
  - `docs/codex/history/2026-06-16-context-index.md`
  - `docs/codex/reference/phase-7-admin-dashboard-ui-polish.md`
  - `docs/codex/reference/phase-8-demo-app-implementation.md`
  - `docs/codex/reference/playwright-mcp-local-browser-cache-fix.md`
- Repo-scoped Codex setup remains in `.codex/agents/` and `.agents/skills/`.

## Repo guardrails to keep

- Prioritize required MVP deliverables before recommended enhancements:
  research report, backend API, admin dashboard, demo app, database,
  validation/error handling, README run instructions, seed data, short design
  docs, slides, and report.
- Preserve deterministic evaluation and stable percentage rollout hashing.
- Preserve safe defaults and fail-closed evaluation; missing project/flag returns
  `enabled=false` with `reason=NOT_FOUND` in evaluation responses.
- Preserve append-only audit logging for project/flag/rule mutations, with
  before/after snapshots written in the same transaction as the mutation.
- Keep management/control-plane APIs separate from runtime data-plane evaluation.
- Use stable, non-PII identifiers for targeting and rollout keys.
- Keep feature flag status labels (`Enabled`/`Disabled`/`Archived`) distinct
  from runtime state (`On`/`Off`/`Conditional`).
- For frontend UI/UX changes, use `.agents/skills/frontend-ui-ux-editor/` and
  validate responsive/accessibility states with Playwright when available.
- Never expose secrets or connection strings; local Codex `session_meta` can
  contain sensitive remote/config details, so do not copy raw metadata into docs.
- Keep `.env.example` aligned with `.env` variable shape using safe placeholders
  only, and avoid browser-exposed control-plane/admin values in Vite apps.

## What happened today

- One repo-scoped Codex session log was found under
  `~/.codex/sessions/2026/06/17/` for this repository.
- The only meaningful workstream in the available June 17 logs was this context
  index update request.
- The `codex-history-index` skill was used as requested:
  - Read `.agents/skills/codex-history-index/SKILL.md`.
  - Re-read active project guardrails from `AGENTS.md`,
    `docs/plan/project-goal.md`, `docs/requirement/requirement-init.md`, and
    `docs/requirement/info-init.md`.
  - Inspected the June 17 local Codex session log and filtered it to this repo.
  - Created this daily context index at
    `docs/codex/history/2026-06-17-context-index.md`.
- No backend, admin, demo, schema, seed, or requirement implementation changes
  were present in the June 17 session logs before this file was written.
- The prior June 16 caveat still matters: `apps/demo/.env.example` contains a
  commented `VITE_ADMIN_ACTOR` placeholder even though the demo app should stay
  data-plane-only and avoid browser-exposed control-plane/admin values.

## Current observed working tree notes

- Current filesystem inspection while writing this file reports:
  - Branch: `develop`.
  - `HEAD`: `1457e69` (`docs: add codex context index for 2026-06-16 sessions`).
  - Working tree before writing this file: clean.
- Current Codex context roots observed:
  - `.codex/config.toml`
  - `.codex/agents/*.toml`
  - `.agents/skills/*/SKILL.md`
  - `docs/codex/history/`
  - `docs/codex/reference/`
- Current grep confirmed this caveat remains in the filesystem:
  `apps/demo/.env.example` contains commented `VITE_ADMIN_ACTOR`.
- Ignored/local artifacts still should not be committed: `.env`, app-local
  `.env` files, `.playwright-browsers/`, `.playwright-mcp/`, `node_modules/`,
  app `dist/`, and backend `coverage/`.
- `markdownlint` has repeatedly been unavailable in this environment; when it is
  installed, run it for docs changes.

## Best next prompt for Codex

Continue on `develop`. Read `AGENTS.md`, `docs/plan/project-goal.md`,
`docs/plan/implementation-roadmap.md`,
`docs/codex/history/2026-06-16-context-index.md`, and this June 17 context
index. Start Phase 9 release readiness by first removing the browser-exposed
control-plane placeholder `VITE_ADMIN_ACTOR` from `apps/demo/.env.example`, then
verify or fix the PR #25 admin review risks around dirty navigation,
pagination, retry error clearing, and clearing descriptions. Run focused
admin/demo lint/build checks, then full `npm run build`, `npm run lint`,
`npm run test`, and `npm run diff:check` as the release gate. Preserve
deterministic evaluation, safe defaults, append-only audit logging, non-PII
rollout keys, and control-plane/data-plane separation.

## Session index, compressed

- `019ed66c-08e5-7133-88ce-c88ca6f7a1bf` (23:31 ICT): updated today's
  `docs/codex/history/2026-06-17-context-index.md` from local June 17 Codex
  logs, current filesystem inspection, and active repo guardrails. No raw
  transcript or secret-bearing session metadata was copied into the doc.
