# Project Goal — Feature Flag Platform

## Source

This goal is derived from:

1. `docs/requirement/requirement-init.md` — product topic, scope, expected
   deliverables, recommended enhancements, and evaluation criteria.
2. `docs/requirement/info-init.md` — submission dates and mentor evaluation
   criteria.

Treat those initial requirement documents as the product source for scope,
deliverables, dates, and evaluation criteria. Treat `AGENTS.md` as the
repository guardrail source for implementation safety and agent behavior.

## Goal Statement

Build a safe feature release management system for web applications that
demonstrates how feature flags separate deployment from release. The platform
must let an administrator create and configure feature flags, evaluate those
flags for user contexts through an API, and show the result in a demo
application.

The project should be simple enough for a mini project, but technically credible
enough to demonstrate safe rollout practices, deterministic rule evaluation,
fast rollback through kill switches, and auditable configuration changes.

## Delivery Dates

1. **Submission deadline:** July 7, 2026.
2. **Presentation:** July 9, 2026.

All plans, implementation sequencing, and recommended enhancements must protect
these dates. Slides and the research report are required delivery artifacts.
The required MVP is the protected release baseline. Continue recommended work
through `docs/plan/recommended-enhancements-roadmap.md`, preserving its stop
gates and keeping every increment reversible and independently testable.

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

Recommended work must not regress required MVP completion. Follow the active
recommended roadmap and stop at the latest passing gate if delivery risk rises.

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
4. Authoritative evaluation precedence is:
   1. Archived flag
   2. Disabled flag environment config
   3. Group kill switch
   4. Flag kill switch
   5. Global on
   6. Ordered enabled rules: user allowlist, role targeting, percentage rollout
   7. Default off
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
7. Slides and the research report are complete enough to explain the problem,
   solution, workflow, architecture, technology choices, and comparison with
   existing solutions.
8. The team can explain why this mini project is needed, what practical value
   it provides, and what is novel or differentiating compared with existing
   feature flag solutions.
9. The team can explain the chosen technologies and why they were selected over
   reasonable alternatives.
10. The live presentation demonstrates both the working project and the
   engineering mindset expected of a Viettel Digital Talent 2026 participant:
   clear understanding, problem-solving, design thinking, system thinking,
   pragmatic tradeoffs, practical value, and delivery discipline.

## Presentation and Mentor Evaluation Fit

The project should be prepared so a presenter can answer:

1. What problem does this mini project solve, and why build it?
2. What are feature flags, and how do they separate deployment from release?
3. What is novel or practically valuable about this implementation?
4. How does it compare with existing solutions such as LaunchDarkly, Unleash,
   Flagsmith, ConfigCat, and Split?
5. Which technologies were used, and why were they chosen instead of
   alternatives?
6. How does the demo prove safe rollout, targeting, rollback, and auditability?
7. How do the slides and report show problem-solving, design thinking, and
   system thinking?
8. Which recommended-level requirements were completed after MVP, why were they
   worth the extra scope, and which roadmap gates controlled delivery risk?

## Active Delivery Routing

- `docs/plan/implementation-roadmap.md` is the completed MVP implementation
  history and regression baseline.
- `docs/plan/recommended-enhancements-roadmap.md` is the active source for
  recommended phases, completion evidence, and Gate A/B/C sequencing.
- Determine current phase status from checked completion evidence in the active
  roadmap and repository tests, not from older session history.
