# Codex Context History — 2026-06-03

Purpose: compact context for future Codex sessions. Use this as an index, not a transcript.

## Read first

- Active repo authority: `AGENTS.md`.
- Product sources:
  - `docs/requirement/requirement-init.md`
  - `docs/requirement/info-init.md`
  - `docs/plan/project-goal.md`
- Durable Codex context files:
  - `docs/codex/context-map.md`
  - `docs/codex/task-template.md`
  - `docs/codex/history/*.md`
  - `docs/codex/reference/*.md`
  - `.codex/config.toml`
  - `.codex/agents/*.toml`
  - `.agents/skills/*/SKILL.md`
- Current branch head observed during this update: `develop` at `da540fa`
  (`origin/develop`), with one uncommitted `.gitignore` change.
- Trust the filesystem over chat history. Some earlier MVP source attempts still
  appear only as ignored generated directories, not tracked implementation.

## Repo guardrails to keep

- Required MVP before enhancements: research report, backend API, admin
  dashboard, demo app, database, validation/error handling, README run
  instructions, seed data, and short design docs.
- July dates from `docs/requirement/info-init.md`: submission July 1, 2026;
  presentation July 2, 2026.
- Single backend service hosts management and evaluation endpoints.
- MVP stack: NestJS, Prisma, PostgreSQL, REST/Swagger, Jest, in-memory cache.
- Keep control-plane APIs/dashboard separate from data-plane evaluation.
- Default rule order: global disable -> user allowlist -> role targeting ->
  percentage rollout -> default off.
- Percentage rollout must be deterministic with stable hashing over stable,
  non-PII rollout keys.
- Evaluation responses must include `enabled`, `reason`, `projectKey`, and
  `flagKey`; missing project or flag returns `enabled=false`,
  `reason=NOT_FOUND`.
- Project, flag, and rule mutations must write append-only audit logs with
  before/after snapshots in the same transaction.
- Feature flag status labels (`Enabled`, `Disabled`, `Archived`) are separate
  from runtime state (`On`, `Off`).

## What happened today

### Roadmap and project-goal alignment

- `docs/plan/implementation-roadmap.md` was added, then revised into phased MVP
  delivery:
  - Phase 0 contracts.
  - Scaffold/local workflow.
  - Data model and migrations.
  - Backend foundation.
  - Evaluation engine/data-plane API.
  - Management APIs with transactional audit logging.
  - Early vertical slice.
  - Admin UI, demo app, and release readiness.
- Project docs and Codex config were aligned to the initial requirement docs:
  - `docs/plan/project-goal.md` became the concise active goal summary.
  - `AGENTS.md`, `README.md`, `docs/plan/*`,
    `docs/design/software-architecture-document.md`,
    `docs/requirement/use-case-specification.md`, `docs/codex/*`,
    `.codex/config.toml`, and `.codex/agents/*.toml` were updated around the
    MVP goal and July evaluation criteria.
- The roadmap was later reviewed as ready to start implementation. The durable
  reference is
  `docs/codex/reference/implementation-roadmap-start-readiness-review.md`.

### Durable Codex reference workflow added

- Added repo-scoped skills:
  - `.agents/skills/codex-session-reference/SKILL.md`
  - `.agents/skills/codex-latest-response-reference/SKILL.md`
- Added skill metadata under each skill's `agents/openai.yaml`.
- Added `docs/codex/reference/codex-session-reference-skills.md` to explain
  how topic-based reference docs differ from daily history indexes.
- Current reference convention: use content-based, lowercase kebab-case file
  names under `docs/codex/reference/`; no dates, timestamps, random IDs, or
  generic names.

### API and evaluation contract decisions discussed

- Suggested final MVP evaluation response shape includes a future-compatible
  boolean `variant` derived from `enabled`:
  - `enabled=true` -> `variant="on"`
  - `enabled=false` -> `variant="off"`
- Suggested MVP reason enum from discussion:
  - `GLOBAL_DISABLED`
  - `GLOBAL_ON`
  - `USER_ALLOWLIST`
  - `ROLE_MATCH`
  - `PERCENTAGE_ROLLOUT`
  - `DEFAULT_OFF`
  - `NOT_FOUND`
  - `INVALID_CONTEXT`
  - `ERROR`
