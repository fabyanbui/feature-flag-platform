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

## Target Concept

Turn `apps/demo` into a mini e-commerce checkout application:

```text
+--------------------------------------------------+
| FFP Shop                                        |
| Preview as: Beta Tester / Regular / Rollout ... |
+--------------------------------------------------+

[Product Card]
[Cart Summary]

[Checkout Experience]
  If new-checkout is Off:
    Classic Checkout
  If new-checkout is On:
    New One-Page Checkout

[Optional Experience Banner]
  beta-dashboard can show/hide a beta dashboard/promo panel.

[Evaluation Details]
  projectKey, flagKey, enabled, reason, source, context
```

The main user-visible feature is:

- `new-checkout` controls **Classic Checkout** vs **New Checkout**.

The secondary feature is:

- `beta-dashboard` controls a **Beta Dashboard / customer insight panel** or
  visible promotional dashboard card.

The operational rollback feature is:

- `customer-experience` group kill switch forces both assigned flags Off with
  `reason=GROUP_KILL_SWITCH`.

## Product Demo Goals

The mini app must prove these points:

1. **Deployment is separate from release**
   - The checkout UI changes when flag configuration changes.
   - No frontend rebuild or redeploy is needed during the demo.
2. **Different users can receive different experiences**
   - Beta tester sees the new checkout through role targeting.
   - One regular user sees the new checkout through percentage rollout.
   - Another regular user remains on classic checkout.
3. **Rollback is fast and safe**
   - Group kill switch makes all related user-facing experiences fall back to
     safe UI.
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

## UX Requirements

### 1. App Shell

Use a clear title such as:

```text
FFP Shop — Feature Flag Checkout Demo
```

The opening copy should explain the business scenario in one or two sentences:

> This is a deployed checkout application. Feature flags decide which customer
> experience is visible at runtime.

### 2. User Persona Selector

Replace or reframe "Demo scenario" as:

```text
Preview as customer
```

Each selectable persona should show:

- persona name,
- short business description,
- expected flag behavior,
- stable non-PII `targetingKey`,
- roles.

Recommended personas:

| Persona | Flag | Context | Expected reason |
| --- | --- | --- | --- |
| Everyone / Global user | `beta-dashboard` | `demo-user-global`, role `user` | `GLOBAL_ON` |
| Beta Tester | `new-checkout` | `demo-user-beta`, role `beta-tester` | `ROLE_MATCH` |
| Rollout Included User | `new-checkout` | `demo-rollout-on`, role `user` | `PERCENTAGE_ROLLOUT` |
| Rollout Excluded User | `new-checkout` | `demo-rollout-off`, role `user` | `DEFAULT_OFF` |
| Missing Config User | missing project/flag | `demo-missing-user`, role `user` | `NOT_FOUND` |

The implementation may keep the underlying `demoScenarios` array, but update
labels and copy so the user appears as a real customer persona.

### 3. Business UI

Add static business sections:

1. **Product card**
   - Example product: "Premium Wireless Headphones" or "Pro Delivery Plan".
   - Include price, rating, and a simple Add to cart button or visual CTA.
2. **Cart summary**
   - subtotal,
   - shipping,
   - total,
   - selected customer segment.
3. **Checkout experience**
   - Main gated section controlled by `new-checkout`.

When `new-checkout` is **On**, show:

```text
New One-Page Checkout
- Smart discount recommendation
- Express payment row
- Saved delivery preferences
- Beta/New badge
```

When `new-checkout` is **Off**, show:

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

When the selected scenario evaluates `beta-dashboard`, use the result to show
or hide a secondary panel:

On:

```text
Beta Customer Insights Dashboard
```

Off:

```text
Beta Dashboard hidden
```

This panel should support the global toggle story without confusing it with the
`new-checkout` checkout story.

### 5. Evaluation Details Panel

Keep an explicit technical panel below or beside the business UI:

- API base URL
- SDK client
- environment
- selected persona
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

This panel is supporting evidence, not the main visual focus.

### 6. Presenter Note

Each persona should include a short presenter note:

- Global toggle: "Change `beta-dashboard` in Admin, then evaluate again."
- Beta tester: "Expected reason: `ROLE_MATCH`."
- Rollout included: "Expected reason: `PERCENTAGE_ROLLOUT`."
- Rollout excluded: "Expected reason: `DEFAULT_OFF`."
- Missing config: "Expected reason: `NOT_FOUND`; fallback stays active."

### 7. Loading, Error, and Retry

Preserve:

- initial evaluation on load,
- manual **Evaluate flag** button,
- loading state,
- retry button,
- non-technical error message,
- SDK fallback copy explaining that client-local failure is not a backend
  evaluation decision.

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

### Step 1 — Refactor Scenario Metadata

In `apps/demo/src/App.tsx`:

- Extend `DemoScenario` with optional fields:
  - `personaName`
  - `personaSummary`
  - `expectedOutcome`
  - `businessFeature`
- Keep stable keys and contexts unchanged.
- Rename user-facing headings from "Demo scenario" to "Preview as customer" or
  equivalent.

