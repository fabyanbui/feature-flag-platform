# Codex Context Map

## Core sources

- Initial requirement and source goal: `docs/requirement/requirement-init.md`
- Submission and mentor criteria: `docs/requirement/info-init.md`
- Active project goal: `docs/plan/project-goal.md`
- Project guardrails: `AGENTS.md`
- MCP tool selection: `docs/codex/mcp-tool-selection.md`
- Architecture: `docs/design/software-architecture-document.md`
- Project plan: `docs/plan/project-plan.md`
- Completed MVP roadmap: `docs/plan/implementation-roadmap.md`
- Active recommended roadmap and gates:
  `docs/plan/recommended-enhancements-roadmap.md`
- Backend requirements: `docs/requirement/backend/be-init.md`
- Frontend requirements: `docs/requirement/frontend/fe-init.md`
- Demo requirements: `docs/requirement/demo/demo-app.md`,
  `docs/requirement/demo/minimal-mvp.md`
- Research report: `docs/requirement/feature-flag-research.md`
- Rollout behavior: `docs/research/rollout-strategies.md`
- Audit logging: `docs/research/audit-log-configuration-changes.md`

## Guardrails

Always follow `AGENTS.md`. The required MVP is the protected release baseline;
recommended work now follows
`docs/plan/recommended-enhancements-roadmap.md` in phase and gate order. Current
dates from `docs/requirement/info-init.md` are submission
on July 7, 2026 and presentation on July 9, 2026. Criteria from
`docs/requirement/info-init.md` require a demonstrable project, required slides
and report, clear technology rationale, practical value/novelty, comparison
with existing solutions, and visible problem-solving, design thinking, and
system thinking. Preserve deterministic evaluation, append-only audit logging, safe
defaults, non-PII rollout keys, and clear control-plane/data-plane separation.

## Important skills

- Use `rule-evaluation` for evaluation engine work.
- Use `audit-logging` for mutation flows.
- Use `api-design` for REST API design.
- Use `workflow-feature-delivery` for end-to-end features.
- Use `security-defaults` for targeting/privacy/client exposure review.
- Use `demo-scenarios` for demo app behavior.
- Use `frontend-ui-ux-editor` for general frontend UI/UX edits from screenshots,
  design briefs, Figma notes, visual references, or UX feedback, including
  responsive and browser-based visual checks.
- Use `ui-status-semantics` for dashboard status/runtime-state display.
- Use `workflow-quality-review` before demo/release.
- Use `evaluation-runtime-reliability` for snapshot cache and aggregate stats.
- Use `javascript-sdk-delivery` for `@ffp/js-sdk` and demo migration.
- Use `demo-rbac` for server-resolved demo identities and permission checks.
- Use `docker-compose-delivery` for Docker startup, health, init, and Redis.

## MCP tool usage

- Prefer local repo files, Prisma schema/migrations, tests, and docs before
  live MCP calls.
- Use the Prisma MCP for Prisma Postgres control-plane work: managed database
  discovery/creation, connection strings, backups/recovery, managed
  introspection, and explicitly approved schema/data operations.
- Use the PostgreSQL readonly MCP for data-plane inspection:
  schema descriptions, SELECT-only checks, seed/audit verification, query
  plans, locks, health, indexes, bloat, roles, and privileges.
- Never use the PostgreSQL readonly MCP for writes, schema changes, database
  management, backups, or connection-string management.
