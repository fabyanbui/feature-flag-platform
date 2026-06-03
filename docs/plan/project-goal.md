# Project Goal — Feature Flag Platform

## Source

This goal is derived from `docs/requirement/requirement-init.md`. Treat that
initial requirement document as the product source for scope, deliverables, and
evaluation criteria. Treat `AGENTS.md` as the repository guardrail source for
implementation safety and agent behavior.

## Goal Statement

Build a safe feature release management system for web applications that
demonstrates how feature flags separate deployment from release. The platform
must let an administrator create and configure feature flags, evaluate those
flags for user contexts through an API, and show the result in a demo
application.

The project should be simple enough for a mini project, but technically credible
enough to demonstrate safe rollout practices, deterministic rule evaluation,
fast rollback through kill switches, and auditable configuration changes.

## Required MVP Deliverables

1. **Research report**
   - Explain feature flags and the problems they solve.
   - Compare deployment and release.
   - Describe release, experiment, ops/kill-switch, and permission flags.
   - Present the overall workflow of a feature flag system.
2. **Backend API**
   - Project management API.
   - Feature flag CRUD API.
   - Rule configuration API for global enable/disable, user ID allowlists,
     role targeting, and percentage rollout.
   - Evaluation API that accepts user context and returns whether a flag is
     enabled or disabled.
   - Audit log API for flag and rule changes.
3. **Frontend dashboard**
   - Project list screen.
   - Feature flag list screen.
   - Create/edit feature flag screen.
   - Rule configuration screen.
   - Audit log screen.
   - Clear display of feature flag status.
4. **Demo application**
   - Small web app that calls the evaluation API.
   - Show or hide a demo feature based on flag status.
   - Demonstrate global enable/disable plus role-based or percentage-based
     enablement.
5. **Minimum technical foundation**
   - Database tables for projects, flags, rules, sample user contexts, and
     audit logs.
   - Input validation and basic error handling.
   - README setup/run instructions for backend, frontend, and demo app.
   - Seed data or scripts for sample data.
   - Short design documentation covering architecture, schema, and API
     specification.

## Recommended Enhancements After MVP

Recommended work must not delay required MVP completion. Select only the
smallest set that improves demo or evaluation value after the MVP is working.

1. Redis or in-memory cache for flag evaluation results.
2. Simple JavaScript SDK for client integration.
3. Unit tests for rule evaluation.
4. Rule versioning or configuration change history.
5. Role-based access control with admin, developer, and viewer roles.
6. Statistics dashboard for evaluations per flag.
7. Group kill switch for disabling multiple flags quickly.
8. Docker Compose for one-command local setup.

## Non-Negotiable Guardrails

1. Keep control-plane concerns (management APIs and dashboard) separate from
   data-plane concerns (runtime evaluation path).
2. Evaluation responses must include `enabled`, `reason`, `projectKey`, and
   `flagKey`.
3. Missing project or flag must return `enabled=false` with `reason=NOT_FOUND`.
4. Default rule order is:
   1. Global disable / kill switch
   2. User allowlist
   3. Role targeting
   4. Percentage rollout
   5. Default off
5. Percentage rollout must be deterministic through stable hashing over a
   stable, non-PII rollout key.
6. Mutations for projects, flags, and rules must write append-only audit log
   entries with actor, timestamp, target, and before/after snapshots in the
   same transaction.
7. Feature flag status labels (`Enabled`, `Disabled`, `Archived`) are distinct
   from runtime state (`On`, `Off`).
8. Safe defaults must favor disabled/off behavior when evaluation cannot be
   completed reliably.

## Acceptance Criteria

1. A reviewer can read the research report and understand feature flags,
   deployment vs. release, flag types, rollout strategies, kill switches, audit
   logging, caching, consistency, defaults, and endpoint security.
2. A user can create a project, create a flag, configure rules, evaluate the
   flag, and inspect audit entries.
3. The demo app proves at least two scenarios:
   - global feature enable/disable,
   - role-based or percentage-based enablement.
4. Repeated evaluations for the same flag and user context return the same
   result and reason.
5. Configuration mutations are auditable and do not lose before/after context.
6. README instructions and seed data allow the project to be run for a local
   demonstration.
