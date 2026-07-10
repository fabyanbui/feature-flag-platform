# Phase 15 JavaScript SDK Demo Migration — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a
reference, not a transcript.

## Scope

The user asked Codex to implement Phase 15 from
`docs/plan/recommended-enhancements-roadmap.md` after the completed MVP path and
recommended Phases 10 through 14. Phase 15 introduced the data-plane
JavaScript SDK package and migrated the demo application away from direct
evaluation `fetch` calls.

The work stayed inside the active recommended roadmap and treated the completed
MVP plus Phases 10 through 14 as the protected regression baseline. The main
skills used were:

- `.agents/skills/javascript-sdk-delivery/SKILL.md`
- `.agents/skills/frontend-ui-ux-editor/SKILL.md`
- `.agents/skills/security-defaults/SKILL.md`
- `.agents/skills/workflow-quality-review/SKILL.md`

## High-signal outcomes

- Added a workspace package named `@ffp/js-sdk` under `packages/js-sdk/`.
- Implemented the public SDK factory
  `createFeatureFlagClient({ baseUrl, projectKey, environmentKey?,
  timeoutMs?, fetch? })`.
- Implemented SDK methods:
  - `evaluate(flagKey, context)`
  - `isEnabled(flagKey, context)`
  - `getVariant(flagKey, context)`
- Kept the SDK data-plane only: it calls only `POST /v1/evaluate` and does not
  introduce control-plane APIs, actor headers, secrets, local evaluation, or
  decision caching.
- Preserved distinct identity semantics:
  - `targetingKey` is the stable non-PII rollout key.
  - `userId` remains optional and is not required to equal `targetingKey`.
- Added strict backend response validation for project key, flag key, enabled
  state, variant, reason, and nullable matched rule ID.
- Added typed SDK-local fail-closed fallback for timeout, network, unsuccessful
  HTTP, invalid JSON, invalid response shape, unserializable context, and
  invalid request failures.
- Kept backend reason-code contracts stable. SDK-local fallback uses
  `reason: 'ERROR'` with `errorSource: 'CLIENT'`; normal backend responses do
  not include `errorSource`.
- Migrated `apps/demo` to consume evaluation through `@ffp/js-sdk`.
- Preserved demo presentation visibility for project, environment, flag,
  targeting, role, enabled state, variant, reason, matched rule, loading,
  retry, and gated-feature states.
- Added request sequencing in the demo so stale SDK responses cannot overwrite
  a newer scenario selection.
- Updated Phase 15 roadmap evidence and marked Gate B as passed, because cache,
  statistics, SDK, demo, and stable evaluation-contract validations were green.

## Files and artifacts

Code and package files added under `packages/js-sdk/`:

- `packages/js-sdk/.gitignore`
- `packages/js-sdk/README.md`
- `packages/js-sdk/package.json`
- `packages/js-sdk/tsconfig.json`
- `packages/js-sdk/tsconfig.test.json`
- `packages/js-sdk/jest.config.cjs`
- `packages/js-sdk/eslint.config.js`
- `packages/js-sdk/src/contracts.ts`
- `packages/js-sdk/src/response-validator.ts`
- `packages/js-sdk/src/client.ts`
- `packages/js-sdk/src/index.ts`
- `packages/js-sdk/test/client.spec.ts`

Workspace and dependency files changed:

- `package.json`
- `package-lock.json`
- `apps/demo/package.json`

Demo app files changed:

- `apps/demo/.env.example`
- `apps/demo/README.md`
- `apps/demo/src/App.tsx`
- `apps/demo/src/App.css`

Project documentation changed:

- `AGENTS.md`
- `README.md`
- `docs/requirement/demo/demo-app.md`
- `docs/design/mvp-api-and-contracts.md`
- `docs/design/software-architecture-document.md`
- `docs/presentation/slide-outline.md`
- `docs/release/demo-script.md`
- `docs/release/security-review.md`
- `docs/research/feature-flag-platform-research-report.md`
- `docs/plan/recommended-enhancements-roadmap.md`

Important implementation details:

- Root `package.json` workspace order now lists packages before apps so
  `@ffp/js-sdk` builds before app workspaces.
- `apps/demo/.env.example` includes `VITE_API_BASE_URL` and
  `VITE_ENVIRONMENT_KEY`.
