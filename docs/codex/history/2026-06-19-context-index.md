# Codex Context History — 2026-06-19

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
  - `docs/codex/history/2026-06-18-context-index.md`
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

- Two local Codex session logs were found at `~/.codex/sessions/2026/06/19/`,
  and both had `cwd` set to this repository.
- The first session asked Codex to update "today's" history index while the IDE
  had `docs/codex/history/2026-06-17-context-index.md` open, but the turn was
  intentionally interrupted before durable work was recorded.
- The second session asked Codex to update "yesterday's" history index. In ICT
  on June 19, that meant `2026-06-18`.
- Codex created `docs/codex/history/2026-06-18-context-index.md` from current
  filesystem inspection because no June 18 session log directory existed at
  `~/.codex/sessions/2026/06/18/`.
- The June 18 index captured the active guardrails, durable Codex context paths,
  one June 18 git commit, and the demo `.env.example` caveat around the
  commented `VITE_ADMIN_ACTOR` placeholder.
- The second session reported successful `git diff --check` validation for the
  June 18 file and noted that `markdownlint` was unavailable locally.
- Git history now shows the June 18 index was committed later on June 19 as
  `c19ce6b docs: add codex context index for 2026-06-18 sessions`.
- No backend, admin, demo, Prisma schema, seed, or requirement implementation
  changes were supported by June 19 session logs beyond the Codex history work.

## Current observed working tree notes

- Date interpreted for this file: `2026-06-19` in ICT (`+0700`), because the
  user requested "yesterday's" index on June 20, 2026.
- Branch during this update: `develop`.
- `HEAD` before writing this file: `c19ce6b`
  (`docs: add codex context index for 2026-06-18 sessions`).
- Working tree before writing this file was clean.
- `docs/codex/history/2026-06-19-context-index.md` did not exist before this
  update.
- Current Codex context roots observed:
  - `.codex/config.toml`
  - `.codex/agents/*.toml`
  - `.agents/skills/*/SKILL.md`
  - `docs/codex/history/`
  - `docs/codex/reference/`
- Ignored/local artifacts still should not be committed: `.env`, app-local
  `.env` files, `.playwright-browsers/`, `.playwright-mcp/`, `node_modules/`,
  app `dist/`, and backend `coverage/`.
- `markdownlint` has repeatedly been unavailable in this environment; when it is
  installed, run it for docs changes.

## Best next prompt for Codex

Continue on `develop`. Read `AGENTS.md`, `docs/plan/project-goal.md`,
`docs/plan/implementation-roadmap.md`,
`docs/codex/history/2026-06-18-context-index.md`, and this June 19 context
index. Start Phase 9 release readiness by first removing the browser-exposed
control-plane placeholder `VITE_ADMIN_ACTOR` from `apps/demo/.env.example`, then
verify or fix the PR #25 admin review risks around dirty navigation,
pagination, retry error clearing, and clearing descriptions. Run focused
admin/demo lint/build checks, then full `npm run build`, `npm run lint`,
`npm run test`, and `npm run diff:check` as the release gate. Preserve
deterministic evaluation, safe defaults, append-only audit logging, non-PII
rollout keys, and control-plane/data-plane separation.

## Session index, compressed

- `12:58 ICT` /
  `rollout-2026-06-19T12-58-37-019ede75-b77c-7483-9f67-6c0ec4ed9f1a.jsonl`:
  repo-scoped session started to update the day's history index; user aborted
  before durable outcomes.
- `12:58-13:00 ICT` /
  `rollout-2026-06-19T12-58-49-019ede75-e6bb-75b3-bd12-4f5bb211776c.jsonl`:
  repo-scoped session read `codex-history-index`, `AGENTS.md`, project goal and
  requirement docs, inspected history files and git state, created
  `docs/codex/history/2026-06-18-context-index.md`, and reported diff-check
  validation.
- `13:06 ICT`: git commit `c19ce6b` added the June 18 context index.
