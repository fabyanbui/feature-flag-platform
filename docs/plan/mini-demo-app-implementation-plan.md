# Mini Demo App Implementation Plan

## Purpose

Upgrade `apps/demo` from an evaluation-response viewer into a small,
presentation-ready application that visibly proves the value of feature flags.
The demo should look like a real client application where a business feature is
shown, hidden, rolled out, or rolled back based on backend flag evaluation.

The intended story is:

> One app has already been deployed, but release behavior changes at runtime
> through feature flag configuration instead of a redeploy.

This plan is for Codex implementation work. Use it with the repo guardrails in
`AGENTS.md`, the demo requirements in
`docs/requirement/demo/demo-app.md`, the active project goal in
`docs/plan/project-goal.md`, and the presentation script in
`docs/release/demo-script.md`.

## Current Problem

The current demo app already calls `@ffp/js-sdk`, evaluates seeded scenarios,
and displays `projectKey`, `flagKey`, `enabled`, `reason`, and decision source.
However, it still feels primarily like an API/debug page.

For the presentation, the demo app should make the feature-flag value obvious
without requiring the audience to interpret API fields first.

## Source Facts Inspected Before This Revision

This plan was refined against the current repository state. Before implementing
it, Codex must re-check these same sources because the worktree is authoritative:

- `AGENTS.md` for project guardrails.
- `apps/demo/src/App.tsx` and `apps/demo/src/App.css` for the current demo UI.
- `packages/js-sdk/src/contracts.ts`, `packages/js-sdk/src/client.ts`, and
  `packages/js-sdk/src/response-validator.ts` for SDK result and client-error
  behavior.
- `apps/backend/src/evaluation/engine/evaluation.types.ts` and
  `apps/backend/src/evaluation/dto/evaluate-response.dto.ts` for backend reason
  codes and response shape.
- `apps/backend/prisma/seed.ts` for seeded project, group, flag, rule, and
  sample-user context keys.
- `apps/demo/package.json` and root `package.json` for available workspace
  scripts.
- `docs/release/demo-script.md` for the live presentation flow.

Current backend/SDK reason-code contract:

```text
GLOBAL_ON
FLAG_DISABLED
FLAG_ARCHIVED
GROUP_KILL_SWITCH
KILL_SWITCH
USER_ALLOWLIST
ROLE_MATCH
PERCENTAGE_ROLLOUT
DEFAULT_OFF
NOT_FOUND
INVALID_CONTEXT
ERROR
```

The implementation must display the exact `reason` string returned by the
existing SDK/backend contract. Do not rename, translate, normalize, or invent
reason codes.

Current demo workspace scripts:

```bash
npm run lint --workspace=@ffp/demo
npm run build --workspace=@ffp/demo
```

There is currently no dedicated `@ffp/demo` test script in `apps/demo/package.json`.
Do not invent new package scripts.

## Target Concept

Turn `apps/demo` into a mini e-commerce checkout application:

```text
+--------------------------------------------------+
| FFP Shop                                        |
| Preview scenario: Beta Tester / Rollout / ...   |
+--------------------------------------------------+

[Product Card]
[Cart Summary]

[Checkout Experience]
  If new-checkout is Off, uncertain, missing, or client-failed:
    Classic Checkout
  If new-checkout is confirmed On by the SDK:
    New One-Page Checkout

[Optional Beta Dashboard Panel]
  beta-dashboard can show/hide a secondary dashboard/promo panel only.

[Evaluation Details]
  projectKey, flagKey, enabled, reason, source, context
```

The main presentation story must focus on:

- **Classic Checkout**
- **New One-Page Checkout**
- runtime release without frontend redeployment
- targeted rollout
- safe rollback

The primary user-visible feature is:

- `new-checkout` controls **only** the checkout experience.

The secondary feature is:

- `beta-dashboard` controls **only** an optional beta dashboard/customer insight
  panel for the existing global-toggle scenario.

The operational rollback feature is:

- `customer-experience` group kill switch forces assigned flags Off with
  `reason=GROUP_KILL_SWITCH` when each assigned flag is evaluated.

