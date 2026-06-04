# Phase 0 MVP API Contracts — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a reference, not a transcript.

## Scope

The session guided Phase 0 of the implementation roadmap as an architecture
contract workshop. The user asked Codex to discuss decisions step by step, then
create and review the Phase 0 MVP contract document before freezing it for
implementation.

The work focused on:

- API contract consistency for `/v1`.
- Evaluation flow correctness and fail-safe behavior.
- Rule model and reason-code design.
- Stable hashing for deterministic percentage rollout.
- Error, validation, pagination, sorting, filtering, and audit contracts.
- Sample-user semantics and seed/demo readiness.
- MVP scope control before backend/frontend scaffolding.

## High-signal outcomes

- Created `docs/design/mvp-api-and-contracts.md` as the Phase 0 contract
  reference.
- Reviewed the document as an architect and updated it with implementation
  blockers found during review.
- Confirmed Phase 0 is documentation/contract work only; backend, frontend,
  database, and demo implementation remain later phases.
- Kept the MVP focused while documenting future extension points, especially
  bulk evaluation.

## Files and artifacts

Created:

- `docs/design/mvp-api-and-contracts.md`

Created by this summary task:

- `docs/codex/reference/phase-0-mvp-api-contracts.md`

Relevant source/guardrail docs used or referenced:

- `AGENTS.md`
- `docs/plan/implementation-roadmap.md`
- `docs/plan/project-goal.md`
- `docs/requirement/requirement-init.md`
- `docs/requirement/info-init.md`
- `docs/requirement/demo/minimal-mvp.md`
- `docs/design/software-architecture-document.md`

Skills used during the session:

- `.agents/skills/workflow-feature-delivery/SKILL.md`
- `.agents/skills/workflow-quality-review/SKILL.md`
- `.agents/skills/api-design/SKILL.md`
- `.agents/skills/rule-evaluation/SKILL.md`
- `.agents/skills/audit-logging/SKILL.md`
- `.agents/skills/security-defaults/SKILL.md`
- `.agents/skills/data-modeling/SKILL.md`
- `.agents/skills/demo-scenarios/SKILL.md`
- `.agents/skills/codex-session-reference/SKILL.md`

## Decisions and guardrails

### Phase 0 artifact

- Use one centralized document:
  `docs/design/mvp-api-and-contracts.md`.
- Treat it as the implementation contract for later backend, UI, database,
  demo, and test work.

### API conventions

- Base path: `/v1`.
- JSON request/response bodies using `camelCase`.
- Control-plane APIs:
  - `/v1/projects`
  - `/v1/projects/{projectKey}/flags`
  - `/v1/projects/{projectKey}/flags/{flagKey}/rules`
  - `/v1/projects/{projectKey}/sample-users`
  - `/v1/projects/{projectKey}/audit-logs`
- Data-plane API:
  - `POST /v1/evaluate`
- Management mutations require `X-Actor`; missing normal mutation actor returns
  `VALIDATION_ERROR`.
- Backend accepts `X-Request-Id`; if missing, it generates one. The same request
  ID should appear in logs, errors, and audit entries.

### Evaluation contract

- Evaluation request uses `context`, not `user`.
- Evaluation response includes:
  - `projectKey`
  - `flagKey`
  - `enabled`
  - `variant`
  - `reason`
  - `matchedRuleId`
- MVP boolean `variant` is derived, not persisted:
  - `enabled=true` -> `variant="on"`
  - `enabled=false` -> `variant="off"`
- Missing project or flag returns evaluation-shaped `200 OK` with:
  - `enabled=false`
  - `variant="off"`
  - `reason=NOT_FOUND`
  - `matchedRuleId=null`
- Public evaluation response uses `NOT_FOUND` for both missing project and
  missing flag; internal logs may distinguish them.
- `INVALID_CONTEXT` and `ERROR` must fail closed with `enabled=false` and
  `variant="off"`.
- Malformed JSON, missing top-level `projectKey` / `flagKey` / `context`,
  non-object `context`, or invalid key formats return management-style
  `400 VALIDATION_ERROR`.

### Reason codes

Final MVP reason codes:

- `GLOBAL_ON`
- `FLAG_DISABLED`
- `FLAG_ARCHIVED`
- `KILL_SWITCH`
- `USER_ALLOWLIST`
- `ROLE_MATCH`
- `PERCENTAGE_ROLLOUT`
- `DEFAULT_OFF`
- `NOT_FOUND`
- `INVALID_CONTEXT`
- `ERROR`

### Rule model

- Do not model `GLOBAL` as a rule.
- Flag-level runtime fields:
  - `status: ENABLED | DISABLED | ARCHIVED`
  - `servingMode: GLOBAL_ON | TARGETED`
  - `killSwitch: boolean`
- MVP rule types:
  - `USER_ALLOWLIST`
  - `ROLE_TARGETING`
  - `PERCENTAGE_ROLLOUT`
- Rule `priority` is unique within a flag.
- Duplicate priorities in a rule replacement payload return
  `VALIDATION_ERROR`; conflicts with existing stored rules in single-rule
  create/update flows return `CONFLICT`.
- Disabled rules are skipped.
- Type precedence cannot be overridden by priority; priority orders rules of
  the same type.

### Evaluation order

The agreed order in the contract:

