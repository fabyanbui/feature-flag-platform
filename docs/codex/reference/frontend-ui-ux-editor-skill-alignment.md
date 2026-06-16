# Frontend UI/UX Editor Skill Alignment

Purpose: durable handoff for the repo-scoped `frontend-ui-ux-editor` skill and
the Codex docs/config files updated to make future UI work discoverable.

## Skill added

- `.agents/skills/frontend-ui-ux-editor/SKILL.md`
- `.agents/skills/frontend-ui-ux-editor/agents/openai.yaml`

The skill is intentionally general frontend guidance, not feature-flag-specific.
It should trigger for UI/UX edits from screenshots, design briefs, Figma notes,
visual references, or UX feedback. It tells Codex to reuse the current repo's
components, tokens, routing, state, and data-fetch patterns, then validate with
browser/Playwright checks when available.

## Source rationale

OpenAI's Codex frontend-design use case
(`https://developers.openai.com/codex/use-cases/frontend-designs`) recommends
translating screenshots and design briefs into code that matches the repo's
design system, then using Playwright/browser checks across screen sizes and
iterating until the UI is directionally close to the visual references.

## Repo alignment updates

- `AGENTS.md`: notes that `.agents/skills/` includes general frontend UI/UX
  guidance and adds `frontend-ui-ux-editor` to agent guardrails.
- `.codex/config.toml`: adds a project instruction to use the skill for
  frontend UI/UX work and validate with browser/Playwright checks when
  available.
- `.codex/agents/frontend-engineer.toml`: adds the skill as a primary input and
  makes responsive, accessible, design-system-aligned visual validation part of
  expected frontend output.
- `.codex/agents/test-engineer.toml`: adds the skill as context for frontend
  changes and calls out UI regression checks.
- `docs/codex/context-map.md`: lists `frontend-ui-ux-editor` under important
  skills.
- `docs/codex/task-template.md`: adds frontend/UI skill context and UI/UX
  validation guardrails for future task prompts.

## How future Codex sessions should use it

- Use `frontend-ui-ux-editor` first for generic UI/UX polish, visual-reference
  implementation, responsive layout, accessibility, and browser validation.
- Pair it with project-specific skills when the UI change touches feature-flag
  semantics:
  - `ui-status-semantics` for Enabled/Disabled/Archived versus runtime On/Off.
  - `demo-scenarios` for evaluation API demo behavior.
  - `security-defaults` for client-side exposure or targeting data concerns.
- Keep required MVP delivery ahead of optional design enhancements unless the
  UI change directly supports demo or presentation readiness.
