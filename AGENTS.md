# Repository Guidelines

## Project Structure & Module Organization

This repository is currently documentation-first. Core planning, requirements, research, and design artifacts live under `docs/`:

- `docs/plan/` contains vision and project planning.
- `docs/requirement/` contains backend, frontend, demo, and use-case requirements.
- `docs/research/` and `docs/competitor-analysis/` contain supporting analysis.
- `docs/design/software-architecture-document.md` is the architecture baseline.
- `.github/agents/`, `.github/prompts/`, `.github/skills/`, and `.github/instructions/` define GitHub Copilot workflows and project guardrails.
- `.agents/skills/` contains repo-scoped Codex skills mirrored from `.github/skills/` so Codex can discover the same project expertise.
- `.codex/agents/` contains repo-scoped Codex subagents converted from `.github/agents/` for specialized architecture, backend, frontend, database, test, security, and research work.

When implementation is added, keep the planned layers clear: backend API, domain/evaluation engine, persistence, admin UI, and demo app. Do not mix generated build output into `docs/`.

## Build, Test, and Development Commands

There is no application package manifest yet, so no repo-wide build or test command currently exists. Until implementation is scaffolded, validate documentation changes with:

- `git diff --check` to catch whitespace errors.
- `markdownlint docs/**/*.md README.md AGENTS.md` if `markdownlint` is installed.

Expected future stack from the architecture docs: NestJS, Prisma, PostgreSQL, REST/Swagger, and Jest. Once scaffolded, document exact commands such as `npm run start:dev`, `npm test`, `npm run lint`, and `npx prisma migrate dev` in `README.md` and keep this file aligned.

## Coding Style & Naming Conventions

Use concise Markdown with descriptive headings and relative links for documentation. Name docs in lowercase kebab-case, for example `feature-flag-key-considerations.md`.

For future TypeScript code, follow standard NestJS conventions: `*.module.ts`, `*.controller.ts`, `*.service.ts`, DTOs under a clear API boundary, and tests named `*.spec.ts`. Keep rule-evaluation logic deterministic and separated from controllers.

## Testing Guidelines

Current changes are documentation-only and should be reviewed for accuracy against `docs/design/software-architecture-document.md` and `.github/instructions/context.instructions.md`.

When code is added, use Jest for unit and integration tests. Prioritize tests for rule ordering, deterministic percentage rollout, kill-switch behavior, `NOT_FOUND` evaluation responses, and audit-log writes in the same transaction as mutations.

## Commit & Pull Request Guidelines

Recent commits use short imperative subjects such as `Add Software Architecture Document for Feature Flag Platform` and `Refine software architecture document...`. Follow that style: start with a verb, keep the subject specific, and avoid vague messages like `update docs`.

Pull requests should include a brief summary, affected paths, validation performed, and links to related issues or planning docs. UI changes should include screenshots once frontend implementation exists. Security-sensitive changes must call out authorization, audit logging, and data exposure impacts.

## Agent-Specific Instructions

Treat `.github/instructions/` as the source of project guardrails. Preserve safe defaults, deterministic evaluation, append-only audit logging, and clear separation between control-plane and data-plane concerns.

When adding or changing variables in `.env`, also update `.env.example` in the same change with sanitized, commit-safe placeholder values. Never copy real secrets or personal tokens into `.env.example`.
