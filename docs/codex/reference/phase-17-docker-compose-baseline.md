# Phase 17 Docker Compose Baseline — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a
reference, not a transcript.

## Scope

The session implemented and validated Phase 17 from
`docs/plan/recommended-enhancements-roadmap.md`: a Docker Compose baseline for
PostgreSQL, the NestJS backend, the admin dashboard, and the demo app.

The user had already completed the MVP path in
`docs/plan/implementation-roadmap.md` and recommended phases 10 through 16.
The work preserved Phase 17's explicit boundary: do not add Redis yet, and do
not claim a final one-command demo workflow until Phase 19 automates migration
and seed ordering.

After Phase 17 completion, the same conversation reviewed whether Phase 18 was
safe to start. The answer was yes, but only after recording Gate C completion
evidence first.

## High-signal outcomes

- Added a Compose baseline with `postgres`, `backend`, `admin`, and `demo`
  services.
- Added health checks and dependency ordering so PostgreSQL becomes healthy
  before backend startup, and frontend containers wait for backend health.
- Added Dockerfiles for the backend, admin app, and demo app.
- Preserved the normal npm-local workflow alongside containerized startup.
- Documented the distinction between:
  - Phase 17 baseline Compose workflow with manual migration and seed commands,
  - Phase 19 final stabilized workflow with clean-environment automation.
- Confirmed browser-facing frontend API URLs must use `localhost`, not the
  Docker-internal `backend` service hostname.
- Confirmed backend container database access must use the Compose service name
  for PostgreSQL.
- Fixed the backend production entrypoint to the actual Nest build output path.
- Fixed Docker build ordering so workspace lifecycle scripts can build the
  JavaScript SDK when needed.
- Installed OpenSSL in backend image stages so Prisma works correctly in slim
  Node images.
- Validated Phase 17 end to end with builds, tests, Compose startup,
  migrations, seeding, CORS, health checks, frontend bundle checks, restart
  behavior, and cleanup.

## Files and artifacts

Created:

- `.dockerignore`
- `docker-compose.yml`
- `apps/backend/Dockerfile`
- `apps/admin/Dockerfile`
- `apps/demo/Dockerfile`

Modified:

- `.env.example`
- `README.md`
- `apps/backend/package.json`
- `docs/plan/recommended-enhancements-roadmap.md`
- `docs/release/troubleshooting.md`

Authoritative docs and guardrails referenced:

- `AGENTS.md`
- `docs/plan/implementation-roadmap.md`
- `docs/plan/recommended-enhancements-roadmap.md`
- `docs/requirement/requirement-init.md`
- `docs/requirement/info-init.md`
- `docs/plan/project-goal.md`
- `.agents/skills/docker-compose-delivery/SKILL.md`
- `.agents/skills/workflow-quality-review/SKILL.md`

## Decisions and guardrails

- Redis remains out of Phase 17.
- Phase 18 Redis work must remain optional and must not become a ninth
  recommended requirement.
- The default cache provider should remain in-memory unless Phase 18 explicitly
  adds and validates an optional Redis provider.
- Phase 18 should not begin until Gate C is recorded as passed in
  `docs/plan/recommended-enhancements-roadmap.md`.
- Compose frontend builds should embed browser-resolvable API URLs.
- Compose backend runtime configuration should use container-internal service
  discovery for PostgreSQL.
- Migration and seed remain manual in Phase 17 docs; do not market Phase 17 as
  a one-command startup flow.
- Preserve deterministic evaluation, stable non-PII rollout keys, safe
  defaults, append-only audit logging, and control-plane/data-plane separation.
- Do not expose secrets, committed tokens, or private connection strings in docs
  or summaries.

## Validation and caveats

Phase 17 validation completed successfully:

- `docker compose config --quiet`
- `git diff --check`
- `npm run build`
- `npm run lint`
- `npm run test`
- backend integration tests
- backend E2E tests
- default Compose image build
- isolated Compose stack startup
- clean Compose database migration deployment
- repeatable seed execution
- backend health endpoint smoke check
- admin and demo HTTP smoke checks
- CORS preflight checks for admin and demo origins
- seeded evaluation through the containerized backend
- frontend bundle checks for browser-facing API URL correctness
- authenticated control-plane smoke check using configured demo identity
- container restart and health recovery check
- isolated validation container and volume cleanup

Known caveats:

- Markdown linting was not available during the Phase 17 validation run.
- Existing PostgreSQL-related deprecation warnings appeared during DB-backed
  test runs but did not fail validation.
- Phase 17 intentionally does not automate migrations and seeding as part of a
  final one-command workflow; that belongs to Phase 19.

Gate C readiness review:

- Current repo evidence supports moving to Phase 18 after adding explicit Gate C
  completion evidence.
- Gate C evidence should state that phases 10 through 17 are complete, full
  tests pass, the Docker baseline works, no unfinished migrations remain, and
  the in-memory cache behavior is stable.

## Best reusable next prompt

Use `workflow-quality-review`, `evaluation-runtime-reliability`, and
`docker-compose-delivery` as needed. First add explicit Gate C completion
evidence to `docs/plan/recommended-enhancements-roadmap.md`. Then implement
Phase 18 as an optional Redis cache provider without changing the in-memory
cache default. Keep TTL and invalidation semantics identical across providers,
make Redis outage fall back to repository/no-cache behavior, update docs, and
run unit, integration, E2E, build, lint, diff, and Compose validation.

## Source notes

Source: current Codex conversation visible in context. The durable repository
evidence is in `docs/plan/recommended-enhancements-roadmap.md`, `README.md`,
`docs/release/troubleshooting.md`, the Compose file, and the Dockerfiles.
