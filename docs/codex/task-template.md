# Codex Task Template

## Goal

Implement ...

## Scope

Included:
- ...

Excluded:
- ...

## Required context

Read:
- `AGENTS.md`
- `docs/requirement/requirement-init.md`
- `docs/plan/project-goal.md`
- `docs/design/software-architecture-document.md`
- ...

## Guardrails

- Preserve deterministic evaluation.
- Preserve append-only audit logging.
- Preserve safe defaults, including `enabled=false` with `reason=NOT_FOUND`
  for missing project or flag.
- Use stable, non-PII identifiers for targeting and rollout keys.
- Keep management API and evaluation API separated.
- Complete required MVP deliverables before recommended enhancements.

## Expected output

- Code changes
- Tests
- Docs updates if needed

## Validation

Run:
- `npm test`
- `npm run lint`
