# Minimal MVP Technical Requirements — Feature Flag Platform

**Last updated:** 2026-05-29

## 1. Purpose and Scope
This document defines the minimum technical requirements to deliver a functional MVP of the Feature Flag Platform, including backend APIs, a lightweight management UI, a demo app, and essential documentation. The MVP must be complete enough to demonstrate end-to-end flag creation, rule configuration, evaluation, and auditability.

## 2. Goals and Non-Goals
**Goals**
1. Provide a persistent data model for projects, flags, rules, sample user contexts, and audit logs.
2. Deliver stable APIs for CRUD operations and flag evaluation.
3. Provide a minimal dashboard and a demo app to validate real usage.
4. Ensure baseline reliability via input validation and basic error handling.
5. Provide clear run instructions and seed data for local demos.

**Non-Goals (MVP)**
1. Multi-variant experimentation (A/B/C variants).
2. Client SDKs and streaming config distribution.
3. Advanced governance (approvals, expiration workflows, or RBAC beyond simple roles).

## 3. System Architecture (Short Design Doc)
**Components**
1. **Frontend Dashboard**: Admin UI for projects, flags, rules, and audit logs.
2. **Backend API**: REST API for CRUD, rule management, evaluation, and audit logging.
3. **Demo App**: Small web app that calls the Evaluation API.
4. **Database**: Persistent storage for all platform data.

**Flow (high level)**
1. Admin uses Dashboard to create project, flags, and rules.
2. Backend writes data to Database and emits audit logs.
3. Demo App calls Evaluation API using projectKey, flagKey, and user context.
4. Backend evaluates rules and returns deterministic results.

## 4. Database Requirements and Schema (Short Design Doc)
**Database Type**
- A relational database is required (PostgreSQL recommended; SQLite acceptable for local dev).
- Must support foreign keys, unique constraints, and JSON fields or equivalent.

**Minimum Tables**
1. **projects**
   - id (PK), key (unique), name, description, created_at, updated_at
2. **feature_flags**
   - id (PK), project_id (FK), key (unique per project), name, description,
     globally_enabled (bool), created_at, updated_at
3. **flag_rules**
   - id (PK), flag_id (FK), type, priority, parameters (JSON), created_at, updated_at
4. **sample_user_contexts**
   - id (PK), project_id (FK), name, user_id, roles (JSON array), attributes (JSON),
     created_at, updated_at
5. **audit_log_entries**
   - id (PK), project_id (FK), target_type, target_id, action, actor,
     before (JSON), after (JSON), created_at

**Constraints**
1. Project key is unique and immutable.
2. Feature flag key is unique within its project.
3. Audit log entries are append-only and immutable.

## 5. API Specification (Short Design Doc)
**Conventions**
- Base path: `/v1`
- JSON request/response.
- Pagination on list endpoints (limit + cursor or offset).

### 5.1 Projects
1. `POST /v1/projects` — create project
2. `GET /v1/projects` — list projects
3. `GET /v1/projects/{projectKey}` — get project
4. `PATCH /v1/projects/{projectKey}` — update project
5. `DELETE /v1/projects/{projectKey}` — delete project (reject or cascade if flags exist)

### 5.2 Feature Flags
1. `POST /v1/projects/{projectKey}/flags` — create flag
2. `GET /v1/projects/{projectKey}/flags` — list flags
3. `GET /v1/projects/{projectKey}/flags/{flagKey}` — get flag
4. `PATCH /v1/projects/{projectKey}/flags/{flagKey}` — update flag
5. `DELETE /v1/projects/{projectKey}/flags/{flagKey}` — delete flag

### 5.3 Flag Rules
1. `GET /v1/projects/{projectKey}/flags/{flagKey}/rules` — list rules
2. `PUT /v1/projects/{projectKey}/flags/{flagKey}/rules` — replace rules (ordered)

**Minimum rule types**
1. Global on/off
2. Allow list by userId
3. Role match
4. Percentage rollout (deterministic hash on userId)

### 5.4 Evaluation
1. `POST /v1/evaluate`

**Request**
```json
{
  "projectKey": "string",
  "flagKey": "string",
  "user": {
    "userId": "string",
    "roles": ["string"],
    "attributes": { "key": "value" }
  }
}
```

**Response**
```json
{
  "projectKey": "string",
  "flagKey": "string",
  "enabled": true,
  "reason": "GLOBAL_ON | ROLE_MATCH | PERCENTAGE | DEFAULT_OFF | NOT_FOUND"
}
```

### 5.5 Sample User Contexts
1. `POST /v1/projects/{projectKey}/sample-users` — create sample user
2. `GET /v1/projects/{projectKey}/sample-users` — list sample users
3. `DELETE /v1/projects/{projectKey}/sample-users/{id}` — delete sample user

### 5.6 Audit Logs
1. `GET /v1/projects/{projectKey}/audit-logs` — list audit entries

**Query parameters**: targetType, targetId, actor, from, to, limit, cursor

## 6. Input Validation Requirements
1. All write endpoints must validate payloads and return `VALIDATION_ERROR` on failure.
2. Required fields must be enforced for create operations.
3. Key formats:
   - `projectKey` and `flagKey` must be lowercase alphanumeric with dashes or underscores.
   - Length limits: 3-64 characters.
4. Percentage rollout values must be between 0 and 100.
5. Rule parameters must match rule type schema; invalid rules must be rejected.

## 7. Error Handling Requirements
1. Errors must use a consistent JSON shape:
```json
{
  "code": "VALIDATION_ERROR | NOT_FOUND | CONFLICT | INTERNAL_ERROR",
  "message": "Human readable summary",
  "details": { "field": "reason" }
}
```
2. Missing project/flag must return `enabled=false` for evaluation with `reason=NOT_FOUND`.
3. All server errors must be logged with request context and correlation id.

## 8. Documentation Requirements
**README must include**
1. Prerequisites (runtime, database)
2. Installation steps for backend, frontend, and demo app
3. Environment variables and defaults
4. How to seed data
5. How to run locally (ports and URLs)

## 9. Seed Data Requirements
1. Provide scripts or seed data to create:
   - One demo project
   - At least one flag with global on/off
   - At least one rule for role match and one for percentage rollout
   - At least two sample user contexts that produce different results
2. Seed process must be documented in README and runnable in one command.

## 10. Acceptance Criteria
1. Database stores projects, flags, rules, sample user contexts, and audit logs.
2. CRUD APIs work for projects and flags, and rules can be replaced in order.
3. Evaluation API returns deterministic results with reason codes.
4. Input validation rejects malformed payloads with clear error responses.
5. Audit logs are appended on every create/update/delete.
6. README provides full install and run instructions for backend, frontend, and demo app.
7. Seed data script generates a working demo scenario.

## 11. References
- Backend requirements: `docs/requirement/backend/be-init.md`
- Frontend requirements: `docs/requirement/frontend/fe-init.md`
- Demo app requirements: `docs/requirement/demo/demo-app.md`
