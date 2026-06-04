# MVP API and Contracts

## 1. Purpose

This document freezes the Phase 0 MVP contracts for the Feature Flag Platform.
It is the implementation reference for API conventions, evaluation behavior,
rule types, deterministic rollout, error responses, pagination, audit logging,
and seed/demo readiness.

The contracts are derived from:

1. `docs/requirement/requirement-init.md`
2. `docs/requirement/info-init.md`
3. `docs/plan/project-goal.md`
4. `docs/plan/implementation-roadmap.md`
5. `docs/requirement/demo/minimal-mvp.md`
6. `docs/design/software-architecture-document.md`
7. `AGENTS.md`

Phase 0 does not implement the backend, frontend, database, or demo app. It
defines stable contracts so later implementation can proceed without inventing
behavior inside controllers, UI components, or tests.

## 2. Requirement Traceability

| MVP requirement | Contract section | Implementation module or artifact |
| --- | --- | --- |
| Research report | Project goal and requirement sources | `docs/requirement/feature-flag-research.md` |
| Project management API | API conventions, errors, pagination, audit | Backend projects module, `/v1/projects` |
| Feature flag CRUD API | API conventions, key validation, audit | Backend flags module, `/v1/projects/{projectKey}/flags` |
| Rule configuration API | Rule types, evaluation order, audit | Backend rules module, `/v1/projects/{projectKey}/flags/{flagKey}/rules` |
| Evaluation API | Evaluation contract, reason codes, hashing | Backend evaluation module, `POST /v1/evaluate` |
| Audit log API | Audit log contract, pagination, filtering | Backend audit module, `/v1/projects/{projectKey}/audit-logs` |
| Frontend dashboard | API conventions, status semantics, audit | Admin web app |
| Demo application | Evaluation contract, seed/demo expectations | Demo web app |
| Database | Audit contract, rule model, key validation | Prisma schema and PostgreSQL |
| Input validation | Key validation, error contract | DTOs and validation pipe |
| Basic error handling | Error contract, fail-safe evaluation behavior | Global exception filter and evaluation fallback handling |
| README run instructions | Phase 0 acceptance, seed/demo expectations | `README.md` quickstart |
| Seed data | Seed/demo data expectations | Prisma seed script |
| Short design documentation | This document | `docs/design/mvp-api-and-contracts.md` |

## 3. API Conventions

- Base path: `/v1`
- Request and response body format: JSON
- JSON field naming: `camelCase`
- Content type: `application/json`
- Management APIs are control-plane APIs.
- The evaluation API is the data-plane API.
- Evaluation failures must prefer safe disabled responses.
- Mutation requests should include an actor identity for audit logging.

### 3.1 Actor Identity

MVP mutation requests use an actor header:

```http
X-Actor: admin@example.local
```

The backend may use `system` for seed scripts or internal setup operations.
Future authentication/RBAC can replace this header with authenticated user
identity, but audit entries must still capture an actor.

### 3.2 Control Plane

Control-plane APIs manage configuration:

- `/v1/projects`
- `/v1/projects/{projectKey}/flags`
- `/v1/projects/{projectKey}/flags/{flagKey}/rules`
- `/v1/projects/{projectKey}/sample-users`
- `/v1/projects/{projectKey}/audit-logs`

### 3.3 Data Plane

Data-plane APIs answer runtime feature decisions:

- `POST /v1/evaluate`

The data plane must remain deterministic, fail-safe, and safe for repeated
calls with the same input.

## 4. Evaluation Contract

### 4.1 Endpoint

```http
POST /v1/evaluate
```

### 4.2 Request Body

```json
{
  "projectKey": "demo-project",
  "flagKey": "new-checkout",
  "context": {
    "targetingKey": "user-123",
    "userId": "user-123",
    "roles": ["beta-tester"],
    "attributes": {
      "country": "VN",
      "plan": "pro"
    }
  }
}
```

| Field | Required | Description |
| --- | --- | --- |
| `projectKey` | Yes | Stable project key. |
| `flagKey` | Yes | Stable flag key within the project. |
| `context` | Yes | Runtime context for evaluation. |
| `context.targetingKey` | Required for percentage rollout | Stable non-PII key used for deterministic rollout. |
| `context.userId` | Optional | Demo-friendly identifier for allowlist rules. |
| `context.roles` | Optional | Roles used for role targeting. |
| `context.attributes` | Optional | Additional non-PII attributes for future targeting. |

The MVP uses `context`, not `user`, because the value may represent a user,
tenant, account, service, or other stable target.

