# Codex Context History — 2026-06-08

Purpose: compact context for future Codex sessions. Use this as an index, not a transcript.

## Read first

- Active authority: `AGENTS.md`.
- Product and deadline sources:
  - `docs/requirement/requirement-init.md`
  - `docs/requirement/info-init.md`
  - `docs/plan/project-goal.md`
- Phase/workflow references:
  - `docs/plan/implementation-roadmap.md`
  - `docs/design/mvp-api-and-contracts.md`
  - `docs/design/software-architecture-document.md`
- Durable Codex context added or used recently:
  - `docs/codex/context-map.md`
  - `docs/codex/mcp-tool-selection.md`
  - `docs/codex/reference/phase-3-backend-foundation.md`
  - `docs/codex/reference/phase-3-request-context-x-request-id-middleware-fix.md`
  - `docs/codex/reference/phase-3-audit-log-prisma-nullable-json-fix.md`
  - `docs/codex/reference/phase-3-health-endpoint-type-only-import-fix.md`

## Repo guardrails to keep

- Keep the MVP focused on required deliverables before enhancements: research report,
  backend API, admin dashboard, demo app, PostgreSQL persistence, validation,
  error handling, README run instructions, seed data, and short design docs.
- Preserve deterministic evaluation, especially stable percentage rollout hashing.
- Preserve safe defaults and fail-closed evaluation; missing project/flag returns
  `enabled=false` with `reason=NOT_FOUND` in evaluation responses.
- Preserve append-only audit logging for project/flag/rule mutations, with
  before/after snapshots written in the same transaction as the mutation.
- Keep control-plane management APIs separate from data-plane evaluation behavior.
- Use stable, non-PII rollout keys and avoid exposing secrets or connection strings.
- Keep feature flag status labels distinct from runtime On/Off state.

## What happened today

- Git history was repaired around a temporary revert:
  - A restore/revert sequence was created and then corrected.
  - Only `docs/codex/history/2026-06-07-context-index.md` was restored from
    commit `cd17c8d3afe9e084fda36883ee72e4b1391cf9fb`.
  - Durable commit from that repair: `ea4b8b7` (`docs: restore June 7 context history index`).
- Phase 3 backend foundation was completed and documented.
  - Added strict validation and shared DTO/error-response foundations.
  - Added Swagger/OpenAPI setup at `/docs` while keeping API prefix `/v1`.
  - Added request context support and fixed `X-Request-Id` propagation by using
    app-level middleware in `apps/backend/src/main.ts`.
  - Added Prisma `DatabaseModule`, `PrismaService`, and `TransactionService`.
  - Added append-only `AuditLogService.record(...)` and fixed nullable JSON writes
    by using `Prisma.DbNull` for absent `before`/`after` values.
  - Added repository skeletons for projects, flags, rules, sample users, and
    read-only audit log access.
  - Replaced scaffold output with `GET /v1/health` returning structured status.
  - Fixed Nest/TypeScript decorator metadata issue with `import type` for
    `HealthResponse`.
- Validation reported in the session:
  - `npm run build --workspace=@ffp/backend`
  - `npm run test --workspace=@ffp/backend`
  - `git diff --check`
- Reference docs created for future Codex sessions:
  - `docs/codex/reference/phase-3-backend-foundation.md`
  - `docs/codex/reference/phase-3-audit-log-prisma-nullable-json-fix.md`
  - `docs/codex/reference/phase-3-health-endpoint-type-only-import-fix.md`
- Pull requests were created from the active branches to `develop`:
  - PR #14: `docs/codebase-infra-lab` -> `develop`
  - PR #15: `feat/backend-foundation` -> `develop`
- A review subagent found a P2 documentation correctness issue in
  `docs/learning/data-model-and-migrations.md`: it says environment audit rows
  are set null on environment delete, but the migration also has an
  `audit_log_entries_no_update` trigger, so that delete can fail instead of
  updating the audit row unless the trigger or FK behavior changes.

## Current observed working tree notes

- Observed on 2026-06-09 before writing this file:
  - Branch: `develop...origin/develop`.
  - Working tree was clean.
  - `develop` included merged PR #14 and PR #15; `HEAD` was `d3a1539`.
- Backend Phase 3 files are present under:
  - `apps/backend/src/common/`
  - `apps/backend/src/database/`
  - `apps/backend/src/audit/`
  - `apps/backend/src/repositories/`
- Current `docs/codex/reference/` contains Phase 0, Phase 1, Phase 2, Phase 3,
  MCP, and setup references; use those before reading raw session logs.
- Caveat still visible in the filesystem: `docs/learning/data-model-and-migrations.md`
  line 622 documents `Environment -> AuditLogEntry | Set null`; verify and correct
  this against `apps/backend/prisma/migrations/20260605133630_init_data_model/migration.sql`.

## Best next prompt for Codex

Continue from `develop` after Phase 3 backend foundation. First read `AGENTS.md`,
`docs/plan/implementation-roadmap.md`, `docs/design/mvp-api-and-contracts.md`,
and `docs/codex/reference/phase-3-backend-foundation.md`. Then implement Phase 4:
the deterministic evaluation engine and `POST /v1/evaluate`, preserving rule order
(global disable -> user allowlist -> role targeting -> percentage rollout -> default off),
stable SHA-256 rollout hashing, safe default-off behavior, evaluation-shaped
`NOT_FOUND`, non-PII rollout keys, and tests for rule ordering, kill switches,
archived/disabled flags, missing context, deterministic hashing, and default off.
Before coding, fix or explicitly track the audited environment deletion wording in
`docs/learning/data-model-and-migrations.md` if it is still present.

## Session index, compressed

- `019ea6dc-015d-75d1-931b-19bbea941670` (`codex-tui`, repo cwd): handled the
  revert/restore repair and restored only the June 7 context index file.
- `019ea6dd-538d-7560-b16b-0952560d64e9` (`codex_vscode`, repo cwd): continued
  Phase 3 backend foundation, fixed build issues, verified build/test/diff-check,
  and created `phase-3-backend-foundation.md`.
- `019ea6ee-e9d1-7da2-bbda-c54b4a4177c7` (`codex_vscode`, repo cwd): debugged
  request ID behavior and documented the Prisma nullable JSON audit fix.
- `019ea706-57c8-7832-b1f0-2f5674aae7e6` (`codex_vscode`, repo cwd): closed the
  health endpoint/type-only import fix and created the corresponding reference.
- `019ea70f-43e4-7cd1-a501-ffa11b2ac899` (`codex-tui`, repo cwd): created PR #14
  and PR #15 from the current branches to `develop`.
- `019ea73d-ea58-79f3-b559-9df666bbaf3a` (`review` subagent, repo cwd): reviewed
  PR documentation and reported the audited environment deletion behavior issue.
