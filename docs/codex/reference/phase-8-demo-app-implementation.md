# Phase 8 Demo App Implementation — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a
reference, not a transcript.

## Scope

This session guided Phase 8 of
[`docs/plan/implementation-roadmap.md`](../../plan/implementation-roadmap.md):
the demo application for the feature flag platform.

The user wanted step-by-step implementation coaching after completing Phase 7.
The work focused on making `apps/demo` presentation-ready and aligned with the
MVP requirement that a client app calls the evaluation API and shows/hides a
demo feature based on flag results.

## High-signal outcomes

- Confirmed the demo app should remain **data-plane only**:
  - It calls `POST /v1/evaluate`.
  - It does not create/update/delete projects, flags, rules, audit logs, or send
    admin actor headers.
  - Control-plane changes stay in the admin dashboard.
- Refactored the demo app concept from user-based selection to
  scenario-based selection.
- Defined five Phase 8 scenarios:
  - Global Toggle using `demo-project` / `beta-dashboard`.
  - Role Targeting — Beta Tester using `demo-user-beta`.
  - Percentage Rollout — Included User using `demo-rollout-on`.
  - Percentage Rollout — Excluded User using `demo-rollout-off`.
  - Missing Project / Flag using `missing-project` / `missing-flag`.
- Kept the evaluation request shape aligned to the backend DTO:

  ```json
  {
    "projectKey": "demo-project",
    "flagKey": "new-checkout",
    "context": {
      "targetingKey": "demo-user-beta",
      "userId": "demo-user-beta",
      "roles": ["beta-tester"]
    }
  }
  ```

- Improved the UI to show:
  - `projectKey`
  - `flagKey`
  - targeting key
  - user roles
  - runtime state
  - `enabled`
  - `reason`
  - loading, error, and retry states
- Made the gated feature card scenario-aware instead of hardcoding only New
  Checkout.
- Removed `VITE_ADMIN_ACTOR` from the demo app guidance because it is a
  control-plane/admin concept and Vite variables are browser-visible.
- Replaced the default Vite README for `apps/demo` with project-specific demo
  instructions.
- Added a Phase 8 validation note to the implementation roadmap.

## Files and artifacts

Primary files touched or made authoritative during this workstream:

- `apps/demo/src/App.tsx`
  - Introduced `EvaluationContext`, `DemoScenario`, and `demoScenarios`.
  - Changed app state from selected user index to selected scenario ID.
  - Sends `selectedScenario.projectKey`, `selectedScenario.flagKey`, and
    `selectedScenario.context` to `/evaluate`.
  - Renders a scenario selector and presenter notes.
  - Displays evaluation fields and targeting context.
  - Keeps retry tied to the currently selected scenario.
- `apps/demo/src/App.css`
  - Added styling for presenter notes and screen-reader-only loading text.
- `apps/demo/.env.example`
  - Kept only browser-safe demo configuration, preferably
    `VITE_API_BASE_URL=http://localhost:3000/v1`.
- `apps/demo/.env`
  - Treated as local-only; `VITE_ADMIN_ACTOR` should not remain in the demo app
    environment.
- `apps/demo/README.md`
  - Replaced default Vite content with demo-specific responsibility, setup,
    scenarios, presentation flow, and validation commands.
- `docs/plan/implementation-roadmap.md`
  - Added a Phase 8 validation note covering scenario-based evaluation,
    displayed fields, loading/error/retry, data-plane-only behavior, and no
    browser-exposed secrets.

Relevant source docs and guardrails:

- [`AGENTS.md`](../../../AGENTS.md)
- [`docs/requirement/demo/demo-app.md`](../../requirement/demo/demo-app.md)
- [`docs/plan/project-goal.md`](../../plan/project-goal.md)
- [`docs/plan/implementation-roadmap.md`](../../plan/implementation-roadmap.md)
- [`.agents/skills/demo-scenarios/SKILL.md`](../../../.agents/skills/demo-scenarios/SKILL.md)
- [`.agents/skills/frontend-ui-ux-editor/SKILL.md`](../../../.agents/skills/frontend-ui-ux-editor/SKILL.md)

## Decisions and guardrails

- Preserve control-plane/data-plane separation:
  - Admin dashboard configures flags and rules.
  - Demo app only evaluates flags.
- Preserve safe defaults:
  - Missing project or flag must show `enabled=false` and `reason=NOT_FOUND`.
  - Feature UI remains hidden when evaluation is missing, failed, or off.
- Preserve deterministic rollout:
  - Use stable non-PII targeting keys.
  - The selected percentage scenario keys were chosen to produce predictable
    50% rollout examples with seeded data:
    - `demo-rollout-on` should return `PERCENTAGE_ROLLOUT`.
    - `demo-rollout-off` should return `DEFAULT_OFF`.
- Keep browser configuration safe:
  - `VITE_API_BASE_URL` is allowed.
  - Do not put database URLs, backend secrets, admin tokens, or actor headers in
    `apps/demo/.env`.
- Do not change backend contracts in Phase 8 unless the demo reveals a true
  contract issue.
- Keep runtime state labels (`On`/`Off`) separate from feature flag status
  labels (`Enabled`/`Disabled`/`Archived`).

## Validation and caveats

User-reported validation completed during the session:

- Demo build/lint/diff validation was reported complete in Step 11:

  ```bash
  npm run build --workspace=@ffp/demo
  npm run lint --workspace=@ffp/demo
  npm run diff:check
  ```

- Manual scenario validation was reported complete in Step 12:

  | Scenario | Expected reason |
  | --- | --- |
  | Global Toggle | `GLOBAL_ON` |
  | Role Targeting — Beta Tester | `ROLE_MATCH` |
  | Percentage Rollout — Included User | `PERCENTAGE_ROLLOUT` |
  | Percentage Rollout — Excluded User | `DEFAULT_OFF` |
  | Missing Project / Flag | `NOT_FOUND` |

Recommended final gate before moving fully into Phase 9:

```bash
grep -R "VITE_ADMIN_ACTOR\|DATABASE_URL\|POSTGRES_PASSWORD\|JWT_SECRET\|ADMIN_TOKEN\|API_SECRET" apps/demo
grep -R "fetch" apps/demo/src
npm run build
npm run test
npm run diff:check
```

Caveat: the session ended before the user explicitly confirmed the final Step
14 quality gate. Future work should run or confirm that gate before calling the
Phase 8 branch release-ready.

## Best reusable next prompt

```text
Continue from the Phase 8 demo app implementation reference in
docs/codex/reference/phase-8-demo-app-implementation.md. Verify the final
quality gate, then start Phase 9 release readiness. Prioritize end-to-end demo
flow tests, evaluation rule coverage, README completion, demo script,
troubleshooting notes, security review for browser exposure/CORS/non-PII
rollout keys, and presentation/report readiness. Preserve control-plane vs
data-plane separation, deterministic evaluation, safe defaults, and
append-only audit logging.
```

## Source notes

Source was the current Codex conversation visible in context. The session
followed the repo guardrails in `AGENTS.md`, the Phase 8 roadmap entry in
`docs/plan/implementation-roadmap.md`, and the demo app requirements in
`docs/requirement/demo/demo-app.md`.
