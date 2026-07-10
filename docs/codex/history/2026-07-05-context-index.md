# Codex Context History — 2026-07-05

Purpose: compact context for future Codex sessions. Use this as an index, not a transcript.

## Read first

- Active authority: `AGENTS.md`.
- Product and deadline sources:
  - `docs/requirement/requirement-init.md`
  - `docs/requirement/info-init.md`
  - `docs/plan/project-goal.md`
- Roadmap sources:
  - `docs/plan/implementation-roadmap.md` is the protected completed MVP path.
  - `docs/plan/recommended-enhancements-roadmap.md` is the active enhancement
    path and gate source.
- Durable Codex context:
  - `docs/codex/`
  - `.codex/`
  - `.agents/skills/`
- Final release and presentation/report evidence to reuse:
  - `docs/release/final-recommended-release-review.md`
  - `docs/release/demo-script.md`
  - `docs/design/software-architecture-document.md`

## Repo guardrails to keep

- Preserve deterministic evaluation and stable non-PII rollout keys.
- Preserve fail-closed defaults and safe evaluation responses.
- Preserve append-only audit logging for control-plane mutations.
- Preserve control-plane/data-plane separation.
- Keep evaluation precedence aligned with `AGENTS.md`:
  archived flag -> disabled config -> group kill switch -> flag kill switch ->
  global on -> ordered enabled rules -> default off.
- Evaluation responses must include `enabled`, `reason`, `projectKey`, and
  `flagKey`; missing project or flag returns `enabled=false` with
  `reason=NOT_FOUND`.
- Recommended phases are complete through Phase 20 from roadmap and release
  evidence; avoid reopening gated work without failing evidence.
- Submission is due July 7, 2026 and presentation is July 9, 2026. Slides and
  report remain required final artifacts.

## What happened today

- Created the July 4 daily history index:
  - `docs/codex/history/2026-07-04-context-index.md`
  - Current git evidence shows commit `774fd6d`:
    `docs: add Codex context history index for 2026-07-04`.
- Most work targeted the sibling report repo
  `../VDT2026_MiniProject_report` while using this repo as source evidence:
  - Removed unused LaTeX heading labels from report files.
  - Reduced repeated report content across Ch. 1-4 and rebuilt the PDF.
  - Audited high-priority missing evidence needs without initially editing.
  - Generated report-ready Mermaid diagrams grounded in source code:
    architecture, control-plane/data-plane split, evaluation flow, evaluation
    precedence, cache invalidation/consistency, and Docker Compose startup.
  - Gave Swagger screenshot guidance: capture an overview of `/docs`, then use a
    concise endpoint summary table instead of a long full-page screenshot.
  - After the user supplied high-priority Mermaid/screenshot assets and asked to
    skip medium/low-priority items, updated the report with high-priority
    figures/tables only:
    - architecture and control-plane/data-plane diagrams,
    - evaluation and precedence diagrams,
    - cache invalidation and Docker Compose diagrams,
    - Backend API/OpenAPI and Frontend Dashboard screenshots,
    - backend endpoint summary table,
    - end-to-end demo scenario table from seed/source evidence,
    - automated test result table from actual test suites.
  - Also aligned report reason-code wording with implementation names such as
    `KILL_SWITCH`, `USER_ALLOWLIST`, `ROLE_MATCH`, and
    `PERCENTAGE_ROLLOUT`.
- One local backend runtime issue was debugged and fixed without repo file
  changes:
  - Symptom: Prisma failed at `db.project.count()` because `public.projects` did
    not exist in the local database/schema used by the backend.
  - Cause recorded in the session: backend was connected to an empty `ffp_dev`
    `public` schema.
  - Fix run locally: `npm run prisma:migrate:deploy --workspace=@ffp/backend`
    followed by `npm run db:seed --workspace=@ffp/backend`.
  - Validation observed tables and seeded rows including `projects`,
    `feature_flags`, `flag_groups`, `sample_user_contexts`, and
    `audit_log_entries`.
  - Durable rule: for a clean local DB, run migrations and seed before opening
    admin/demo; Docker Compose users should use the documented migrate/seed
    workflow.
- Later sessions were explanation-only and changed no repo files:
  - Backend walkthrough: modules, controllers, Prisma repositories,
    evaluation, audit, metrics, auth/RBAC, and error handling.
  - Cache explanation: evaluation snapshot cache stores config snapshots, not
    final per-user decisions, and invalidation follows control-plane mutations.
  - SDK explanation: `@ffp/js-sdk` is a data-plane JavaScript client for
    `POST /v1/evaluate`; it standardizes request/timeout/response handling and
    fail-closed fallback, but does not manage flags or evaluate rules locally.
  - Observability explanation: `audit_log_entries` answers who changed config
    and before/after state; `flag_evaluation_metrics` answers how often flags
    were evaluated and with which result/reason.

## Current observed working tree notes

- Date summarized: July 5, 2026, because the current session timezone is
  Asia/Saigon and the user asked for "yesterday" on July 6, 2026.
- Repo status before creating this file: clean working tree on
  `chore/demo-optimization-maintenance`, ahead of origin by 3 commits.