- `apps/demo/src` no longer contains direct evaluation `fetch` logic.
- `docs/plan/recommended-enhancements-roadmap.md` contains Phase 15 completion
  evidence, final validation evidence, and Gate B completion evidence.

## Decisions and guardrails

- The backend remains the only authority for evaluation decisions, precedence,
  deterministic rollout, cache behavior, and metric recording.
- The SDK is a thin transport and validation wrapper around the stable
  evaluation API.
- SDK-local failure behavior is explicitly fail-closed:
  `enabled=false`, `variant='off'`, `reason='ERROR'`,
  `matchedRuleId=null`, `errorSource='CLIENT'`.
- SDK-local fallback does not add SDK-only reason codes to the backend
  `EvaluationReason` union.
- Backend responses with `reason='ERROR'` remain valid backend results and are
  not treated as SDK-local errors unless `errorSource='CLIENT'` is present.
- The SDK avoids PII storage and does not persist decisions.
- The demo keeps feature flag status labels separate from runtime On/Off state.
- The control-plane and data-plane boundary remains explicit:
  - Admin and management endpoints are control-plane concerns.
  - SDK and demo evaluation are data-plane concerns.

Relevant guardrail sources:

- `AGENTS.md`
- `docs/requirement/requirement-init.md`
- `docs/requirement/info-init.md`
- `docs/plan/project-goal.md`
- `docs/plan/implementation-roadmap.md`
- `docs/plan/recommended-enhancements-roadmap.md`

## Validation and caveats

Validation completed during the implementation session:

- `npm run test --workspace=@ffp/js-sdk`
- `npm run build --workspace=@ffp/js-sdk`
- `npm run lint --workspace=@ffp/js-sdk`
- `npm run build --workspace=@ffp/demo`
- `npm run lint --workspace=@ffp/demo`
- `npm run test`
- `npm run build`
- `npm run lint`
- `npm run test:integration --workspace=@ffp/backend`
- `npm run test:e2e --workspace=@ffp/backend -- --runInBand`
- `npm run prisma:validate --workspace=@ffp/backend`
- `npm run diff:check`
- `git diff --check`
- `npm pack --dry-run --workspace=@ffp/js-sdk`

Observed validation results:

- SDK unit tests passed: 21 tests.
- Backend unit tests passed: 47 suites and 357 tests.
- Backend integration tests passed: three suites and 11 tests.
- Backend E2E tests passed: nine suites and 37 tests.
- SDK, backend, admin, and demo production builds passed.
- All workspace lint checks passed.
- Prisma schema validation passed.
- Live SDK smoke checks against seeded backend confirmed:
  - `GLOBAL_ON`
  - `ROLE_MATCH`
  - `PERCENTAGE_ROLLOUT`
  - `DEFAULT_OFF`
  - `NOT_FOUND`
- Live backend health and demo development server HTTP checks passed.

Caveats:

- Browser automation was unavailable in the execution environment, so no
  automated Playwright browser inspection was completed.
- Responsive layout, focus visibility, textual status, loading, client
  fallback, and retry behavior were validated by implementation review,
  TypeScript, ESLint, production build, and live-server checks.
- A non-failing existing `pg` deprecation warning remained visible during
  database-backed tests and was unchanged from Phase 14.
- `npm install` reported dependency vulnerabilities, but no audit or remediation
  was performed in this Phase 15 session.

## Best reusable next prompt

Continue from the Phase 15 JavaScript SDK and demo migration. First inspect
`docs/plan/recommended-enhancements-roadmap.md`, especially Phase 15 completion
evidence and Gate B. Confirm the current git state, then proceed only if the
Phase 15 and Gate B validation evidence still holds. Preserve the SDK as a
data-plane-only wrapper around `POST /v1/evaluate`, keep fail-closed client
fallback with `errorSource='CLIENT'`, and do not change backend evaluation
reason codes or precedence without explicit roadmap justification.

## Source notes

This reference was created from the visible Codex conversation context for the
Phase 15 implementation workstream, not from a local raw session log. It
summarizes outcomes and durable decisions only; it intentionally excludes raw
transcript turns, long command output, secrets, and unrelated worktree changes.
