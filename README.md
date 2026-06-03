# Feature Flag Platform

A lightweight feature flag platform for researching and demonstrating safe
feature release management in web applications.

## Project Goal

Build a mini feature flag management platform that separates code deployment
from feature release. The system provides:

1. A research report explaining feature flags, rollout strategies, kill
   switches, audit logs, API integration, caching, consistency, defaults, and
   endpoint security.
2. Backend REST APIs for projects, feature flags, rule configuration,
   evaluation, and audit logs.
3. An admin dashboard for project, flag, rule, and audit-log workflows.
4. A demo application that calls the evaluation API and shows or hides a demo
   feature based on flag results.

The active goal is documented in `docs/plan/project-goal.md` and is derived
from `docs/requirement/requirement-init.md`.

## MVP Guardrails

- Keep management/dashboard flows (control plane) separate from runtime
  evaluation (data plane).
- Evaluate rules deterministically using stable hashing for percentage rollout.
- Use safe defaults: missing project/flag returns `enabled=false` with
  `reason=NOT_FOUND`; unresolved matches fall back to default off.
- Write append-only audit entries for project, flag, and rule mutations with
  before/after snapshots in the same transaction.
- Keep feature flag status labels distinct from runtime state.

## Core Documentation

- Initial requirement: `docs/requirement/requirement-init.md`
- Project goal: `docs/plan/project-goal.md`
- Vision: `docs/plan/vision.md`
- Project plan: `docs/plan/project-plan.md`
- Roadmap: `docs/plan/implementation-roadmap.md`
- Architecture: `docs/design/software-architecture-document.md`
- Backend requirements: `docs/requirement/backend/be-init.md`
- Frontend requirements: `docs/requirement/frontend/fe-init.md`
- Demo app requirements: `docs/requirement/demo/demo-app.md`
- Research report: `docs/requirement/feature-flag-research.md`

## Current Repository Status

This repository is documentation-first. Keep source code, generated build
outputs, and documentation separated. When implementation is scaffolded, update
this README with exact setup, migration, seed, run, and test commands for the
backend API, admin dashboard, and demo app.

## Documentation Validation

For documentation-only changes, run:

```bash
git diff --check
```

If `markdownlint` is installed, also run:

```bash
markdownlint docs/**/*.md README.md AGENTS.md
```
