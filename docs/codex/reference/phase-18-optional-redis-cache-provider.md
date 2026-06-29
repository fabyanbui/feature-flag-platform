# Phase 18 Optional Redis Cache Provider — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a reference, not a transcript.

## Scope

This session implemented and validated Phase 18 from
`docs/plan/recommended-enhancements-roadmap.md`: an optional Redis-backed
evaluation snapshot cache provider after Gate C. The work preserved the
completed MVP and Phases 10–17 as the protected baseline, kept the existing
evaluation API contract unchanged, and prepared the repo to move into Phase 19
Docker Compose stabilization.

The implementation used these repo guardrails:

- cache reusable `EvaluationSnapshot` configuration, not final decisions,
- keep evaluation deterministic and fail closed,
- store no user IDs, targeting keys, roles, attributes, raw context, or final
  decisions in cache keys/values,
- preserve repository/no-cache fallback when cache operations fail,
- keep Redis optional and not a ninth recommended requirement,
- keep the Phase 17 baseline Compose stack independent of Redis.

## High-signal outcomes

- Added provider selection with `EVALUATION_CACHE_PROVIDER=memory|none|redis`.
- Kept `memory` as the default provider to preserve Phase 13 behavior.
- Added a `none` provider for disabled-cache validation; it always misses and
  makes writes/invalidation no-ops.
- Added a Redis provider behind the existing `EvaluationSnapshotCache`
  abstraction.
- Redis provider uses the existing cache key contract:

  ```text
  evaluation-snapshot:{projectKey}:{environmentScope}:{flagKey}
  ```

- Redis provider uses the same TTL fallback as the in-memory provider:
  `EVALUATION_CACHE_TTL_MS`, defaulting to 30 seconds.
- Redis invalidation preserves the in-memory provider semantics:
  environment-scoped invalidation deletes the selected environment and the
  default alias; omitted environment invalidates all environment scopes for the
  flag.
- Redis client is lazy, uses a short connection timeout, disables offline queue,
  and disables reconnect strategy so cache failures surface quickly to the
  existing repository fallback path.
- Added an optional `redis` Docker Compose profile with health check.
- Updated release/security/design/README documentation and Phase 18 completion
  evidence.
- Answered that it is OK to proceed to Phase 19 once Phase 18 changes are kept
  clean/committed.

## Files and artifacts

Created:

- `apps/backend/src/evaluation/cache/noop-evaluation-snapshot-cache.ts`
- `apps/backend/src/evaluation/cache/noop-evaluation-snapshot-cache.spec.ts`
- `apps/backend/src/evaluation/cache/redis-evaluation-snapshot-cache.ts`
- `apps/backend/src/evaluation/cache/redis-evaluation-snapshot-cache.spec.ts`
- `docs/codex/reference/phase-18-optional-redis-cache-provider.md`

Edited:

- `apps/backend/src/evaluation/cache/evaluation-cache.module.ts`
- `apps/backend/src/evaluation/cache/evaluation-cache.module.spec.ts`
- `apps/backend/package.json`
- `package-lock.json`
- `.env.example`
- `docker-compose.yml`
- `README.md`
- `docs/design/software-architecture-document.md`
- `docs/plan/recommended-enhancements-roadmap.md`
- `docs/release/security-review.md`

Key implementation artifacts:

- `EvaluationCacheModule` now resolves `EVALUATION_CACHE_PROVIDER` and returns
  `InMemoryEvaluationSnapshotCache`, `NoopEvaluationSnapshotCache`, or
  `RedisEvaluationSnapshotCache` through the existing
  `EVALUATION_SNAPSHOT_CACHE` token.
- `RedisEvaluationSnapshotCache` imports `createClient` from `redis`, uses
  `PX` TTL writes, `SCAN`/`scanIterator` for wildcard invalidation, and deletes
  invalid JSON entries as misses.
