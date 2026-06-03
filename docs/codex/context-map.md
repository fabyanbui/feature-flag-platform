# Codex Context Map

## Core sources

- Initial requirement and source goal: `docs/requirement/requirement-init.md`
- Active project goal: `docs/plan/project-goal.md`
- Project guardrails: `AGENTS.md`
- Architecture: `docs/design/software-architecture-document.md`
- Project plan and roadmap: `docs/plan/project-plan.md`,
  `docs/plan/implementation-roadmap.md`
- Backend requirements: `docs/requirement/backend/be-init.md`
- Frontend requirements: `docs/requirement/frontend/fe-init.md`
- Demo requirements: `docs/requirement/demo/demo-app.md`,
  `docs/requirement/demo/minimal-mvp.md`
- Research report: `docs/requirement/feature-flag-research.md`
- Rollout behavior: `docs/research/rollout-strategies.md`
- Audit logging: `docs/research/audit-log-configuration-changes.md`

## Guardrails

Always follow `AGENTS.md`. Required MVP work from
`docs/requirement/requirement-init.md` must complete before recommended
enhancements. Preserve deterministic evaluation, append-only audit logging,
safe defaults, non-PII rollout keys, and clear control-plane/data-plane
separation.

## Important skills

- Use `rule-evaluation` for evaluation engine work.
- Use `audit-logging` for mutation flows.
- Use `api-design` for REST API design.
- Use `workflow-feature-delivery` for end-to-end features.
- Use `security-defaults` for targeting/privacy/client exposure review.
- Use `demo-scenarios` for demo app behavior.
- Use `ui-status-semantics` for dashboard status/runtime-state display.
- Use `workflow-quality-review` before demo/release.
