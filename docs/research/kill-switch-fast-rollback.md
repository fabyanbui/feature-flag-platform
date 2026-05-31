# Kill switch and fast rollback during production errors

## Executive summary
A **kill switch** is an operational feature flag that lets you disable a capability immediately in production without deploying new code. It is the fastest rollback path because it flips behavior at runtime rather than requiring a build, deploy, or data migration. Feature management systems explicitly call out **instant kill switch** behavior for turning features off on demand and **instant rollback** of a bad change without redeploying. In practice, the kill switch is a "hard off" path that routes traffic back to the last known-good behavior, minimizing blast radius and recovery time. [1][2]

## What a kill switch is (and is not)
**Kill switch (ops toggle):**
- A runtime-controlled flag that **forces the "off" path** of a feature to be active immediately across a defined scope (global, region, tenant, cohort).
- Used during incidents to stop harm quickly and restore stability.

**Not a kill switch:**
- A partial rollout or A/B experiment flag (these reduce blast radius, but still expose the feature).
- A deployment rollback (slower, requires orchestration, may reintroduce unrelated regressions).

Martin Fowler distinguishes **ops toggles** (operational controls) from release and experiment toggles. Ops toggles are explicitly for operational control, which is exactly the kill switch use case. [3]

## Why kill switches enable fast rollback
Feature management decouples **release** from **deployment**, letting teams flip behavior on demand. Azure App Configuration explicitly describes **instant kill switch** capabilities, and AWS AppConfig highlights **instant rollback** of changes plus using a flag as a block switch without rolling back the deployment. [1][2] This yields:

1. **Time-to-mitigate measured in seconds** (flag change propagation) rather than minutes or hours (deploy rollback).
2. **Lower operational risk** because the rollback path is pre-validated and does not touch build/deploy pipelines.
3. **Granular scope control** to limit impact (global, region, tier, tenant).

## Reference architecture for kill switches
**Core components:**
1. **Flag store/control plane** (central repository): externalized from the app to allow runtime changes. [1]
2. **SDK/runtime evaluator**: evaluates flags per request with caching and defaults.
3. **Propagation channel**: pushes config updates to services quickly (poll, streaming, or cache invalidation).
4. **Observability integration**: metrics + alerts tied to rollout/rollback.

**Fast rollback depends on:**
- **Low propagation latency** (seconds to a minute).
- **Safe defaults** if the flag service is unavailable.
- **A stable off-path** that restores previous behavior.

## Kill switch design patterns

### 1) Global kill switch (single lever)
**Purpose:** immediate stop across the entire system.  
**Pros:** fastest, simplest.  
**Cons:** large blast radius; can be too coarse for partial degradation.

### 2) Scoped kill switch (region/tenant/cohort)
**Purpose:** isolate the problem and reduce impact.  
**Pros:** smaller blast radius, enables targeted recovery.  
**Cons:** more complex control and monitoring.

### 3) Layered kill switches (service + feature)
**Purpose:** allow disabling the feature at the edge and at the core service.  
**Pros:** resilience to partial system failures and traffic paths.  
**Cons:** requires coordination and consistent evaluation logic.

### 4) Degraded mode switch
**Purpose:** disable the risky path but keep a reduced feature set.  
**Pros:** better user experience than a full cut.  
**Cons:** must be pre-designed and tested.

## Implementation invariants (non-negotiables)
1. **The "off" path must be safe.** A kill switch that crashes or uses broken data is not a rollback path.
2. **The off path must be maintained.** Test it in CI or pre-prod; it should never rot.
3. **Flag evaluation must be local and fast.** Cache at runtime; avoid calling remote systems per request.
4. **Safe defaults for flag service outages.** If the flag system fails, default to the safest behavior (usually off). [1]
5. **Minimal toggle points.** Keep the number of conditional branches small to avoid inconsistent state and to ease rollback. [3]
6. **Retire kill switches when no longer needed.** Leaving long-lived toggles creates confusion and risk. [3]

## Fast rollback workflow during an incident
1. **Detect:** alert on error rate, latency, or correctness regression.
2. **Decide scope:** global vs. scoped rollback based on blast radius.
3. **Flip the kill switch:** set to OFF through the control plane.
4. **Verify recovery:** observe SLOs and error budgets.
5. **Stabilize & follow-up:** root cause, remove or fix the feature, clean up toggles.

**Automation:** AWS AppConfig supports monitoring-based **automatic rollback** if a configuration change causes unhealthy metrics. This enables "self-healing" rollbacks without operator intervention. [2]

## Failure modes and mitigations
| Failure mode | Impact | Mitigation |
|---|---|---|
| Flag service outage | Cannot change state; stale flags | Cache + TTL, fail-safe defaults (off), secondary control paths |
| Slow propagation | Delayed rollback | Streaming updates, aggressive poll intervals, regional replication |
| Incomplete toggle coverage | Feature still reachable | Wrap entry points, define a single authoritative toggle point [3] |
| State/data incompatibility | Off path cannot read new data | Backward-compatible schema and dual-read strategies |
| Excessive flags | Operational confusion | Naming conventions, ownership, expiration policies |

## Decision framework: when to rely on kill switch vs rollback
**Use kill switch when:**
- The risk is primarily behavioral (logic errors, latency spikes, cost spikes).
- There is a stable previous behavior to fall back to.
- You need sub-minute mitigation.

**Use deployment rollback when:**
- The failure is in the shared runtime or infrastructure.
- The "off" path is not safe (data incompatible).
- The feature and old path cannot coexist.

## Practical recommendations
1. **Embed kill switches for high-risk features by default.**
2. **Treat kill switches as operational controls (ops toggles)** with strict RBAC and audit logs.
3. **Design for backward compatibility** so "off" is always safe.
4. **Set a propagation SLO** (for example, < 60 seconds) and test it.
5. **Automate rollback** based on monitoring thresholds where possible. [2]

## References
1. Microsoft Azure App Configuration: Feature management concepts (instant kill switch). https://learn.microsoft.com/en-us/azure/azure-app-configuration/concept-feature-management  
2. AWS AppConfig: What is AppConfig (instant rollback, block switch, automatic rollback). https://docs.aws.amazon.com/appconfig/latest/userguide/what-is-appconfig.html  
3. Martin Fowler: Feature Toggle (ops toggles, minimal toggle points, remove toggles). https://martinfowler.com/bliki/FeatureToggle.html  