### 4.3 Response Body

```json
{
  "projectKey": "demo-project",
  "flagKey": "new-checkout",
  "enabled": true,
  "variant": "on",
  "reason": "ROLE_MATCH",
  "matchedRuleId": "rule_123"
}
```

| Field | Required | Description |
| --- | --- | --- |
| `projectKey` | Yes | Echoes the requested project key. |
| `flagKey` | Yes | Echoes the requested flag key. |
| `enabled` | Yes | Runtime result. `true` means On, `false` means Off. |
| `variant` | Yes | MVP boolean variant: `on` or `off`. |
| `reason` | Yes | Canonical reason code. |
| `matchedRuleId` | Yes, nullable | Opaque rule ID when a rule matched; otherwise `null`. |

For MVP boolean flags:

- `enabled=true` maps to `variant="on"`
- `enabled=false` maps to `variant="off"`

Multivariate flags are not in MVP scope.

### 4.4 Not Found Behavior

Missing project or missing flag must return a safe evaluation response:

```json
{
  "projectKey": "demo-project",
  "flagKey": "unknown-flag",
  "enabled": false,
  "variant": "off",
  "reason": "NOT_FOUND",
  "matchedRuleId": null
}
```

Evaluation uses `NOT_FOUND` for both missing project and missing flag. The
public data-plane response must not distinguish `PROJECT_NOT_FOUND` from
`FLAG_NOT_FOUND`. The backend may log more specific internal diagnostics with
the request ID.

### 4.5 Invalid Context and Error Fallbacks

`INVALID_CONTEXT` is returned when required evaluation context is missing or
unusable. For example, percentage rollout requires a non-empty
`context.targetingKey`; no random fallback is allowed.

```json
{
  "projectKey": "demo-project",
  "flagKey": "new-checkout",
  "enabled": false,
  "variant": "off",
  "reason": "INVALID_CONTEXT",
  "matchedRuleId": null
}
```

`ERROR` is returned only when the evaluation path catches an unexpected
recoverable error. The server must log the error with the request ID.

```json
{
  "projectKey": "demo-project",
  "flagKey": "new-checkout",
  "enabled": false,
  "variant": "off",
  "reason": "ERROR",
  "matchedRuleId": null
}
```

Both fallback responses must fail closed with `enabled=false` and
`variant="off"`.

## 5. Reason Codes

| Reason | `enabled` | `matchedRuleId` | Meaning |
| --- | --- | --- | --- |
| `GLOBAL_ON` | `true` | `null` | Flag serving mode enables the feature for everyone. |
| `FLAG_DISABLED` | `false` | `null` | Flag status is disabled. |
| `FLAG_ARCHIVED` | `false` | `null` | Flag status is archived and no longer served. |
| `KILL_SWITCH` | `false` | `null` | Emergency kill switch forces Off. |
| `USER_ALLOWLIST` | `true` | rule ID | User matched an explicit allowlist rule. |
| `ROLE_MATCH` | `true` | rule ID | User matched a role-targeting rule. |
| `PERCENTAGE_ROLLOUT` | `true` | rule ID | Target fell inside deterministic rollout percentage. |
| `DEFAULT_OFF` | `false` | `null` | No enabling rule matched. |
| `NOT_FOUND` | `false` | `null` | Project or flag was missing. |
| `INVALID_CONTEXT` | `false` | `null` | Required evaluation context was missing or unusable. |
| `ERROR` | `false` | `null` | Unexpected evaluation failure safely returned Off. |

## 6. Flag Model, Rule Types, and Evaluation Order

### 6.1 Flag-Level Runtime Fields

Global behavior is modeled at the flag level, not as a rule:

```text
status: ENABLED | DISABLED | ARCHIVED
servingMode: GLOBAL_ON | TARGETED
killSwitch: boolean
```

`status` is a management lifecycle label. `enabled` in evaluation responses is
runtime On/Off state. The dashboard must not confuse these concepts.

### 6.2 MVP Rule Types

MVP rule types are targeted enablement rules:

```text
USER_ALLOWLIST
ROLE_TARGETING
PERCENTAGE_ROLLOUT
```

Do not model `GLOBAL` as a rule in the MVP. Global on/off behavior belongs to
flag-level fields.

### 6.3 Evaluation Order

Evaluation must be deterministic and use this order:

