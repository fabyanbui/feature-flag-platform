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
| Flag configuration history | Audit-backed history contract and pagination | Backend audit module, `/v1/projects/{projectKey}/flags/{flagKey}/history` |
| Group kill switch | Group identity, membership, environment config, audit, and evaluation precedence | Backend flag-groups and evaluation modules |
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
- Control-plane requests require a server-resolved demo identity.
- Backend accepts `X-Request-Id` when provided; otherwise it generates one.
- Error responses, audit entries, and server logs should include the same
  request ID.

### 3.1 Demo Identity and Authorization

Phase 16 control-plane requests use a presentation-only bearer token:

```http
Authorization: Bearer <demo-token>
```

The backend maps the token to a fixed actor and one of `ADMIN`, `DEVELOPER`, or
`VIEWER`, then applies a centralized permission matrix. Missing or invalid
credentials return `UNAUTHORIZED`; insufficient permissions return
`FORBIDDEN`. Client-provided `X-Actor` or `X-Actor-Role` values are not trusted
for authorization or audit attribution. Seed scripts may continue to use the
internal `system` actor.

This is a local, presentation-grade identity model rather than OAuth or a
production identity provider. Health and `POST /v1/evaluate` remain public.

| Capability | ADMIN | DEVELOPER | VIEWER |
| --- | :---: | :---: | :---: |
| Read projects, flags, groups, rules, history, audit, and stats | Yes | Yes | Yes |
| Create or update projects | Yes | No | No |
| Create or update flags | Yes | Yes | No |
| Replace rules | Yes | Yes | No |
| Assign or unassign flag groups | Yes | Yes | No |
| Archive or restore flags | Yes | No | No |
| Create or rename groups | Yes | No | No |
| Toggle group kill switches | Yes | No | No |
| Manage sample users | Yes | No | No |

### 3.2 Request ID

Clients may provide a request ID:

```http
X-Request-Id: req_123
```

If `X-Request-Id` is missing, the backend generates a request ID. The same
request ID must be used in request logs, error responses, and audit entries
created by that request.

### 3.3 Control Plane

Control-plane APIs manage configuration:

- `/v1/projects`
- `/v1/projects/{projectKey}/flags`
- `/v1/projects/{projectKey}/flags/{flagKey}/rules`
- `/v1/projects/{projectKey}/sample-users`
- `/v1/projects/{projectKey}/audit-logs`
- `/v1/projects/{projectKey}/flags/{flagKey}/history`
- `/v1/projects/{projectKey}/groups`
- `/v1/projects/{projectKey}/groups/{groupKey}`
- `/v1/projects/{projectKey}/groups/{groupKey}/config`
- `/v1/projects/{projectKey}/flags/{flagKey}/group`

### 3.4 Data Plane

Data-plane APIs answer runtime feature decisions:

- `POST /v1/evaluate`

The data plane must remain deterministic, fail-safe, and safe for repeated
calls with the same input.

## 4. Evaluation Contract

### 4.1 Endpoint

```http
POST /v1/evaluate
```

Evaluation returns `200 OK` for normal decisions and safe fallback decisions,
including `NOT_FOUND`, `INVALID_CONTEXT`, `DEFAULT_OFF`, and `ERROR`.
Malformed JSON, missing top-level required fields, non-object `context`, or
invalid `projectKey` / `flagKey` formats return `400 VALIDATION_ERROR`.

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

The MVP does not store variants. `variant` is derived from `enabled`.
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

### 4.6 Evaluation Validation Order

The evaluation endpoint must use this validation behavior:

1. Malformed JSON, missing top-level `projectKey` / `flagKey` / `context`,
   non-object `context`, or invalid key format returns management-style
   `400 VALIDATION_ERROR`.
2. Valid keys with a missing project or missing flag return evaluation-shaped
   `200 OK` with `reason=NOT_FOUND`.
3. Missing `context.userId` does not fail the request; user allowlist rules are
   skipped.
4. Missing or empty `context.roles` does not fail the request; role-targeting
   rules are skipped.
