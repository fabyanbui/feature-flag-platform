# Feature Flag Demo App

This app demonstrates runtime feature flag evaluation through `@ffp/js-sdk`.
It behaves like a real client application: it only evaluates flags and shows or
hides UI based on the response.

The original demo app was delivered in MVP Phase 8. Recommended Phase 15
migrated its direct HTTP request to the JavaScript SDK.

## Responsibility

The demo app is a data-plane consumer.

It does:

- Keep a tiny demo-app account database under `src/data/` and expose it through
  a local service under `src/services/`.
- Call `POST /v1/evaluate` through `@ffp/js-sdk`.
- Display `projectKey`, `flagKey`, `enabled`, and `reason`.
- Display whether a result came from the backend or an SDK-local safe fallback.
- Show loading, client-fallback, error, and retry states.
- Show or hide a demo feature based on `enabled`.

It does not:

- Implement login, registration, sessions, or authentication.
- Create projects.
- Create or update feature flags.
- Create or update rules.
- Write audit logs.
- Send admin actor headers or secrets.

Use the admin dashboard for control-plane changes, then use this app to evaluate
the runtime result.

## Demo-app account database

The ecommerce demo owns a simple local account seed in
`src/data/seed.ts`, with account types in `src/data/demoAccounts.ts`. This is
the demo app's own BE-like data layer and is independent from the feature flag
platform backend.

Each account stores only the fields needed for feature flag targeting:

- `userId`
- `targetingId`
- one `role`

`src/services/demoAccountService.ts` maps each account to an SDK evaluation
context:

```ts
{
  userId: account.userId,
  targetingKey: account.targetingId,
  roles: [account.role],
}
```

The UI then lets the presenter switch customer accounts from a dropdown. No
login/register flow is involved.

## Local configuration

Create a local environment file:

```bash
cp apps/demo/.env.example apps/demo/.env
```

Default local value:

```env
VITE_API_BASE_URL=http://localhost:3000/v1
VITE_ENVIRONMENT_KEY=production
```

Only browser-safe values should be placed in `apps/demo/.env`. Do not put
database URLs, API secrets, admin tokens, or backend-only credentials in this
file.

The SDK uses a 1500 ms timeout in the demo. Timeout, network, unsuccessful HTTP,
invalid JSON, and invalid response failures return a typed client fallback with
`enabled=false`, `variant=off`, `reason=ERROR`, and `errorSource=CLIENT`.
Backend decisions do not include `errorSource`.

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

The app preserves these presentation scenarios through the SDK:

| Scenario | Purpose | Expected result with seed data |
| --- | --- | --- |
| Global Toggle | Shows global serving behavior for `beta-dashboard` | `GLOBAL_ON` when globally enabled |
| Role Targeting — Beta Tester | Shows role-based targeting for `new-checkout` | `ROLE_MATCH` |
| User Allowlist — Admin Preview | Shows user-id allowlist targeting for `new-checkout` | `USER_ALLOWLIST` |
| Percentage Rollout — Included User | Shows deterministic percentage rollout | `PERCENTAGE_ROLLOUT` |
| Percentage Rollout — Excluded User | Shows deterministic rollout fallback | `DEFAULT_OFF` |

## Presentation flow

1. Start the backend and demo app.
2. Open the demo app.
3. Switch customer accounts from the ecommerce account dropdown in the header.
4. Watch the storefront update automatically for each selected account.
5. Optionally expand **View customer account details** to explain user ID,
   targeting ID, and role.
6. Show beta customer, admin preview customer, and rollout accounts.

This demonstrates the separation between:

- Control plane: admin dashboard configuration.
- Data plane: `@ffp/js-sdk` calling the runtime evaluation API.

## Validation

Run:

```bash
npm run build --workspace=@ffp/demo
npm run lint --workspace=@ffp/demo
npm run test --workspace=@ffp/js-sdk
```

For full project validation:

```bash
npm run build
npm run test
npm run diff:check
```
