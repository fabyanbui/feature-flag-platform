# Use Case Specification — Feature Flag Platform (RUP)

## Revision History
| Date | Version | Description | Author |
|---|---|---|---|
| 2026-05-30 | 1.0 | Initial RUP use case specification | Principal Engineer (Copilot) |

## 1. Introduction
### 1.1 Purpose
Define the use case specifications for the Feature Flag Platform using the Rational Unified Process (RUP) template, covering the MVP scope: project management, feature flag lifecycle, rule configuration, evaluation, audit logging, and demo integration.

### 1.2 Scope
The system provides a control plane (dashboard + management APIs), a data plane (evaluation API), and a demo app to demonstrate runtime gating. The use cases focus on required MVP deliverables and observable behaviors in the requirements and research documents.

### 1.3 References
`docs/requirement/requirement-init.md`, `docs/requirement/backend/be-init.md`, `docs/requirement/frontend/fe-init.md`, `docs/requirement/demo/demo-app.md`, `docs/requirement/demo/minimal-mvp.md`, `docs/requirement/feature-flag-research.md`, `docs/research/feature-flags.md`, `docs/research/rollout-strategies.md`, `docs/research/kill-switch-fast-rollback.md`, `docs/research/audit-log-configuration-changes.md`, `docs/research/feature-flag-key-considerations.md`, competitor analyses (ConfigCat, LaunchDarkly, Split, Flagsmith, Unleash).

## 2. Actors
| Actor | Description |
|---|---|
| Feature Owner | Creates and manages projects, flags, and rules. |
| Release Manager | Controls rollout state and uses kill switch during incidents. |
| Auditor/Compliance | Reviews change history and audit trails. |
| Client Application | Calls the evaluation API to determine flag state at runtime (includes demo app). |

## 3. Use Case Overview
| ID | Name | Primary Actor | Goal |
|---|---|---|---|
| UC-01 | Manage Projects | Feature Owner | Create, update, list, and delete projects safely. |
| UC-02 | Manage Feature Flags | Feature Owner | Create, edit, enable/disable, and archive flags. |
| UC-03 | Configure Flag Rules | Feature Owner | Define ordered rules for targeting and rollout. |
| UC-04 | Evaluate Feature Flag | Client Application | Determine enabled/disabled state with reason. |
| UC-05 | View Audit Logs | Auditor/Compliance | Trace all configuration changes. |
| UC-06 | Emergency Kill Switch | Release Manager | Immediately disable risky functionality. |

## 4. Use Case Specifications

### UC-01 — Manage Projects
**Brief Description**  
The Feature Owner creates, updates, lists, or deletes a project that groups feature flags.

**Primary Actor(s)** Feature Owner  
**Secondary Actor(s)** Auditor/Compliance (read-only visibility)  
**Preconditions** Actor is authenticated and authorized for project management.  
**Postconditions** On success, project data is stored and audit entries are created; on failure, no changes are persisted.  
**Trigger** Feature Owner selects a project management action in the dashboard or via API.

**Main Success Scenario**
1. Actor requests to create or update a project with key, name, and optional description.
2. System validates uniqueness and key format.
3. System persists the project and returns the updated project data.
4. System writes an immutable audit log entry for the change.

**Extensions**
1. If the project key already exists, the system rejects the request with `CONFLICT`.
2. If validation fails, the system returns `VALIDATION_ERROR` with field details.
3. If the actor requests deletion and flags exist, the system rejects deletion or requires explicit cascade per policy.

**Special Requirements**
Project key is unique and immutable; list endpoints support pagination and filtering; all changes are audited.

**Related Requirements**  
Backend project CRUD requirements; audit log requirements; frontend project list screen requirements.

**Relationships**  
Includes UC-05 View Audit Logs (audit entries are created for all mutations).

---

### UC-02 — Manage Feature Flags
**Brief Description**  
The Feature Owner creates, edits, enables/disables, or archives a feature flag within a project.

**Primary Actor(s)** Feature Owner  
**Secondary Actor(s)** Release Manager (toggle control), Auditor/Compliance (read-only)  
**Preconditions** Project exists; actor is authorized to manage flags.  
**Postconditions** Flag is stored with updated status; audit entry is written.  
**Trigger** Actor opens the feature flag list or detail screen and initiates an action.

**Main Success Scenario**
1. Actor provides flag name, unique key, and status (Enabled/Disabled).
2. System validates the key format and uniqueness within the project.
3. System persists the flag and returns the updated flag record.
4. System records an audit log entry with before/after values.

**Extensions**
1. If a flag key already exists in the project, the system rejects with `CONFLICT`.
2. If the actor toggles status to Disabled, the system sets the global state to off and records the reason in the audit entry.
3. If the actor lacks permission, the system returns `FORBIDDEN` and no change occurs.

**Special Requirements**
Status label and runtime state are clearly visible in the UI; destructive actions require confirmation; updates must be reflected in audit logs promptly.

**Related Requirements**  
Feature flag CRUD API; frontend flag list and create/edit screen requirements; minimal MVP validation requirements.

**Relationships**  
Extends UC-06 Emergency Kill Switch (fast disable is a specialized toggle path).

---

### UC-03 — Configure Flag Rules
**Brief Description**  
The Feature Owner defines ordered rollout rules for a flag, including global enable/disable, user targeting, role targeting, and percentage rollout.

