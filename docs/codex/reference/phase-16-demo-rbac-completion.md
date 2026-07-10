# Phase 16 Demo RBAC Completion — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a reference, not a transcript.

## Scope

This session implemented and validated Phase 16 from
[`docs/plan/recommended-enhancements-roadmap.md`](../../plan/recommended-enhancements-roadmap.md):
server-resolved demo role-based access control for the feature flag platform.
The work followed the completed MVP baseline in
[`docs/plan/implementation-roadmap.md`](../../plan/implementation-roadmap.md) and
kept Phase 10 through Phase 15 behavior intact.

The user asked Codex to act as a principal engineer, implement Phase 16 end to
end, run completion checks, and confirm whether the project could proceed to
Phase 17.

## High-signal outcomes

- Phase 16 was completed and committed as a working RBAC increment.
- Backend control-plane access moved from client-provided `X-Actor` to
  server-resolved bearer-token demo identities.
- Data-plane evaluation and health endpoints remained public and fail-closed.
- Control-plane mutations continue to use trusted server-resolved audit actors.
- Admin UI gained local demo identity switching with role-aware disabled states.
- Viewer can read control-plane resources but cannot create or mutate projects,
  flags, groups, or rules.
- Developer can manage flags, rules, and group assignments without full admin
  authority.
- Admin has all configured demo permissions.
- Phase 17 was judged safe to start after Phase 16 validation passed, with the
  caveat that Phase 17 should implement only the Docker Compose baseline and not
  claim one-command startup until the later compose stabilization phase.

## Files and artifacts

Backend RBAC implementation:

- `apps/backend/src/auth/demo-role.ts`
- `apps/backend/src/auth/permission.ts`
- `apps/backend/src/auth/permission-matrix.ts`
- `apps/backend/src/auth/demo-identity.ts`
- `apps/backend/src/auth/demo-identity.service.ts`
- `apps/backend/src/auth/public.decorator.ts`
- `apps/backend/src/auth/require-permissions.decorator.ts`
- `apps/backend/src/auth/demo-authentication.guard.ts`
- `apps/backend/src/auth/permission.guard.ts`
- `apps/backend/src/auth/auth.module.ts`
- `apps/backend/src/common/request-context.ts`
- `apps/backend/src/common/error-code.ts`
- Control-plane controllers under `apps/backend/src/**` were updated with
  bearer auth metadata and permission requirements.

Backend tests and helpers:

- `apps/backend/test/phase-16-rbac.e2e-spec.ts`
- `apps/backend/test/rbac-test-credentials.ts`
- `apps/backend/test/create-e2e-app.ts`
- `apps/backend/test/integration-test-helpers.ts`
- Unit tests were added for the demo identity service, authentication guard,
  permission guard, and permission matrix.

Admin UI implementation:

- `apps/admin/src/auth/model.ts`
- `apps/admin/src/auth/auth-context.ts`
- `apps/admin/src/auth/AuthContext.tsx`
- `apps/admin/src/auth/useAuth.ts`
- `apps/admin/src/lib/api.ts`
- `apps/admin/src/App.tsx`
- `apps/admin/src/pages/ProjectListPage.tsx`
- `apps/admin/src/pages/FlagListPage.tsx`
- `apps/admin/src/pages/FlagForm.tsx`
- `apps/admin/src/pages/FlagGroupPage.tsx`
- `apps/admin/src/pages/RuleEditorPage.tsx`
- `apps/admin/src/App.css`

Environment and docs updated:

- `.env.example`
- `apps/admin/.env.example`
- `README.md`
- `docs/design/mvp-api-and-contracts.md`
- `docs/design/software-architecture-document.md`
- `docs/release/security-review.md`
- `docs/release/demo-script.md`
- `docs/presentation/slide-outline.md`
- `docs/research/feature-flag-platform-research-report.md`
- `docs/plan/recommended-enhancements-roadmap.md`

Local ignored `.env` files were configured for the developer's machine, but no
secret values were recorded in docs or this reference.

## Decisions and guardrails

- Keep `GET /v1/health` and `POST /v1/evaluate` public.
- Protect control-plane routes with global authentication and permission guards.
- Fail closed when a protected route has no permission metadata.
- Use a centralized role-to-permission matrix:
  - `ADMIN`: all demo permissions.
  - `DEVELOPER`: read control-plane resources and manage flags, rules, and
    group assignments.
  - `VIEWER`: read-only control-plane access.
- Store trusted identity in request context and derive audit actors from the
  server-resolved identity, not from client-supplied actor headers.
- Preserve append-only audit logging for mutations and keep audit writes in the
  same transaction as the corresponding mutation.
- Preserve deterministic evaluation semantics and stable non-PII rollout keys.
- Keep feature flag status labels separate from runtime On/Off evaluation state.
- Do not start Redis work before the correct roadmap gate; Redis belongs to the
  later optional cache-provider phase, not the Phase 17 Docker baseline.

## Validation and caveats

Completed validation during the session:

```bash
npm run build
npm run lint
npm run test
npm run test:integration --workspace=@ffp/backend
npm run test:e2e --workspace=@ffp/backend -- --runInBand
npm run diff:check
```

Observed results:

- All workspace builds passed.
- All lint checks passed.
- All unit tests passed, including backend and `@ffp/js-sdk` tests.
- Backend integration tests passed.
- Backend E2E tests passed, including Phase 16 RBAC coverage.
- Whitespace diff check passed.
- Headless browser checks passed for desktop and mobile admin UI states.
- Known non-blocking caveat: existing PostgreSQL test warning about
  `client.query()` during execution remained visible in integration/E2E output.
- `markdownlint` was not installed during the Phase 16 validation run.

Phase 17 readiness conclusion:

- It is OK to move to Phase 17 because Phase 16 validation is green and the
  RBAC increment was committed.
- Phase 17 should focus on a Docker Compose baseline for PostgreSQL, backend,
  admin, and demo, plus health checks and documentation.
- Do not describe Phase 17 as final one-command startup unless migrations and
  seeding are automated in the later compose stabilization phase.

## Best reusable next prompt

Use this prompt to continue from this session:

```text
Read AGENTS.md, docs/plan/recommended-enhancements-roadmap.md, and the
repo-scoped docker-compose-delivery skill. Phase 16 demo RBAC is complete and
validated. Implement the next roadmap phase without regressing Phase 16:
create the Docker Compose baseline for PostgreSQL, backend, admin, and demo;
add health checks; document required environment variables and manual
migration/seed steps; keep npm local development unchanged; and validate the
compose workflow as far as the local sandbox permits. Do not add Redis or claim
one-command startup unless the roadmap gate and phase scope allow it.
```

## Source notes

- Source: current Codex conversation visible in context, including the Phase 16
  implementation summary and the follow-up Phase 17 readiness answer.
- Skill used:
  [`.agents/skills/codex-session-reference/SKILL.md`](../../.agents/skills/codex-session-reference/SKILL.md).
- Repository guardrails used: [`AGENTS.md`](../../../AGENTS.md),
  [`docs/plan/implementation-roadmap.md`](../../plan/implementation-roadmap.md),
  and [`docs/plan/recommended-enhancements-roadmap.md`](../../plan/recommended-enhancements-roadmap.md).
