# Repository Guidelines

## Project Goal Source

The active project goal is derived from
`docs/requirement/requirement-init.md` and
`docs/requirement/info-init.md`, and summarized in `docs/plan/project-goal.md`.
Keep documentation, implementation choices, and Codex agent behavior aligned to
that goal: a mini feature flag management platform with a research report,
backend API, frontend dashboard, demo application, persistent storage,
validation, error handling, seed data, short design documentation, and a
presentation-ready explanation of practical value, technology choices,
comparison with existing solutions, and visible problem-solving, design
thinking, and system thinking. Slides and the research report are required final
artifacts; recommended-level requirements are a plus after the required MVP is
stable.

## Project Structure & Module Organization

This repository uses an npm workspace with implementation under `apps/` and
project knowledge under `docs/`:

- `apps/backend/` contains the NestJS backend API and future Prisma-backed
  persistence/evaluation modules.
- `apps/admin/` contains the admin dashboard.
- `apps/demo/` contains the demo application that calls the evaluation API.
- `docs/plan/` contains vision and project planning.
- `docs/requirement/` contains backend, frontend, demo, and use-case requirements.
- `docs/research/` and `docs/competitor-analysis/` contain supporting analysis.
- `docs/design/software-architecture-document.md` is the architecture baseline.
- `.codex/agents/` contains repo-scoped Codex subagents for specialized architecture, backend, frontend, database, test, security, and research work.
- `.agents/skills/` contains repo-scoped Codex skills so Codex can discover the same project expertise.

Keep planned layers clear: backend API, domain/evaluation engine, persistence,
admin UI, and demo app. Do not mix generated build output into `docs/`.

## Build, Test, and Development Commands

Use the root npm workspace commands documented in `README.md`:

- `npm install` to install dependencies.
- `npm run dev:backend` to start the backend API.
- `npm run dev:admin` to start the admin dashboard.
- `npm run dev:demo` to start the demo app.
- `npm run build` to build all workspaces that define a build script.
- `npm run test` to run workspace tests.
- `npm run lint` to run workspace lint checks.
- `npm run diff:check` or `git diff --check` to catch whitespace errors.

For documentation-only changes, also run `markdownlint docs/**/*.md README.md
AGENTS.md` if `markdownlint` is installed. Keep this file aligned when package
scripts or local workflow commands change.

## Coding Style & Naming Conventions

Use concise Markdown with descriptive headings and relative links for documentation. Name docs in lowercase kebab-case, for example `feature-flag-key-considerations.md`.

For future TypeScript code, follow standard NestJS conventions: `*.module.ts`, `*.controller.ts`, `*.service.ts`, DTOs under a clear API boundary, and tests named `*.spec.ts`. Keep rule-evaluation logic deterministic and separated from controllers.

## Testing Guidelines

Current changes are documentation-only and should be reviewed for accuracy against `docs/design/software-architecture-document.md` and this file.

When code is added, use Jest for unit and integration tests. Prioritize tests for rule ordering, deterministic percentage rollout, kill-switch behavior, `NOT_FOUND` evaluation responses, and audit-log writes in the same transaction as mutations.

## Commit & Pull Request Guidelines

Recent commits use short imperative subjects such as `Add Software Architecture Document for Feature Flag Platform` and `Refine software architecture document...`. Follow that style: start with a verb, keep the subject specific, and avoid vague messages like `update docs`.

Pull requests should include a brief summary, affected paths, validation performed, and links to related issues or planning docs. UI changes should include screenshots once frontend implementation exists. Security-sensitive changes must call out authorization, audit logging, and data exposure impacts.

## Agent-Specific Instructions

Treat this file as the source of project guardrails. Preserve safe defaults, deterministic evaluation, append-only audit logging, and clear separation between control-plane and data-plane concerns.

Project guardrails:
- `docs/requirement/requirement-init.md` is the product source for required and
  recommended deliverables.
- `docs/requirement/info-init.md` is the source for submission dates, required
  slides/report, and mentor evaluation criteria.
- `docs/codex/mcp-tool-selection.md` defines when Codex should use the Prisma
  MCP versus the PostgreSQL readonly MCP.
- Single backend service hosts management and evaluation endpoints.
- MVP stack is NestJS, Prisma, PostgreSQL, REST/Swagger, Jest, and in-memory cache.
- Default rule order is global disable -> user allowlist -> role targeting -> percentage rollout -> default off.
- Percentage rollout must be deterministic using stable hashing.
- Evaluation responses must include `enabled`, `reason`, `projectKey`, and `flagKey`.
- Missing project or flag returns `enabled=false` with `reason=NOT_FOUND`.
- Mutations for projects, flags, and rules must write append-only audit entries with before/after snapshots in the same transaction.
- Use stable, non-PII identifiers for targeting and rollout keys.
- Feature flag status labels (Enabled/Disabled/Archived) are distinct from runtime state (On/Off).

MCP usage guardrails:
- Prefer repository files and deterministic tests before live database MCP calls.
- Use the Prisma MCP for Prisma Postgres control-plane operations, such as
  database discovery, database creation, connection strings, backups/recovery,
  Prisma-managed introspection, and explicitly approved schema/data operations.
- Use the PostgreSQL readonly MCP for data-plane inspection only, such as
  schema/table descriptions, SELECT-only validation, migration/seed checks,
  query plans, locks, bloat/index checks, health checks, and audit-log review.
- Never use the PostgreSQL readonly MCP for writes, schema updates, connection
  string management, database creation, or backups.
- Do not expose secrets or connection strings in responses unless explicitly
  requested, and require confirmation before any MCP action that can mutate
  data, alter schema, or manage cloud resources.
