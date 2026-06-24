# Codex Context History — 2026-06-18

Purpose: compact context for future Codex sessions. Use this as an index, not a transcript.

## Read first

- Active authority: `AGENTS.md`.
- Product and deadline sources:
  - `docs/requirement/requirement-init.md`
  - `docs/requirement/info-init.md`
  - `docs/plan/project-goal.md`
- Required final artifacts remain non-optional: research report and slides, with
  submission due July 7, 2026 and presentation due July 9, 2026.
- Durable Codex context to prefer before raw logs:
  - `docs/codex/context-map.md`
  - `docs/codex/mcp-tool-selection.md`
  - `docs/codex/history/2026-06-17-context-index.md`
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
- Prefer repository files, Prisma schema, migrations, and deterministic tests
  before live MCP database calls.
- Never expose secrets or connection strings; local Codex `session_meta` can
  contain sensitive remote/config details, so do not copy raw metadata into docs.
- Keep `.env.example` aligned with `.env` variable shape using safe placeholders
  only, and avoid browser-exposed control-plane/admin values in Vite demo code.

## What happened today

- No local Codex session log directory was found at
  `~/.codex/sessions/2026/06/18/` during this update.
- Therefore, there were no June 18 Codex transcripts available to filter by
  `cwd` for this repository.
- Filesystem and git inspection found one June 18 commit on this repo:
  `48d6b72 docs: add codex context index for 2026-06-17 sessions` at
  `2026-06-18 00:10:16 +0700`.
- No backend, admin, demo, schema, seed, or requirement implementation changes
  were supported by June 18 local Codex logs because no such logs were present.
- The prior caveat from June 17 still exists in the filesystem:
  `apps/demo/.env.example` contains a commented `VITE_ADMIN_ACTOR` placeholder
  even though the demo app should remain data-plane-only and avoid
  browser-exposed control-plane/admin values.

## Current observed working tree notes

- Current filesystem inspection while writing this file reports:
  - Date interpreted for "yesterday": `2026-06-18` in ICT (`+0700`).
  - Branch: `develop`.
  - `HEAD`: `48d6b72` (`docs: add codex context index for 2026-06-17 sessions`).
  - Working tree before writing this file: clean.
  - `docs/codex/history/2026-06-18-context-index.md` did not exist before this
    update.
- Current Codex context roots observed:
  - `.codex/config.toml`
  - `.codex/agents/*.toml`
  - `.agents/skills/*/SKILL.md`
  - `docs/codex/history/`
  - `docs/codex/reference/`
- Current grep confirmed:
  - `apps/demo/.env.example` contains commented `VITE_ADMIN_ACTOR`.
  - `apps/admin/.env.example` contains `VITE_ADMIN_ACTOR=admin@example.local`,
    which is expected for the control-plane admin app.
- Ignored/local artifacts still should not be committed: `.env`, app-local
  `.env` files, `.playwright-browsers/`, `.playwright-mcp/`, `node_modules/`,
  app `dist/`, and backend `coverage/`.
- `markdownlint` has repeatedly been unavailable in this environment; when it is
  installed, run it for docs changes.

## Best next prompt for Codex

Continue on `develop`. Read `AGENTS.md`, `docs/plan/project-goal.md`,
`docs/plan/implementation-roadmap.md`,
`docs/codex/history/2026-06-17-context-index.md`, and this June 18 context
index. Start Phase 9 release readiness by first removing the browser-exposed
control-plane placeholder `VITE_ADMIN_ACTOR` from `apps/demo/.env.example`, then
verify or fix the PR #25 admin review risks around dirty navigation,
pagination, retry error clearing, and clearing descriptions. Run focused
admin/demo lint/build checks, then full `npm run build`, `npm run lint`,
`npm run test`, and `npm run diff:check` as the release gate. Preserve
deterministic evaluation, safe defaults, append-only audit logging, non-PII
rollout keys, and control-plane/data-plane separation.

## Session index, compressed

- No repo-scoped Codex sessions were found for June 18 because
  `~/.codex/sessions/2026/06/18/` was absent.
- Durable filesystem event: `48d6b72` added
  `docs/codex/history/2026-06-17-context-index.md` shortly after midnight ICT.
- This file was created from current filesystem inspection and active repo
  guardrails, not from June 18 raw transcripts.
