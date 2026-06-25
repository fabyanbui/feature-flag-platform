# Demo App Requirements: Feature Flag Integration

**Last updated:** 2026-06-25

## 1. Purpose and Scope
Define a small web application that demonstrates real-time feature flag evaluation by calling the platform Evaluation API. The app must clearly show how a feature is enabled/disabled globally and how targeting (role) or percentage rollout affects different users.

In scope:
1. A minimal web UI that evaluates a single flag via the Evaluation API.
2. Visual demonstration of flag state and a gated demo feature.
3. Two demonstrable scenarios: global toggle and targeted/percentage rollout.

Out of scope:
1. Building or modifying the feature flag backend.
2. A full administrative dashboard.
3. Multi-variant (A/B/C) experiments beyond boolean flags.

## 2. Definitions
**Evaluation API:** Backend endpoint that returns whether a flag is enabled for a given user context.  
**User context:** Identifiers and attributes used for targeting (e.g., userId, roles).  
**Scenario:** A curated set of user context inputs used to demonstrate a flag rule outcome.

## 3. Assumptions and Dependencies
1. The Evaluation API is available and follows the backend requirements: request includes project key, flag key, and user context; response includes `enabled`, `reason`, `flagKey`, and `projectKey`.
2. A demo project and flag exist in the backend with rules that support:
   - Global on/off.
   - Role-based targeting and/or percentage rollout.
3. The app is allowed to call the Evaluation API from the browser (CORS configured) or via a lightweight proxy if required by security.

## 4. Functional Requirements
### 4.1 App Shell and Configuration
1. The app must render a single-page interface with a clear title and status area.
2. The app must allow configuration of:
   - **API base URL**
   - **Project key**
   - **Flag key**
   - **User context** (userId, roles, optional attributes)
3. Configuration must be provided via environment variables or a simple settings panel, with safe defaults for local demo.

### 4.2 Evaluation Flow
1. The app must call the Evaluation API on initial load with a default user
   context, preferably through the project JavaScript SDK.
2. The app must provide a manual **Evaluate** action to re-run the evaluation on demand.
3. The app must display:
   - `enabled` result
   - `reason` (matched rule type or default)
   - `flagKey` and `projectKey`
4. Evaluation must be deterministic for the same user context.

### 4.3 Demo Feature Gating
1. A visible demo feature section must exist (e.g., “New Checkout Widget”).
2. The demo feature must be:
   - **Visible** only when `enabled=true`.
   - **Hidden** (or replaced with a clear “Feature Off” placeholder) when `enabled=false`.

### 4.4 Scenario A — Global Toggle
1. The app must include a **Global Toggle** scenario that:
   - Uses a fixed user context.
   - Reflects on/off changes when the flag is globally enabled or disabled.
2. The UI must clearly label the scenario and show the current evaluation result.

### 4.5 Scenario B — Targeting / Percentage Rollout
1. The app must include a **Targeting/Rollout** scenario that demonstrates at least one of:
   - Role-based enablement (e.g., `roles=["admin"]`), or
   - Percentage rollout based on stable `targetingKey` bucketing.
2. The user must be able to switch between at least two user contexts that yield different outcomes, for example:
   - **Admin user** (role-based enablement expected).
   - **Standard user** (role-based disablement or percentage-based depending on flag config).
3. For percentage rollout, the app must provide a stable non-PII
   `targetingKey` so different targets can be bucketed deterministically.

### 4.6 Error and Loading States
1. The app must show a loading state while evaluation is in progress.
2. On API failure, the app must display:
   - A non-technical error message suitable for demos.
   - A retry action.
3. When the flag or project is missing, the UI must display the `reason` from the API and treat the feature as disabled.

## 5. Data Contract (Evaluation API)
**Request (JSON):**
```json
{
  "projectKey": "string",
  "environmentKey": "production",
  "flagKey": "string",
  "context": {
    "targetingKey": "stable-non-pii-key",
    "userId": "optional-allowlist-id",
    "roles": ["string"],
    "attributes": { "key": "value" }
  }
}
```

**Response (JSON):**
```json
{
  "projectKey": "string",
  "flagKey": "string",
  "enabled": true,
  "variant": "on",
  "reason": "GLOBAL_ON | ROLE_MATCH | PERCENTAGE_ROLLOUT | DEFAULT_OFF | NOT_FOUND",
  "matchedRuleId": "string-or-null"
}
```

SDK-local timeout, network, unsuccessful HTTP, invalid JSON, or invalid response
failures use `reason=ERROR`, `enabled=false`, `variant=off`, and
`errorSource=CLIENT`. The SDK must not add client-only values to the backend
reason-code contract.

## 6. UX and Presentation Requirements
1. The UI must clearly separate:
   - **Input** (user context and scenario selection)
   - **Result** (enabled/disabled, reason)
   - **Demo feature** (gated content)
2. Status must be expressed in text (not color-only).
3. The UI should be minimal and readable for live demonstrations.

## 7. Non-Functional Requirements
1. **Performance:** Evaluation results should render within 1 second on a typical broadband connection.
2. **Reliability:** The app must handle transient API errors with a visible retry path.
3. **Security:** No secrets are stored in the browser. If an API key is required, use a read-only or demo-scoped key.
4. **Accessibility:** All interactive controls must be keyboard-accessible.

## 8. Acceptance Criteria
1. The app evaluates a flag and shows `enabled`, `reason`, `flagKey`, and `projectKey`.
2. The demo feature is only visible when the flag is enabled.
3. The **Global Toggle** scenario visibly changes when the flag is globally turned on/off.
4. The **Targeting/Rollout** scenario shows different results for at least two user contexts.
5. Errors and loading states are clearly communicated and do not block retry.
