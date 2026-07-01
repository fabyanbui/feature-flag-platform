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
- Fail safely to standard dashboard and checkout behavior if personalization is
  unavailable.

The demo app does not:

- Implement real authentication, login, registration, or sessions.
- Store ecommerce data in PostgreSQL, Prisma, or browser storage.
- Create or update platform projects, rules, or configuration.
- Send admin tokens, database URLs, or secrets to the browser.

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

Only browser-safe values should be placed in `apps/demo/.env`.

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

## Demo flow

1. Open the storefront in guest mode.
2. Use the account switcher to select a customer.
3. Show the customer's dashboard, product catalog, cart, and checkout mode.
4. Add products to the cart and change quantities.
5. Switch between beta, regular, admin preview, and rollout customer accounts.
6. Optionally open **Developer diagnostics** for hidden technical evidence.

## Validation

Run:

```bash
npm run build --workspace=@ffp/demo
npm run lint --workspace=@ffp/demo
```
