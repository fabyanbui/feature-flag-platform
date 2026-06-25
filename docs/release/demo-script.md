# Demo Script — Feature Flag Platform

## Purpose

Use this script for the July 9, 2026 presentation. The goal is to show that the
platform separates deployment from release, supports safe rollout decisions, and
keeps configuration changes auditable.

## Pre-Demo Setup

From the repository root:

```bash
npm install
cp .env.example .env
docker start ffp-postgres
npm run prisma:migrate --workspace=@ffp/backend
npm run db:seed --workspace=@ffp/backend
```

Start the apps in separate terminals:

```bash
npm run dev:backend
npm run dev:admin
npm run dev:demo
```

Open:

```text
Backend Swagger: http://localhost:3000/docs
Admin app:       http://localhost:5173
Demo app:        http://localhost:5174
```

## Main Story

> We deployed one application, but we can release features gradually through
> configuration instead of redeploying code.

The demo has two planes:

- **Control plane:** admin dashboard and management APIs.
- **Data plane:** demo app calling `POST /v1/evaluate`.

## Demo Flow

### 1. Show the project and flags

Open the admin dashboard.

Show:

- project `demo-project`,
- group `customer-experience`,
- flag `beta-dashboard`,
- flag `new-checkout`.

Explain:

- both demo flags belong to one operational rollback group,
- `beta-dashboard` demonstrates global serving.
- `new-checkout` demonstrates role targeting and percentage rollout.

### 2. Show Global Toggle

Open the demo app and select:

```text
Global Toggle
```

Click **Evaluate flag**.

Expected result with seed data:

```text
projectKey: demo-project
flagKey: beta-dashboard
enabled: true
reason: GLOBAL_ON
runtime state: On
```

Presenter point:

> This shows a release decision made by configuration. The code is already
> deployed; the feature becomes visible because the flag evaluates to On.

Optional live change:

1. In admin, update `beta-dashboard` to disabled or enable kill switch.
2. Return to demo app.
3. Click **Evaluate flag** again.

Expected result:

```text
enabled: false
reason: FLAG_DISABLED or KILL_SWITCH
runtime state: Off
```

Presenter point:

> This is the single-flag rollback story. We can turn off risky behavior
> without a redeploy.

### 3. Show Group Kill Switch

Return to the admin dashboard and open **Groups**.

For group `customer-experience` in `production`, show:

- two assigned flags,
- lifecycle status remains `Enabled` for both flags,
- group kill switch starts `Inactive`.

Activate the group kill switch and accept the confirmation. Evaluate
`beta-dashboard` and `new-checkout` again.

Expected result for both assigned flags:

```text
enabled: false
reason: GROUP_KILL_SWITCH
runtime state: Off
```

Explain:

- the group switch has higher precedence than per-flag serving and rules,
- lifecycle status is unchanged because runtime state and flag status are
  separate concepts,
- one group audit entry records the group mutation; the system does not claim
  that every member flag was individually edited.

Deactivate the group switch before continuing. Re-evaluate `beta-dashboard` and
confirm normal evaluation returns:

```text
enabled: true
reason: GLOBAL_ON
runtime state: On
```

Presenter point:

> This is the operational rollback story. One confirmed control-plane change
> safely disables a related set of features, while preserving each flag's
> configuration for fast restoration.

### 4. Show Role Targeting

Select:

```text
Role Targeting — Beta Tester
```

Expected result:

```text
projectKey: demo-project
flagKey: new-checkout
enabled: true
reason: ROLE_MATCH
runtime state: On
```

Presenter point:

> Only users with the beta-tester role see this feature. This supports internal
> testing or limited beta release.

### 5. Show Percentage Rollout

Select:

```text
Percentage Rollout — Included User
```

Expected result:

```text
enabled: true
reason: PERCENTAGE_ROLLOUT
```

Then select:

```text
Percentage Rollout — Excluded User
```

Expected result:

```text
enabled: false
reason: DEFAULT_OFF
```

Presenter point:

> Percentage rollout uses stable hashing. The same user context gets the same
> result on repeated evaluations, so the user experience is stable.

### 6. Show Safe Fallback

Select:

