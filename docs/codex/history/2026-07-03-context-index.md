# Codex Context History — 2026-07-03

Purpose: compact context for future Codex sessions. Use this as an index, not a transcript.

## Read first

- Active authority: `AGENTS.md`.
- Product and deadline sources:
  - `docs/requirement/requirement-init.md`
  - `docs/requirement/info-init.md`
  - `docs/plan/project-goal.md`
- Submission is due July 7, 2026; presentation is July 9, 2026. Slides and the
  research report remain required final artifacts.
- `docs/plan/implementation-roadmap.md` is the completed MVP regression
  baseline.
- `docs/plan/recommended-enhancements-roadmap.md` remains the active source for
  recommended phase evidence and Gate A/B/C sequencing.
- Durable Codex context remains under `docs/codex/`, `.codex/`, and
  `.agents/skills/`.
- Read nearby history before substantial work:
  - `docs/codex/history/2026-06-30-context-index.md`
  - `docs/codex/history/2026-07-01-context-index.md`
  - `docs/codex/history/2026-07-02-context-index.md`

## Repo guardrails to keep

- Preserve deterministic evaluation, stable percentage hashing, safe defaults,
  and fail-closed `NOT_FOUND` and `ERROR` behavior.
- Authoritative evaluation precedence remains:
  `FLAG_ARCHIVED` -> `FLAG_DISABLED` -> `GROUP_KILL_SWITCH` ->
  `KILL_SWITCH` -> `GLOBAL_ON` -> ordered enabled rules -> `DEFAULT_OFF`.
- Preserve append-only audit entries and same-transaction before/after snapshots
  for control-plane mutations.
- Keep server-resolved demo RBAC authoritative; clients must not elevate roles.
- Keep control-plane management separate from data-plane evaluation and SDK
  behavior.
- Keep stable, non-PII rollout keys and do not expose secrets or connection
  strings.
- Keep Redis optional; the stable demo path must not require Redis.
- Keep `.env.example` aligned with `.env` variable shape using safe placeholders
  only.
- User explicitly said not to use Playwright MCP during the July 3 audit/demo/UI
  task; avoid it again unless the user later authorizes it.

## What happened today

- Seven July 3 session logs had `cwd` set to this repository.
- Admin Audit Logs were iterated for safety and presentation clarity:
  - an initial safer summary view was added, then rolled back at user request,
  - final current UI shows the entry detail style again, but does not show
    request ID,
  - the detail field was changed from target ID to target key,
  - target key is visible in `apps/admin/src/pages/AuditLogPage.tsx`.
- Audit request IDs were clarified and normalized:
  - `requestId` is a trace/correlation ID, not the audit row ID, actor, user, or
    security token,
  - backend request middleware generates IDs in `req_<uuid>` shape when no
    client `X-Request-Id` is supplied,
  - backend seed helper was updated so seeded audit rows use deterministic
    `req_<uuid>`-shaped values instead of labels like `seed_init`,
  - existing local `seed_%` rows could not be updated in place because the audit
    table is append-only, so the local DB was reset, migrations were re-applied,
    and seed was rerun during the session,
  - verification during the session found legacy `seed_%` request IDs count `0`.
- Demo account seed was expanded for a presentation-scale scenario:
  - `apps/demo/src/data/seed.ts` now generates 100 account records,
  - distribution is `org-alpha` 30, `org-beta` 25, `org-gamma` 20,
    `org-delta` 15, and `org-epsilon` 10,
  - each organization keeps one shop admin plus beta and regular customer counts,
  - accounts are sorted by organization and role generation order,
  - “Continue as guest” behavior was kept.
- Admin Projects page and backend project listing were changed:
  - project name/description editing UI was added,
  - project key remains immutable,
  - project search UI and backend search-query support were removed,
  - later commit `db4cba4` renamed the button text from “Open flags” to
    “Open project”.
- PR and branch workflow:
  - PR #44 was created from `chore/demo-optimization-maintenance` to `develop`,
  - repository history shows PR #44 merged the main July 3 admin/demo/audit work
    into `develop`,
  - a later branch commit `db4cba4` remains ahead of `develop` with only the
    ProjectList button-label rename.
