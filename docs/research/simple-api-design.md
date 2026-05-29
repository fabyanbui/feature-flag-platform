# Simple API design for applications to integrate feature flags

This document proposes a **simple, consistent API surface** for application teams to integrate feature flags across server and client environments. It draws on established industry patterns, especially the OpenFeature evaluation API and evaluation context model, along with common SDK shapes from LaunchDarkly and Unleash.

## 1. Design goals

1. **Minimal call surface** in application code (one or two calls per decision).
2. **Typed evaluation** with explicit defaults and safe fallbacks.
3. **Deterministic behavior** across requests, environments, and SDKs.
4. **Low-latency evaluation** (local cache, avoid network per request).
5. **Strong context model** for targeting and rollout without leaking PII.
6. **Vendor-agnostic** and interoperable across SDKs.

These goals mirror the OpenFeature specification emphasis on a common evaluation API and context-driven targeting, while keeping the integration simple for application authors.

## 2. Canonical minimal SDK API (OpenFeature-shaped)

OpenFeature standardizes a vendor-agnostic evaluation API with **typed getters** and optional evaluation context. It requires methods for boolean, string, number, and structured values, and it defines defaults and error handling semantics for consistency across SDKs. A minimal API that mirrors this design stays simple yet powerful [OpenFeature Evaluation API](https://openfeature.dev/specification/sections/flag-evaluation).

### Recommended API surface

```ts
// bootstrap
FeatureFlags.setProvider(provider); // or initialize(config)
const client = FeatureFlags.getClient("default"); // domain optional

// boolean/typed evaluation
const enabled = client.getBooleanValue("new-checkout", false, context);
const theme = client.getStringValue("ui-theme", "classic", context);
const price  = client.getNumberValue("price-multiplier", 1.0, context);
const config = client.getObjectValue("search-config", { ranker: "v1" }, context);

// detailed evaluation (optional)
const details = client.getBooleanDetails("new-checkout", false, context);
// details.value, details.variant, details.reason, details.errorCode
```

**Why this shape?**
1. OpenFeature explicitly requires **typed evaluation methods** with required defaults and optional evaluation context [OpenFeature Flag Evaluation](https://openfeature.dev/specification/sections/flag-evaluation).
2. It also defines **detailed evaluation** methods that return metadata (value, reason, variant, error) for debugging and telemetry [OpenFeature Flag Evaluation](https://openfeature.dev/specification/sections/flag-evaluation).

### Convenience aliases (optional)

To reduce boilerplate for the most common use case (boolean toggles), most SDKs provide or emulate `isEnabled`:

```ts
const enabled = client.isEnabled("new-checkout", context, false); // alias for getBooleanValue
```

Unleash and LaunchDarkly both expose this shape: Unleash uses `isEnabled` and `getVariant` in its quick start examples [Unleash Node SDK README](https://raw.githubusercontent.com/Unleash/unleash-client-node/main/README.md), while LaunchDarkly uses typed `variation` methods with a fallback value [LaunchDarkly Flag Evaluation](https://docs.launchdarkly.com/sdk/features/evaluating).

## 3. Evaluation context design

OpenFeature defines a **context object** that carries data used for targeting, percentage rollout, and per-user decisions. It requires a **targeting key** plus arbitrary custom fields [OpenFeature Evaluation Context](https://openfeature.dev/specification/sections/evaluation-context).

### Recommended context shape

```json
{
  "targetingKey": "user_12345",     // stable identifier
  "tenantId": "acct_987",
  "country": "US",
  "plan": "pro",
  "device": "ios"
}
```

**Guidelines**
1. **Targeting key:** stable, non-PII, consistent across services; required for deterministic percentage rollouts [OpenFeature Evaluation Context](https://openfeature.dev/specification/sections/evaluation-context).
2. **Custom attributes:** include only what targeting rules require (region, tier, device). Avoid raw PII; hash user identifiers if needed.
3. **Multi-tenant apps:** include `tenantId` or `accountId` to avoid cross-tenant targeting collisions.

## 4. Initialization and provider lifecycle (keep it a singleton)

OpenFeature recommends a **global singleton** for the API instance and a **provider mutator** to set the active provider [OpenFeature Flag Evaluation](https://openfeature.dev/specification/sections/flag-evaluation). Unleash’s Java SDK reinforces this: a single shared instance avoids inconsistencies and performance issues [Unleash Java SDK README](https://raw.githubusercontent.com/Unleash/unleash-client-java/main/README.md).

### Recommended initialization pattern

```ts
const provider = new FlagProvider({
  endpoint: "https://flags.example.com",
  apiKey: "env-or-app-token",
  streaming: true,
});

FeatureFlags.setProvider(provider); // singleton provider
```

**Rationale**
1. Single provider avoids diverging caches and inconsistent flag values.
2. Central configuration enables consistent rollout and audit behavior.
3. Provider lifecycle (initialize/shutdown) should be explicit.

## 5. Default values, fallbacks, and safe behavior

LaunchDarkly’s evaluation docs explicitly note that **fallback values** are returned on errors such as missing flag keys, unreachable service, or invalid context [LaunchDarkly Flag Evaluation](https://docs.launchdarkly.com/sdk/features/evaluating). OpenFeature also requires returning defaults when the provider returns a wrong type [OpenFeature Flag Evaluation](https://openfeature.dev/specification/sections/flag-evaluation).

**Rule of thumb:**  
**Always supply defaults. Always return defaults on error. Never throw in application code paths.**

This is critical for resiliency: feature flags must never take down production.

## 6. Variants and detailed evaluation

Modern systems often use **multivariate flags**. OpenFeature provider resolution details explicitly include a `variant` string and a `reason` for how the evaluation resolved [OpenFeature Providers](https://openfeature.dev/specification/sections/providers).

### Recommended details structure

```json
{
  "value": true,
  "variant": "treatment",
  "reason": "TARGETING_MATCH",
  "errorCode": null
}
```

Use `reason` and `variant` for:
1. **Observability:** understand why a decision happened.
2. **Analytics:** track exposure by variant.
3. **Debugging:** detect stale cache or invalid context.

## 7. Bulk evaluation and snapshot APIs

Applications often need **all flags for a user** (UI gating, feature menus). LaunchDarkly supports retrieving all flags in one call, returning a key-value map from local cache [LaunchDarkly Flag Evaluation](https://docs.launchdarkly.com/sdk/features/evaluating).

### Minimal bulk API

```ts
const allFlags = client.getAllFlags(context); // returns { key: value }
```

**Best practice:** bulk calls should be served from local cache to avoid per-request network cost.

## 8. Client-side vs server-side SDK differences

OpenFeature distinguishes **client-side SDKs** (static context) from **server-side SDKs** (dynamic context) [OpenFeature Glossary](https://openfeature.dev/specification/glossary). This should influence API design:

| Dimension | Server-side SDK | Client-side SDK |
| --- | --- | --- |
| Context | Per-request (dynamic) | Mostly static (user/session) |
| Storage | Memory + polling/streaming | Local cache + bootstrap |
| Security | Full rules and variants | Avoid exposing rule logic |

**Recommendation:** use server-side evaluation for sensitive rules or entitlements. Client-side SDKs should receive only evaluated values or a safe subset of flags.

## 9. Simple REST API (for platforms without SDKs)

Not all environments can embed an SDK. A **small REST API** can support these cases with predictable semantics.

### Suggested endpoints

```
POST /evaluate
{
  "flagKey": "new-checkout",
  "default": false,
  "context": { "targetingKey": "user_123" }
}

GET /flags?context=...   // bulk
POST /events             // exposure or custom metrics
```

**Design notes**
1. Keep **evaluation deterministic** (stable targeting key).
2. Provide **ETag** or `If-None-Match` for bulk flags to minimize bandwidth.
3. Support **offline or stale cache** behavior for reliability.

OpenFeature providers can wrap REST clients, so this aligns with the provider model [OpenFeature Providers](https://openfeature.dev/specification/sections/providers).

## 10. Operational considerations that keep the API simple

1. **Local cache + background sync:** evaluation should be synchronous and fast. LaunchDarkly emphasizes that evaluation calls read from local memory after initialization [LaunchDarkly Flag Evaluation](https://docs.launchdarkly.com/sdk/features/evaluating).
2. **Initialization readiness:** provide a `setProviderAndWait` or `await initialize` for cases where startup must block until flags are ready [OpenFeature Flag Evaluation](https://openfeature.dev/specification/sections/flag-evaluation).
3. **Context validation:** missing targeting keys should not crash; return defaults and record a diagnostic.
4. **Consistent bucketing:** hash `(flagKey, targetingKey)` to ensure sticky rollouts.
5. **Auditability:** track evaluation reasons and variants.

## 11. A minimal, production-ready API (reference)

This is a concise reference that fits most application teams:

```ts
// Init
FeatureFlags.initialize({
  provider: "my-flag-service",
  endpoint: "https://flags.example.com",
  apiKey: "...",
  streaming: true,
});

// Evaluate
const enabled = flags.isEnabled("new-checkout", context, false);
const priceMultiplier = flags.getNumberValue("price-multiplier", 1.0, context);
const details = flags.getBooleanDetails("new-checkout", false, context);

// Bulk
const all = flags.getAllFlags(context);
```

This design follows OpenFeature’s typed evaluation and context model, while matching the simplicity of Unleash and LaunchDarkly SDK calls [OpenFeature Flag Evaluation](https://openfeature.dev/specification/sections/flag-evaluation) [Unleash Node SDK README](https://raw.githubusercontent.com/Unleash/unleash-client-node/main/README.md) [LaunchDarkly Flag Evaluation](https://docs.launchdarkly.com/sdk/features/evaluating).

## References

1. OpenFeature Specification — Flag Evaluation: https://openfeature.dev/specification/sections/flag-evaluation  
2. OpenFeature Specification — Evaluation Context: https://openfeature.dev/specification/sections/evaluation-context  
3. OpenFeature Specification — Providers: https://openfeature.dev/specification/sections/providers  
4. OpenFeature Glossary: https://openfeature.dev/specification/glossary  
5. LaunchDarkly SDK — Evaluating flags: https://docs.launchdarkly.com/sdk/features/evaluating  
6. Unleash Node SDK README (isEnabled, getVariant): https://raw.githubusercontent.com/Unleash/unleash-client-node/main/README.md  
7. Unleash Java SDK README (single instance, isEnabled, context): https://raw.githubusercontent.com/Unleash/unleash-client-java/main/README.md  
8. Microsoft Azure App Configuration — Feature Filters (conditional flags): https://learn.microsoft.com/en-us/azure/azure-app-configuration/howto-feature-filters