`beta-dashboard` may remain as a secondary demonstration, but it must not
distract from the checkout story.

## Non-Negotiable Feature-to-UI Mapping

The implementation must keep feature ownership explicit:

1. A `new-checkout` SDK result may control only the checkout experience.
2. A `beta-dashboard` SDK result may control only the optional beta dashboard
   panel.
3. A `beta-dashboard` evaluation result must never enable New Checkout.
4. A `new-checkout` evaluation result must never control the beta dashboard
   panel.
5. Metadata such as `expectedOutcome`, expected reason, scenario descriptions,
   and presenter notes is display-only. It must never determine whether a
   feature is On or Off.
6. Only the real result returned by `@ffp/js-sdk` may control rendered feature
   visibility.

## Product Demo Goals

The mini app must prove these points:

1. **Deployment is separate from release**
   - The checkout UI changes when `new-checkout` configuration changes.
   - No frontend rebuild or redeploy is needed during the demo.
2. **Different users can receive different experiences**
   - Beta tester sees the new checkout through role targeting.
   - One regular user sees the new checkout through percentage rollout.
   - Another regular user remains on classic checkout.
3. **Rollback is fast and safe**
   - A flag or group kill switch makes the selected feature fall back to safe UI.
4. **Evaluation is explainable**
   - The app still displays `projectKey`, `flagKey`, `enabled`, `reason`, and
     decision source.
5. **Failure defaults are safe**
   - Missing project/flag or SDK client failures show the fallback experience,
     not the experimental one.

## Scope

### In Scope

- Update `apps/demo/src/App.tsx`.
- Update `apps/demo/src/App.css`.
- Keep using `@ffp/js-sdk`; do not construct raw evaluation fetches in the app.
- Keep seeded project/flag keys:
  - project: `demo-project`
  - environment: `production`
  - flags: `beta-dashboard`, `new-checkout`
  - group: `customer-experience`
- Keep existing scenario coverage:
  - Global Toggle
  - Role Targeting — Beta Tester
  - Percentage Rollout — Included User
  - Percentage Rollout — Excluded User
  - Missing Project / Flag
- Add a business-facing app shell and feature cards.
- Preserve loading, retry, error, SDK fallback, and accessibility behavior.
- Optionally update `docs/release/demo-script.md` after implementation if UI
  labels change.

### Out of Scope

- Do not add new backend schema or migrations.
- Do not add a new standalone app.
- Do not add production login/register.
- Do not add local client-side rule evaluation.
- Do not store secrets or control-plane credentials in the demo app.
- Do not change backend evaluation contracts or reason-code semantics.
- Do not change SDK contracts.
- Do not add cart state, payment processing, checkout submission, unrelated
  form validation, routing, persistence, or additional backend calls.

The commerce UI is presentational only. Product cards, order summaries, prices,
ratings, shipping, coupon fields, and buttons exist only to make the
flag-controlled UI difference visually clear.

## UX Requirements

### 1. App Shell

Use a clear title such as:

```text
FFP Shop — Feature Flag Checkout Demo
```

The opening copy should explain the business scenario in one or two sentences:

> This is a deployed checkout application. Feature flags decide which customer
> experience is visible at runtime.

### 2. Scenario Selector Terminology

The current options are a mix of customer personas and technical test cases.
Use one selector with a neutral heading such as:

```text
Preview scenario
```

or:

```text
Customer release scenario
```

Do not describe every option as a real customer persona because entries such as
missing configuration and rollout bucket checks are technical scenarios. Keep
one selector unless the existing code already supports a cleaner split without
extra state-management complexity.

Each selectable scenario should show:

- scenario name,
- short business or technical description,
- display-only expected behavior,
- stable non-PII `targetingKey`,
- roles.

Recommended scenarios:

- **Global Toggle**
  - Flag: `beta-dashboard`
  - Context: `demo-user-global`, role `user`
  - Display-only expected reason: `GLOBAL_ON`
