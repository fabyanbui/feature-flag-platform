# Feature Flag Platform Research Report

## Executive Summary

Feature flags are runtime controls that decide whether a feature should be
visible or hidden without requiring a new deployment. They help teams separate
the technical act of deploying code from the business decision of releasing a
feature to users.

This mini project implements a focused feature flag management platform with:

- a backend API,
- an admin dashboard,
- a demo application,
- PostgreSQL persistence,
- deterministic rule evaluation,
- safe fallback behavior,
- append-only audit logs,
- seed data and release-readiness tests.

The goal is not to compete with enterprise products such as LaunchDarkly,
Unleash, Flagsmith, ConfigCat, or Split. The goal is to demonstrate the core
engineering ideas behind safe release management in a compact, explainable
system.

## 1. What Feature Flags Are

A feature flag, also called a feature toggle, is a runtime decision point in an
application. Instead of permanently enabling a code path when code is deployed,
the application asks a flag system whether the feature should be on or off for
the current context.

Typical evaluation context includes:

- project key,
- flag key,
- targeting key,
- user ID or stable user identifier,
- roles,
- selected attributes.

The response usually includes:

- whether the feature is enabled,
- the matched reason,
- the selected variant,
- optional rule or trace information.

In this project, the evaluation API returns:

```json
{
  "projectKey": "demo-project",
  "flagKey": "new-checkout",
  "enabled": true,
  "variant": "on",
  "reason": "ROLE_MATCH",
  "matchedRuleId": "..."
}
```

## 2. Deployment vs. Release

Deployment and release are different activities.

| Concept | Meaning | Owner | Risk control |
| --- | --- | --- | --- |
| Deployment | Shipping code to an environment | Engineering/DevOps | Rollback or redeploy |
| Release | Exposing functionality to users | Product/engineering/ops | Flag change, rollout, kill switch |

Without feature flags, deployment and release often happen together. That
increases risk because any production deployment can expose unfinished or risky
behavior immediately.

With feature flags:

1. Code can be deployed with the feature off.
2. Internal users can test first.
3. A small percentage of users can receive the feature.
4. The rollout can expand gradually.
5. The feature can be disabled quickly if problems occur.

This project demonstrates that separation by keeping management APIs and the
admin dashboard as the **control plane**, while the demo application only calls
the runtime evaluation API as the **data plane**.

## 3. Problems Solved in the Software Delivery Lifecycle

### 3.1 Safer incremental release

Teams can reduce big-bang launch risk by releasing to small cohorts before full
exposure.

### 3.2 Faster rollback

Kill switches allow risky behavior to be disabled by configuration. This is
faster than building, testing, and deploying a rollback package.

### 3.3 Parallel development

Incomplete features can be merged behind disabled flags, reducing long-lived
branches and integration conflicts.

### 3.4 Targeted validation

Features can be released first to admins, beta testers, selected roles, or
percentage cohorts.

### 3.5 Auditability

Because flag changes affect production behavior, each configuration mutation
should be traceable to an actor and timestamp.

## 4. Types of Feature Flags

### 4.1 Release flags

Release flags control exposure of new features. They are usually short-lived:

```text
off -> internal users -> beta users -> percentage rollout -> fully on -> remove
```

### 4.2 Experiment flags

Experiment flags compare treatments, such as A/B tests. They require stable
bucketing and analytics. This MVP does not implement full experimentation, but
its deterministic percentage rollout is a foundation for that future work.

### 4.3 Ops and kill-switch flags

Ops flags provide operational safety. A kill switch should override all
targeting rules and force the feature off.

This project tests that `killSwitch=true` returns:

```text
enabled=false
reason=KILL_SWITCH
```

before allowlist, role, or percentage rules can enable the feature.

### 4.4 Permission flags

Permission flags gate features by role, plan, or entitlement. This project
demonstrates role-based targeting with a `beta-tester` role. Sensitive
authorization should normally be evaluated server-side, not trusted only to a
browser.

## 5. Rollout Strategies

The MVP supports these strategies.

### 5.1 Global toggle

A flag can be globally on or off for an environment. This is the simplest
release control and is useful for demos and kill-switch-like behavior.

### 5.2 User allowlist

Specific users can be enabled by stable user identifiers. This is useful for
internal testing or VIP access.