- Keep public missing-project and missing-flag evaluation response as one
  `NOT_FOUND` reason to match guardrails and avoid leaking existence details.
- Bulk evaluate should be documented as future-compatible, not implemented
  early unless MVP risk is already low.
- These API/evaluation discussion decisions were observed in session logs but
  are not fully persisted in a dedicated API-contract doc yet. Next Phase 0
  work should write them down before backend implementation.

### Control-plane/data-plane and API conventions clarified

- Control-plane APIs manage configuration and are primarily used by the admin
  dashboard: projects, flags, rules, sample users, and audit logs.
- Data-plane API is runtime evaluation, primarily `POST /v1/evaluate`.
- Suggested MVP mutation convention: require `X-Actor` for control-plane
  `POST`, `PATCH`, `PUT`, and `DELETE` requests for auditability; it is not
  authentication and is not required for `POST /v1/evaluate`.
- Suggested API convention additions still need to be persisted: consistent
  error response shape, pagination, key validation, and audit header behavior.

### Codex `/goal` usage researched

- OpenAI/Codex docs were checked for `/goal` and Goal mode.
- Practical repo use: set a measurable objective for a task, phase, or overall
  project thread; keep longer instructions in files and point the goal at them.
- A project-level goal was created during the alignment session and later
  completed after docs/config updates passed validation.

### Commits observed from today's work

- `f5f6ba8` — added `docs/plan/implementation-roadmap.md`.
- `76b539c` — revised roadmap and enhanced project documentation/config.
- `fda0b01` — added Codex session/latest-response reference skills and docs.
- `da540fa` — added roadmap start readiness reference.

## Current observed working tree notes

- `git status --short` showed:

```text
 M .gitignore
```

- `.gitignore` now adds common generated/temporary ignores beyond `.env`:
  `node_modules/`, `dist/`, `**/dist/`, `coverage/`, `.vite/`,
  `*.tsbuildinfo`, `.DS_Store`, and `*.log`.
- `git status --short --ignored` also showed ignored `.env`, `apps/`,
  `node_modules/`, and `packages/`.
- `apps/` and `packages/` exist as ignored directories, but no tracked package
  manifest was found from the current filesystem scan. Treat them as caveats,
  not current MVP source, until explicitly inspected.
- No repo-wide build/test command exists yet. Documentation validation remains
  `git diff --check`; run `markdownlint` only if installed.

## Best next prompt for Codex

```text
Use AGENTS.md, docs/plan/project-goal.md, and docs/codex/history/2026-06-03-context-index.md as context.
Start Phase 0 by creating a concise API/design contract doc before scaffolding code.
Persist the evaluation contract, reason enum, optional boolean variant behavior, X-Actor audit header convention, error response shape, pagination/key validation conventions, and control-plane/data-plane endpoint split.
Keep required MVP deliverables ahead of enhancements and preserve deterministic evaluation, safe defaults, NOT_FOUND behavior, non-PII rollout keys, and transactional append-only audit logging.
Before editing, inspect git status and the ignored apps/packages caveat.
```

## Session index, compressed

- 09:45 — initial attempt to create a repeatable daily skill was interrupted;
  no durable outcome from that session.
- 09:48 — reviewed and edited `docs/plan/implementation-roadmap.md` for more
  realistic implementation sequencing.
- 10:02 — aligned project goal/docs/Codex config with
  `requirement-init.md`, then folded in dates and mentor criteria from
  `info-init.md`.
- 10:17 — researched Codex `/goal` usage from official docs.
- 10:31 — confirmed roadmap readiness; created durable reference-summarizing
  skills and `implementation-roadmap-start-readiness-review.md`.
- 11:44 — discussed evaluation response extensibility, reason codes,
  `NOT_FOUND` behavior, and deferring bulk evaluation.
- 20:46 — reviewed requirement traceability and explained control-plane vs
  data-plane APIs.
- 21:20 — reviewed API conventions around `/v1`, JSON, `X-Actor`, validation,
  error shape, pagination, and safe evaluation failures.
- 23:21 — updated this daily context index from local Codex session logs.
