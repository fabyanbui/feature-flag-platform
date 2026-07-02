# Codex Context History — 2026-07-01

Purpose: compact context for future Codex sessions. Use this as an index, not a
transcript.

## Read first

- Active authority: `AGENTS.md`.
- Product/deadline sources remain:
  - `docs/requirement/requirement-init.md`
  - `docs/requirement/info-init.md`
  - `docs/plan/project-goal.md`
- Submission is due July 7, 2026; presentation is July 9, 2026. Slides and the
  research report remain required final artifacts.
- `docs/plan/implementation-roadmap.md` is the completed MVP regression
  baseline.
- `docs/plan/recommended-enhancements-roadmap.md` is the active recommended
  phase and Gate A/B/C evidence source. Current filesystem records Phase 20 as
  complete with no later unpassed gate.
- Durable Codex context remains under `docs/codex/`, `.codex/`, and
  `.agents/skills/`.
- Useful nearby indexes and release/demo references:
  - `docs/codex/history/2026-06-30-context-index.md`
  - `docs/plan/mini-demo-app-implementation-plan.md`
  - `docs/plan/requirement-traceability-matrix.md`
  - `docs/release/demo-script.md`
  - `docs/release/final-recommended-release-review.md`
  - `docs/release/troubleshooting.md`

## Repo guardrails to keep

- Preserve deterministic evaluation, stable percentage hashing, safe defaults,
  and fail-closed `NOT_FOUND` and `ERROR` behavior.
- Authoritative evaluation precedence remains `FLAG_ARCHIVED` ->
  `FLAG_DISABLED` -> `GROUP_KILL_SWITCH` -> `KILL_SWITCH` -> `GLOBAL_ON` ->
  ordered enabled rules -> `DEFAULT_OFF`.
- Cache only reusable evaluation snapshots; never cache user-specific final
  decisions, raw context, targeting keys, roles, attributes, or matched rule IDs.
- Preserve append-only audit entries with trusted before/after snapshots in the
  same transaction as control-plane mutations.
- Keep server-resolved demo RBAC authoritative; clients must not elevate by
  spoofing actor or role headers.
- Keep management/control-plane concerns separate from runtime evaluation and
  SDK data-plane concerns.
- Use stable, non-PII identifiers for targeting and rollout keys.
- Keep feature flag lifecycle/configuration status distinct from runtime On/Off
  state.
- Keep Redis optional; the stable demo path must not require Redis.
- Keep `.env.example` aligned with `.env` variable shape using safe placeholders
  only.

## What happened today

- Fifteen local July 1 session logs were found for this repository under
  `~/.codex/sessions/2026/07/01/`.
- The requested date string in the later history-index prompt was
  `2027-07-01`, but no `~/.codex/sessions/2027/07/01/` directory exists. The
  filesystem does contain July 1, 2026 logs, so this index summarizes
  `2026-07-01`.
- Demo and data-model planning decisions were clarified:
  - use one main project, three environments, a small set of groups/flags, and
    seeded sample contexts for a focused presentation story,
  - `Environment` belongs to `Project`; flag and group runtime config is scoped
    per environment,
  - `SampleUserContext` should be backend/seeded data for repeatable scenarios,
    while the demo app can remain independent as a storefront consumer,
  - multiple seed files/profiles are feasible, but `prisma/seed.ts` should stay
    the safe entrypoint if implemented.
- Prisma Studio workflow was repeatedly fixed and documented:
  - local script should use Prisma 7 style `prisma studio --config prisma.config.ts`
    rather than unsupported `--schema`,
  - Compose gained a `prisma-studio` service under the optional `tools` profile,
  - the Compose service needed the backend working directory and direct
    `npx prisma studio --config prisma.config.ts --port 5555 --browser none`,
  - when started with the tools profile, cleanup should use
    `docker compose --profile tools down -v` if the default network remains in
    use.
- The demo app was expanded into a fuller ecommerce storefront:
  - added in-memory commerce data/service structure under `apps/demo/src`,
  - rebuilt product catalog, account switcher, cart, order summary, checkout,
    trending, recommendations, and gated storefront experiences,
  - backend seed was expanded with demo groups/features such as checkout,
    recommendations, and standalone flags,
  - the demo now evaluates multiple feature keys and shows grouped plus
    standalone experiences while preserving SDK-backed evaluation.
- Demo UI was heavily polished based on user feedback:
  - professional storefront header and account selector,
  - side-tab panel for customer account details and developer diagnostics,
  - customer-facing copy that avoids exposing feature-flag platform language,
  - improved cart header alignment and secure pill positioning,
  - professional trending insight shelf,
  - popup-style toast notifications,
  - live support moved through several placements and finally fixed so it does
    not hide behind the cart,
  - limited-offer banner moved under Experience Coverage,
  - one catalog item, `Adjustable Studio Stand`, was added and promoted into
    Trending by raising its rating to meet the existing threshold.
- Admin dashboard cleanup removed the “Demo features / Checkout and standalone
  showcase” panel from `FlagListPage`, including related demo-only state, extra
  `listFlags` request, and unused CSS.