5. Missing or empty `context.targetingKey` fails only if a percentage rollout
   rule is reached; return evaluation-shaped `200 OK` with
   `reason=INVALID_CONTEXT`.
6. `ERROR` is returned only by a top-level evaluation exception handler. It is
   not a normal rule-order step.

## 5. Reason Codes

| Reason | `enabled` | `matchedRuleId` | Meaning |
| --- | --- | --- | --- |
| `GLOBAL_ON` | `true` | `null` | Flag serving mode enables the feature for everyone. |
| `FLAG_DISABLED` | `false` | `null` | Flag status is disabled. |
| `FLAG_ARCHIVED` | `false` | `null` | Flag status is archived and no longer served. |
| `GROUP_KILL_SWITCH` | `false` | `null` | The flag's group kill switch is active in the evaluated environment. |
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

Minimal flag object shape:

```json
{
  "key": "new-checkout",
  "name": "New Checkout",
  "description": "Demo checkout rollout flag",
  "status": "ENABLED",
  "servingMode": "TARGETED",
  "killSwitch": false
}
```

### 6.2 MVP Rule Types

MVP rule types are targeted enablement rules:

```text
USER_ALLOWLIST
ROLE_TARGETING
PERCENTAGE_ROLLOUT
```

Do not model `GLOBAL` as a rule in the MVP. Global on/off behavior belongs to
flag-level fields.

### 6.3 Rule Object and Parameter Shapes

All rules share these common fields:

| Field | Required | Description |
| --- | --- | --- |
| `id` | Response only | Opaque rule ID. |
| `type` | Yes | One of the MVP rule types. |
| `priority` | Yes | Integer ordering value unique within a flag. |
| `enabled` | Yes | Disabled rules are skipped. |
| `parameters` | Yes | Type-specific rule configuration. |

Rule `priority` is used for UI ordering and for ordering rules of the same
type. MVP evaluation type precedence cannot be overridden by priority.
When multiple enabled rules of the same type exist, evaluate lower `priority`
values first and return the first matching rule ID as `matchedRuleId`.
Rule `priority` must be unique within a flag. Duplicate priorities in a rule
replacement payload return `VALIDATION_ERROR`; conflicts with existing stored
rules in single-rule create/update flows return `CONFLICT`.

User allowlist rule:

```json
{
  "type": "USER_ALLOWLIST",
  "priority": 10,
  "enabled": true,
  "parameters": {
    "userIds": ["demo-user-beta"]
  }
}
```

`parameters.userIds` must be a non-empty array of stable non-PII user
identifiers. A missing `context.userId` means this rule cannot match.

Role-targeting rule:

```json
{
  "type": "ROLE_TARGETING",
  "priority": 20,
  "enabled": true,
  "parameters": {
    "roles": ["beta-tester"]
  }
}
```

`parameters.roles` must be a non-empty array of role keys. A missing or empty
`context.roles` means this rule cannot match.

Percentage rollout rule:

```json
{
  "type": "PERCENTAGE_ROLLOUT",
  "priority": 30,
  "enabled": true,
  "parameters": {
    "percentage": 25
  }
}
```

`parameters.percentage` must follow the percentage validation rules in the
stable hashing section. A missing or empty `context.targetingKey` returns
`INVALID_CONTEXT` if this rule is reached.

### 6.4 Evaluation Order

Evaluation must be deterministic and use this order:

1. If project or flag is missing, return `NOT_FOUND`.
2. If flag status is `ARCHIVED`, return `FLAG_ARCHIVED`.
3. If flag status is `DISABLED`, return `FLAG_DISABLED`.
4. If the environment-specific group kill switch is active, return
   `GROUP_KILL_SWITCH`.
5. If the flag-level `killSwitch=true`, return `KILL_SWITCH`.
6. If `servingMode=GLOBAL_ON`, return `GLOBAL_ON`.
7. Skip disabled rules.
8. If a user allowlist rule matches, return `USER_ALLOWLIST`.
9. If a role-targeting rule matches, return `ROLE_MATCH`.
10. If an enabled percentage rollout rule is reached and `context.targetingKey`
   is missing or empty, return `INVALID_CONTEXT`.
