---
name: frontend-ui-ux-editor
description: General frontend UI/UX editing workflow for web apps. Use when Codex needs to implement or refine responsive UI from screenshots, design briefs, Figma notes, visual references, or UX feedback; improve layout, spacing, hierarchy, accessibility, states, interactions, or visual polish; make granular frontend changes; or verify frontend behavior with browser-based checks while reusing the current repo's framework, components, tokens, routing, state, and data-fetch patterns.
---

# Frontend UI/UX Editor

## Overview

Use this skill to turn visual references, design notes, or UX feedback into polished frontend code that fits the current project rather than creating a parallel design system. Prefer small, verifiable iterations: understand the existing UI conventions, implement the requested change, run build/lint/test checks when practical, then inspect the UI in a browser and refine.

## Workflow

1. **Clarify the target only when necessary**
   - Use provided screenshots, Figma notes, design briefs, product copy, and existing pages as the source of truth.
   - If details are ambiguous, choose the simplest implementation that preserves the intended hierarchy and note the assumption.
   - Do not block on missing pixel-perfect specs unless the change would be risky or irreversible.

2. **Discover the existing frontend system**
   - Read the repo guidance first: `AGENTS.md`, package scripts, app README files, and relevant frontend source.
   - If recommended-level work is affected, read the active phase and stop gate
     in `docs/plan/recommended-enhancements-roadmap.md`.
   - Identify the framework, routing, data-fetch, state, styling approach, design tokens, shared components, icon library, and test setup.
   - Reuse canonical primitives for buttons, inputs, cards, navigation, typography, color, spacing, dialogs, tables, forms, and feedback states.

3. **Plan a minimal UI edit**
   - Map the request to affected routes, components, styles, tests, and fixtures.
   - Keep behavior and data contracts stable unless the user requested a UX behavior change.
   - Preserve accessibility, responsiveness, loading states, empty states, error states, focus states, hover/active/selected states, and reduced-motion expectations.

4. **Implement in the repo's idioms**
   - Translate visual targets into existing utilities, wrappers, tokens, layout primitives, and component APIs.
   - Prefer semantic HTML and accessible components before custom interaction code.
   - Avoid hard-coded magic values when a token or shared utility exists; use minimal local overrides only to match the target.
   - Keep copy concise and consistent with nearby UI. Do not introduce unrelated redesigns.

5. **Verify mechanically**
   - Run the narrowest relevant checks first: typecheck, lint, unit/component tests, or app build according to the repo scripts.
   - Fix regressions introduced by the UI change. If a check cannot run, record the reason and continue with available validation.

6. **Verify visually with a browser when available**
   - Start or use the app according to repo instructions.
   - Use Playwright/browser tools when available to inspect real rendered UI, interactions, console errors, and responsive breakpoints.
   - Check desktop and mobile widths, keyboard navigation, loading/error/empty states, and any interaction included in the request.
   - Compare the implementation against provided references and iterate until it is directionally close.

## UI/UX Quality Checklist

- **Visual hierarchy:** clear primary action, readable headings, consistent grouping, no crowded layouts.
- **Spacing and alignment:** consistent rhythm, aligned edges, balanced density, no accidental overflow.
- **Responsive behavior:** works on common mobile, tablet, and desktop widths; avoids clipped text and horizontal scroll unless intentional.
- **Accessibility:** semantic controls, labels, alt text where needed, visible focus, keyboard support, sufficient contrast, no color-only status communication.
- **State coverage:** loading, disabled, hover, active, selected, empty, error, and success states are represented when relevant.
- **Authorization and runtime causes:** explain role-disabled controls and
  runtime-off reasons accessibly without confusing them with lifecycle status.
- **Design-system fit:** uses existing tokens/components and does not fork styling conventions.
- **Performance:** avoids unnecessary client work, layout thrash, oversized images, and animation that harms usability.
- **Maintainability:** keeps components cohesive, removes dead code, and avoids unrelated cleanup.

## Browser Validation Pattern

When browser tooling is available, prefer this loop:

1. Navigate to the edited route.
2. Capture the current rendered state or inspect the accessibility tree.
3. Resize to at least one narrow mobile width and one desktop width.
4. Exercise requested interactions with keyboard and pointer.
5. Check console/network errors.
6. Patch the smallest necessary UI changes.
7. Repeat until the visual and interaction issues are resolved.

If screenshots or visual references are provided, compare against them for layout, spacing, hierarchy, and responsive behavior. Prefer project tokens and components when exact pixel matching conflicts with maintainability.

## Response Expectations

When finishing a UI/UX task, report:

- What changed and where.
- Which design-system conventions or components were reused.
- Validation performed, including browser checks and responsive widths if used.
- Any assumptions, limitations, or follow-up design questions.