**Primary Actor(s)** Feature Owner  
**Secondary Actor(s)** Release Manager (review), Auditor/Compliance (read-only)  
**Preconditions** Flag exists; actor is authorized to edit rules.  
**Postconditions** Rules are saved in deterministic order; audit entry is created.  
**Trigger** Actor opens the rule configuration screen for a flag.

**Main Success Scenario**
1. Actor opens the rule configuration screen and views current ordered rules.
2. Actor adds or edits rules for user allowlist, role targeting, and percentage rollout.
3. Actor sets explicit rule order and provides required parameters.
4. System validates rule schema and percentage ranges.
5. System saves rules and returns the ordered rule set.
6. System records an audit log entry with before/after snapshots.

**Extensions**
1. If rule validation fails, the system rejects with `VALIDATION_ERROR` and displays inline errors.
2. If conflicting rules exist, the system resolves using explicit priority; if not provided, default order applies: global disable → user allowlist → role match → percentage rollout → default off.
3. If percentage rollout is configured, the system uses deterministic hashing on a stable user identifier.

**Special Requirements**
Rule evaluation must be deterministic and explainable; rule ordering must be visible and editable; saved rules must be auditable and immutable in history.

**Related Requirements**  
Rule configuration API requirements; frontend rule configuration screen; rollout strategies and deterministic hashing guidance.

**Relationships**  
Includes UC-05 View Audit Logs (rules changes are logged).

---

### UC-04 — Evaluate Feature Flag
**Brief Description**  
A Client Application requests the evaluation API to determine whether a flag is enabled for a user context.

**Primary Actor(s)** Client Application  
**Secondary Actor(s)** Feature Owner (configures rules)  
**Preconditions** Project and flag exist; evaluation API is reachable; request is authenticated if required.  
**Postconditions** System returns an evaluation decision with reason; no state is mutated.  
**Trigger** Client Application calls the evaluation API with project key, flag key, and user context.

**Main Success Scenario**
1. Client sends evaluation request with `projectKey`, `flagKey`, and user context.
2. System loads the flag and its ordered rules.
3. System evaluates rules deterministically and returns `enabled` and `reason`.
4. Client uses the result to gate feature behavior.

**Extensions**
1. If the project or flag is missing, the system returns `enabled=false` with `reason=NOT_FOUND`.
2. If the flag is globally disabled, the system returns `enabled=false` with `reason=GLOBAL_OFF`.
3. If user context is missing or invalid, the system returns `enabled=false` with `reason=DEFAULT_OFF` and logs a validation error.

**Special Requirements**
Evaluation must be low latency and safe for high-throughput use; results must be deterministic for the same context; default behavior must be safe (usually off); response must include `projectKey`, `flagKey`, `enabled`, and `reason`.

**Related Requirements**  
Evaluation API requirements; demo app requirements; minimum API specification; feature flag research.

**Relationships**  
Includes UC-03 Configure Flag Rules (evaluation depends on rule definitions).

---

### UC-05 — View Audit Logs
**Brief Description**  
The Auditor/Compliance user queries audit logs to trace configuration changes to projects, flags, and rules.

**Primary Actor(s)** Auditor/Compliance  
**Secondary Actor(s)** Feature Owner, Release Manager (read-only)  
**Preconditions** Actor is authorized to view audit logs.  
**Postconditions** Audit results are displayed; no state is mutated.  
**Trigger** Actor opens the audit log screen or calls the audit log API.

**Main Success Scenario**
1. Actor selects a project and provides optional filters (flag key, actor, time range).
2. System queries audit entries with pagination.
3. System displays entries with timestamps, actor, action, target, and change summary.

**Extensions**
1. If no results match filters, the system displays an empty state with filter reset guidance.
2. If access is denied, the system returns `FORBIDDEN`.

**Special Requirements**
Audit logs are append-only and immutable; entries include actor identity, timestamp, action, and before/after values; filters support project, flag, actor, and time range.

**Related Requirements**  
Audit log API requirements; frontend audit log screen; audit log research guidance.

**Relationships**  
Included by UC-01, UC-02, and UC-03 (all configuration changes are audited).

---

### UC-06 — Emergency Kill Switch
**Brief Description**  
The Release Manager disables a risky feature immediately to mitigate incidents without redeploying.

**Primary Actor(s)** Release Manager  
**Secondary Actor(s)** Feature Owner (notification), Client Application (evaluation)  
**Preconditions** Flag exists and is deployed; actor is authorized for operational control.  
**Postconditions** Flag is disabled globally; audit entry is recorded; clients receive updated evaluation results.  
**Trigger** Release Manager initiates a kill switch action during an incident.

**Main Success Scenario**
1. Release Manager selects a high-risk flag and chooses "Disable globally."
2. System sets the flag state to Disabled and persists the change.
3. System records an audit log entry with actor and reason.
4. Client Applications evaluate the flag as disabled and route to the safe off-path.

**Extensions**
1. If the flag evaluation system is temporarily unavailable, clients use safe defaults (off).
2. If the actor lacks permission, the system returns `FORBIDDEN` and no change occurs.

**Special Requirements**
Propagation must be fast enough for incident response; the off-path must be safe and tested; changes must be auditable and traceable.

**Related Requirements**  
Global toggle and rule ordering requirements; kill switch research; evaluation API requirements.
