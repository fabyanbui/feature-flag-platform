# ShopEase Demo App

This app is a simple ecommerce storefront used to demonstrate customer-specific
shopping experiences. It is intentionally independent from the platform backend
for its ecommerce data: accounts, products, carts, and seeded state live in an
in-memory demo database inside this app.

## Responsibility

The demo app does:

- Keep a local in-memory ecommerce database under `src/data/` and `src/services/`.
- Provide customer account switching without login or registration.
- Show guest browsing when no account is selected.
- Show products, saved carts, quantity changes, and checkout actions.
- Call the personalization/evaluation service through `@ffp/js-sdk` to decide
  which customer experience to display.
- Expose a tiny demo backend under `/api/demo/*` that uses the same SDK to guard
  server-side feature APIs.
- Fail safely to standard dashboard and checkout behavior if personalization is
  unavailable.

The demo app does not:

- Implement real authentication, login, registration, or sessions.
- Store ecommerce data in PostgreSQL, Prisma, or browser storage.
- Create or update platform projects, rules, or configuration.
- Send admin tokens, database URLs, or secrets to the browser.
- Treat frontend hiding as security; guarded demo backend endpoints still check
  the feature flag before returning feature data.

## In-memory demo database

The local demo data is split into:

```text
src/data/demoAccounts.ts        # ecommerce data types
src/data/seed.ts                # seeded accounts, products, and carts
src/services/commerceDb.ts      # in-memory database operations
src/services/demoAccountService.ts
```

Seeded accounts contain the targeting fields needed by the personalization SDK:

- `userId`
- `targetingId`
- `organizationId`
- one `role`

The service maps those fields to the SDK context:

```ts
{
  userId: account.userId,
  targetingKey: account.targetingId,
  roles: [account.role],
  attributes: {
    organizationId: account.organizationId,
  },
}
```

Because this is an in-memory database, edits during runtime reset when the app
reloads. That is acceptable for the demo because the ecommerce data is fixed
presentation data.

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

`VITE_API_BASE_URL` is browser-visible because the storefront evaluates flags
from the browser. The optional `DEMO_SERVER_API_BASE_URL` is server-only and lets
the demo backend call the platform backend from Docker, for example
`http://backend:3000/v1`. Do not put secrets in either value.

## Run locally

From the repository root, start the backend service used for personalization:

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

## Guarded demo backend endpoints

The demo backend intentionally keeps the ecommerce API tiny. It exists to prove
that disabling a feature flag does not only hide frontend UI. The backend also
fails closed before returning feature-specific data.

Each feature flag has one concrete GET endpoint:

| Endpoint | Guard flag | Enabled behavior | Disabled behavior |
| --- | --- | --- | --- |
| `GET /api/demo/features/beta-dashboard?accountId=...` | `beta-dashboard` | Returns priority dashboard data. | Returns `403 FEATURE_DISABLED`. |
| `GET /api/demo/features/new-checkout?accountId=...` | `new-checkout` | Returns one-page checkout data. | Returns `403 FEATURE_DISABLED`. |
| `GET /api/demo/features/express-payment?accountId=...` | `express-payment` | Returns express payment data. | Returns `403 FEATURE_DISABLED`. |
| `GET /api/demo/features/shipping-progress-meter?accountId=...` | `shipping-progress-meter` | Returns shipping progress data. | Returns `403 FEATURE_DISABLED`. |
| `GET /api/demo/features/coupon-engine?accountId=...` | `coupon-engine` | Returns coupon data. | Returns `403 FEATURE_DISABLED`. |
| `GET /api/demo/features/personalized-recommendations?accountId=...` | `personalized-recommendations` | Returns personalized recommendation data. | Returns `403 FEATURE_DISABLED`. |
| `GET /api/demo/features/trending-products?accountId=...` | `trending-products` | Returns trending product data. | Returns `403 FEATURE_DISABLED`. |
| `GET /api/demo/features/holiday-promo-banner?accountId=...` | `holiday-promo-banner` | Returns holiday promo data. | Returns `403 FEATURE_DISABLED`. |
| `GET /api/demo/features/live-support-widget?accountId=...` | `live-support-widget` | Returns live support data. | Returns `403 FEATURE_DISABLED`. |
| `GET /api/demo/health` | none | Returns demo backend health. | N/A |

The storefront uses existing feature UI for the live demo:

- **Express Pay** calls `GET /api/demo/features/express-payment`.
- **Open chat** calls `GET /api/demo/features/live-support-widget`.

For CLI evidence, after selecting or knowing a seeded account you can run:

```bash
curl -i "http://localhost:5174/api/demo/features/express-payment?accountId=rollout-account-006"
curl -i "http://localhost:5174/api/demo/features/live-support-widget?accountId=rollout-account-006"
```

When the relevant flag is off, archived, disabled, killed, or unavailable, the
response is safe and disabled with the evaluation result included for demo
traceability.

## Demo flow

1. Open the storefront in guest mode.
2. Use the account switcher to select a customer.
3. Show the customer's dashboard, product catalog, cart, and checkout mode.
4. Click **Express Pay** or **Open chat** to call guarded backend endpoints from
   existing flagged UI.
5. Disable the matching flag in the admin app, then call the endpoint by curl and
   show `403 FEATURE_DISABLED`.
6. Switch between beta, regular, admin preview, and rollout customer accounts.
7. Optionally open **Developer diagnostics** for hidden technical evidence.

## Validation

Run:

```bash
npm run build --workspace=@ffp/demo
npm run lint --workspace=@ffp/demo
```