11. If a percentage rollout rule matches, return `PERCENTAGE_ROLLOUT`.
12. Otherwise, return `DEFAULT_OFF`.

The terminal-condition precedence is deliberate:

```text
FLAG_ARCHIVED
-> FLAG_DISABLED
-> GROUP_KILL_SWITCH
-> KILL_SWITCH
-> GLOBAL_ON
```

When multiple terminal conditions are simultaneously true, the first condition
in this sequence determines both the result and reason.

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

### 8.1 Key Uniqueness

`projectKey` is globally unique and immutable. Creating a project with an
existing `projectKey` returns `409 CONFLICT`.

`flagKey` is unique within a project and immutable. Creating a feature flag
with a duplicate `flagKey` in the same project returns `409 CONFLICT`. The same
`flagKey` may exist in different projects.

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
| `UNAUTHORIZED` | 401 | Missing, malformed, or invalid demo credentials. |
| `FORBIDDEN` | 403 | Authenticated identity lacks the required permission. |
| `NOT_FOUND` | 404 | Resource not found on a management API. |
| `CONFLICT` | 409 | Duplicate key or invalid state conflict. |
| `INTERNAL_ERROR` | 500 | Unexpected server error. |

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
| `/v1/projects/{projectKey}/flags/{flagKey}/history` | `createdAt desc` | `createdAt` |

Audit logs are newest-first by default because users usually inspect recent
configuration changes first.

### 10.5 Filtering

Filters are endpoint-specific. Examples:

```http
GET /v1/projects?search=demo
GET /v1/projects/demo-project/flags?status=ENABLED&search=checkout
GET /v1/projects/demo-project/audit-logs?targetType=FEATURE_FLAG&actor=admin@example.local
```

Allowed filters:

| Endpoint | Allowed filters |
| --- | --- |
| `/v1/projects` | `search` |
| `/v1/projects/{projectKey}/flags` | `search`, `status` |
| `/v1/projects/{projectKey}/flags/{flagKey}/rules` | `type` |
| `/v1/projects/{projectKey}/sample-users` | `search`, `role` |
| `/v1/projects/{projectKey}/audit-logs` | `targetType`, `targetKey`, `actor`, `action`, `from`, `to` |
| `/v1/projects/{projectKey}/flags/{flagKey}/history` | None beyond pagination and ordering |

Audit log filters:

- `targetType`
- `targetKey`
- `actor`
- `action`
- `from`
- `to`

`from` and `to` must be ISO 8601 timestamps.

## 11. Sample User Context Contract

Sample users are stored demo contexts used by the admin dashboard and demo app.
They are not authentication users, production identities, or authorization
subjects.

Sample users must use stable non-PII identifiers.

Minimal sample user shape:

```json
{
  "displayName": "Beta User",
  "targetingKey": "demo-user-beta",
  "userId": "demo-user-beta",
  "roles": ["beta-tester"],
  "attributes": {
    "plan": "pro"
  }
}
```

| Field | Required | Description |
| --- | --- | --- |
| `displayName` | Yes | Human-readable demo label. |
| `targetingKey` | Yes | Stable non-PII rollout key. |
| `userId` | Optional | Demo identifier used by allowlist rules. |
| `roles` | Optional | Demo roles used by role-targeting rules. |
| `attributes` | Optional | Extra non-PII context attributes. |

`targetingKey` must be unique within a project. Creating a sample user with a
duplicate `targetingKey` in the same project returns `409 CONFLICT`.

## 12. Audit Log Contract

Audit logs are append-only records for configuration mutations.

### 12.1 Audit Entry Shape

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

### 12.2 Fields

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

### 12.3 Target Types

```text
PROJECT
FEATURE_FLAG
FLAG_GROUP
FLAG_RULE
SAMPLE_USER
```

### 12.4 Actions

