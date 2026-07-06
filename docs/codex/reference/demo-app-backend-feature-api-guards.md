# Demo App Backend Feature API Guards — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a
reference, not a transcript.

## Scope

This session added a lightweight backend API layer to the demo app so the
presentation can prove feature flags disable both frontend UI and backend API
behavior. The work stayed inside `apps/demo/` and Docker delivery files; it did
not add a new microservice, database connection, or control-plane capability.

The user first asked whether the SDK can disable both frontend and backend
demo-app features. The durable answer was: the SDK is a data-plane client that
calls the evaluation API and returns a decision; frontend and backend code must
then use that decision to guard UI, routes, or business logic.

## High-signal outcomes

- Added a demo-app backend under `apps/demo/server/`.
- The demo backend exposes one guarded GET endpoint per current demo feature
  flag:
  - `GET /api/demo/features/beta-dashboard?accountId=...`
  - `GET /api/demo/features/new-checkout?accountId=...`
  - `GET /api/demo/features/express-payment?accountId=...`
  - `GET /api/demo/features/shipping-progress-meter?accountId=...`
  - `GET /api/demo/features/coupon-engine?accountId=...`
  - `GET /api/demo/features/personalized-recommendations?accountId=...`
  - `GET /api/demo/features/trending-products?accountId=...`
  - `GET /api/demo/features/holiday-promo-banner?accountId=...`
  - `GET /api/demo/features/live-support-widget?accountId=...`
- Added `GET /api/demo/health` for the demo backend healthcheck.
- Each guarded endpoint maps directly to the same feature flag key in the URL.
- Each endpoint requires `accountId` and uses stable demo account context from
  seeded non-PII data.
- The demo backend uses `@ffp/js-sdk` to call the platform `POST /v1/evaluate`
  endpoint before returning feature-specific data.
- If evaluation returns `enabled=false`, or if SDK/evaluation transport fails,
  the demo backend fails closed with `403 FEATURE_DISABLED` and includes the
  evaluation result for demo traceability.
- The separate proof panel that was initially added to the demo UI was removed
  after user feedback. The existing flagged UI remains the visible proof.
- Two existing feature buttons now call backend endpoints:
  - `Express Pay` calls `/api/demo/features/express-payment` before placing the
    demo order.
  - `Open chat` calls `/api/demo/features/live-support-widget` before opening
    the demo chat session.
- Local dev still uses `npm run dev:demo`; Vite mounts the demo backend handler
  as middleware.
- Production-like and Docker demo app execution now uses a Node server so it can
  serve both the built SPA and `/api/demo/*`.

## Files and artifacts

Created:

- `apps/demo/server/demo-api.ts`
  - Defines demo backend request handling, feature endpoint parsing, evaluation
    guard behavior, `403 FEATURE_DISABLED`, and health response.
- `apps/demo/server/demo-data.ts`
  - Reuses demo seed data to find accounts and build feature-specific mock
    payloads without a database connection.
- `apps/demo/server/server.ts`
  - Node server that serves `/api/demo/*` and static `dist/` SPA assets.
- `apps/demo/tsconfig.server.json`
  - TypeScript config for compiling demo backend server code.

Edited:

- `apps/demo/src/App.tsx`
  - Added `callGuardedFeatureApi` helper.
  - Wired `Express Pay` to the `express-payment` backend endpoint.
  - Wired `Open chat` to the `live-support-widget` backend endpoint.
  - Removed the temporary separate backend proof panel and related state.
- `apps/demo/src/data/seed.ts`
  - Updated relative import to include `.js` so NodeNext server compilation can
    consume shared demo seed data.
- `apps/demo/vite.config.ts`
  - Added a dev-server middleware plugin that routes `/api/demo/*` to the same
    demo backend handler during `npm run dev:demo`.
- `apps/demo/package.json`
  - Build now compiles frontend and demo backend.
  - Added `start` script for the compiled demo server.