- **Role Targeting — Beta Tester**
  - Flag: `new-checkout`
  - Context: `demo-user-beta`, role `beta-tester`
  - Display-only expected reason: `ROLE_MATCH`
- **Percentage Rollout — Included User**
  - Flag: `new-checkout`
  - Context: `demo-rollout-on`, role `user`
  - Display-only expected reason: `PERCENTAGE_ROLLOUT`
- **Percentage Rollout — Excluded User**
  - Flag: `new-checkout`
  - Context: `demo-rollout-off`, role `user`
  - Display-only expected reason: `DEFAULT_OFF`
- **Missing Project / Flag**
  - Flag: missing project/flag
  - Context: `demo-missing-user`, role `user`
  - Display-only expected reason: `NOT_FOUND`

The expected reason column is documentation/display metadata only. The app must
render the actual `reason` returned by the SDK result.

### 3. Business UI

Add static business sections:

1. **Product card**
   - Example product: "Premium Wireless Headphones" or "Pro Delivery Plan".
   - Include price, rating, and a simple presentational CTA.
2. **Cart summary**
   - subtotal,
   - shipping,
   - total,
   - selected scenario/customer segment.
3. **Checkout experience**
   - Main gated section controlled only by `new-checkout`.

When `new-checkout` is confirmed **On** by the SDK, show:

```text
New One-Page Checkout
- Smart discount recommendation
- Express payment row
- Saved delivery preferences
- Beta/New badge
```

When `new-checkout` is **Off**, missing, not yet evaluated, loading, or in SDK
client fallback, show:

```text
Classic Checkout
- Standard address form
- Manual coupon box
- Standard payment button
```

For missing config or SDK fallback, make the copy explicitly safe:

```text
Classic Checkout remains active because the feature flag did not return a safe
On decision.
```

### 4. Optional Global Feature Panel

When the selected scenario evaluates `beta-dashboard`, use only that result to
show or hide a secondary panel:

On:

```text
Beta Customer Insights Dashboard
```

Off:

```text
Beta Dashboard hidden
```

This panel supports the global toggle story. It must not control or imply the
state of the `new-checkout` checkout experience.

### 5. Evaluation Details Panel

Keep an explicit technical panel below or beside the business UI:

- API base URL
- SDK client
- environment
- selected scenario
- `projectKey`
- `flagKey`
- `targetingKey`
- roles
- `enabled`
- `reason`
- `variant`
- matched rule ID if available
- decision source:
  - Backend evaluation
  - Client fallback
  - Not evaluated

This panel is supporting evidence, not the main visual focus. It must display
the current scenario and current SDK result only.

### 6. Presenter Note

Each scenario may include a short presenter note:

- Global toggle: "Change `beta-dashboard` in Admin, then evaluate again."
- Beta tester: "Expected reason: `ROLE_MATCH`."
- Rollout included: "Expected reason: `PERCENTAGE_ROLLOUT`."
- Rollout excluded: "Expected reason: `DEFAULT_OFF`."
- Missing config: "Expected reason: `NOT_FOUND`; fallback stays active."

Presenter notes are display-only metadata and must not control UI state.

### 7. Loading, Error, Retry, and Stale-State Prevention

Preserve:

- initial evaluation on load,
- manual **Evaluate flag** button,
- loading state,
- retry button,
- non-technical error message,
- SDK fallback copy explaining that client-local failure is not a backend
  evaluation decision.

When the selected scenario changes:

- do not display the previous scenario's result as the current result;
- clear the previous result or mark it stale immediately;
- show loading or not-evaluated state until the new decision is available;
- do not display an old reason, flag key, or context beside the newly selected
  scenario.

### 8. Fail-Closed UI State Rules

Define UI behavior by state:

- **Initial loading**
  - Checkout UI: Classic Checkout
  - Decision source display: Not evaluated or loading
- **Not yet evaluated**
  - Checkout UI: Classic Checkout
  - Decision source display: Not evaluated
- **Backend decision with `enabled=true` for `new-checkout`**
  - Checkout UI: New Checkout
  - Decision source display: Backend evaluation