1. If evaluation context is structurally unusable, return `INVALID_CONTEXT`.
2. If project or flag is missing, return `NOT_FOUND`.
3. If flag status is `ARCHIVED`, return `FLAG_ARCHIVED`.
4. If `killSwitch=true`, return `KILL_SWITCH`.
5. If flag status is `DISABLED`, return `FLAG_DISABLED`.
6. If `servingMode=GLOBAL_ON`, return `GLOBAL_ON`.
7. If a user allowlist rule matches, return `USER_ALLOWLIST`.
8. If a role-targeting rule matches, return `ROLE_MATCH`.
9. If a percentage rollout rule matches, return `PERCENTAGE_ROLLOUT`.
10. Otherwise, return `DEFAULT_OFF`.
11. If an unexpected recoverable error occurs, return `ERROR`.

The same flag configuration and same evaluation request must always produce
the same result.

## 7. Stable Hashing for Percentage Rollout

Percentage rollout must be deterministic. It must never use randomness.

### 7.1 Required Targeting Key

`context.targetingKey` is required when evaluating a percentage rollout rule.
If the percentage rule is reached and `targetingKey` is missing or empty after
trimming, return:

```json
{
  "projectKey": "demo-project",
  "flagKey": "new-checkout",
  "enabled": false,
  "variant": "off",
  "reason": "INVALID_CONTEXT",
  "matchedRuleId": null
}
```

### 7.2 Hash Input

```text
${projectKey}:${flagKey}:${targetingKey}
```

Example:

```text
demo-project:new-checkout:user-123
```

### 7.3 Canonicalization

- `projectKey`: validated lowercase kebab-case
- `flagKey`: validated lowercase kebab-case
- `targetingKey`: trim surrounding whitespace, reject if empty, preserve case

Do not use raw PII such as email, phone number, national ID, or real names as
the targeting key.

### 7.4 SHA-256 Bucket Algorithm

1. Encode the hash input as UTF-8.
2. Compute SHA-256.
3. Take the first 8 bytes as an unsigned big-endian integer.
4. Compute `bucket = first64Bits % 10000`.
5. Compute `bucketPercentage = bucket / 100`.
6. Match when `bucketPercentage < percentage`.

The bucket range is `[0.00, 99.99]`.

### 7.5 Percentage Validation

`percentage` must be:

- a number
- greater than or equal to `0`
- less than or equal to `100`
- no more than 2 decimal places

Valid examples:

```text
0
25
50.5
99.99
100
```

Invalid examples:

```text
-1
100.01
25.123
"25"
```

Edge cases:

- `0` never matches.
- `100` always matches, unless a higher-priority Off condition wins.

## 8. Key Validation

`projectKey` and `flagKey` must use lowercase kebab-case.

Rules:

- 3-64 characters
- lowercase letters, numbers, and dashes only
- must start with a lowercase letter or number
- must end with a lowercase letter or number
- no spaces
- no uppercase
- no underscores
- no dots
- immutable after creation

Regex:

```regex
^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$
```

Valid examples:

```text
demo-project
new-checkout
project1
pricing-page-v2
```

Invalid examples:

```text
DemoProject
new_checkout
new checkout
-checkout
checkout-
ab
checkout.v2
```

## 9. Error Contract

Management/control-plane APIs use consistent error responses.

