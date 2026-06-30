# Demo Script — Feature Flag Platform

## Purpose

Use this script for the July 9, 2026 presentation. The goal is to show that the
platform separates deployment from release, supports safe rollout decisions, and
keeps configuration changes auditable.

## Pre-Demo Setup

Recommended Phase 19 Docker setup from the repository root:

```bash
npm install
cp .env.example .env
docker compose up --build -d
docker compose ps -a
curl http://localhost:3000/v1/health
```

For the safest live presentation, keep Redis disabled unless you explicitly
want to show the optional cache provider. The stable demo path is PostgreSQL,
the default evaluation snapshot cache provider, backend, admin, and demo.

Expected Compose state:

```text
postgres   healthy
migrate    exited 0
demo-seed  exited 0
backend    healthy
admin      healthy
demo       healthy
```

Open:

```text
Backend Swagger: http://localhost:3000/docs
Admin app:       http://localhost:5173
Demo app:        http://localhost:5174
```

The npm-local workflow remains available if Docker Compose is not used:

```bash
npm install
cp .env.example .env
docker start ffp-postgres
npm run prisma:migrate --workspace=@ffp/backend
npm run db:seed --workspace=@ffp/backend
npm run dev:backend
npm run dev:admin
npm run dev:demo
```

## Main Story

> We deployed one application, but we can release features gradually through
> configuration instead of redeploying code.

The demo has two planes:

- **Control plane:** admin dashboard and management APIs.
- **Data plane:** demo app calling `POST /v1/evaluate`.

Recommended live sequence:

1. Show SDK-backed evaluation in the demo app.
2. Activate and deactivate the group kill switch to prove fast rollback.
3. Show Viewer RBAC disabled controls and backend-protected mutations.
4. Show flag history, audit logs, and statistics as supporting evidence.
5. Mention optional Redis only as a completed provider/fallback enhancement,
   not as a dependency for the stable demo.

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

Open **ShopEase Checkout** and select:

```text
Standard shopper
```

Click **Refresh preview**.

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
> deployed; the optional beta dashboard panel becomes visible because the
> `beta-dashboard` flag evaluates to On. Checkout remains controlled only by
> `new-checkout`.

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
> without a redeploy. Disabling `beta-dashboard` hides only the optional panel.

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
Beta customer
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

> Only users with the beta-tester role see New One-Page Checkout. This supports
> internal testing or limited beta release while Classic Checkout remains the
> safe fallback for everyone else.

### 5. Show Percentage Rollout

In the demo app, use **Switch customer accounts** and select several regular
accounts from the staged rollout series:

```text
Customer account 01 through Customer account 12
```

With seed data, the 50% rollout is deterministic. Expected visible customer
experience:

```text
Customer accounts 02, 03, 05, 07, 09, and 11: New One-Page Checkout
Customer accounts 01, 04, 06, 08, 10, and 12: Classic Checkout
```

If you need to show the underlying feature-flag contract, expand **Show
technical feature-flag diagnostics** for the selected account. Expected
technical reasons are:

```text
New One-Page Checkout: enabled=true, reason=PERCENTAGE_ROLLOUT
Classic Checkout: enabled=false, reason=DEFAULT_OFF
```

Presenter point:

> Percentage rollout uses stable hashing over a stable non-PII account key.
> The same account gets the same result on repeated evaluations, so the user
> experience is stable. A series of accounts makes the rollout behavior visible
> better than only one included and one excluded user.

### 6. Show Safe Fallback

Select:

```text
Safe fallback preview
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

### 10. Show JavaScript SDK Integration

Return to the demo app, expand **Show technical diagnostics**, and
point out the **SDK client** and **Decision source** fields.

Explain:

- the demo no longer constructs evaluation HTTP requests directly,
- `@ffp/js-sdk` exposes `evaluate`, `isEnabled`, and `getVariant`,
- it calls only the data-plane `POST /v1/evaluate` endpoint,
- it validates response shape and keeps `targetingKey` separate from optional
  `userId`,
- it contains no management APIs, actor headers, or secrets.

Optional failure demonstration:

1. Stop the backend.
2. Retry the selected scenario.
3. Show `enabled=false`, `variant=off`, `reason=ERROR`,
   `errorSource=CLIENT`, and **Decision source: Client fallback**.
4. Restart the backend before continuing.

Presenter point:

> The SDK reduces integration mistakes while preserving the backend contract.
> Transport failures fail closed locally and remain distinguishable from a
> backend evaluation decision.

### 11. Show Server-Resolved Demo RBAC

1. Open the admin dashboard and select **Viewer**.
2. Show that projects, flags, groups, history, statistics, and audit logs remain
   readable while mutation controls are disabled with role explanations.
3. Select **Developer** and show flag/rule editing plus group assignment.
4. Point out that archive/restore, project management, group management, and
   group kill switches remain disabled.
5. Select **Admin** and perform one administrator-only action.
6. Open the resulting audit entry and show the resolved `demo-admin` actor.

Presenter point:

> The selector changes provisioned demo credentials, but the browser never
> declares its own role. The backend resolves the token, checks one permission
> matrix, and supplies the trusted audit actor.

Security boundary:

> This is presentation-grade authorization, not OAuth or a production identity
> provider. The evaluation API remains public and unchanged for the SDK.

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
- privacy-preserving evaluation statistics,
- a small JavaScript SDK,
- one-command Docker Compose startup.

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
rollout, kill switch, evaluation API, audit logs, and a small client SDK. It
intentionally avoids enterprise complexity such as production identity
providers, streaming SDKs,
advanced experimentation analytics, and multi-region operations. Redis support
and Docker Compose are implemented for this project, but Redis is intentionally
optional so the stable demo remains simple.

## If Something Fails During Demo

Use `docs/release/troubleshooting.md`.

Most common Docker fixes:

```bash
docker compose ps -a
docker compose logs migrate
docker compose logs demo-seed
docker compose logs backend
docker compose up --build --force-recreate migrate demo-seed backend admin demo
```

Most common npm-local fixes:

```bash
docker start ffp-postgres
npm run prisma:migrate --workspace=@ffp/backend
npm run db:seed --workspace=@ffp/backend
npm run dev:backend
```
