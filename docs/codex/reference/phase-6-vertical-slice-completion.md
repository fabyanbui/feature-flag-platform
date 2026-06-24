# Phase 6 Vertical Slice Completion — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a
reference, not a transcript.

## Scope

This session guided and completed Phase 6 from
`docs/plan/implementation-roadmap.md`: the early vertical slice that proves a
control-plane configuration can be created, audited, evaluated through the
data-plane API, and displayed in the demo app before expanding to the Phase 7
admin dashboard.

The user wanted step-by-step principal-engineer guidance, starting from Phase 5
being complete and ending with Phase 6 validated.

## High-signal outcomes

- Created and fixed the Phase 6 backend e2e test flow in
  `apps/backend/test/phase-6-vertical-slice.e2e-spec.ts`.
- The e2e test now proves:
  - `POST /v1/projects` creates a demo project with `X-Actor`.
  - `POST /v1/projects/:projectKey/flags` creates `new-checkout` safely
    disabled by default.
  - `PATCH /v1/projects/:projectKey/flags/:flagKey` enables targeted serving.
  - `PUT /v1/projects/:projectKey/flags/:flagKey/rules` configures a
    `ROLE_TARGETING` rule for `beta-tester`.
  - `POST /v1/evaluate` returns `enabled=true`, `variant=on`,
    `reason=ROLE_MATCH` for `demo-user-beta`.
  - `POST /v1/evaluate` returns `enabled=false`, `variant=off`,
    `reason=DEFAULT_OFF` for `demo-user-regular`.
  - `GET /v1/projects/:projectKey/audit-logs` verifies
    `PROJECT_CREATED`, `FEATURE_FLAG_CREATED`, `FEATURE_FLAG_UPDATED`, and
    `FLAG_RULES_REPLACED` audit entries with before/after snapshots where
    applicable.
- Fixed a Step 4 test issue: evaluation requests and assertions had been
  placed outside the `it(...)` block, causing out-of-scope variables and
  invalid async test structure.
- Connected `apps/demo/src/App.tsx` to the real `/v1/evaluate` endpoint.
- The demo app now displays `projectKey`, `flagKey`, `enabled`, `reason`,
  runtime state, loading state, error state, retry action, and gated
  `New Checkout Widget` content.
- Added a Phase 6 validation note under Phase 6 in
  `docs/plan/implementation-roadmap.md`.

## Files and artifacts

- `apps/backend/test/phase-6-vertical-slice.e2e-spec.ts`
  - Authoritative Phase 6 backend e2e coverage for the early vertical slice.
  - Uses a unique `phase6-demo-${Date.now()}` project key for test isolation.
  - Uses stable synthetic non-PII contexts:
    - `demo-user-beta` with role `beta-tester`.
    - `demo-user-regular` with role `user`.
- `apps/demo/src/App.tsx`
  - Demo client for `/v1/evaluate`.
  - Uses `VITE_API_BASE_URL`, `VITE_DEFAULT_PROJECT_KEY`, and
    `VITE_DEFAULT_FLAG_KEY`.
  - Sends evaluation body with `context`, not `user`.
- `apps/demo/src/App.css`
  - Adds scenario selection, result, error, and gated-feature styles.
- `apps/demo/.env`
  - Should point at stable demo keys for local browser demos:
    `demo-project` and `new-checkout`.
- `apps/demo/.env.example`
  - Should stay aligned with the demo app's expected Vite variables.
- `.env.example`
  - Should keep backend CORS and frontend Vite variable examples aligned.
- `docs/plan/implementation-roadmap.md`
  - Phase 6 includes a validation note referencing the e2e test and demo app
    API integration.
- `docs/codex/reference/phase-6-e2e-evaluation-step-fix.md`
  - Existing related reference for the specific Step 4 e2e evaluation fix.

## Decisions and guardrails

- Phase 6 is a contract-validation slice, not the full Phase 7 admin UI or
  full Phase 8 demo app.
- Keep control-plane management APIs separate from data-plane evaluation:
  mutation APIs require `X-Actor`; `/v1/evaluate` does not mutate state.
- Keep feature flag status/config labels distinct from runtime result:
  - Config `status: ENABLED` means the flag may serve.
  - Evaluation `enabled: true | false` means runtime On/Off for one context.
- Use synthetic non-PII stable keys for targeting and rollout examples.
- For the clearest Phase 6 demo:
  - `demo-user-beta` should return `ROLE_MATCH` and feature On.
  - `demo-user-regular` should return `DEFAULT_OFF` and feature Off.
- Audit logging remains non-negotiable: setup mutations must produce
  append-only entries with actor, action, target, and snapshots in the same
  mutation flow.

## Validation and caveats

- The Phase 6 e2e test was run successfully during the session after fixing the
  Step 4 placement issue:

  ```bash
  npm run test:e2e --workspace=@ffp/backend -- phase-6-vertical-slice
  ```

- The sandbox initially blocked Supertest's local server bind with
  `listen EPERM`; rerunning the same local e2e command with approved escalation
  passed.
- The user reported Step 8 complete after running final validation steps.
- Important seed caveat: `apps/backend/prisma/seed.ts` currently seeds
  `new-checkout` with `USER_ALLOWLIST`, `ROLE_TARGETING`, and
  `PERCENTAGE_ROLLOUT`. Because of the 50% rollout rule, a regular user may
  deterministically return `PERCENTAGE_ROLLOUT` instead of `DEFAULT_OFF`.
  During the session, the recommended Phase 6 demo fix was to replace
  `demo-project/new-checkout` rules with only:

  ```json
  {
    "type": "ROLE_TARGETING",
    "priority": 10,
    "enabled": true,
    "parameters": {
      "roles": ["beta-tester"]
    }
  }
  ```

- If `npm run db:seed --workspace=@ffp/backend` is run again, it may recreate
  the percentage rollout rule. For a permanently stable Phase 6 demo, update
  the seed data or document the rollout behavior explicitly before presenting.

## Best reusable next prompt

```text
Start Phase 7. Use AGENTS.md, docs/plan/implementation-roadmap.md, and the
Phase 6 reference in docs/codex/reference/phase-6-vertical-slice-completion.md.
Build the admin UI professionally in small steps: project list, flag list,
create/edit flag, rule editor, and audit log page. Preserve control-plane vs
data-plane separation, distinguish flag config status from runtime On/Off, use
the existing /v1 backend APIs, and keep loading/empty/error/confirmation states
accessible.
```

## Source notes

- Source was the current Codex conversation visible in context.
- Relevant durable sources:
  - `AGENTS.md`
  - `docs/plan/implementation-roadmap.md`
  - `docs/plan/project-goal.md`
  - `docs/requirement/demo/demo-app.md`
  - `.agents/skills/workflow-feature-delivery/SKILL.md`
  - `.agents/skills/demo-scenarios/SKILL.md`
  - `.agents/skills/rule-evaluation/SKILL.md`
  - `.agents/skills/audit-logging/SKILL.md`
  - `.agents/skills/workflow-quality-review/SKILL.md`