### 9.1 Error Response Shape

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed.",
  "details": [
    {
      "field": "projectKey",
      "message": "projectKey must be 3-64 characters, lowercase, and may contain numbers or dashes."
    }
  ],
  "requestId": "req_123"
}
```

### 9.2 Error Codes

| Code | HTTP status | Meaning |
| --- | ---: | --- |
| `VALIDATION_ERROR` | 400 | Invalid body, path parameter, or query parameter. |
| `NOT_FOUND` | 404 | Resource not found on a management API. |
| `CONFLICT` | 409 | Duplicate key or invalid state conflict. |
| `INTERNAL_ERROR` | 500 | Unexpected server error. |

`UNAUTHORIZED` and `FORBIDDEN` are reserved for future authentication/RBAC.

### 9.3 Error Field Rules

- `requestId` is required in every error response.
- `details` is required for `VALIDATION_ERROR`.
- `details` is optional for `NOT_FOUND`, `CONFLICT`, and `INTERNAL_ERROR`.
- Internal error messages must not leak secrets, stack traces, or database
  internals.

### 9.4 Evaluation API Exception

The evaluation API uses safe evaluation-shaped fallback responses for
`NOT_FOUND`, `INVALID_CONTEXT`, and `ERROR` instead of management-style error
bodies.

## 10. Pagination, Filtering, and Sorting

List endpoints use offset pagination.

### 10.1 Pagination Query

```http
?limit=20&offset=0
```

Constraints:

- `limit` default: `20`
- `limit` minimum: `1`
- `limit` maximum: `100`
- `offset` default: `0`
- `offset` minimum: `0`

Invalid pagination values return `VALIDATION_ERROR`.

### 10.2 List Response Shape

```json
{
  "items": [],
  "page": {
    "limit": 20,
    "offset": 0,
    "total": 42,
    "hasNext": true
  }
}
```

`hasNext` is calculated as:

```text
offset + limit < total
```

### 10.3 Sorting Query

```http
?sort=createdAt&order=desc
```

Allowed `order` values:

```text
asc
desc
```

Unsupported `sort` or `order` values return `VALIDATION_ERROR`.

### 10.4 Default Sorting

| Endpoint | Default sort | Allowed sort fields |
| --- | --- | --- |
| `/v1/projects` | `createdAt desc` | `createdAt`, `updatedAt`, `key`, `name` |
| `/v1/projects/{projectKey}/flags` | `createdAt desc` | `createdAt`, `updatedAt`, `key`, `name`, `status` |
| `/v1/projects/{projectKey}/flags/{flagKey}/rules` | `priority asc` | `priority`, `createdAt`, `type` |
| `/v1/projects/{projectKey}/sample-users` | `createdAt desc` | `createdAt`, `displayName`, `targetingKey` |
| `/v1/projects/{projectKey}/audit-logs` | `createdAt desc` | `createdAt`, `actor`, `targetType`, `action` |

Audit logs are newest-first by default because users usually inspect recent
configuration changes first.

### 10.5 Filtering

Filters are endpoint-specific. Examples:

```http
GET /v1/projects?search=demo
GET /v1/projects/demo-project/flags?status=ENABLED&search=checkout
GET /v1/projects/demo-project/audit-logs?targetType=FEATURE_FLAG&actor=admin@example.local
```

Audit log filters:

- `targetType`
- `targetKey`
- `actor`
- `action`
- `from`
- `to`

`from` and `to` must be ISO 8601 timestamps.

## 11. Audit Log Contract

Audit logs are append-only records for configuration mutations.

### 11.1 Audit Entry Shape

```json
{
  "id": "audit_123",
  "projectKey": "demo-project",
  "targetType": "FEATURE_FLAG",
  "targetId": "flag_123",
  "targetKey": "new-checkout",
  "action": "FEATURE_FLAG_UPDATED",
  "actor": "admin@example.local",
  "before": {
    "key": "new-checkout",
    "status": "DISABLED"
  },
  "after": {
    "key": "new-checkout",
    "status": "ENABLED"
  },
  "metadata": {
    "ip": "127.0.0.1",
    "userAgent": "Chrome",
    "source": "dashboard"
  },
  "createdAt": "2026-06-04T10:30:00.000Z",
  "requestId": "req_123"
}
```

### 11.2 Fields

| Field | Required | Description |
| --- | --- | --- |
| `id` | Yes | Audit entry ID. |
| `projectKey` | Yes | Project scope. |
| `targetType` | Yes | Type of changed object. |
| `targetId` | Yes | Internal target ID. |
| `targetKey` | Optional | Human-readable key, when available. |
| `action` | Yes | Mutation action. |
| `actor` | Yes | Actor who caused the change. |
| `before` | Yes, nullable | Minimal meaningful snapshot before the change; `null` for create. |
| `after` | Yes, nullable | Minimal meaningful snapshot after the change; `null` for delete. |
| `metadata` | Optional | Extra request/source context. |
| `createdAt` | Yes | Server timestamp. |
| `requestId` | Yes | Correlation ID. |

### 11.3 Target Types

```text
PROJECT
FEATURE_FLAG
FLAG_RULE
SAMPLE_USER
```

### 11.4 Actions

```text
PROJECT_CREATED
PROJECT_UPDATED
PROJECT_DELETED

FEATURE_FLAG_CREATED
FEATURE_FLAG_UPDATED
FEATURE_FLAG_DELETED

FLAG_RULE_CREATED
FLAG_RULE_UPDATED
FLAG_RULE_DELETED
FLAG_RULES_REPLACED

