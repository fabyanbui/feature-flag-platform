# Codex Context History — 2026-06-23

Purpose: compact context for future Codex sessions. Use this as an index, not a
transcript.

## Read first

- Active authority: `AGENTS.md`.
- Product and deadline sources:
  - `docs/requirement/requirement-init.md`
  - `docs/requirement/info-init.md`
  - `docs/plan/project-goal.md`
- Submission remains due July 7, 2026; presentation is July 9, 2026. Slides and
  the research report are required.
- Read `docs/codex/history/2026-06-22-context-index.md` for the preceding MVP
  release-readiness review.
- `docs/plan/recommended-enhancements-roadmap.md` is now the detailed plan for
  optional post-MVP work. No recommended application feature was implemented
  in the indexed sessions.
- Durable Codex context remains under `docs/codex/`, `.codex/agents/`, and
  `.agents/skills/`.

## Repo guardrails to keep

- Protect the required MVP before starting recommended enhancements.
- Preserve deterministic evaluation, stable percentage hashing, safe defaults,
  and fail-closed `NOT_FOUND` behavior.
- Preserve append-only audit logs with before/after snapshots in the same
  transaction as project, flag, and rule mutations.
- Keep management/control-plane concerns separate from runtime evaluation.
- Use stable, non-PII targeting and rollout keys.
- Keep lifecycle/status labels distinct from runtime On/Off state.
- Prefer repository files and deterministic tests before database MCP calls.
- Keep `.env.example` aligned with `.env` variable shape using safe
  placeholders; never copy secrets or raw session metadata into documentation.

## What happened today

- Two local Codex logs were found for June 23, 2026, and both had `cwd` set to
  this repository.
- The first session created and validated
  `docs/codex/history/2026-06-22-context-index.md`; it was committed as
  `b6de4c2`.
- An MVP requirements review concluded that the current project covers the
  required research report, backend APIs, dashboard, demo app, database,
  validation/error handling, seed data, and design/run documentation.
- That review reported successful validation:
  - `npm run test` with 199 tests passing
  - `npm run build`
  - backend Prisma validation, integration tests, and end-to-end tests
  - `npm run diff:check`
- Submission polish still noted by that review:
  - turn `docs/presentation/slide-outline.md` into actual slides if required,
  - document archive/restore as the safe alternative to hard-delete CRUD,
  - replace the default-looking `apps/admin/README.md` content.
- The second workstream created
  `docs/plan/recommended-enhancements-roadmap.md`, covering all eight
  recommended requirements without implementing application code.
- The roadmap was then redesigned to reduce rework:
  - cache reusable evaluation snapshots, not per-user final results,
  - use existing `AuditLogEntry` records for configuration history by default,
  - standardize group models as `FlagGroup` and `FlagGroupConfig`,
  - use server-resolved bearer demo identities for RBAC,
  - count every evaluation request in statistics, including cache hits,
  - split Docker Compose into baseline and stabilization phases,
  - add domain, runtime, and Redis stop gates.
- The roadmap now locks this recommended-level precedence:
  `FLAG_ARCHIVED` -> `FLAG_DISABLED` -> `GROUP_KILL_SWITCH` ->
  `KILL_SWITCH` -> `GLOBAL_ON` -> ordered enabled rules -> `DEFAULT_OFF`.
- The initial roadmap was committed on June 23 as `f85c35b`. The revised,
  filesystem-authoritative roadmap was committed shortly after midnight on
  June 24 as `cebdf5d`.
- Another June 23 commit, `5da4f4f`, added the June 21 context index.

## Current observed working tree notes

- Date interpreted for this file: June 23, 2026 in ICT (`+0700`), because the
  user requested yesterday's index on June 24, 2026.
- Current branch before writing this file: `develop`.
- Current `HEAD` before writing this file: `cebdf5d`.
- Working tree was clean before this file was added.
- Current roadmap is 1,029 lines and orders recommended work from Phase 10
  evaluation tests through Phase 20 final recommended release review.
- The previous day's three P2 review concerns remain visible in the filesystem
  and were not fixed during these documentation sessions:
  - request-body implicit conversion remains enabled in
    `apps/backend/src/main.ts`,
  - `sort=status` still maps to `createdAt` in
    `apps/backend/src/feature-flags/feature-flags.service.ts`,
  - clearing a flag description still sends `undefined` from
    `apps/admin/src/pages/FlagForm.tsx`.
- Trust the current roadmap over the first roadmap draft recorded in the
  session log.

## Best next prompt for Codex

Continue on `develop`. Read `AGENTS.md`,
`docs/codex/history/2026-06-22-context-index.md`,
`docs/codex/history/2026-06-23-context-index.md`, and
`docs/plan/recommended-enhancements-roadmap.md`. Protect the stable MVP first:
fix and test the three remaining P2 issues for boolean coercion, `sort=status`,
and explicit description clearing. Then, only if the MVP remains green, begin
Phase 10 evaluation tests and precedence-contract work. Do not skip roadmap
stop gates or implement Redis before Gate C.

## Session index, compressed

- `22:44-22:48 ICT` /
  `rollout-2026-06-23T22-44-12-019ef527-463a-78f1-9a6c-5806cfdedb04.jsonl`:
  created and validated the June 22 context index.
- `22:50-23:43 ICT` /
  `rollout-2026-06-23T22-48-19-019ef52b-0c11-7af1-97e1-ff4ed0181813.jsonl`:
  reviewed MVP readiness, ran the full validation set, created the recommended
  enhancements roadmap, and revised its cache, history, precedence, group,
  statistics, SDK, RBAC, Docker, ordering, and stop-gate decisions.