- **Backend decision with `enabled=false` for `new-checkout`**
  - Checkout UI: Classic Checkout
  - Decision source display: Backend evaluation
- **Backend `NOT_FOUND`**
  - Checkout UI: Classic Checkout
  - Decision source display: Backend evaluation
- **SDK/client failure**
  - Checkout UI: Classic Checkout
  - Decision source display: Client fallback
- **Selected flag is `beta-dashboard`**
  - Checkout UI: Classic Checkout remains safe
  - Decision source display: Backend evaluation or fallback

New Checkout must appear only after a confirmed SDK result for `new-checkout`
with:

```ts
enabled === true
```

All other states keep Classic Checkout active. The UI should still distinguish
a legitimate backend Off decision from a client-side fallback.

## Accessibility and Responsive Requirements

- Use semantic headings and sections.
- Do not rely on color alone for On/Off status.
- Keep radio/select controls keyboard accessible.
- Preserve visible focus styles.
- Keep content readable on mobile widths.
- Avoid horizontal scrolling.
- Use `aria-live` for evaluation/loading status where appropriate.
- Keep action buttons at least 44px high.

## Implementation Steps

### Step 0 — Re-Inspect Current Source

Before editing UI code, inspect and align with:

1. `AGENTS.md`.
2. Current `apps/demo` implementation.
3. Current `@ffp/js-sdk` response and error types.
4. Current backend reason-code enum.
5. Seeded scenario keys and contexts.
6. Demo workspace package scripts.
7. `docs/release/demo-script.md`.

If any reason code, key, script, or contract differs from this plan, follow the
source code and update the plan or implementation notes before proceeding.

### Step 1 — Refactor Scenario Metadata

In `apps/demo/src/App.tsx`:

- Extend `DemoScenario` with display-only fields such as:
  - `scenarioLabel`
  - `scenarioSummary`
  - `expectedReason`
  - `businessFeature`
- Keep stable project keys, flag keys, and contexts unchanged unless source
  inspection proves they changed.
- Rename user-facing headings from "Demo scenario" to "Preview scenario" or
  "Customer release scenario".
- Ensure all expected fields and presenter notes are display-only metadata.

Do not change backend contracts.

### Step 2 — Add Business Layout Components

Within `App.tsx`, add small presentational helpers or components:

- `ProductShowcase`
- `CartSummary`
- `CheckoutExperience`
- `BetaDashboardPanel`
- `EvaluationDetails`

They may stay in `App.tsx` if the file remains readable. Otherwise, extract
them into a small `apps/demo/src/components` directory. Do not introduce a new
state-management or architectural layer.

### Step 3 — Gate Features From the Correct SDK Result

Use only the real SDK result to compute visibility.

For checkout:

```ts
const isNewCheckoutOn =
  selectedScenario.flagKey === 'new-checkout' && result?.enabled === true;
```

For the beta dashboard panel:

```ts
const isBetaDashboardOn =
  selectedScenario.flagKey === 'beta-dashboard' && result?.enabled === true;
```

Required behavior:

- `new-checkout` On => show New Checkout.
- `new-checkout` Off/not evaluated/loading/client fallback/`NOT_FOUND` => show
  Classic Checkout.
- `beta-dashboard` On => show only the optional beta dashboard panel.
- `beta-dashboard` Off/not evaluated/loading/client fallback => hide or show the
  safe hidden state for only the beta dashboard panel.
- Never let one flag's result control another feature.
- Never use `expectedReason`, descriptions, presenter notes, or other metadata
  to determine UI state.

### Step 4 — Prevent Stale Decisions

On scenario change:

- increment or replace the current request sequence as the existing app does;
- clear `result` and `errorMessage` immediately, or attach the result to the
  scenario/request ID and hide it when it no longer matches;
- render the new scenario with Not evaluated/loading state until a matching SDK
  response returns;
- ignore late responses from earlier scenarios.

The evaluation details panel must never show the previous scenario's `reason`,
`flagKey`, `projectKey`, context, or decision source as if it belonged to the
new scenario.

### Step 5 — Preserve SDK and Data-Plane Boundary