- Current repo commit evidence for this date includes `774fd6d`; the later
  local head is `e5776ed`, a Docker Compose env-var documentation commit.
- `~/.codex/sessions/2026/07/05/` contained 13 repo-scoped session logs whose
  first `session_meta.cwd` matched this repository.
- Sibling report repo `../VDT2026_MiniProject_report` currently reports clean on
  `main...origin/main`. It is outside this repo; inspect it directly before any
  future report edits because July 5 work mostly happened there.
- No MCP data-plane or Prisma cloud-control action was needed for this index.

## Best next prompt for Codex

Use `AGENTS.md` and `docs/codex/history/2026-07-05-context-index.md` as context.
Prepare final submission/presentation artifacts for the July 7, 2026 deadline
and July 9, 2026 presentation without regressing the completed MVP or Phase 20
recommended baseline. First inspect the current filesystem, especially
`../VDT2026_MiniProject_report`, `docs/release/`, and `README.md`; then validate
any implementation claim against source code and run targeted checks for touched
files.

## Session index, compressed

- `rollout-2026-07-05T01-03-39-019f2e4c-e6e3-79a1-a894-3c014418879b.jsonl`
  - Cwd matched this repo.
  - User requested `codex-history-index` for the previous day, but no durable
    assistant outcome or file change was recorded in this short log.
- `rollout-2026-07-05T10-39-15-019f305b-e130-7210-8fd3-2a51338b4150.jsonl`
  - Cwd matched this repo.
  - Outcome: created `docs/codex/history/2026-07-04-context-index.md`.
  - Validation in that session used a no-index whitespace check because
    `.git/index.lock` was read-only in the sandbox; `markdownlint` was not
    installed.
- `rollout-2026-07-05T10-49-02-019f3064-d590-7911-8d05-4c71469c9d64.jsonl`
  - Workstream: report cleanup in `../VDT2026_MiniProject_report`.
  - Removed unused heading labels, reduced duplicate report prose, ran LaTeX
    rebuild steps, listed high-priority evidence gaps, and iterated on Mermaid
    architecture diagrams based on repo source.
- `rollout-2026-07-05T15-49-26-019f3177-da92-7930-8ef0-500f80e2f155.jsonl`
  - Fork of the report/diagram workstream.
  - Produced source-grounded control-plane/data-plane Mermaid diagrams and a
    shorter PDF-friendly version.
- `rollout-2026-07-05T15-56-02-019f317d-e6ea-73c1-ad79-f87950b77068.jsonl`
  - Continued report diagram work.
  - Produced evaluation sequence diagrams and shorter variants grounded in
    `apps/backend/src/evaluation/*` and `packages/js-sdk`.
- `rollout-2026-07-05T16-06-04-019f3187-1571-7f11-9c8b-0d041265e954.jsonl`
  - Continued source-grounded diagram work.
  - Used `rule-evaluation` and checked `evaluation-engine.ts` /
    `stable-rollout-hash.ts` before producing compact precedence diagrams.
- `rollout-2026-07-05T16-14-54-019f318f-2c1a-7210-bd92-85d7468e9d63.jsonl`
  - Used `evaluation-runtime-reliability`.
  - Produced compact cache invalidation / consistency diagrams based on cache,
    audit, transaction, and invalidator source files.
- `rollout-2026-07-05T16-24-14-019f3197-b676-78d2-9871-9be555af05e0.jsonl`
  - Used Docker/source evidence to produce compact Docker Compose diagrams with
    localhost ports, service classes, optional Redis, and Prisma Studio.
- `rollout-2026-07-05T16-46-16-019f31ab-e275-7651-92ba-bd3430eb185c.jsonl`
  - Used `demo-scenarios`.
  - Built an end-to-end demo scenario matrix from `apps/backend/prisma/seed.ts`,
    `apps/demo/src/data/seed.ts`, `apps/demo/src/App.tsx`, and
    `packages/js-sdk/src/*`; a session note records that the table was inserted
    into the sibling report and PDF was rebuilt.
- `rollout-2026-07-05T16-59-15-019f31b7-c8ee-7871-b93b-cdfd12b8ce0a.jsonl`
  - Clarified that full Swagger screenshots are too long for the report.
  - Recommended a Swagger overview screenshot plus endpoint summary table.
- `rollout-2026-07-05T17-10-55-019f31c2-75c3-7313-8bf4-c761114b56b7.jsonl`
  - Used `data-modeling` for a local Prisma/PostgreSQL issue.
  - Ran backend migrations and seed against the local DB; no repo files changed.
- `rollout-2026-07-05T17-16-55-019f31c7-f1ed-7963-bdea-e544b0cbee79.jsonl`
  - Final high-priority report evidence pass after user-supplied assets.
  - Added high-priority figures/tables to the sibling report, left medium/low
    priority evidence out, aligned reason-code wording, and validated LaTeX/PDF.
- `rollout-2026-07-05T21-33-20-019f32b2-b443-7e80-9671-146f5d90b861.jsonl`
  - Explanation-only backend study session.
  - Covered cache, Docker Compose, SDK, `audit_log_entries`, and
    `flag_evaluation_metrics`; no repo file changes were recorded.
