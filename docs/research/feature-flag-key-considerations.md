# Feature Flags Key Considerations

This note focuses on four practical, high-impact areas in feature-flag platforms: caching, consistency, default values, and evaluation endpoint security. It assumes a control plane (flag management) and data plane (runtime evaluation via SDKs or endpoints).

## 1. Caching

Caching is essential for latency, availability, and cost control. The goal is to minimize remote lookups while keeping evaluations accurate and fresh enough for operational needs.

### 1.1 Where to cache
Common layers and what they optimize:
- **SDK in-memory cache:** Fast per-request decisions; best for server-side evaluation.
- **Local persistent cache (disk / mobile storage):** Survives restarts; important for mobile and edge devices.
- **Edge/CDN cache:** Useful for public, non-sensitive client-side flags with high read volume.
- **Configuration store cache:** Reduces load on the authoritative store (e.g., database, config service).

### 1.2 What to cache
Cache choices affect correctness:
- **Flag configs (rules + variants):** Cache configs and evaluate locally when possible.
- **Evaluation results:** Risky unless the cache key includes all context attributes that influence targeting.
- **Precomputed segments:** Cache large segments or user membership to avoid repeated expensive queries.

### 1.3 Cache keys and context
If caching evaluation results, include:
- Flag key + environment + version.
- User/tenant identity and all attributes that influence rule evaluation.
- Dependencies (prerequisite flags, segments, experiments).

Avoid caching results when context is dynamic or high-cardinality unless you have strong eviction controls.

### 1.4 Freshness and invalidation
Options and tradeoffs:
- **Short TTLs:** Simpler but can increase load.
- **Streaming updates:** Best for fast propagation and lower latency. Use versioned updates with monotonic sequence numbers.
- **Long polling:** Acceptable where streaming is not feasible.
- **Stale-while-revalidate:** Keeps low latency and avoids stampedes, with an upper bound on staleness.

### 1.5 Cache stampede and backpressure
Protect the control plane:
- Use **single-flight** refresh on cache miss.
- Apply **jittered TTLs** to spread refreshes.
- Rate-limit or shed load during incidents; ensure the system degrades gracefully.

## 2. Consistency

Consistency defines how quickly and uniformly a flag change becomes visible across the system. The correct level depends on risk tolerance and feature criticality.

### 2.1 Consistency models
- **Eventual consistency:** Default in distributed systems; acceptable for low-risk rollouts.
- **Read-after-write (strong) consistency:** Needed for high-risk or operational kill switches.
- **Session/request consistency:** Ensures a single request or user session sees a stable snapshot.

### 2.2 Snapshot consistency for multi-flag decisions
When evaluating multiple flags in a single request, use a consistent snapshot to avoid mixed versions (e.g., flag A updated but flag B not yet updated). This matters for:
- Feature dependencies and prerequisites.
- Coordinated rollouts.
- Experiments requiring stable assignment.

### 2.3 Ordering and propagation
Key mechanisms:
- **Versioned configuration bundles** with a monotonic version number.
- **Atomic bundle updates** so related flags update together.
- **Regional replication** with measured propagation SLOs.

### 2.4 Deterministic evaluation
Ensure that:
- The evaluation engine is deterministic given the same config + context.
- Hashing / bucketing algorithms are stable across SDK versions.
- Targeting rules and segments use well-defined data types and normalization.

### 2.5 Consistency vs availability tradeoff
When the control plane is unavailable:
- Prefer **local cached configs** with explicit staleness bounds.
- For critical kill switches, consider **out-of-band channels** (e.g., fast-path propagation).
- Make the tradeoff explicit in the platform documentation and SLA.

## 3. Default Values

Default values are not just a fallback; they are a critical part of safe feature release behavior.

### 3.1 Safe defaults
Defaults should be:
- **Explicit:** Always defined for each flag and environment.
- **Conservative:** Prefer "off" or safest behavior for high-risk features.
- **Documented:** Known by engineering and incident response.

### 3.2 Type safety and schema
For multivariate flags:
- Maintain **schema metadata** for type (boolean, string, JSON, numeric).
- Validate values at write-time to avoid runtime type errors.
- Consider "off" values for each variant (e.g., default JSON payload).

### 3.3 Missing or deleted flags
Handle unknown flags consistently:
- Return the **declared default** if flag exists but is disabled.
- Return a **global fallback** only when a flag is missing; log and alert.
- For deleted flags, support **tombstones** to prevent silent fallback to defaults that may be unsafe.

### 3.4 Environment-specific defaults
Defaults may differ by environment:
- **Dev/Staging:** More permissive defaults can accelerate testing.
- **Prod:** Conservative defaults to minimize risk.
Ensure changes to defaults are audited like any other flag edit.

## 4. Flag Evaluation Endpoint Security

If evaluation is exposed through an endpoint (especially for client-side or edge scenarios), security must be treated as a first-class concern.

### 4.1 Principle: do not expose sensitive flags
Client-side evaluation should only serve flags that are safe to expose publicly. Sensitive flags (pricing logic, security controls, internal admin features) should be evaluated server-side.

### 4.2 Authentication and authorization
Minimum requirements:
- **Strong authentication**: OAuth2 client credentials, mTLS, or short-lived signed tokens.
- **Scope-based authorization**: Access restricted by project, environment, and tenant.
- **Least privilege**: Separate "evaluate" permissions from "manage" permissions.

### 4.3 Integrity and replay protection
Protect request integrity:
- **Signed payloads** with timestamps and nonces for replay defense.
- **Transport security (TLS)** everywhere.
- Reject stale or unsigned requests for sensitive environments.

### 4.4 Data minimization and privacy
Context data often contains PII:
- Send only required attributes for targeting.
- Hash or tokenize identifiers where possible.
- Avoid logging full contexts; use redaction and structured logging policies.

### 4.5 Abuse resistance
Public endpoints can be attacked:
- **Rate limits** per token, IP, and tenant.
- **Quota enforcement** to prevent runaway cost.
- **Anomaly detection** for abuse or misconfigured clients.

### 4.6 Secure rule evaluation
Targeting rules can be a code execution vector if implemented poorly:
- Use a **safe DSL** or expression language, not general-purpose eval.
- Impose **time and complexity limits** (regex limits, recursion depth, function restrictions).
- Validate rules at write-time with static checks.

### 4.7 Auditability
Security includes traceability:
- Audit logs for flag changes and access to evaluation endpoints.
- Immutable logs for critical changes (kill switches, high-risk flags).
- Integration with alerting and incident response.

## Summary Guidance

Caching, consistency, defaults, and endpoint security are tightly coupled:
- **Caching** is about latency and cost, but must be bounded by staleness rules.
- **Consistency** determines correctness across regions and within requests.
- **Defaults** define safe behavior when things go wrong.
- **Endpoint security** protects both configuration and user context from leakage or abuse.

Treat these areas as platform-level guarantees, not per-flag exceptions. They are core to user trust, safe rollouts, and operational resilience.
