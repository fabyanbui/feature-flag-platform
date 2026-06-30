# Codex Context History — 2026-06-27

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
- Read the newest prior index first: `docs/codex/history/2026-06-26-context-index.md`.
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

- One local June 27 session log had `cwd` set to this repository.
- The session used `.agents/skills/codex-history-index/SKILL.md` to update the
  previous day's history index.
- Because the active date was June 27, 2026 in ICT, the user's "yesterday"
  request was interpreted as June 26, 2026.
- Created `docs/codex/history/2026-06-26-context-index.md` from fourteen
  June 26 repo-scoped Codex session logs.
- The June 26 index captured these durable outcomes from prior sessions:
  - Phase 17 Docker Compose baseline,
  - Phase 18 optional Redis cache provider,
  - Phase 19 one-command Docker Compose stabilization,
  - Phase 20 final recommended release review,
  - PRs #37 through #41,
  - release-readiness caveats including optional Redis, Docker Buildx fallback,
    missing local `markdownlint`, and non-failing `pg` deprecation warnings.
- The June 27 session validated the new June 26 index with
  `git diff --check -- docs/codex/history/2026-06-26-context-index.md`.
- `markdownlint` was not installed locally, so optional Markdown linting was
  skipped for that update.
- No application code, schema, Docker, SDK, RBAC, cache, statistics, or release
  documentation was changed in the June 27 session beyond the history index.

## Current observed working tree notes

- Date interpreted for this file: June 27, 2026 in ICT (`+0700`).
- Current branch while writing this file: `develop`.
- Current `HEAD` while writing this file: `1336011`.
- Current `develop` is even with `origin/develop` before adding this June 27
  history file.
- Working tree was clean before adding this June 27 history file.
- `docs/codex/history/2026-06-26-context-index.md` exists in the filesystem and
  is the latest prior daily context index.
- Current roadmap records Phases 10 through 20 complete; no next recommended
  phase or unpassed gate is listed after Phase 20.
- `docker compose up --build` remains the stable local Docker demo workflow.
- Optional Redis remains behind the `redis` Compose profile and
  `EVALUATION_CACHE_PROVIDER=redis`; default cache provider remains `memory`.
- `.codex/` currently contains repo-scoped Codex configuration and agent files;
  `.agents/skills/` currently contains 17 repo-scoped skills.
- `markdownlint` availability should still be checked per context-index update;
  it was missing in the June 27 session.

## Best next prompt for Codex

Continue from current `develop`. Read `AGENTS.md`,
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

- `16:39-16:42 ICT`: Used `codex-history-index` to read June 26 session logs,
  filter them to this repository, create
  `docs/codex/history/2026-06-26-context-index.md`, run the required whitespace
  check, note that `markdownlint` was unavailable, and report the new file as
  the only working-tree change at that time.
