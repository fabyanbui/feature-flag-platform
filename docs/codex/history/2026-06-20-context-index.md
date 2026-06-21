# Codex Context History — 2026-06-20

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
  - `docs/codex/history/2026-06-19-context-index.md`
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

- One local Codex session log was found at `~/.codex/sessions/2026/06/20/`, and
  it had `cwd` set to this repository.
- The session used `.agents/skills/codex-history-index/SKILL.md` to update
  "yesterday's" history index. In ICT on June 20, that meant `2026-06-19`.
- Codex read the June 19 session logs, filtered them to this repo, and created
  `docs/codex/history/2026-06-19-context-index.md`.
- The June 19 index captured that June 19 work was history-index maintenance:
  creating `docs/codex/history/2026-06-18-context-index.md` after finding no
  June 18 local session directory, plus preserving repo guardrails and current
  context paths.
- The session reported successful whitespace validation with
  `git diff --check -- docs/codex/history/2026-06-19-context-index.md`.
- `markdownlint` was not installed locally and was skipped.
- At the end of the session, `docs/codex/history/2026-06-19-context-index.md`
  was untracked; current git history now shows it was committed later on June 20
  as `0f8ba18 docs: add codex context index for 2026-06-19 sessions`.
- No backend, admin, demo, Prisma schema, seed, or requirement implementation
  changes were supported by June 20 session logs beyond the Codex history work.

## Current observed working tree notes

- Date interpreted for this file: `2026-06-20` in ICT (`+0700`), because the
  user requested "yesterday's" index on June 21, 2026.
- Branch during this update: `develop`.
- `HEAD` before writing this file: `0f8ba18`
  (`docs: add codex context index for 2026-06-19 sessions`).
- Working tree before writing this file was clean.
- `docs/codex/history/2026-06-20-context-index.md` did not exist before this
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
`docs/codex/history/2026-06-19-context-index.md`, and this June 20 context
index. Start Phase 9 release readiness by first removing the browser-exposed
control-plane placeholder `VITE_ADMIN_ACTOR` from `apps/demo/.env.example`, then
verify or fix the PR #25 admin review risks around dirty navigation,
pagination, retry error clearing, and clearing descriptions. Run focused
admin/demo lint/build checks, then full `npm run build`, `npm run lint`,
`npm run test`, and `npm run diff:check` as the release gate. Preserve
deterministic evaluation, safe defaults, append-only audit logging, non-PII
rollout keys, and control-plane/data-plane separation.

## Session index, compressed

- `09:51-09:53 ICT` /
  `rollout-2026-06-20T09-51-20-019ee2f0-9f0b-7e33-a682-f345316d8774.jsonl`:
  repo-scoped session read `codex-history-index`, `AGENTS.md`, project goal and
  requirement docs, inspected June 19 logs and current git state, created
  `docs/codex/history/2026-06-19-context-index.md`, and reported diff-check
  validation with `markdownlint` skipped because it was unavailable.
- `22:58 ICT`: git commit `0f8ba18` added the June 19 context index.
