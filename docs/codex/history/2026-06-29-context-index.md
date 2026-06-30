# Codex Context History — 2026-06-29

Purpose: compact context for future Codex sessions. Use this as an index, not a
transcript.

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
- Read the latest prior indexes first:
  - `docs/codex/history/2026-06-28-context-index.md`
  - `docs/codex/history/2026-06-27-context-index.md`
  - `docs/codex/history/2026-06-26-context-index.md`
- Useful release-readiness references remain:
  - `docs/plan/requirement-traceability-matrix.md`
  - `docs/release/final-recommended-release-review.md`
  - `docs/release/demo-script.md`
  - `docs/release/troubleshooting.md`

## Repo guardrails to keep

- Preserve deterministic evaluation, stable percentage hashing, safe defaults,
  and fail-closed `NOT_FOUND` and `ERROR` behavior.
- Authoritative evaluation precedence remains:
  `FLAG_ARCHIVED` -> `FLAG_DISABLED` -> `GROUP_KILL_SWITCH` ->
  `KILL_SWITCH` -> `GLOBAL_ON` -> ordered enabled rules -> `DEFAULT_OFF`.
- Cache only reusable evaluation snapshots; never cache user-specific final
  decisions, raw context, targeting keys, roles, attributes, or matched rule
  IDs.
- Evaluation statistics remain aggregate and privacy-preserving.
- Preserve append-only audit entries with trusted before/after snapshots in the
  same transaction as control-plane mutations.
- Keep server-resolved RBAC authoritative; clients must not elevate by
  spoofing actor or role headers.
- Keep management/control-plane concerns separate from runtime evaluation and
  SDK data-plane concerns.
- Use stable, non-PII identifiers for targeting and rollout keys.
- Keep feature flag lifecycle/configuration status distinct from runtime On/Off
  state.
- Keep Redis optional; the stable demo path must not require Redis.
- Keep `.env.example` aligned with `.env` variable shape using safe
  placeholders only.

## What happened today

- Three local June 29 session logs had `cwd` set to this repository.
- A Codex concept Q&A explained sandboxing and approval behavior using the
  official Codex manual through the `openai-docs` skill:
  - `workspace-write` is the best default for normal repo coding,
  - `read-only` is useful for review/planning,
  - approvals should be used as checkpoints for network access, outside-repo
    writes, dependency installs, destructive commands, and MCP operations that
    can mutate data or expose secrets.
- A long project-understanding walkthrough was completed in Vietnamese for
  presentation/interview preparation. It inspected existing repo files rather
  than changing implementation:
  - project goal, requirements, deadline info, recommended roadmap, README,
    architecture, and traceability matrix,
  - npm workspace structure under `apps/` and `packages/`,
  - NestJS backend modules, Prisma schema, evaluation DTOs, repository,
    engine, stable rollout hashing, tests, and evaluation precedence,
  - control-plane REST APIs, auth/RBAC files, audit logging, and cache
    invalidation references,
  - in-memory/no-op/Redis evaluation snapshot cache providers,
  - `@ffp/js-sdk` contracts, response validation, and demo app integration,
  - admin dashboard routing, API client, auth context, status badges, flag
    history, statistics page, and RBAC UI behavior,
  - seed data, Docker Compose workflow, package scripts, test files, final
    release review, slide outline, research report, and demo script.
- The walkthrough produced reusable mental models and presentation prep:
  - control plane configures flags; data plane evaluates flags at runtime,
  - PostgreSQL is the source of truth; cache is an optimization,
  - audit logs explain changes; metrics observe aggregate activity,
  - SDK/client fallback should remain fail-closed,
  - mock interview answers and flashcards covered feature flags, project
    novelty, control/data plane, evaluation precedence, RBAC, audit, cache,
    statistics, and Docker demo workflow.
- A short dashboard Q&A clarified local startup and presentation expectations:
  - admin dashboard opens at `http://localhost:5173`,
  - backend API is `http://localhost:3000/v1`, and Swagger docs are
    `http://localhost:3000/docs`,
  - the admin dashboard is the control-plane UI for projects, flags, rules,
    groups, status, audit/history, RBAC behavior, and statistics,
  - statistics do not require charts; summary cards/tables satisfy the current
    requirement, and data may be empty until demo evaluations are generated.
- No durable code, schema, Docker, SDK, RBAC, cache, statistics, release-doc,
  or MCP configuration changes were made in the June 29 sessions.

## Current observed working tree notes

- Date interpreted for this file: June 29, 2026 in ICT (`+0700`).
- Current branch while writing this file: `develop`.
- Current `HEAD` while writing this file: `1336011`.
- Current `develop` is even with `origin/develop` before adding this June 29
  history file.
- Working tree already had two untracked history files before this update:
  - `docs/codex/history/2026-06-27-context-index.md`
  - `docs/codex/history/2026-06-28-context-index.md`
- Current roadmap records Phases 10 through 20 complete; no next recommended
  phase or unpassed gate is listed after Phase 20.
- `docker compose up --build` remains the stable local Docker demo workflow.
- Optional Redis remains behind the `redis` Compose profile and
  `EVALUATION_CACHE_PROVIDER=redis`; default cache provider remains `memory`.
- `.codex/` currently contains repo-scoped Codex configuration and agent files;
  `.agents/skills/` currently contains 17 repo-scoped skills.
- `markdownlint` availability should still be checked per context-index update;
  it was not installed during nearby history-index updates.

## Best next prompt for Codex

Continue from current `develop`. Read `AGENTS.md`,
`docs/codex/history/2026-06-29-context-index.md`,
`docs/codex/history/2026-06-28-context-index.md`,
`docs/codex/history/2026-06-27-context-index.md`,
`docs/codex/history/2026-06-26-context-index.md`,
`docs/plan/recommended-enhancements-roadmap.md`,
`docs/plan/requirement-traceability-matrix.md`, and
`docs/release/final-recommended-release-review.md`. Treat the MVP as the
protected baseline and Phase 20 as the current recommended-level release
decision. Keep the project submission-ready for July 7, 2026 and
presentation-ready for July 9, 2026. Preserve deterministic evaluation,
append-only audit logging, server-resolved RBAC, privacy-preserving cache and
statistics behavior, optional Redis, and the Docker Compose demo workflow. If
changing code, use small reversible increments and validate with the strongest
relevant npm, Prisma, Docker, and diff checks available.

## Session index, compressed

- `16:44-16:47 ICT`: Answered what Codex sandboxing is and how to leverage it
  for safe repo work; used official Codex manual via `openai-docs`.
- `17:00-20:03 ICT`: Deep Vietnamese project walkthrough for understanding,
  interview prep, and presentation readiness; inspected docs, code, tests,
  Docker, admin/demo, SDK, release docs, and used `api-design` for the REST API
  map portion; no files changed.
- `23:32-23:35 ICT`: Explained how to open the admin dashboard and clarified
  that statistics cards/tables are acceptable without charts; no files changed.
