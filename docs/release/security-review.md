# Security Review — Phase 9 Release Readiness

## Purpose

This review documents the MVP security posture for the feature flag platform
before submission and presentation. It focuses on safe defaults, privacy-aware
targeting, CORS, browser exposure, and control-plane/data-plane separation.

This is not a production security certification. It is release-readiness
evidence for the required mini-project MVP.

## Scope

Reviewed surfaces:

- Backend API under `/v1`.
- Admin dashboard control-plane behavior.
- Demo app data-plane behavior.
- Evaluation engine defaults and reason codes.
- Audit logging behavior for configuration mutations.
- Local environment configuration examples.

Out of scope for the MVP:

- Full authentication and authorization.
- Secret rotation.
- Production rate limiting and abuse protection.
- Multi-tenant isolation beyond project-scoped data modeling.

## Safe Defaults

The system favors disabled/off behavior when evaluation cannot safely enable a
feature.

Evidence:

- Missing project or flag returns `enabled=false` with `reason=NOT_FOUND`.
- Evaluation service returns `enabled=false` with `reason=ERROR` when the
  repository path throws.
- Archived flags return off.
- Disabled configs return off.
- Kill switch returns off before targeting rules can enable the flag.
- No matching rule returns `enabled=false` with `reason=DEFAULT_OFF`.

Test evidence:

- `apps/backend/src/evaluation/engine/evaluation-engine.spec.ts`
- `apps/backend/src/evaluation/evaluation.service.spec.ts`
- `apps/backend/test/integration/phase-4-evaluation.integration-spec.ts`
- `apps/backend/test/phase-9-demo-flow.e2e-spec.ts`

## Privacy-Aware Targeting and Rollout Keys

The MVP uses stable non-PII identifiers for targeting and percentage rollout.

Accepted examples:

- `demo-user-beta`
- `demo-user-regular`
- `demo-rollout-on`
- `phase9-rollout-1`

Avoid using these values as rollout keys:

- email addresses,
- phone numbers,
- legal names,
- national identifiers,
- raw database IDs from unrelated systems,
- session tokens or credentials.

The percentage rollout hash uses `projectKey`, `flagKey`, and `targetingKey`.
The targeting key should therefore be stable but non-sensitive.

Test evidence:

- `apps/backend/src/evaluation/engine/stable-rollout-hash.spec.ts`
- `apps/backend/test/phase-9-demo-flow.e2e-spec.ts`

## Browser Exposure

The demo app is a data-plane consumer. It only needs the public API base URL.

Allowed in the demo app:

```env
VITE_API_BASE_URL=http://localhost:3000/v1
```

Not allowed in the demo app:

- `DATABASE_URL`
- `POSTGRES_MCP_DATABASE_URL`
- database passwords,
- backend API secrets,
- admin tokens,
- JWT secrets,
- private service credentials,
- write-capable control-plane credentials.

Evidence:

- `apps/demo/src/App.tsx` calls only `POST /v1/evaluate`.
- `apps/demo/.env.example` contains only browser-safe demo configuration.
- The demo app does not send `X-Actor`; actor identity is only needed for
  audited control-plane mutations.

## CORS

The backend enables CORS only for configured origins.

Implementation:

- `ADMIN_ORIGIN` controls admin dashboard origin.
- `DEMO_ORIGIN` controls demo app origin.
- If neither is configured, CORS origin is set to `false`.

Local expected values:

```env
ADMIN_ORIGIN=http://localhost:5173
DEMO_ORIGIN=http://localhost:5174
```

Evidence:

- `apps/backend/src/main.ts`
- `.env.example`

## Control Plane vs Data Plane

The MVP keeps configuration changes separate from runtime evaluation.

Control plane:

- Admin dashboard.
- Project creation and updates.
- Feature flag creation and updates.
- Rule replacement.
- Audit log inspection.
- Requires `X-Actor` for audited mutations.

Data plane:

- Demo app.
- `POST /v1/evaluate`.
- No mutation behavior.
- No actor header.
- No database or backend secrets in browser configuration.

Evidence:

- `apps/demo/src/App.tsx`
- `apps/backend/test/phase-9-demo-flow.e2e-spec.ts`
- `apps/backend/test/phase-9-api-hardening.e2e-spec.ts`

## Audit and Accountability

Mutation flows require actor identity and write audit records with before/after
snapshots in the same transaction as the mutation. This supports accountability
for control-plane changes.

Evidence:

- `apps/backend/src/audit/audit-log.service.ts`
- `apps/backend/src/projects/projects.service.ts`
- `apps/backend/src/feature-flags/feature-flags.service.ts`
- `apps/backend/src/flag-rules/flag-rules.service.ts`
- `apps/backend/test/integration/phase-5-management.integration-spec.ts`
- `apps/backend/test/phase-9-api-hardening.e2e-spec.ts`

## Known MVP Limitations and Mitigations

| Limitation | MVP mitigation |
| --- | --- |
| No full authentication system | Actor header is required for audited mutations and documented as MVP-only. |
| Evaluation endpoint is browser-callable for the demo | Demo only exposes non-sensitive demo flags and non-PII targeting keys. |
| No production rate limiting | Keep deployment local/demo scoped; add rate limiting before production use. |
| No server-side SDK | REST evaluation API is enough for the MVP demo; SDK is a recommended enhancement only after MVP stability. |
| Vite environment variables are browser-visible | Only browser-safe values are allowed in demo `.env` files. |

## Release Decision

The MVP is acceptable for local demonstration when:

1. Safe-default evaluation tests pass.
2. Demo app remains data-plane only.
3. Control-plane mutations require actor identity.
4. CORS origins are configured for local admin and demo apps.
5. No browser app contains database URLs, backend secrets, or admin tokens.
