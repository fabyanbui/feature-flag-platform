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
- `docs/requirement/info-init.md`
- `docs/plan/project-goal.md`
- `docs/plan/implementation-roadmap.md`
- `docs/plan/recommended-enhancements-roadmap.md`
- `docs/design/software-architecture-document.md`
- ...

For frontend UI/UX work, also read:
- `.agents/skills/frontend-ui-ux-editor/SKILL.md`
- `docs/requirement/frontend/fe-init.md`
- `docs/requirement/demo/demo-app.md` if the demo app is affected

## Guardrails

- Preserve deterministic evaluation.
- Preserve append-only audit logging.
- Preserve safe defaults, including `enabled=false` with `reason=NOT_FOUND`
  for missing project or flag.
- Use stable, non-PII identifiers for targeting and rollout keys.
- Keep management API and evaluation API separated.
- Preserve the completed MVP as the release baseline.
- Follow the active recommended phase and Gate A/B/C prerequisites.
- Keep outputs submission- and presentation-ready for the current
  `docs/requirement/info-init.md` dates: slides and report are required;
  explain project need, practical value, technology choices, alternatives,
  comparison with existing solutions, problem-solving, design thinking, and
  system thinking when relevant.
- Keep each recommended enhancement reversible and independently testable.
- For UI/UX changes, reuse existing design-system components/tokens, preserve
  accessibility and responsive behavior, and use browser/Playwright checks when
  available.

## Expected output

- Code changes
- Tests
- Docs updates if needed

## Validation

Run:
- `npm test`
- `npm run lint`