1. Missing project or flag -> `NOT_FOUND`.
2. Archived flag -> `FLAG_ARCHIVED`.
3. `killSwitch=true` -> `KILL_SWITCH`.
4. Disabled flag -> `FLAG_DISABLED`.
5. `servingMode=GLOBAL_ON` -> `GLOBAL_ON`.
6. Skip disabled rules.
7. User allowlist match -> `USER_ALLOWLIST`.
8. Role-targeting match -> `ROLE_MATCH`.
9. Enabled percentage rollout reached without usable `targetingKey` ->
   `INVALID_CONTEXT`.
10. Percentage rollout match -> `PERCENTAGE_ROLLOUT`.
11. No match -> `DEFAULT_OFF`.

`ERROR` is not a normal rule-order step; it is a top-level recoverable
exception fallback.

### Stable hashing

- Percentage rollout requires `context.targetingKey`; no random fallback.
- Hash input:
  `${projectKey}:${flagKey}:${targetingKey}`
- Canonicalization:
  - `projectKey`: validated lowercase kebab-case
  - `flagKey`: validated lowercase kebab-case
  - `targetingKey`: trim whitespace, reject empty, preserve case
- SHA-256 bucket algorithm:
  1. UTF-8 encode hash input.
  2. SHA-256.
  3. Take first 8 bytes as unsigned big-endian integer.
  4. `bucket = first64Bits % 10000`.
  5. `bucketPercentage = bucket / 100`.
  6. Match when `bucketPercentage < percentage`.
- `percentage` is a number from `0` to `100` inclusive, with up to 2 decimal
  places.

### Validation and uniqueness

- `projectKey` and `flagKey` use lowercase kebab-case:
  `^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$`
- Length: 3-64 characters.
- No underscores, dots, spaces, uppercase, leading dash, or trailing dash.
- `projectKey` is globally unique and immutable.
- `flagKey` is unique within a project and immutable; same `flagKey` may exist
  in different projects.
- Duplicate `projectKey` or same-project duplicate `flagKey` returns
  `409 CONFLICT`.

### Error contract

- Management/control-plane errors use:
  - `VALIDATION_ERROR` -> 400
  - `NOT_FOUND` -> 404
  - `CONFLICT` -> 409
  - `INTERNAL_ERROR` -> 500
- `requestId` required in every error.
- `details` required for `VALIDATION_ERROR`; optional for other errors.
- `UNAUTHORIZED` and `FORBIDDEN` are reserved for future auth/RBAC.

### Pagination, sorting, and filtering

- Offset pagination:
  - `limit` default 20, min 1, max 100
  - `offset` default 0, min 0
- List response includes:
  - `items`
  - `page.limit`
  - `page.offset`
  - `page.total`
  - `page.hasNext`
- `hasNext = offset + limit < total`.
- Sorting uses `sort` + `order`; unsupported values return
  `VALIDATION_ERROR`.
- Audit logs default to `createdAt desc`; rules default to `priority asc`.
- Allowed filters are documented per list endpoint.

### Audit log contract

- Audit logs are append-only.
- Project, feature flag, and rule mutations must write audit entries in the
  same transaction as the mutation.
- Audit entries include:
  - `id`
  - `projectKey`
  - `targetType`
  - `targetId`
  - optional `targetKey`
  - `action`
  - `actor`
  - nullable `before`
  - nullable `after`
  - optional `metadata`
  - `createdAt`
  - `requestId`
- Snapshot rule: minimal meaningful snapshots; include changed fields and stable
  identifiers; exclude secrets, raw PII, and unrelated fields.
- `FLAG_RULES_REPLACED` targets the feature flag:
  - `targetType=FEATURE_FLAG`
  - `targetId=<flagId>`
  - `targetKey=<flagKey>`
  - `action=FLAG_RULES_REPLACED`
- For MVP, audit metadata may store only `source`; `ip` and `userAgent` are
  optional.

### Sample users and seed/demo data

- Sample users are stored demo contexts, not authentication users or production
  identities.
- Sample users require stable non-PII identifiers.
- `targetingKey` is unique within a project; duplicates return
  `409 CONFLICT`.
- Seed/demo expectations include:
  - one demo project
  - globally enabled flag
  - targeted flag
  - role-targeting rule
  - percentage-rollout rule
  - sample users with different evaluation outcomes
  - audit entries for setup mutations if seeded through app services

### Out of MVP scope

Explicitly out of MVP unless all required deliverables are complete:

- bulk evaluation endpoint
- client SDK
- Redis cache
- streaming/realtime updates
- multivariate flags
- experiment analytics/statistics dashboard
- full auth/RBAC
- advanced targeting operators
- rule versioning beyond append-only audit logs
- group kill switch
- Docker Compose one-command setup

## Validation and caveats

Validation run during the session:

```bash
git diff --check
```

Result: passed after document creation and after subsequent update passes.

`markdownlint` was checked with `command -v markdownlint` and was not available
in the environment.

Known repo status caveat at one point in the session:

- Existing unrelated changes were present:
  - `.gitignore`
  - `docs/codex/history/2026-06-03-context-index.md`
- Codex only created/edited the Phase 0 contract document during the main task.

## Best reusable next prompt

```text
Use docs/design/mvp-api-and-contracts.md as the frozen Phase 0 contract.
Review Phase 1 in docs/plan/implementation-roadmap.md and guide me step by
step to scaffold the project professionally. Preserve the Phase 0 contracts:
/v1 JSON APIs, control-plane/data-plane separation, deterministic evaluation,
safe OFF defaults, stable non-PII targeting keys, append-only transactional
audit logs, and MVP scope control.
```

## Source notes

This summary is based on the current visible Codex conversation. It captures
durable decisions and artifacts, not the raw transcript.