Keep:

```ts
createFeatureFlagClient(...)
client.evaluate(...)
isClientEvaluationError(...)
```

Do not add control-plane tokens, admin credentials, management API calls, local
rule evaluation, or extra backend calls to the demo app.

### Step 6 — Update Styling

In `apps/demo/src/App.css`:

- Convert the page from one debug card into an app-like layout.
- Use cards/sections for product, cart, checkout, optional dashboard, and
  evaluation details.
- Keep the existing green/dark visual language unless changing it improves
  clarity.
- Add responsive grid behavior:
  - desktop: app content and details can sit in two columns,
  - mobile: sections stack vertically.
- Preserve focus, loading, error, selected, and disabled states.

### Step 7 — Update Documentation Only If Labels Change

If implementation changes visible labels used by the live script, update
`docs/release/demo-script.md` so presenter instructions match the UI. Do not
expand scope into unrelated release-doc edits.

## Group Kill-Switch Demonstration

The demo app does not need to evaluate every flag in `customer-experience` at
the same time.

Sufficient proof:

1. Select a scenario whose flag is assigned to `customer-experience`.
2. Activate the group kill switch in Admin.
3. Evaluate the selected flag again in the demo app.
4. Show safe UI and the backend reason returned by the SDK.

The presenter may repeat this with another assigned flag to prove group-wide
behavior. Do not require the demo app to automatically show both assigned flags
being disabled simultaneously.

## Validation Requirements

Inspect available scripts before running commands. Do not invent new scripts.
For the current repo, the expected narrow commands are:

```bash
npm run lint --workspace=@ffp/demo
npm run build --workspace=@ffp/demo
```

If a test script is later added for `@ffp/demo`, run the narrowest relevant test
script after inspecting `apps/demo/package.json`.

If backend/demo stack is available, manually verify:

1. Global Toggle controls only the optional `beta-dashboard` panel and displays
   the exact returned reason such as `GLOBAL_ON`.
2. Beta Tester shows New Checkout only after a confirmed `new-checkout` SDK
   result with `enabled=true`; expected reason is currently `ROLE_MATCH`.
3. Rollout Included shows New Checkout only after a confirmed `new-checkout`
   SDK result with `enabled=true`; expected reason is currently
   `PERCENTAGE_ROLLOUT`.
4. Rollout Excluded shows Classic Checkout when the backend returns
   `enabled=false`; expected reason is currently `DEFAULT_OFF`.
5. Missing Project / Flag shows Classic Checkout and exact returned reason
   `NOT_FOUND`.
6. Group kill switch in Admin makes the selected assigned flag return Off with
   exact returned reason `GROUP_KILL_SWITCH`.
7. SDK client fallback displays Classic Checkout, `enabled=false`,
   `reason=ERROR`, and `Decision source: Client fallback`.
8. Changing scenarios never shows stale result fields from the previous
   scenario.

Record in the final implementation response:

- exact commands run,
- command results,
- changed files,
- unresolved issues, if any,
- whether any failure appears caused by this change or pre-existing state.

## Demo Script After Implementation

Use this live flow:

1. Open the demo app and select **Role Targeting — Beta Tester**.
   - Show New Checkout.
   - Point to the exact returned `reason`, expected `ROLE_MATCH`.
2. Select **Percentage Rollout — Included User**.
   - Show New Checkout.
   - Point to the exact returned `reason`, expected `PERCENTAGE_ROLLOUT`.
3. Select **Percentage Rollout — Excluded User**.
   - Show Classic Checkout.
   - Point to the exact returned `reason`, expected `DEFAULT_OFF`.
4. Open Admin and activate the `customer-experience` group kill switch.
5. Return to demo app and evaluate the selected assigned flag again.
   - Show safe fallback UI for that feature.
   - Point to the exact returned `reason`, expected `GROUP_KILL_SWITCH`.
6. Deactivate the group kill switch.
7. Select **Missing Project / Flag**.
   - Show Classic Checkout.
   - Point to the exact returned `reason`, expected `NOT_FOUND`.