- Demo account identity fields were refined:
  - `organizationId` was added to all demo customer accounts,
  - account details now display Organization ID instead of Targeting ID,
  - `targetingId` remains internal for deterministic rollout hashing,
  - SDK context attributes now include `organizationId`.
- Evaluation request semantics were clarified:
  - `attributes` is an optional `context.attributes` key/value object and is not
    currently used by rule evaluation,
  - `userId` supports exact user allowlist matching,
  - `targetingKey` supports deterministic percentage rollout and should remain
    stable and non-PII,
  - `userId` and `targetingKey` are intentionally distinct even if demo-safe
    sample values sometimes look similar.
- Git/PR work observed in logs:
  - PR #42 was created from `feat/mini-checkout-demo-app` to `develop`,
  - PR #43 was later created to `develop`, with a warning that some local files
    were not included at that moment,
  - branch-name suggestions included `chore/demo-optimization-maintenance` for
    demo maintenance/polish work.
- Validation reported throughout the logs included repeated successful runs of:
  - `npm run build --workspace=@ffp/demo`
  - `npm run lint --workspace=@ffp/demo`
  - `npm run build --workspace=@ffp/admin`
  - `docker compose config --quiet`
  - `git diff --check`
- User explicitly said “Don't use playwright!” in demo UI sessions. Later UI
  validation for those changes used code review plus lint/build/diff, not
  browser automation.

## Current observed working tree notes

- This file was written from current branch `develop`.
- Current working tree was clean before this history index file was created.
- Latest observed HEAD while writing: `785504f` on `develop`, with
  `origin/develop` at the same commit.
- Current filesystem already includes later committed work beyond the July 1
  session logs, including project/flag soft-delete, audit-log filters, fixed
  flag table/search optimization, quick stats/audit ranges, seed actor updates,
  and project editing commits. Trust current files over older session summaries.
- `docs/codex/history/2026-07-01-context-index.md` did not exist before this
  update. `docs/codex/history/2027-07-01-context-index.md` also does not exist.
- No live database or MCP inspection was needed; repository files and local
  session logs were sufficient.
- `markdownlint` availability should still be checked per history-index update;
  nearby updates found it missing locally.

## Best next prompt for Codex

Continue from current `develop`. Read `AGENTS.md`,
`docs/codex/history/2026-07-01-context-index.md`,
`docs/codex/history/2026-06-30-context-index.md`,
`docs/plan/recommended-enhancements-roadmap.md`,
`docs/plan/requirement-traceability-matrix.md`,
`docs/release/demo-script.md`, and
`docs/release/final-recommended-release-review.md`. Preserve the completed MVP
and Phase 20 recommended-release posture. Before changing demo, admin, seed, or
Docker/Prisma Studio behavior, inspect current files because July 1 logs include
many UI iterations and some PR timing notes that may be older than current
`develop`. Keep deterministic evaluation, stable non-PII rollout keys,
append-only audit logging, server-resolved demo RBAC, fail-closed SDK behavior,
optional Redis, and Docker Compose delivery intact. Use small reversible
increments and run relevant npm, Compose config, and diff checks.

## Session index, compressed

- `00:05 ICT`: Demo/data-model Q&A: scenario count, project/flag/group/env
  setup, schema overview, sample user context ownership, seed profile approach,
  and host-vs-container npm workflow.
- `00:39 ICT`: Local and Docker Prisma Studio setup; fixed Prisma 7 script and
  Compose command shape for Studio on `localhost:5555`.
- `01:53 ICT`: Demo app updated to evaluate both `beta-dashboard` and
  `new-checkout`, add a Beta Account Dashboard panel, and show multi-flag
  diagnostics.
- `02:54 ICT`: PR #42 created from `feat/mini-checkout-demo-app` to `develop`.
- `02:59 ICT`: Discussed independent demo app data, fuller ecommerce demo app
  direction, and branch naming.
- `03:10 ICT`: Major demo-app expansion and UI rebuild: ecommerce data layer,
  storefront header, grouped checkout/recommendation/standalone features,
  feature matrix, and branch-name guidance.
- `16:50 ICT`: PR #43 created to `develop`; logs noted some local demo/seed
  changes were not included at that instant.
- `17:01 ICT`: Updated June 30 history index, then moved customer details and
  developer diagnostics into a side-tab panel without Playwright.
- `17:03 ICT`: Suggested branch name `chore/demo-optimization-maintenance`.
- `17:34 ICT`: Removed customer-facing feature-flag/platform wording and refined
  cart header/secure-pill layout.
- `17:56 ICT`: Fixed Prisma Studio Compose access and documented tools-profile
  cleanup for lingering Docker networks.
- `19:07 ICT`: Polished Trending, toast popups, Live Support placement, product
  catalog, Limited Offer placement, and third Trending item.
- `19:30 ICT`: Removed the demo-feature showcase panel from the admin flag list
  page and validated admin build/diff.
- `23:11 ICT`: Clarified that evaluation `attributes` is optional key/value
  context and currently unused by rules.
- `23:31 ICT`: Added `organizationId` to demo accounts and explained why
  `userId` and `targetingKey` remain separate evaluation fields.