Do not change backend contracts.

### Step 2 — Add Business Layout Components

Within `App.tsx`, add small local render helpers or components:

- `ProductShowcase`
- `CartSummary`
- `CheckoutExperience`
- `BetaDashboardPanel`
- `EvaluationDetails`

Keep these in `App.tsx` unless the file becomes difficult to read. A separate
component file is optional, not required.

### Step 3 — Gate the Checkout UI

Use the current result:

```ts
const isFeatureOn = result?.enabled === true;
```

For `new-checkout` scenarios:

- On => show New Checkout.
- Off/not evaluated/client fallback => show Classic Checkout.

For `not-found`, show Classic Checkout and make the safe fallback reason clear.

### Step 4 — Preserve SDK and Data-Plane Boundary

Keep:

```ts
createFeatureFlagClient(...)
client.evaluate(...)
isClientEvaluationError(...)
```

Do not add control-plane tokens, admin credentials, or management API calls to
the demo app.

### Step 5 — Update Styling

In `apps/demo/src/App.css`:

- Convert the page from one debug card into an app-like layout.
- Use cards/sections for product, cart, checkout, and evaluation details.
- Keep the existing green/dark visual language unless changing it improves
  clarity.
- Add responsive grid behavior:
  - desktop: app content and details can sit in two columns,
  - mobile: sections stack vertically.
- Preserve focus, loading, error, and selected states.

### Step 6 — Verify Behavior

Run the narrowest practical checks:

```bash
npm run lint --workspace=@ffp/demo
npm run build --workspace=@ffp/demo
```

If those scripts are unavailable or fail due to pre-existing environment
issues, record the exact failure.

If backend/demo stack is available, manually verify:

1. Global Toggle shows `beta-dashboard` state and reason.
2. Beta Tester shows New Checkout with `ROLE_MATCH`.
3. Rollout Included shows New Checkout with `PERCENTAGE_ROLLOUT`.
4. Rollout Excluded shows Classic Checkout with `DEFAULT_OFF`.
5. Missing Project / Flag shows Classic Checkout with `NOT_FOUND`.
6. Group kill switch in Admin makes assigned features Off with
   `GROUP_KILL_SWITCH`.
7. SDK client fallback displays Off with `reason=ERROR` and
   `Decision source: Client fallback` when backend is unavailable.

## Demo Script After Implementation

Use this live flow:

1. Open the demo app and select **Beta Tester**.
   - Show New Checkout.
   - Point to `reason=ROLE_MATCH`.
2. Select **Rollout Included User**.
   - Show New Checkout.
   - Point to `reason=PERCENTAGE_ROLLOUT`.
3. Select **Rollout Excluded User**.
   - Show Classic Checkout.
   - Point to `reason=DEFAULT_OFF`.
4. Open Admin and activate the `customer-experience` group kill switch.
5. Return to demo app and evaluate again.
   - Show Classic Checkout.
   - Point to `reason=GROUP_KILL_SWITCH`.
6. Deactivate the group kill switch.
7. Select **Missing Config User**.
   - Show Classic Checkout.
   - Point to `reason=NOT_FOUND`.
8. Mention that the app uses `@ffp/js-sdk`, not local rule logic.

Presenter line:

> This app is already deployed. Feature flags decide whether each customer sees
> the classic checkout or the new checkout, and operations can roll back the
> risky experience immediately without a redeploy.

## Acceptance Criteria

The implementation is complete when:

1. The demo app visually resembles a simple checkout application, not only an
   API response viewer.
2. A real visible feature changes between Classic Checkout and New Checkout
   based on flag evaluation.
3. The app still displays `projectKey`, `flagKey`, `enabled`, `reason`, and
   decision source.
4. Existing seeded scenario contexts remain stable and non-PII.
5. Role targeting, percentage rollout, missing config, and group kill switch
   remain demonstrable.
6. SDK client fallback remains fail-closed and distinguishable from backend
   decisions.
7. The app remains accessible and responsive.
8. No backend schema, seed, or API contract change is required.
9. `npm run build --workspace=@ffp/demo` passes, or any failure is documented
   with clear evidence that it is unrelated to this UI change.

## Files Likely to Change

Required:

- `apps/demo/src/App.tsx`
- `apps/demo/src/App.css`

Optional:

- `docs/release/demo-script.md`
- `docs/requirement/demo/demo-app.md`
- `README.md`

Do not change these unless required by implementation details:

- `apps/backend/prisma/schema.prisma`
- backend evaluation engine
- backend API DTOs
- `packages/js-sdk` contracts

## Codex Implementation Prompt

Use this prompt for the implementation turn:

```text
Implement docs/plan/mini-demo-app-implementation-plan.md.
Use demo-scenarios and frontend-ui-ux-editor.
Upgrade apps/demo into a mini e-commerce checkout demo where new-checkout
switches between Classic Checkout and New Checkout, while preserving SDK-backed
evaluation, seeded scenarios, safe fallback behavior, accessibility, and
responsive layout. Do not change backend contracts or schema.
Validate with npm run build --workspace=@ffp/demo and lint if practical.
```
