# Rollout strategies for feature flags

This note focuses on four common rollout strategies—global toggle, user targeting, role-based targeting, and percentage rollout—and how they behave in real systems. These strategies are frequently combined into ordered rules (for example: global kill switch → allow/deny lists → role rules → percentage rollout → default off). Feature flag libraries commonly support conditional evaluation and custom filters so the same flag can evaluate differently per request or context. Microsoft’s feature management documentation explicitly distinguishes basic “on/off for everyone” flags from conditional flags evaluated by filters, including a targeting filter for users/groups and custom filters with parameters such as percentage [Microsoft Feature Filters](https://learn.microsoft.com/en-us/azure/azure-app-configuration/howto-feature-filters).

## 1. Global toggle (environment-wide on/off)

**Definition:** A single flag state applies uniformly to all requests in an environment. Microsoft describes this as the basic feature flag: the application behaves according to the flag value “in all circumstances” when the flag is simply on or off [Microsoft Feature Filters](https://learn.microsoft.com/en-us/azure/azure-app-configuration/howto-feature-filters).

**Use cases**
- **Kill switch:** immediate shutdown of a risky feature.
- **Dark launch enablement:** deploy code paths but keep them inactive until ready.
- **Environment gating:** enable in staging but not in production.

**Engineering details**
- **Evaluation simplicity:** no user context required; fastest and most deterministic.
- **Safe defaults:** default off is typical for risky or user-facing changes.
- **Governance:** global toggles should be cleaned up after full rollout to avoid long-lived dead code. Atlassian explicitly calls out the need to remove flags after 100% rollout [Atlassian Feature Flagging](https://www.atlassian.com/continuous-delivery/principles/feature-flags).

**Risks & mitigations**
- **Overuse as “permanent config”:** creates persistent branching. Enforce TTLs and cleanup policies.
- **Insufficient safety:** if rollback is needed per cohort, global toggles are too blunt; layer with targeting.

## 2. User targeting (explicit allow/deny per user)

**Definition:** Enable the feature for specific users by identifier (allowlist) and optionally exclude others (denylist). Microsoft’s built‑in **Targeting filter** is designed to turn on a feature for **specified users and groups** [Microsoft Feature Filters](https://learn.microsoft.com/en-us/azure/azure-app-configuration/howto-feature-filters). This maps directly to user targeting.

**Use cases**
- **Beta programs:** invite-only access.
- **Support and debugging:** enable for a single affected customer.
- **Progressive validation:** enable for internal testers and power users first.

**Engineering details**
- **Stable identifiers:** use a stable, non‑PII key (hashed user ID, account ID, or GUID). If anonymous sessions are allowed, assign a stable anonymous ID and persist it.
- **Rule order:** explicit allow/deny should take precedence over coarse rules (roles or percentage) to prevent accidental overrides.
- **Scale considerations:** large allowlists should be managed as segments (stored server‑side) to avoid shipping giant lists to clients.
- **Auditability:** require approvals for adding/removing high‑impact users (e.g., VIPs).

**Risks & mitigations**
- **Manual drift:** stale allowlists. Enforce expiry and ownership.
- **Privacy:** avoid storing raw PII in flag rules; store hashes and keep mapping in your identity system.

## 3. Role‑based targeting (group/role membership)

**Definition:** Enable the feature for users who belong to a role or group (e.g., “Admin”, “BetaTester”, “PaidTier”). This is a specialization of targeting by groups; Microsoft’s targeting filter explicitly supports users and groups [Microsoft Feature Filters](https://learn.microsoft.com/en-us/azure/azure-app-configuration/howto-feature-filters).

**Use cases**
- **Entitlements:** paid features or enterprise-only capabilities.
- **Safety gates:** admin‑only tools or internal features.
- **Operational roles:** support tooling accessible only to staff roles.

**Engineering details**
- **Source of truth:** roles should come from your identity/authorization system, not user-supplied client data.
- **Consistency across services:** ensure role mapping is consistent across backend and frontend; prefer server‑evaluated flags where roles are sensitive.
- **Tenant scoping:** for multi‑tenant apps, roles are often tenant‑specific. The evaluation context should include both user ID and tenant/account ID.
- **Precedence:** explicit user allow/deny typically overrides role rules to support special cases.

**Risks & mitigations**
- **Stale role claims:** cache invalidation can leave users over‑privileged. Use short‑lived tokens or revalidation.
- **Role explosion:** too many roles mimic per‑user targeting. Consolidate roles and use segments when needed.

## 4. Percentage rollout (progressive exposure)

**Definition:** Enable a flag for a percentage of a population. In the Microsoft feature filter example, a custom filter reads a `Percentage` parameter and uses a random number to determine if the feature is enabled [Microsoft Feature Filters](https://learn.microsoft.com/en-us/azure/azure-app-configuration/howto-feature-filters) and [Custom Filter Example](https://learn.microsoft.com/en-us/azure/azure-app-configuration/howto-feature-filters-aspnet-core). That example illustrates the concept, but production systems usually require **deterministic** assignment.

**Use cases**
- **Canary rollout:** start at 1–5% to detect regressions.
- **Progressive delivery:** ramp 10% → 25% → 50% → 100% based on metrics.
- **A/B comparison:** use a fixed split for experiments (often paired with metrics).

**Engineering details**
- **Deterministic bucketing:** compute a stable hash of `(flagKey, rolloutKey)` and compare to a threshold so users don’t “flip” on refresh. Random per‑request evaluation causes inconsistent UX.
- **Choose the right unit:** per‑user is typical for UI changes; per‑account/tenant is safer for features that must be consistent across collaborators.
- **Stickiness:** ensure the same rollout key is used across services and clients.
- **Guardrails:** pair with error/latency monitors and an immediate kill switch.

**Risks & mitigations**
- **Inconsistent experiences:** avoid random evaluation at request time. Use deterministic hashing.
- **Bias:** if rollout keys correlate with regions or tiers, you may get unintended skew. Consider stratified rollouts or segmenting by region first.

## Practical rule composition

A typical evaluation order that avoids surprises:
1. **Global kill switch** (off → immediate disable).
2. **Explicit deny list** (security or compliance exclusions).
3. **Explicit allow list** (internal/testers).
4. **Role/group rules** (entitlements).
5. **Percentage rollout** (progressive exposure).
6. **Default** (usually off).

This layered approach provides safety and control while still enabling progressive delivery. Martin Fowler’s overview of feature toggles emphasizes dynamic evaluation and testing both paths to keep toggled code safe and validated [Fowler Feature Toggles](https://martinfowler.com/articles/feature-toggles.html).

## Operational guidance (applies to all strategies)

- **Telemetry first:** define the success/error metrics before rollout. Progressive strategies are only as safe as the monitoring behind them.
- **Fast rollback path:** keep a global override for immediate disable.
- **Cleanup policy:** remove or permanently enable flags after full rollout to avoid technical debt [Atlassian Feature Flagging](https://www.atlassian.com/continuous-delivery/principles/feature-flags).
- **Security:** evaluate sensitive flags on the server when possible; avoid exposing allowlists or role rules to clients.
- **Testing:** exercise both enabled/disabled paths in automated tests [Fowler Feature Toggles](https://martinfowler.com/articles/feature-toggles.html).

## References

- Microsoft Azure App Configuration — Feature Filters: https://learn.microsoft.com/en-us/azure/azure-app-configuration/howto-feature-filters  
- Microsoft Azure App Configuration — Custom Filter Example: https://learn.microsoft.com/en-us/azure/azure-app-configuration/howto-feature-filters-aspnet-core  
- Martin Fowler — Feature Toggles: https://martinfowler.com/articles/feature-toggles.html  
- Atlassian — Feature Flagging: https://www.atlassian.com/continuous-delivery/principles/feature-flags  