```text
PROJECT_CREATED
PROJECT_UPDATED
PROJECT_DELETED

FEATURE_FLAG_CREATED
FEATURE_FLAG_UPDATED
FEATURE_FLAG_DELETED
FEATURE_FLAG_GROUP_ASSIGNED
FEATURE_FLAG_GROUP_UNASSIGNED

FLAG_GROUP_CREATED
FLAG_GROUP_UPDATED
FLAG_GROUP_KILL_SWITCH_UPDATED

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

For `FLAG_RULES_REPLACED`, the audit target should be the feature flag whose
ordered rule set changed:

```text
targetType=FEATURE_FLAG
targetId=<flagId>
targetKey=<flagKey>
action=FLAG_RULES_REPLACED
```

The `before` and `after` snapshots should contain minimal ordered rule
summaries.

### 12.5 Metadata

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
For MVP, storing only `source` is acceptable. `ip` and `userAgent` are optional
and may be omitted to reduce privacy and implementation overhead.

### 12.6 Snapshot Rules

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

### 12.7 Append-Only and Transaction Rules

Audit entries are append-only:

- no update endpoint
- no delete endpoint
- no admin edit of audit entries

Project, feature flag, and rule mutations must write the mutation and the audit
entry in the same database transaction. This prevents configuration changes
from succeeding without a corresponding audit trail.

Flag-group creation, updates, environment configuration changes, and flag-group
assignment changes follow the same transaction rule.

### 12.8 Soft Delete Contracts

Feature flag deletion is exposed as:

```http
DELETE /v1/projects/{projectKey}/flags/{flagKey}
```

This is a soft delete that is separate from archive. Deleting a flag sets
`deletedAt`/`deletedBy`, hides the flag from the normal dashboard and normal
flag list, makes evaluation treat it as missing (`NOT_FOUND`), invalidates cache
snapshots for that flag, and writes a `FEATURE_FLAG_DELETED` audit entry.
Archived flags remain visible in the normal flag dashboard and evaluate with
`FLAG_ARCHIVED`.

Deleted flags can be viewed and recovered through:

```http
GET /v1/projects/{projectKey}/flags/deleted
POST /v1/projects/{projectKey}/flags/{flagKey}/restore-deleted
```

Restoring a deleted flag clears `deletedAt`/`deletedBy` while preserving the
flag's archive lifecycle state. The archive and restore endpoints remain the
explicit lifecycle controls for active versus archived flags.

Project deletion is exposed as:

```http
DELETE /v1/projects/{projectKey}
```

This is also a soft delete. A project can be deleted only when it is empty
from the normal dashboard perspective: there must be no non-deleted feature
flags, flag groups, or sample user contexts under the project. Soft-deleted
feature flags, default environments, and existing audit entries may remain so
configuration history stays append-only.
Deleted projects are hidden from normal project reads/lists, and evaluation
treats them as missing, returning `enabled=false` with `reason=NOT_FOUND`.

## 13. Flag Configuration History Contract

Flag configuration history is an audit-backed, read-only view of configuration
changes associated with one feature flag. `AuditLogEntry` remains the source of
truth; the platform does not maintain a separate configuration-version table.

### 13.1 Endpoint

```http
GET /v1/projects/{projectKey}/flags/{flagKey}/history
```

This is a control-plane read endpoint. It does not modify configuration,
participate in runtime evaluation, or require an actor header.

### 13.2 Pagination and Ordering

Supported query parameters:

- `limit`, default `20`, minimum `1`, maximum `100`
- `offset`, default `0`, minimum `0`
- `sort`, default `createdAt`, only allowed value `createdAt`
- `order`, default `desc`, allowed values `asc` and `desc`

The only supported sort field is `createdAt`. Entries are ordered by
`createdAt` and an internal stable ID tie-breaker in the same direction. The
default order is newest first.

Unsupported ordering values, invalid pagination values, or an unsupported sort
field return `400 VALIDATION_ERROR`.

Example:

```http
GET /v1/projects/demo-project/flags/new-checkout/history?limit=20&offset=0&order=desc
```

### 13.3 Response

The response uses the standard paginated response and audit-entry shapes:

```json
{
  "items": [
    {
      "id": "audit_123",
      "projectKey": "demo-project",
      "environmentKey": "production",
      "targetType": "FEATURE_FLAG",
      "targetId": "flag_123",
      "targetKey": "new-checkout",
      "action": "FLAG_RULES_REPLACED",
      "actor": "admin@example.local",
      "before": {
        "rules": []
      },
      "after": {
        "rules": [
          {
            "id": "rule_123",
            "type": "ROLE_TARGETING",
            "priority": 10,
            "enabled": true,
            "parameters": {
              "roles": ["beta-tester"]
            }
          }
        ]
      },
      "metadata": {
        "source": "api",
        "replacedRuleCount": 1
      },
      "requestId": "req_123",
      "createdAt": "2026-06-24T10:00:00.000Z"
    }
  ],
  "page": {
    "limit": 20,
    "offset": 0,
    "total": 1,
    "hasNext": false
  }
}
```

Each item includes the actor, action, target type, target ID, target key,
environment key, before and after snapshots, metadata, request ID, and creation
timestamp. Entries are configuration change events and must not be presented
as independently stored configuration versions.

### 13.4 History Scope

History includes audit entries associated with:

- the selected `FeatureFlag`
- its related `FlagEnvironmentConfig` records
- related rule configuration mutations

The current rule replacement contract records `FLAG_RULES_REPLACED` against
the owning feature flag, using `targetType=FEATURE_FLAG`,
`targetId=<flagId>`, and `targetKey=<flagKey>`. Future granular flag-config or
flag-rule audit events must retain an immutable association with the owning
feature flag so they can be included reliably.

The backend must resolve the project and feature flag before querying history.
History association must use immutable resource IDs rather than relying only on
human-readable keys.

The endpoint excludes:

- project-level changes
- sample-user changes
- changes associated with other feature flags
- runtime evaluation requests, because evaluations are not configuration
  mutations

### 13.5 Errors

- A missing project returns `404 NOT_FOUND`.
- A missing flag within an existing project returns `404 NOT_FOUND`.
- Invalid project keys, flag keys, pagination, sorting, or ordering return
  `400 VALIDATION_ERROR`.

This management endpoint uses the standard error contract. It must not return
an evaluation-shaped `enabled=false` response.

### 13.6 Initial Implementation Boundary

The initial implementation must not add a separate `FlagConfigVersion` table.
A numeric revision on `FlagEnvironmentConfig` is also deferred until a concrete
cache-invalidation or concurrency requirement justifies the schema and
transactional complexity.

## 14. Group Kill-Switch Contract

### 14.1 Domain Model and Invariants

Group membership is project-wide:

```text
Project
├── FlagGroup
│   └── FlagGroupConfig per Environment
└── FeatureFlag
    └── optional FlagGroup