### 5.3 Role targeting

Users with selected roles can receive a feature. The demo uses a beta tester
role to show targeted release.

### 5.4 Percentage rollout

Percentage rollout exposes a feature to a stable percentage of users. This
project hashes:

```text
projectKey:flagKey:targetingKey
```

and maps the result into a bucket from `0.00` to `99.99`. This makes repeated
evaluations stable for the same context.

## 6. Evaluation Rule Order

The default MVP rule order is:

1. archived flag,
2. disabled flag configuration,
3. group kill switch,
4. flag kill switch,
5. global on,
6. user allowlist,
7. role targeting,
8. percentage rollout,
9. default off.

Safe defaults matter. If no rule matches, the feature remains off:

```text
enabled=false
reason=DEFAULT_OFF
```

If the project or flag does not exist:

```text
enabled=false
reason=NOT_FOUND
```

This avoids accidentally enabling a feature because of missing configuration.

## 7. Architecture Summary

The MVP uses one backend service but separates responsibilities internally.

| Layer | Responsibility |
| --- | --- |
| Backend API | Management endpoints, evaluation endpoint, validation, errors |
| Evaluation engine | Deterministic rule evaluation and reason codes |
| Persistence | Projects, flags, rules, environments, sample users, audit logs |
| Admin dashboard | Control-plane configuration and audit inspection |
| Demo app | Data-plane consumer that calls evaluation API |

The architecture keeps runtime evaluation simple and explicit while preserving
the auditability of configuration changes.

## 8. Data Model Summary

Core tables:

- `projects`,
- `environments`,
- `feature_flags`,
- `flag_groups`,
- `flag_group_configs`,
- `flag_environment_configs`,
- `flag_rules`,
- `sample_user_contexts`,
- `audit_log_entries`.

The model separates flag identity from environment-specific configuration so a
flag can have different behavior by environment.

Audit entries store:

- actor,
- action,
- project,
- environment,
- target,
- before snapshot,
- after snapshot,
- metadata,
- request ID,
- timestamp.

## 9. Audit Logging

Audit logging is required because flag changes can affect users immediately.

This project writes audit entries for:

- project creation/update,
- feature flag creation/update/archive/restore,
- group creation/update and environment-specific kill-switch changes,
- flag group assignment and unassignment,
- rule replacement,
- sample user changes.

Audit logs are append-only from the API perspective. The public API exposes
read/query behavior, but no update or delete behavior for audit entries.

Same-transaction behavior is important: a configuration mutation and its audit
entry should succeed or fail together. The integration tests include rollback
evidence for this behavior.

## 10. Caching, Consistency, and Defaults

### 10.1 Caching

The implementation caches reusable evaluation configuration snapshots rather
than final user-specific decisions. A snapshot contains flag lifecycle state,
environment configuration, optional group kill-switch state, and ordered rules.
It does not contain user IDs, targeting keys, roles, attributes, or final
`enabled` decisions.

This design improves repeated evaluation performance while preserving
deterministic targeting for each request context. Cache misses load the
snapshot from PostgreSQL, while cache hits still run the evaluation engine with
the current request context.

### 10.2 Consistency

Configuration mutations explicitly invalidate affected snapshots only after
their database and append-only audit transaction commits. A configurable
30-second TTL provides a secondary stale-data bound. Cache failures fall back
to PostgreSQL and do not change fail-closed evaluation behavior.

The process-local provider is intentionally appropriate for this
single-instance mini project. A horizontally scaled deployment would require a
shared provider such as Redis with equivalent TTL and invalidation semantics.

### 10.3 Aggregate Evaluation Statistics

Operational teams need to understand whether features are being evaluated On
or Off and why. The implementation records aggregate counts by flag,
environment, UTC-hour bucket, reason, and enabled result.

The system intentionally avoids storing one raw event per evaluation. It also
excludes targeting keys, user IDs, roles, attributes, and matched rule IDs.
This provides release visibility without turning feature evaluation into a
user-tracking system.

Every valid evaluation request produces one best-effort increment, including
requests served from the snapshot cache. Metric persistence failure does not
alter the evaluation response. This demonstrates a system-design tradeoff:
runtime release decisions prioritize availability, while statistics accept
eventual consistency and possible telemetry loss.