8. Optionally select **Global Toggle**.
   - Show only the secondary beta dashboard panel changing with
     `beta-dashboard`.
9. Mention that the app uses `@ffp/js-sdk`, not local rule logic.

Presenter line:

> This app is already deployed. Feature flags decide whether each customer sees
> the classic checkout or the new checkout, and operations can roll back the
> risky experience immediately without a redeploy.

## Acceptance Criteria

The implementation is complete when:

1. The demo app visually resembles a simple checkout application, not only an
   API response viewer.
2. The presentation remains focused on feature-flag value, not simulated
   commerce functionality.
3. A real visible feature changes between Classic Checkout and New Checkout
   based on `new-checkout` evaluation.
4. New Checkout appears only for a confirmed real SDK evaluation result for
   `new-checkout` with `enabled === true`.
5. Initial loading, not-yet-evaluated, backend Off, backend `NOT_FOUND`, and
   SDK/client failure states keep Classic Checkout active.
6. A legitimate backend Off decision is visually distinguishable from a
   client-side SDK fallback.
7. Only a real SDK evaluation result controls feature visibility.
8. Expected metadata, scenario descriptions, expected reason labels, and
   presenter notes never control UI state.
9. Results from one flag never control another feature:
   - `new-checkout` controls only checkout.
   - `beta-dashboard` controls only the optional beta dashboard panel.
10. Scenario changes never show stale decisions, stale reasons, stale flag keys,
    or stale contexts from the previous scenario.
11. The app displays exact backend/SDK reason codes as returned, without
    renaming, translation, normalization, or invented values.
12. The app still displays `projectKey`, `flagKey`, `enabled`, `reason`, and
    decision source.
13. Existing seeded scenario contexts remain stable and non-PII.
14. Role targeting, percentage rollout, missing config, SDK fallback, and group
    kill switch remain demonstrable.
15. The app remains accessible and responsive.
16. No backend contract, backend schema, seed context, or SDK contract is
    changed.
17. No cart state, payment processing, checkout submission, unrelated form
    validation, routing, persistence, or additional backend calls are added.
18. `npm run build --workspace=@ffp/demo` passes, or any failure is documented
    with clear evidence that it is unrelated to this UI change.

## Files Expected to Change During Implementation

Required:

- `apps/demo/src/App.tsx`
- `apps/demo/src/App.css`

Optional if component extraction improves readability:

- `apps/demo/src/components/*`

Optional if visible labels or demo flow change:

- `docs/release/demo-script.md`

Do not change these unless current source inspection proves a narrow update is
required:

- `apps/backend/prisma/schema.prisma`
- backend evaluation engine
- backend API DTOs
- `packages/js-sdk` contracts
- seed data
- Docker Compose configuration

## Assumptions to Verify During Implementation

- The current `@ffp/js-sdk` reason union remains aligned with backend
  `EvaluationReason`.
- The seeded demo project still uses `demo-project`, `production`,
  `beta-dashboard`, `new-checkout`, and `customer-experience`.
- `demo-rollout-on` and `demo-rollout-off` still produce the intended current
  rollout outcomes with the seeded 50% rollout rule.
- The demo workspace still exposes `lint` and `build` scripts and no dedicated
  test script.
- The existing request-sequence pattern is sufficient to prevent stale UI after
  scenario changes, or can be adapted without adding a new state-management
  layer.

## Codex Implementation Prompt

Use this prompt for the implementation turn:

```text
Implement docs/plan/mini-demo-app-implementation-plan.md.
Use demo-scenarios and frontend-ui-ux-editor.
Upgrade apps/demo into a mini e-commerce checkout demo where new-checkout
switches between Classic Checkout and New Checkout, while preserving SDK-backed
evaluation, seeded scenarios, safe fallback behavior, accessibility,
responsive layout, exact backend reason-code display, and strict feature-to-UI
mapping. Do not change backend contracts, schema, seed data, or SDK contracts.
Inspect current source before editing. Validate with the existing @ffp/demo
lint/build scripts and any existing narrow test script if present.
```