```

The following invariants are authoritative:

1. `FlagGroup.key` is unique within one project.
2. Group keys are immutable after creation.
3. A feature flag belongs to zero or one group.
4. A feature flag and its group must belong to the same project.
5. Group membership does not vary by environment.
6. A group has at most one `FlagGroupConfig` per environment.
7. `FlagGroupConfig.killSwitch` defaults to `false`.
8. Creating a group initializes an inactive configuration for every existing
   project environment.
9. A missing expected group configuration is invalid persisted state and
   evaluation fails closed with `reason=ERROR`.
10. Group deletion is deferred from Phase 12.
11. Repeating the same flag assignment is idempotent and must not create a
    misleading duplicate audit entry.

Evaluation resolves group state through:

```text
FlagEnvironmentConfig
-> FeatureFlag
-> optional FlagGroup
-> FlagGroupConfig for the evaluated Environment
```

### 14.2 Management Endpoints

```http
GET /v1/projects/{projectKey}/groups
POST /v1/projects/{projectKey}/groups
PATCH /v1/projects/{projectKey}/groups/{groupKey}
PUT /v1/projects/{projectKey}/groups/{groupKey}/config
PUT /v1/projects/{projectKey}/flags/{flagKey}/group
DELETE /v1/projects/{projectKey}/flags/{flagKey}/group
```

Group deletion is intentionally not exposed in Phase 12.

Create group:

```json
{
  "key": "checkout",
  "name": "Checkout flags"
}
```

Update group:

```json
{
  "name": "Checkout experience"
}
```

Update environment-specific configuration:

```json
{
  "environmentKey": "production",
  "killSwitch": true
}
```

Assign a flag:

```json
{
  "groupKey": "checkout"
}
```

Group responses expose the project key, immutable group key, name, selected
environment key, kill-switch state, assigned-flag count, and timestamps.
Feature-flag responses expose a nullable group summary containing the group
key, name, and selected environment's kill-switch state.

Creating a group writes inactive configurations for every environment that
already belongs to the project. The creation audit metadata records the number
of initialized environments.

### 14.3 Validation and Error Behavior

- Group and environment keys use the common key validation contract.
- Group names are required and have a maximum length of 120 characters.
- Duplicate group keys within one project return `409 CONFLICT`.
- Missing projects, groups, flags, or environments return `404 NOT_FOUND`.
- Cross-project assignment is rejected and structurally prevented by
  persistence constraints.
- Mutations require an authorized server-resolved demo identity.
- Assigning a flag to its current group returns success without another audit
  mutation event.

### 14.4 Audit Semantics

| Mutation | Target type | Action |
| --- | --- | --- |
| Create group | `FLAG_GROUP` | `FLAG_GROUP_CREATED` |
| Rename group | `FLAG_GROUP` | `FLAG_GROUP_UPDATED` |
| Toggle group switch | `FLAG_GROUP` | `FLAG_GROUP_KILL_SWITCH_UPDATED` |
| Assign or reassign flag | `FEATURE_FLAG` | `FEATURE_FLAG_GROUP_ASSIGNED` |
| Unassign flag | `FEATURE_FLAG` | `FEATURE_FLAG_GROUP_UNASSIGNED` |

Activating or deactivating a group switch creates one audit entry for the group
configuration mutation. It must not pretend every assigned flag was
individually mutated.

Assignment snapshots contain the stable flag key and nullable group key.
Switch snapshots contain the stable group key, environment key, and
`killSwitch` value. All snapshots exclude secrets and unnecessary user data.

### 14.5 Phase 13 Evaluation Cache Contract

The evaluation cache stores reusable configuration snapshots rather than
context-specific final decisions. Its conceptual key is:

```text
evaluation-snapshot:{projectKey}:{environmentScope}:{flagKey}
```

When `environmentKey` is omitted, the private `__default__` environment scope
is used. Neither keys nor values contain user IDs, targeting keys, roles,
attributes, final decisions, validation failures, `NOT_FOUND` results, or
evaluation errors.

The initial provider is a process-local in-memory cache with a configurable
`EVALUATION_CACHE_TTL_MS` value and a 30-second default. Cache failures fall
back to repository access and do not alter the public evaluation response.

| Mutation | Cache invalidation |
| --- | --- |
| Create flag or group | None required |
| Rename flag or group | None for evaluation |
| Change flag lifecycle or config | Flag in every cached environment scope |
| Replace flag rules | Flag in every cached environment scope |
| Assign, reassign, or unassign group | Flag in every cached environment scope |
| Toggle group switch | Every assigned flag in the affected environment |

Invalidation happens only after the database transaction and append-only audit
entry commit. Initial flag-level invalidation may conservatively remove every
environment scope for that flag to prevent stale default-environment aliases.

### 14.6 Phase 14 Evaluation Statistics Contract

Evaluation statistics provide aggregate operational visibility without changing
the deterministic evaluation contract or collecting runtime user context.
Statistics are an observability side effect of evaluation, not part of the
decision itself.

The required runtime flow is:

```text
validated evaluation request
-> snapshot cache or repository lookup
-> exactly one evaluation decision
-> exactly one best-effort metric increment attempt
-> unchanged evaluation response
```

Every request that passes DTO validation and reaches the evaluation service is
counted, including cache hits and decisions with `INVALID_CONTEXT`,
`NOT_FOUND`, or `ERROR`. Requests rejected by the global validation pipeline do
not produce an evaluation decision and are not counted.

#### 14.6.1 Aggregate Dimensions and Privacy Boundary

One metric row represents a count for this unique combination:

```text
projectKey
environmentKey
flagKey
UTC hourly bucket
reason
enabled
```

Metrics store stable resource keys and aggregate outcomes only. They must not
store:

- the evaluation context or request body
- targeting keys or user IDs
- roles or attributes
- IP addresses or actors
- raw per-request evaluation events
- `matchedRuleId`
- secrets or credentials

This boundary keeps statistics useful for release operations while preventing
the statistics subsystem from becoming a user-tracking or high-cardinality
event store.

When an evaluation request omits `environmentKey`, a successful snapshot
resolution records the project's actual default environment key. The private
cache alias `__default__` must not appear as a resolved dashboard environment.
The reusable `EvaluationSnapshot` therefore includes internal `resolution`
metadata containing project, environment, and flag IDs plus the effective
environment key. The evaluation engine ignores this attribution metadata when
making its deterministic decision.

If an evaluation returns `NOT_FOUND` or `ERROR` before an environment can be
resolved, the metric uses the private `__unresolved__` environment dimension.
This value cannot conflict with public environment keys because underscores are
not allowed by the common key validation contract.

#### 14.6.2 Time Buckets and Query Ranges

Metric timestamps are normalized to the start of a UTC hour:

```text
2026-06-25T08:42:19.000Z -> 2026-06-25T08:00:00.000Z
```

Statistics queries use a half-open interval, `[from, to)`. The service rounds
`from` down to the start of its UTC hour and rounds `to` up to the next UTC
hour when necessary. Responses expose the effective normalized range so the
hourly precision is explicit.

The initial query defaults are:

- the project's default environment when `environmentKey` is omitted
- the previous 24 hours when `from` and `to` are omitted
- a maximum query range of 30 days
- `limit=20`, with a maximum of `100`, for project-level flag results

#### 14.6.3 Write and Availability Semantics

Metric increments use an atomic database upsert. A new aggregate combination
starts with `count=1`; an existing combination increments `count` without a
read-modify-write race.

Metric persistence is best-effort and non-blocking:

- evaluation does not wait for metric persistence before responding
- metric failures are caught and logged without changing `enabled`, `reason`,
  `variant`, or `matchedRuleId`
- metric writes do not participate in configuration transactions
- metric writes do not create audit entries because they are telemetry rather
  than control-plane configuration mutations

Statistics are eventually consistent. A dashboard request immediately after an
evaluation may briefly observe the previous count. A process termination may
lose an in-flight best-effort increment; a durable queue and delivery guarantee
are deferred beyond the mini-project scope.

#### 14.6.4 Read Endpoints

Project-level flag statistics:

```http
GET /v1/projects/{projectKey}/stats/flags
```

Supported query parameters:

```text
environmentKey
from
to
limit
offset
sort
order
```

The response uses the standard page envelope. Each item contains the flag key,
total evaluation count, enabled count, disabled count, and top reason counts
for the effective environment and time range. The initial endpoint returns
flags with recorded metrics in the selected range.

Flag-level statistics:

```http
GET /v1/projects/{projectKey}/flags/{flagKey}/stats
```

The response contains:

- project, flag, and effective environment keys
- effective `from` and `to` timestamps
- total, enabled, and disabled counts
- enabled percentage
- reason and enabled-result breakdown
- UTC hourly bucket breakdown

An existing flag with no metrics in the selected range returns zero totals and
empty breakdown arrays.

#### 14.6.5 Validation and Error Behavior

Statistics endpoints are control-plane read APIs and use the standard HTTP
error contract:

- missing projects, flags, or environments return `404 NOT_FOUND`
- malformed keys or timestamps return `400 VALIDATION_ERROR`
- `from` later than `to` returns `400 VALIDATION_ERROR`
- a requested range longer than 30 days returns `400 VALIDATION_ERROR`
- unsupported sorting fields return `400 VALIDATION_ERROR`

This intentionally differs from `POST /v1/evaluate`, where missing resources
produce a safe `200 OK` response with `enabled=false` and `reason=NOT_FOUND`.

## 15. Bulk Evaluation

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

## 16. Seed and Demo Data Expectations

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

## 17. Out of MVP Scope

The following are intentionally outside MVP scope unless all required
deliverables are already complete:

- bulk evaluation endpoint
- client SDK
- Redis cache
- streaming or real-time flag updates
- multivariate flags
- experiment analytics or statistics dashboard
- production authentication, external identity providers, and session management
- advanced targeting operators beyond allowlist, roles, and percentage rollout
- rule versioning beyond append-only audit logs
- Docker Compose one-command setup

These items may be revisited only after the required backend API, admin
dashboard, demo app, database, validation/error handling, seed data, README,
research report, and short design docs are demo-ready.

Recommended phases subsequently implemented several items from this historical
out-of-MVP list without changing the MVP baseline:

- Phase 14 implemented aggregate evaluation statistics without storing raw
  evaluation context or changing release decisions.
- Phase 15 implemented the client SDK as `packages/js-sdk`. The SDK calls only
  `POST /v1/evaluate`, validates the stable response contract, and marks
  client-local fail-closed results with `errorSource=CLIENT`.
- Phase 18 implemented an optional Redis cache provider with the same snapshot
  and fallback semantics as the in-memory provider.
- Phase 19 implemented the one-command local Docker Compose workflow with
  idempotent migration and seed services.

## 18. Phase 0 Acceptance Checklist

- [x] Requirement traceability is documented.
- [x] Requirement traceability maps MVP requirements to contract sections and
  implementation modules.
- [x] `/v1` API base path is confirmed.
- [x] JSON conventions are confirmed.
- [x] Control-plane and data-plane boundaries are documented.
- [x] Server-resolved demo identities, RBAC, and `X-Request-Id` are documented.
- [x] MVP evaluation request contract is documented.
- [x] Evaluation HTTP status behavior is documented.
- [x] MVP evaluation response includes `projectKey`, `flagKey`, `enabled`,
  `variant`, `reason`, and `matchedRuleId`.
- [x] Evaluation reason codes are documented.
- [x] Missing project/flag evaluation behavior returns `enabled=false`,
  `variant="off"`, and `reason=NOT_FOUND`.
- [x] `INVALID_CONTEXT` and `ERROR` fail-safe evaluation behavior is
  documented.
- [x] MVP rule types are documented.
- [x] MVP rule parameter shapes are documented.
- [x] Rule priority uniqueness and conflict behavior are documented.
- [x] Evaluation order is documented.
- [x] Stable hashing contract for percentage rollout is documented.
- [x] `projectKey` and `flagKey` validation rules are documented.
- [x] `projectKey` and `flagKey` uniqueness rules are documented.
- [x] Error response shape and error codes are documented.
- [x] `details` and `requestId` requirements are documented.
- [x] Pagination, filtering, and sorting conventions are documented.
- [x] Allowed filters are documented per list endpoint.
- [x] Default sorting conventions are documented per list endpoint.
- [x] Audit log event shape, actions, metadata, and snapshot rules are
  documented.
- [x] `FLAG_RULES_REPLACED` audit target semantics are documented.
- [x] Same-transaction audit requirement is documented.
- [x] Append-only audit requirement is documented.
- [x] Bulk evaluation is explicitly marked as future extension only.
- [x] Sample-user semantics and uniqueness are documented.
- [x] Seed/demo data expectations are documented for implementation readiness.
- [x] Out-of-MVP-scope items are documented.

## 19. Phase 12 Step 1 Design Checklist

- [x] Project-wide optional group membership is selected.
- [x] Environment-specific group configuration is selected.
- [x] Group keys are immutable.
- [x] Group deletion is deferred.
- [x] Evaluation precedence includes `GROUP_KILL_SWITCH`.
- [x] Audit targets, actions, snapshots, and transaction semantics are defined.
- [x] Group management and flag-assignment endpoints are defined.
- [x] Missing expected group configuration fails closed.
- [x] Future cache invalidation requirements are documented.