SAMPLE_USER_CREATED
SAMPLE_USER_DELETED
```

For the MVP, if the rule API only supports replacing the ordered rule set, it
may emit `FLAG_RULES_REPLACED`. Granular actions are reserved for single-rule
mutation endpoints or richer future UI flows.

### 11.5 Metadata

`metadata` is optional. Recommended fields:

```json
{
  "ip": "127.0.0.1",
  "userAgent": "Chrome",
  "source": "dashboard"
}
```

Recommended `source` values:

```text
dashboard
api
seed
system
```

Metadata must not store secrets, full request bodies, or unnecessary PII.

### 11.6 Snapshot Rules

Snapshots must be minimal and meaningful:

- include changed fields
- include stable identifiers such as `id` and `key`
- avoid unrelated fields
- exclude secrets
- avoid raw PII
- keep enough context to understand the change later

For create operations:

```json
{
  "before": null,
  "after": {
    "key": "new-checkout",
    "name": "New checkout",
    "status": "ENABLED",
    "servingMode": "TARGETED",
    "killSwitch": false
  }
}
```

For delete operations:

```json
{
  "before": {
    "key": "new-checkout",
    "status": "ENABLED"
  },
  "after": null
}
```

### 11.7 Append-Only and Transaction Rules

Audit entries are append-only:

- no update endpoint
- no delete endpoint
- no admin edit of audit entries

Project, feature flag, and rule mutations must write the mutation and the audit
entry in the same database transaction. This prevents configuration changes
from succeeding without a corresponding audit trail.

## 12. Bulk Evaluation

Bulk evaluation is a future extension only and is not part of MVP scope.

The MVP only implements:

```http
POST /v1/evaluate
```

Do not add the following to MVP scope:

- `/v1/evaluate/bulk`
- bulk validation
- bulk tests
- bulk response contracts

The single evaluation result object is intentionally designed to be reusable in
future bulk responses.

Future bulk evaluation must:

- preserve the exact per-flag result contract
- support partial failures per result
- return safe `enabled=false`, `variant="off"` for failed or missing flags
- avoid random fallback behavior

## 13. Seed and Demo Data Expectations

Seed data must support implementation readiness and presentation demos.

Minimum seed/demo expectations:

- one demo project
- at least one globally enabled flag
- at least one targeted flag
- at least one role-targeting rule
- at least one percentage-rollout rule
- sample users that produce different evaluation outcomes
- audit entries for setup mutations if seeded through application services

Suggested demo keys:

```text
projectKey: demo-project
flagKey: new-checkout
flagKey: beta-dashboard
```

Suggested sample users:

| Display name | targetingKey | userId | roles | Expected purpose |
| --- | --- | --- | --- | --- |
| Beta User | `demo-user-beta` | `demo-user-beta` | `beta-tester` | Role-targeting match |
| Regular User | `demo-user-regular` | `demo-user-regular` | `user` | Default-off or percentage contrast |
| Admin User | `demo-user-admin` | `demo-user-admin` | `admin` | Dashboard/demo privileged role |

The demo must be able to show at least:

1. global feature enable/disable behavior
2. role-based or percentage-based enablement
3. missing project/flag returning `enabled=false`, `variant="off"`, and
   `reason=NOT_FOUND`

## 14. Phase 0 Acceptance Checklist

- [x] Requirement traceability is documented.
- [x] Requirement traceability maps MVP requirements to contract sections and
  implementation modules.
- [x] `/v1` API base path is confirmed.
- [x] JSON conventions are confirmed.
- [x] Control-plane and data-plane boundaries are documented.
- [x] MVP evaluation request contract is documented.
- [x] MVP evaluation response includes `projectKey`, `flagKey`, `enabled`,
  `variant`, `reason`, and `matchedRuleId`.
- [x] Evaluation reason codes are documented.
- [x] Missing project/flag evaluation behavior returns `enabled=false`,
  `variant="off"`, and `reason=NOT_FOUND`.
- [x] `INVALID_CONTEXT` and `ERROR` fail-safe evaluation behavior is
  documented.
- [x] MVP rule types are documented.
- [x] Evaluation order is documented.
- [x] Stable hashing contract for percentage rollout is documented.
- [x] `projectKey` and `flagKey` validation rules are documented.
- [x] Error response shape and error codes are documented.
- [x] `details` and `requestId` requirements are documented.
- [x] Pagination, filtering, and sorting conventions are documented.
- [x] Default sorting conventions are documented per list endpoint.
- [x] Audit log event shape, actions, metadata, and snapshot rules are
  documented.
- [x] Same-transaction audit requirement is documented.
- [x] Append-only audit requirement is documented.
- [x] Bulk evaluation is explicitly marked as future extension only.
- [x] Seed/demo data expectations are documented for implementation readiness.

