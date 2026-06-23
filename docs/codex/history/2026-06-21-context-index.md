# Codex Context History — 2026-06-21

Purpose: compact context for future Codex sessions. Use this as an index, not a
transcript.

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
  - `docs/codex/history/2026-06-20-context-index.md`
  - `docs/codex/reference/phase-8-demo-app-implementation.md`
  - `docs/codex/reference/phase-9-release-readiness-completion.md`
- Phase 9 release-readiness evidence now lives in:
  - `docs/plan/phase-9-release-readiness-checklist.md`
  - `docs/plan/phase-9-test-coverage-map.md`
  - `docs/release/security-review.md`
  - `docs/release/audit-log-release-review.md`
  - `docs/release/demo-script.md`
  - `docs/release/troubleshooting.md`
  - `docs/research/feature-flag-platform-research-report.md`
  - `docs/presentation/slide-outline.md`
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
  only. The demo app should stay data-plane only and browser-safe.

## What happened today

- Three local Codex session logs were found in `~/.codex/sessions/2026/06/21/`,
  and all had `cwd` set to this repository.
- The first session used `.agents/skills/codex-history-index/SKILL.md` to create
  `docs/codex/history/2026-06-20-context-index.md`, then commit `396cd9c`
  recorded it as `docs: add codex context index for 2026-06-20 sessions`.
- The main workstream treated Phase 9 as a release-readiness and evidence phase,
  not a feature-expansion phase. It used the quality, API, audit, security, and
  demo skills to implement the roadmap step by step.
- Phase 9 planning artifacts were created:
  - `docs/plan/phase-9-release-readiness-checklist.md`
  - `docs/plan/phase-9-test-coverage-map.md`
- Phase 9 backend confidence was improved with:
  - `apps/backend/test/phase-9-demo-flow.e2e-spec.ts`
  - `apps/backend/test/phase-9-api-hardening.e2e-spec.ts`
  - an explicit kill-switch precedence test in
    `apps/backend/src/evaluation/engine/evaluation-engine.spec.ts`
- Phase 9 release evidence was added:
  - `docs/release/security-review.md`
  - `docs/release/audit-log-release-review.md`
  - `docs/release/demo-script.md`
  - `docs/release/troubleshooting.md`
  - `docs/research/feature-flag-platform-research-report.md`
  - `docs/presentation/slide-outline.md`
- `README.md` gained submission-ready setup, migration, seed, run, and
  validation instructions.
- `docs/plan/implementation-roadmap.md` gained a Phase 9 validation note.
- `apps/demo/.env.example` was simplified to only expose
  `VITE_API_BASE_URL=http://localhost:3000/v1`, preserving the demo app as
  data-plane only.
- The session reported these release-gate checks as passing:
  - `npm run lint`
  - `npm run test`
  - `npm run test:integration --workspace=@ffp/backend`
  - `npm run test:e2e --workspace=@ffp/backend`
  - `npm run build`
  - `npm run prisma:validate --workspace=@ffp/backend`
  - `npm run diff:check`
- The session noted that integration and E2E tests needed unrestricted local
  execution because the sandbox could not connect to PostgreSQL or bind local
  Supertest ports.
- `markdownlint` was unavailable during the full Phase 9 validation, but later
  `node_modules/.bin/markdownlint` was available and passed for
  `docs/codex/reference/phase-9-release-readiness-completion.md`.
- The final short session answered what `markdownlint` is and how to set it up.
  The repo currently has a local `node_modules/.bin/markdownlint`, but
  `package.json` does not define a Markdown lint script or dependency.
- `docs/codex/reference/phase-9-release-readiness-completion.md` was created as
  the durable single-session reference for Phase 9.

## Current observed working tree notes

- Date interpreted for this file: `2026-06-21` in ICT (`+0700`), because the
  user requested yesterday's index on June 22, 2026.
- Current branch before writing this file: `develop`.
- Current `HEAD` before writing this file: `c5a59d4`
  (`Merge pull request #27 from fabyanbui/chore/release-readiness`).
- Working tree before writing this file was clean.
- `docs/codex/history/2026-06-21-context-index.md` did not exist before this
  update.
- June 21 work was committed through release-readiness commits `396cd9c`,
  `d9212de`, `4389bc8`, `f36de97`, `f000150`, `4168e99`, and `5324f11`, then
  completed shortly after midnight by `de6f70e` and merge commit `c5a59d4`.
- Current Codex context roots observed:
  - `.codex/agents/`
  - `.agents/skills/`
  - `docs/codex/history/`
  - `docs/codex/reference/`
- Ignored/local artifacts still should not be committed: `.env`, app-local
  `.env` files, `.playwright-browsers/`, `.playwright-mcp/`, `node_modules/`,
  app `dist/`, and backend `coverage/`.

## Best next prompt for Codex

Continue on `develop`. Read `AGENTS.md`, `docs/plan/project-goal.md`,
`docs/plan/implementation-roadmap.md`,
`docs/codex/history/2026-06-21-context-index.md`, and
`docs/codex/reference/phase-9-release-readiness-completion.md`. Review the
Phase 9 artifacts for final submission polish and run full Markdown linting if
available. Do not add recommended enhancements unless the required MVP remains
green. Preserve deterministic evaluation, safe defaults, append-only audit logs,
non-PII rollout keys, and control-plane/data-plane separation.

## Session index, compressed

- `22:54-23:03 ICT` /
  `rollout-2026-06-21T22-54-26-019eeae3-ebbe-7e03-90a8-197917b1408d.jsonl`:
  repo-scoped history-index maintenance created
  `docs/codex/history/2026-06-20-context-index.md`; committed as `396cd9c`.
- `22:55-23:54 ICT` /
  `rollout-2026-06-21T22-54-58-019eeae4-6b33-7b43-bdd8-9ec4457f8dd2.jsonl`:
  step-by-step Phase 9 release-readiness work created checklist, coverage map,
  Phase 9 demo-flow E2E, API-hardening E2E, kill-switch precedence coverage,
  security/audit release reviews, README updates, demo script, troubleshooting
  guide, final research report, slide outline, and roadmap validation note.
- `23:54-23:55 ICT` /
  `rollout-2026-06-21T23-54-23-019eeb1a-ce82-7f82-a6ec-787992511b94.jsonl`:
  answered what `markdownlint` is and how to set it up for this repo.
- `23:55-23:57 ICT` /
  continuation of `rollout-2026-06-21T22-54-58-...jsonl`: created
  `docs/codex/reference/phase-9-release-readiness-completion.md` and validated
  it with `git diff --check` plus `node_modules/.bin/markdownlint`.