- `apps/demo/Dockerfile`
  - Changed demo runtime from nginx static serving to Node serving frontend plus
    backend API.
- `docker-compose.yml`
  - Demo services now set `DEMO_SERVER_API_BASE_URL=http://backend:3000/v1` so
    the demo container calls the platform backend by Compose service name.
  - Demo healthchecks now target `/api/demo/health`.
- `apps/demo/.env.example`
  - Documents optional server-only `DEMO_SERVER_API_BASE_URL`.
- `apps/demo/README.md`
  - Documents all 9 guarded endpoints, the two UI buttons that call APIs, and
    curl examples.
- `docs/release/demo-script.md`
  - Adds a presentation section for backend API guard proof using existing UI
    buttons and CLI curl.

No generated `apps/demo/server-dist/` output should be committed; it was removed
from the working tree after validation.

## Decisions and guardrails

- Keep control-plane and data-plane separation:
  - The platform backend in `apps/backend/` remains the only backend that owns
    management APIs, evaluation logic, Prisma, and PostgreSQL persistence.
  - The demo backend only calls the public data-plane evaluation API through
    `@ffp/js-sdk` and returns demo ecommerce data.
- Do not connect the demo backend to PostgreSQL or Prisma.
- Do not add secrets or control-plane credentials to demo frontend code.
- Keep safe defaults and fail-closed behavior: backend feature endpoints return
  disabled responses if evaluation cannot verify the feature is enabled.
- Keep stable non-PII targeting: demo accounts use seeded account and
  organization identifiers, not real user data.
- Keep feature status distinct from runtime decisions: endpoints enforce the
  runtime evaluation result and reason, not UI status labels.
- Avoid Playwright MCP for routine validation unless explicitly requested by the
  user, because it is token-expensive. Prefer build, lint, `git diff --check`,
  Docker config checks, and curl smoke tests.

## Validation and caveats

Validation commands run during the session:

```bash
npm run build --workspace=@ffp/demo
npm run lint --workspace=@ffp/demo
docker compose config --quiet
git diff --check
```

A compiled demo server was started on a temporary local port and curl-smoked.
The health endpoint returned `200 OK`. All 9 feature endpoints were curl-tested
with a seeded account; results depended on current flag configuration. Example
observed outcomes included `200 OK` for enabled features and
`403 FEATURE_DISABLED` for an archived/disabled runtime decision.

Caveats for future work:

- The demo backend is intentionally presentation-grade. It is not auth, not a
  production ecommerce backend, and not a second feature-flag control plane.
- The demo app still has browser evaluation calls for UI gating and server
  evaluation calls for backend API gating. This is deliberate for demonstrating
  both planes.
- In Docker, the demo backend must use `DEMO_SERVER_API_BASE_URL` with the
  Compose backend service name, not browser `localhost`.
- In local dev, `DEMO_SERVER_API_BASE_URL` can be omitted and will fall back to
  `VITE_API_BASE_URL`.

## Best reusable next prompt

```text
Continue from docs/codex/reference/demo-app-backend-feature-api-guards.md.
Review the demo-app backend feature API guard implementation and help me make it
submission-ready without adding a separate proof UI. Preserve the 9
/api/demo/features/:featureKey endpoints, keep Express Pay and Open chat wired
to their existing feature endpoints, keep demo backend separate from PostgreSQL
and admin/control-plane code, and validate with build/lint/diff/curl rather than
Playwright unless I explicitly ask for browser checks.
```

## Source notes

Source is the current Codex conversation in this repository. Relevant guardrail
sources are:

- `AGENTS.md`
- `.agents/skills/codex-session-reference/SKILL.md`
- `.agents/skills/javascript-sdk-delivery/SKILL.md`
- `.agents/skills/demo-scenarios/SKILL.md`
- `.agents/skills/frontend-ui-ux-editor/SKILL.md`
- `docs/plan/recommended-enhancements-roadmap.md`
- `docs/release/demo-script.md`
- `apps/demo/README.md`
