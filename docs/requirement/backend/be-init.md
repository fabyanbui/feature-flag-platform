## Backend Requirements: Feature Flag Platform

**Last updated:** 2026-05-29  

### 1. Purpose and Scope
This document defines the backend API requirements for a feature flag platform that supports project management, feature flag lifecycle management, rule configuration, flag evaluation, and audit logging. The scope is limited to server-side APIs and data handling.

### 2. Definitions
**Project:** A logical container that groups feature flags and their rules.  
**Feature flag:** A boolean toggle identified by a unique key within a project.  
**Rule:** A condition that determines whether a flag is enabled for a user.  
**Evaluation:** Determining a flag's enabled/disabled result given user context.  
**Audit log:** An immutable record of changes to flags and rules.

### 3. Functional Requirements
#### 3.1 Project Management API
1. The system must provide CRUD APIs to create, read, update, and delete projects.
2. Each project must have a unique immutable key and a human-readable name.
3. Project deletion must not silently orphan flags; the system must either cascade delete related flags and rules or reject deletion when dependent flags exist.
4. Project listing must support pagination and filtering by name/key.

#### 3.2 Feature Flag CRUD API
1. The system must provide CRUD APIs for feature flags scoped to a project.
2. Each feature flag must have a unique key within a project and metadata fields (name, description, creation timestamps).
3. The system must support enabling and disabling a flag at the flag level (global on/off).
4. Retrieval must support pagination and filtering by key/name/status.

#### 3.3 Flag Rule Configuration API
1. The system must support rule types:
   - Global enable/disable.
   - Enable by user ID (explicit allow list).
   - Enable by role (user has one or more roles).
   - Percentage-based rollout for users.
2. Rules must be evaluated deterministically and produce the same result for the same user context.
3. Percentage-based rollout must use stable hashing over a user identifier to ensure consistency across calls.
4. The API must allow listing and updating rules for a specific flag, including priority/order.
5. Conflicting rules must resolve deterministically using explicit priority order. If not specified, the system must apply the following order:
   - Global disable
   - Enable by user ID
   - Enable by role
   - Percentage rollout
   - Default disabled

#### 3.4 Evaluation API
1. The system must expose an API that accepts:
   - Project identifier
   - Flag key
   - User context (user ID, roles, optional attributes)
2. The evaluation response must include:
   - `enabled` boolean
   - `reason` (matched rule type or default)
   - `flagKey` and `projectKey`
3. The API must be idempotent and safe for repeated calls.
4. The system must return `enabled=false` when the flag or project is missing or disabled, with a clear reason code.

#### 3.5 Audit Log API
1. The system must record all changes to projects, flags, and rules.
2. Audit records must include actor identity, timestamp, action type, and before/after values.
3. Audit logs must be append-only and immutable.
4. The API must support querying by project, flag key, actor, and time range with pagination.

### 4. Data Model Requirements (Logical)
**Project**
- id, key, name, description, createdAt, updatedAt, deletedAt (optional)

**FeatureFlag**
- id, projectId, key, name, description, globallyEnabled, createdAt, updatedAt

**FlagRule**
- id, flagId, type, priority, parameters, createdAt, updatedAt

**AuditLogEntry**
- id, projectId, targetType, targetId, action, actor, before, after, createdAt

### 5. API Conventions
1. APIs must be versioned (e.g., `/v1/`).
2. All APIs must use JSON request/response bodies.
3. Error responses must use consistent error codes and messages (e.g., `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`).
4. All list endpoints must support pagination and sorting.
5. Authentication and authorization must be enforced on all endpoints.

### 6. Non-Functional Requirements
1. **Availability:** Backend APIs should target high availability; downtime must be minimized and observable.
2. **Performance:** Evaluation API must be low latency and suitable for high-throughput use. Targets to be confirmed by load testing.
3. **Security:** All data in transit must use TLS. Audit logs must be protected from tampering.
4. **Observability:** APIs must emit logs and metrics for request volume, latency, and error rates. Audit log writes must be traceable.
5. **Scalability:** The system must scale horizontally for evaluation workloads.

### 7. Out of Scope
1. Client SDKs and UI/administration console.
2. Multi-variant flags (non-boolean).
3. Offline evaluation or edge caching.
