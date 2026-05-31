# Feature Flags — Research Summary

## 1) What a feature flag is (definition)
A **feature flag** (feature toggle) is a runtime control point that decides which code path executes **without a new build or redeploy**. It externalizes release decisions into configuration and policy: teams can enable, disable, or target functionality dynamically by user, cohort, region, or environment. Feature flag systems typically include a control plane (management UI/API), a data plane (SDK/runtime evaluator), and a propagation channel (polling or streaming) so decisions are fast and deterministic at runtime.

Key characteristics:
- **Runtime evaluation:** decisions happen per request, per user/session, or per tenant.
- **Targeting/segmentation:** rules can include attributes (role, plan, region) and percentages.
- **Variants:** binary (on/off) or multivariate (treatment A/B/C).
- **Kill switch capability:** immediate disablement without rollback.
- **Separation of concerns:** deployment of code is independent from release to users.

## 2) Problems feature flags solve in the SDLC
Feature flags address pain points across the full lifecycle:

**Requirements & design**
- Reduce “big-bang” launch risk by planning for incremental activation.
- Enable parallel development: unfinished work can merge safely behind a flag.

**Development & integration**
- Support **trunk-based development**: fewer long-lived branches, fewer merge conflicts.
- Allow partial delivery: small commits can land early without exposing half-done UX.

**Testing & validation**
- Test both **off/on paths** in the same build.
- Enable production-like validation for internal users or small cohorts.
- Keep the test matrix manageable by defining supported flag states.

**Deployment & release**
- **Decouple release from deployment**, enabling frequent deployments with controlled exposure.
- Enable progressive delivery (1% → 10% → 50% → 100%) with monitoring.
- Provide fast rollback: disabling a flag is faster than redeploying.

**Operations & reliability**
- Improve incident response time (sub-minute mitigation via kill switch).
- Support safe degradation modes (fallback behaviors during outages).

**Product learning & iteration**
- Run A/B or multivariate experiments for data-driven decisions.
- Shorten feedback loops with real user behavior.

## 3) Deployment vs. release (clear distinction)
**Deployment** is the technical act of shipping code to an environment (build, deploy, roll out infrastructure).  
**Release** is the business decision to expose functionality to users.

Feature flags **separate** these:
- You can **deploy** code in a “dark” state (flag off).
- You can **release** later by changing configuration, not code.

| Dimension | Deployment | Release |
|---|---|---|
| Trigger | CI/CD pipelines | Product/ops decision |
| Scope | Environment-level (staging/prod) | User- or cohort-level |
| Risk control | Rollback/redeploy | Flag flip / gradual rollout |
| Timing | Often frequent | Can be scheduled or progressive |
| Owner | Engineering/DevOps | Product/ops/security |

## 4) Common types of flags

### 4.1 Release flags (short-lived)
**Purpose:** control a new feature’s exposure during rollout, then remove.  
**Typical usage:** global toggle → targeted rollout → 100% → delete flag.  
**Risks:** flag debt if not cleaned up.

### 4.2 Experiment flags (A/B or multivariate)
**Purpose:** compare treatments against control to measure impact.  
**Key requirements:** deterministic bucketing, stable identifiers, analytics integration.  
**Success criteria:** statistical validity and a clear decision to adopt or reject.

### 4.3 Ops / kill-switch flags
**Purpose:** immediate disablement of risky behavior to mitigate incidents.  
**Design goal:** fastest possible rollback path.  
**Operational requirements:** low propagation latency, safe defaults, tested off-path.

### 4.4 Permission / entitlement flags
**Purpose:** enforce access control by role, plan, or tenant.  
**Use cases:** premium tiers, admin-only features, regional compliance.  
**Security note:** sensitive entitlements should be evaluated server-side.

## 5) Overall workflow of a feature flag system
This is the end-to-end lifecycle used by mature teams.

1. **Define the flag**
   - Choose type (release, experiment, ops, permission).
   - Set owner, environment defaults, and intended lifespan.
   - Specify safe default behavior (usually “off” for risky changes).

2. **Implement the toggle point**
   - Add a single, authoritative conditional in code (if/else, strategy, routing).
   - Provide both “on” and “off” paths; keep the off-path safe and tested.

3. **Configure targeting and rollout**
   - Create rules (allow/deny lists, roles, percentage rollout).
   - For experiments: define variants and allocation.
   - Establish guardrails and monitoring metrics.

4. **Propagate configuration**
   - Control plane writes to flag store.
   - SDKs fetch updates via polling or streaming.
   - Local caches enable low-latency evaluation.

5. **Runtime evaluation**
   - The app evaluates flags per request/user context.
   - Deterministic bucketing ensures stable user experience.
   - Fallbacks return safe defaults if evaluation fails.

6. **Observe and adjust**
   - Monitor error rates, latency, and business KPIs.
   - Ramp exposure (1% → 10% → 50% → 100%) or roll back instantly.
   - For experiments, analyze results and make a release decision.

7. **Cleanup and governance**
   - Remove flags after full rollout or experiment conclusion.
   - Keep audit logs for all configuration changes.
   - Enforce ownership, expiration dates, and approval workflows.

## References
- Feature flag overview, SDLC benefits, and types: https://martinfowler.com/articles/feature-toggles.html  
- Feature flagging principles and cleanup guidance: https://www.atlassian.com/continuous-delivery/principles/feature-flags  
- Kill switch and fast rollback: https://learn.microsoft.com/en-us/azure/azure-app-configuration/concept-feature-management  
- AWS AppConfig instant rollback: https://docs.aws.amazon.com/appconfig/latest/userguide/what-is-appconfig.html  
- Targeting filters and conditional flags: https://learn.microsoft.com/en-us/azure/azure-app-configuration/howto-feature-filters  
