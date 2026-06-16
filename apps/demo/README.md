# Feature Flag Demo App

This app demonstrates runtime feature flag evaluation by calling the backend
Evaluation API. It behaves like a real client application: it only evaluates
flags and shows or hides UI based on the response.

The demo app is part of Phase 8 of the implementation roadmap.

## Responsibility

The demo app is a data-plane consumer.

It does:

- Call `POST /v1/evaluate`.
- Display `projectKey`, `flagKey`, `enabled`, and `reason`.
- Show loading, error, and retry states.
- Show or hide a demo feature based on `enabled`.

It does not:

- Create projects.
- Create or update feature flags.
- Create or update rules.
- Write audit logs.
- Send admin actor headers or secrets.

Use the admin dashboard for control-plane changes, then use this app to evaluate
the runtime result.

## Local configuration

Create a local environment file:

```bash
cp apps/demo/.env.example apps/demo/.env
```

Default local value:

```env
VITE_API_BASE_URL=http://localhost:3000/v1
```

Only browser-safe values should be placed in `apps/demo/.env`. Do not put
database URLs, API secrets, admin tokens, or backend-only credentials in this
file.

## Run locally

From the repository root, start the backend:

```bash
npm run dev:backend
```

In another terminal, start the demo app:

```bash
npm run dev:demo
```

Open:

```txt
http://localhost:5174
```

## Demo scenarios

The app includes these Phase 8 scenarios:

| Scenario | Purpose | Expected result with seed data |
| --- | --- | --- |
| Global Toggle | Shows global serving behavior for `beta-dashboard` | `GLOBAL_ON` when globally enabled |
| Role Targeting — Beta Tester | Shows role-based targeting for `new-checkout` | `ROLE_MATCH` |
| Percentage Rollout — Included User | Shows deterministic percentage rollout | `PERCENTAGE_ROLLOUT` |
| Percentage Rollout — Excluded User | Shows deterministic rollout fallback | `DEFAULT_OFF` |
| Missing Project / Flag | Shows safe fallback for missing config | `enabled=false`, `reason=NOT_FOUND` |

## Presentation flow

1. Start the backend and demo app.
2. Open the demo app.
3. Evaluate the Global Toggle scenario.
4. Use the admin dashboard to change the flag configuration.
5. Return to the demo app and click **Evaluate flag**.
6. Switch to Role Targeting and Percentage Rollout scenarios.
7. End with the Missing Project / Flag scenario to show safe defaults.

This demonstrates the separation between:

- Control plane: admin dashboard configuration.
- Data plane: runtime evaluation used by client applications.

## Validation

Run:

```bash
npm run build --workspace=@ffp/demo
npm run lint --workspace=@ffp/demo
```

For full project validation:

```bash
npm run build
npm run test
npm run diff:check
```