```text
Missing Project / Flag
```

Expected result:

```text
projectKey: missing-project
flagKey: missing-flag
enabled: false
reason: NOT_FOUND
runtime state: Off
```

Presenter point:

> The evaluation API fails closed. Missing configuration does not accidentally
> expose a feature.

### 7. Show Flag Configuration History

Return to the admin dashboard and open the rule editor for `new-checkout`.

Show the **Configuration history** panel and point out:

- the actor who made the change,
- the action and timestamp,
- the environment,
- the request ID,
- the concise change summary,
- the expandable before and after snapshots.

Optionally change a targeting rule and select **Save rules**. The history panel
should refresh and show a new `FLAG_RULES_REPLACED` entry.

Presenter point:

> Configuration history is built from the same append-only audit records used
> for accountability. We avoid duplicating configuration versions in a second
> table, which keeps one source of truth and reduces consistency risk.

### 8. Show Audit Logs

Return to the admin dashboard audit log screen.

Show entries for:

- project creation,
- flag creation,
- group creation and assignment,
- group kill-switch activation and deactivation,
- flag update,
- rule replacement.

Presenter point:

> The focused history panel answers what changed for one flag, while the
> project-wide audit screen supports broader operational investigation. Both
> views use the same immutable audit records.

### 9. Show Evaluation Statistics

Before opening the statistics page, evaluate `beta-dashboard` several times in
the demo app.

Produce both outcomes:

1. evaluate while normal global serving is active,
2. activate the flag or group kill switch,
3. evaluate again,
4. deactivate the switch before continuing.

Open **Statistics** in the admin dashboard and refresh.

Show:

- total evaluation requests,
- On outcomes,
- Off outcomes,
- On percentage,
- counts per flag,
- reasons such as `GLOBAL_ON`, `KILL_SWITCH`, or `GROUP_KILL_SWITCH`.

Presenter point:

> Cache hits still count because the platform measures evaluation requests, not
> database snapshot loads. Statistics are aggregated by hour and outcome, so we
> gain operational visibility without storing user context.

Explain failure isolation:

> Statistics are observability, not part of the release decision. If metric
> persistence fails, evaluation still returns the same deterministic result.
> We prefer incomplete telemetry over making feature delivery unavailable.

Privacy point:

> The dashboard shows aggregate evaluation activity, not unique users. The
> metrics table does not contain targeting keys, user IDs, roles, attributes, or
> raw evaluation requests.

## Required Talking Points

### Project need

Feature flags reduce release risk by separating code deployment from user
release. Teams can ship code safely, validate with targeted users, roll out
gradually, and roll back quickly.

### Practical value

The platform demonstrates common production release-management practices:

- global enable/disable,
- role-based targeting,
- percentage rollout,
- per-flag and group kill switches,
- safe default off behavior,
- audit logs,
- privacy-preserving evaluation statistics.

### Novelty for this mini project

The project is intentionally small but system-oriented. It shows not only CRUD
screens, but also deterministic evaluation, control-plane/data-plane
separation, auditability, and presentation-ready release scenarios.

### Technology choices

- NestJS for structured backend modules and DTO validation.
- Prisma for typed database access and migrations.
- PostgreSQL for persistent relational data and audit history.
- React/Vite for admin and demo apps.
- Jest/Supertest for unit, integration, and E2E test evidence.

### Alternatives

- Express was simpler but less structured than NestJS.
- In-memory storage was faster to start but could not prove persistence or audit
  history.
- No-code flag tools are mature but would not demonstrate system design.

### Comparison with existing solutions

Compared with LaunchDarkly, Unleash, Flagsmith, ConfigCat, and Split, this MVP
is smaller and educational. It borrows the core ideas: management UI, targeting,
rollout, kill switch, evaluation API, and audit logs. It intentionally avoids
enterprise complexity such as full RBAC, streaming SDKs, advanced
experimentation analytics, and multi-region operations.

## If Something Fails During Demo

Use `docs/release/troubleshooting.md`.

Most common fixes:

```bash
docker start ffp-postgres
npm run prisma:migrate --workspace=@ffp/backend
npm run db:seed --workspace=@ffp/backend
npm run dev:backend
```
