# Codex Context History — 2026-06-02

Purpose: compact context for future Codex sessions. Use this as an index, not a transcript.

## Read first

- Active repo authority: `AGENTS.md`.
- Durable Codex context files:
  - `docs/codex/context-map.md`
  - `docs/codex/task-template.md`
  - `docs/codex/history/*.md`
  - `.codex/config.toml`
  - `.codex/agents/*.toml`
  - `.agents/skills/*/SKILL.md`
- Do not trust chat history over the current filesystem. Always inspect files before coding.

## Repo guardrails to keep

- Single backend service hosts management and evaluation endpoints.
- MVP stack: NestJS, Prisma, PostgreSQL, REST/Swagger, Jest, in-memory cache.
- Evaluation rule order: global disable -> user allowlist -> role targeting -> percentage rollout -> default off.
- Percentage rollout must be deterministic with stable hashing.
- Evaluation response must include `enabled`, `reason`, `projectKey`, `flagKey`.
- Missing project/flag returns `enabled=false`, `reason=NOT_FOUND`.
- Project/flag/rule mutations must write append-only audit logs with before/after snapshots in the same transaction.
- Use stable non-PII IDs for targeting and rollout.
- Flag status labels are lifecycle labels, separate from runtime On/Off state.

## What happened today

### 1. Codex setup and context strategy

- Reviewed Codex config/docs and repo `.codex/config.toml`.
- Decided stable context belongs in Git, not only in chats.
- `AGENTS.md` became the single active project guardrail source after `.github` cleanup.
- Repo-scoped agents and skills are the main workflow mechanism.

### 2. Repo exploration

- Researcher/explorer sessions confirmed the repo was docs-first.
- Important docs:
  - `docs/design/software-architecture-document.md`
  - `docs/requirement/backend/be-init.md`
  - `docs/requirement/frontend/fe-init.md`
  - `docs/requirement/demo/minimal-mvp.md`
  - `docs/requirement/demo/demo-app.md`
  - `docs/plan/project-plan.md`

### 3. MCP notes

- GitHub MCP:
  - Initially unavailable in some sessions.
  - Later verified with `get_me` and branch listing.
  - Keep GitHub tokens out of committed files and remote URLs.
- Playwright MCP:
  - Many failures were browser path/config reload issues.
  - Restart Codex after MCP config/env changes.
  - Prefer isolated browser sessions for repeat tests.
  - `.env` can hold browser path variables, but shell/wrapper expansion may be needed.
- Postgres MCP:
  - Recommended only as read-only by default.
  - Use a dedicated read-only database role.
  - Keep `DATABASE_URL` in `.env`, not committed config.

### 4. Env and repo hygiene

- `.env.example` was created from `.env` shape using safe placeholders.
- Rule: whenever `.env` variable shape changes, update `.env.example` with commit-safe placeholders.
- `.github` folder was removed; Codex-facing config/instructions were updated to use `.codex/` and `.agents/skills/`.

### 5. MVP implementation attempt

A session using `workflow-feature-delivery` planned and attempted a full MVP implementation:

- `apps/api`: NestJS + Prisma backend.
- `apps/admin`: Vite React admin UI.
- `apps/demo`: Vite React demo app.
- `packages/contracts`: shared evaluation/reason-code types.
- Prisma schema, migration, seed data.
- `/v1` APIs for projects, flags, rules, audit logs, sample users, evaluation.
- Deterministic SHA-256 percentage rollout buckets.
- Append-only audit logging for mutations.
- Admin UI for flags/rules/evaluation/audit logs.
- Demo UI for global toggle, role targeting, percentage rollout.

Important caveat:

- Later inspection showed current `apps/` and `packages/` contain ignored generated artifacts only.
- Source files from that MVP attempt were not visible in the current tree.
- Before continuing implementation, run:

```bash
git status --short --ignored
find apps packages -type f | sort | sed -n '1,240p'
```

If source files are missing, treat the MVP session as a blueprint, not current code.

## Current observed working tree notes

During this history rewrite, repo status included:

```text
 M .codex/config.toml
 M .gitignore
?? docs/codex/
```

Also observed as ignored:

```text
.env
apps/
node_modules/
packages/
```

Do not commit `.env`, `node_modules/`, build output, or generated artifacts.

## Best next prompt for Codex

Use this when resuming MVP work:

```text
Use AGENTS.md and docs/codex/history/2026-06-02-context-index.md as context.
First inspect the current filesystem and git status.
Do not assume the previous MVP implementation source files exist.
If source files are missing, recreate the MVP in small phases:
1. scaffold workspace
2. Prisma schema and seed
3. backend evaluation/API/audit logs
4. admin UI
5. demo UI
6. tests and README
Preserve deterministic evaluation, append-only audit logging, safe defaults, and control-plane/data-plane separation.
```

## Session index, compressed

- 09:05 — basic Codex config and subagent guidance.
- 09:14–09:45 — researcher/explorer repo briefing.
- 09:52 — Codex context and instruction discovery research.
- 10:37 — multi-agent workflow review.
- 10:45–14:00 — Playwright MCP setup and smoke testing.
- 11:13–12:13 — GitHub MCP setup and authentication checks.
- 14:03 — `.env.example` and env hygiene.
- 14:11 — `.github` cleanup; Codex-only local workflow files.
- 14:48 — Postgres MCP read-only setup research.
- 15:07 — MVP implementation attempt with multi-agent planning sidecars.
- 19:13–21:27 — context/prompt storage strategy for future Codex work.
- 21:20 — generated original detailed history, later simplified into this context index.