- `docker-compose.yml` adds Redis only under `profiles: [redis]`; backend gets
  `EVALUATION_CACHE_PROVIDER`, `EVALUATION_CACHE_TTL_MS`, and `REDIS_URL` but
  does not depend on Redis unconditionally.

## Decisions and guardrails

- Do not change `POST /v1/evaluate` request/response shape for Phase 18.
- Do not cache `NOT_FOUND`, validation failures, evaluation errors, or final
  per-request decisions.
- Do not include request context or PII in cache keys, Redis values, logs, or
  metrics.
- Redis outage is a cache failure, not an evaluation failure; evaluation falls
  back to repository/no-cache behavior.
- Invalidation failure after a successful mutation remains non-fatal and is
  logged, preserving the existing control-plane transaction semantics.
- Redis remains optional; baseline `docker compose up` for PostgreSQL, backend,
  admin, and demo must still work without the Redis profile.
- If Docker Buildx is unavailable in the local environment, legacy Docker build
  mode can validate the backend image:

  ```bash
  DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 \
    POSTGRES_HOST_PORT=55432 \
    EVALUATION_CACHE_PROVIDER=redis \
    docker compose --profile redis build backend
  ```

## Validation and caveats

Validation completed during the session:

```bash
npm run test --workspace=@ffp/backend -- evaluation/cache evaluation.service.spec.ts --runInBand
npm run test --workspace=@ffp/backend -- --runInBand
npm run test --workspace=@ffp/js-sdk
npm run test
npm run build
npm run lint
npm run prisma:validate --workspace=@ffp/backend
docker compose config --quiet
git diff --check
npm run test:integration --workspace=@ffp/backend
npm run test:e2e --workspace=@ffp/backend
```

Observed results:

- focused cache/evaluation-service tests: 7 suites, 71 tests passed,
- backend unit tests: 52 suites, 401 tests passed,
- JavaScript SDK tests: 21 tests passed,
- integration tests: 11 tests passed,
- E2E tests: 44 tests passed,
- workspace build, lint, Prisma validation, Compose config, and diff checks
  passed.

Docker/Redis validation completed:

- optional Redis Compose profile started `redis:7-alpine`,
- `redis-cli ping` returned `PONG`,
- backend image rebuilt with the Redis dependency,
- Compose PostgreSQL migrations applied successfully,
- demo seed ran successfully,
- backend became healthy and `/v1/health` returned OK,
- seeded `new-checkout` evaluation returned `enabled=true` with
  `reason=ROLE_MATCH`,
- stopping Redis while backend ran with `EVALUATION_CACHE_PROVIDER=redis` still
  returned the same successful evaluation through repository fallback and logged
  cache warnings without exposing Redis URLs or evaluation context.

Caveats:

- Docker Buildx plugin was missing in the local environment, so backend image
  validation used legacy Docker build mode.
- `npm install redis --workspace=@ffp/backend` reported pre-existing npm audit
  findings; no `npm audit fix` was run because it would create unrelated
  dependency changes.
- Database-backed tests emitted the existing non-failing `pg` deprecation
  warning already noted in earlier phase evidence.
- Commit Phase 18 changes before starting Phase 19 if a clean reversible history
  is desired.

## Best reusable next prompt

Continue with Phase 19 Docker Compose Stabilization. Use
`docker-compose-delivery` and `workflow-feature-delivery`. First verify Phase 18
changes are committed or at least cleanly separated. Then implement one-shot
migration and idempotent seed services, final dependency ordering, clean
startup docs, and final Compose validation. Preserve the optional Redis profile
and do not change the Redis provider unless validation exposes a real defect.

## Source notes

- Source was the current Codex conversation, not a local session log.
- Product/gate source: `docs/plan/recommended-enhancements-roadmap.md`.
- Release/security source: `docs/release/security-review.md`.
- Architecture source: `docs/design/software-architecture-document.md`.
- Compose workflow source: `docker-compose.yml` and `README.md`.
- Repo guardrails source: `AGENTS.md` and `.agents/skills/codex-session-reference/SKILL.md`.