### 10.4 Defaults

Defaults should be safe:

- missing flag -> off,
- evaluation error -> off,
- no matching rule -> off,
- kill switch -> off.

## 11. Endpoint Security

Important security practices:

- validate request bodies and keys,
- keep browser configuration free of secrets,
- avoid PII in targeting keys,
- fail closed on errors,
- restrict CORS to expected admin and demo origins,
- require actor identity for audited mutations,
- keep control-plane and data-plane responsibilities separate.

The demo app only calls:

```text
POST /v1/evaluate
```

It does not send admin actor headers or secrets.

## 12. Comparison with Existing Solutions

| Solution | Strengths | Difference from this MVP |
| --- | --- | --- |
| LaunchDarkly | Mature enterprise progressive delivery, SDKs, governance | This MVP is smaller, local, educational, and avoids enterprise complexity. |
| Unleash | Open-source, strong rollout strategy model, SDK evaluation | This MVP borrows explainable rules but keeps setup simpler. |
| Flagsmith | Open-source, remote config, flexible deployment | This MVP focuses narrowly on core flag evaluation and auditability. |
| ConfigCat | Simple developer experience and hosted feature flags | This MVP emphasizes learning, architecture, and local implementation. |
| Split | Experimentation and analytics-oriented feature management | This MVP does not implement experiment analytics; it demonstrates rollout foundations. |

The mini project is valuable because it shows the system thinking behind these
tools instead of hiding the behavior behind a hosted product.

## 13. Technology Choices and Alternatives

| Choice | Why chosen | Alternative | Why not the alternative |
| --- | --- | --- | --- |
| NestJS | Structured modules, DTO validation, good API organization | Express | Simpler but less opinionated for a multi-module API |
| Prisma | Typed data access and migrations | Raw SQL | More boilerplate for CRUD-heavy MVP |
| PostgreSQL | Persistent relational model and audit history | In-memory store | Cannot prove persistence or audit requirements |
| React/Vite | Fast dashboard/demo development | Server-rendered UI | Less suitable for interactive demo app |
| Jest/Supertest | Unit, integration, and E2E confidence | Manual-only testing | Not enough evidence for release readiness |

## 14. Practical Value and Novelty

The practical value is safe release control:

- turn features on/off without redeploy,
- target beta users,
- roll out gradually,
- roll back quickly,
- inspect who changed configuration.

The novelty for this mini project is the combination of:

- deterministic evaluation,
- visible reason codes,
- append-only audit logs,
- control-plane/data-plane separation,
- privacy-preserving aggregate evaluation statistics,
- presentation scenarios that show different runtime outcomes.

## 15. Limitations and Future Work

Completed recommended enhancements:

- audit-backed configuration history,
- group kill switch,
- in-memory evaluation-snapshot cache,
- privacy-preserving evaluation statistics dashboard,
- simple JavaScript SDK with typed fail-closed client fallback.

Remaining recommended and future work:

- optional Redis provider for multi-instance cache consistency,
- role-based access control,
- Docker Compose one-command setup,
- durable metric delivery and retention,
- advanced experimentation analytics,
- flag lifecycle cleanup workflow.

Remaining work is sequenced behind the stable MVP and completed recommended
phases so it cannot weaken submission readiness.

## 16. Conclusion

Feature flags are a practical mechanism for safer software delivery. They
separate deployment from release, support targeted rollout, enable fast
rollback, and create an audit trail for runtime-impacting decisions.

This mini project demonstrates the core behavior of a feature flag platform in
a compact, testable, and explainable form. It is ready to support a presentation
focused on problem-solving, design thinking, and system thinking.

## References

- `docs/research/feature-flags.md`
- `docs/research/rollout-strategies.md`
- `docs/research/kill-switch-fast-rollback.md`
- `docs/research/audit-log-configuration-changes.md`
- `docs/research/feature-flag-key-considerations.md`
- `docs/research/simple-api-design.md`
- `docs/competitor-analysis/launchdarkly.md`
- `docs/competitor-analysis/unleash.md`
- `docs/competitor-analysis/flagsmith.md`
- `docs/competitor-analysis/configcat.md`
- `docs/competitor-analysis/split.io.md`