- Context history maintenance:
  - `docs/codex/history/2026-07-01-context-index.md` was created after the user
    accidentally asked for 2027-07-01; Codex used available 2026-07-01 logs and
    noted the date correction,
  - `docs/codex/history/2026-07-02-context-index.md` was created from July 2
    repo logs,
  - later commit `7afe6e2` records both history files on `develop`.
- Sibling report repo work happened outside this repository:
  - `../VDT2026_MiniProject_report` was inspected for GitHub push readiness,
  - a LaTeX-focused `.gitignore` was recommended and later updated,
  - `main.tex` received a Vietnamese “Tóm tắt nội dung và đóng góp” chapter
    summary matching the report content,
  - `main.pdf` and `.gitignore` in that sibling repo were modified,
  - these changes are not part of this repository’s working tree.
- Validation reported during July 3 implementation sessions included:
  - `npm run lint --workspace=@ffp/admin`,
  - `npm run lint --workspace=@ffp/demo`,
  - `npm run lint --workspace=@ffp/backend`,
  - `npm run build --workspace=@ffp/admin`,
  - `npm run build --workspace=@ffp/demo`,
  - `npm run build --workspace=@ffp/backend`,
  - `npm run test --workspace=@ffp/backend -- projects.service.spec.ts audit-logs.service.spec.ts`,
  - `npm run diff:check`.

## Current observed working tree notes

- Date interpreted for this file: July 3, 2026 in Asia/Saigon, because the user
  asked on July 4, 2026 to update yesterday’s index.
- Current branch while writing this file:
  `chore/demo-optimization-maintenance`.
- Current working tree was clean before this history file was added.
- `docs/codex/history/2026-07-03-context-index.md` did not exist before this
  update.
- Current branch is one commit ahead of `develop`:
  - `db4cba4 refactor: rename Open flags button to Open project in ProjectListPage`
  - changed file: `apps/admin/src/pages/ProjectListPage.tsx`
- `develop` currently points at `7afe6e2`, which added the July 1 and July 2
  context history files after the PR #44 merge.
- Current roadmap records Phases 10 through 20 complete and Gate A/B/C passed;
  no new gated recommended phase is pending.
- Current Audit Logs UI shows Target key, not Target ID, and omits Request ID.
- Current repo status does not include the sibling report repo changes; inspect
  `../VDT2026_MiniProject_report` separately before committing or pushing the
  report.
- `markdownlint` has been absent in nearby history-index updates; still check
  availability when validating Markdown changes.

## Best next prompt for Codex

Continue from current `chore/demo-optimization-maintenance`. Read `AGENTS.md`,
`docs/codex/history/2026-07-03-context-index.md`,
`docs/codex/history/2026-07-02-context-index.md`,
`docs/plan/recommended-enhancements-roadmap.md`, `README.md`, and
`docs/release/demo-script.md`. Preserve the completed MVP and recommended
release baseline. Before merging or opening another PR, note that this branch is
one commit ahead of `develop` only for the ProjectList button-label rename. Keep
Audit Logs showing Target key and no Request ID unless the user asks otherwise.
Keep seeded audit request IDs in `req_<uuid>` shape, preserve append-only audit
logging, deterministic evaluation, stable non-PII targeting keys, server-resolved
RBAC, fail-closed SDK behavior, optional Redis, and Docker Compose delivery. If
working on the report, inspect `../VDT2026_MiniProject_report` separately and do
not mix its artifacts into this repo.

## Session index, compressed

- `03:53-04:29 ICT`: Iterated admin Audit Logs display, normalized seeded audit
  request IDs, expanded demo accounts to 100, added project editing, removed
  project search, honored “do not use Playwright MCP,” reset/reseeded the local
  DB to eliminate legacy `seed_%` request IDs, and clarified `requestId`
  semantics.
- `04:40-04:45 ICT`: Created PR #44 from
  `chore/demo-optimization-maintenance` to `develop`; PR noted `npm run
  diff:check` validation and no PR template.
- `04:46-04:56 ICT`: Created/updated July 1 and July 2 Codex context history
  indexes, including the 2026-vs-2027 date correction and validation notes.
- `23:20-23:46 ICT`: Worked in sibling report repo
  `../VDT2026_MiniProject_report`: advised what to commit, added/updated
  `.gitignore`, replaced the report summary placeholder in `main.tex`, fixed a
  LaTeX escaping issue, and left report repo changes ready for commit.
