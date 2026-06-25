---
name: docker-compose-delivery
description: Implement or validate the recommended Docker Compose workflow for PostgreSQL, backend, admin, demo, migrations, seed, and optional Redis. Use for Dockerfiles, health checks, dependency ordering, CORS/API URLs, idempotent initialization, profiles, secrets, and clean-environment startup tests.
---

# Docker Compose Delivery

## Workflow

1. Read Phases 17–19 and Gate C in
   `docs/plan/recommended-enhancements-roadmap.md`.
2. Build a baseline for PostgreSQL, backend, admin, and demo while preserving
   the normal npm-local workflow.
3. Add health checks and correct dependency ordering.
4. Configure browser API URLs for the current Vite setup and backend CORS for
   admin and demo origins.
5. Add one-shot migration and idempotent demo-seed services before claiming a
   one-command demo workflow.
6. Keep seed reruns non-destructive.
7. Add Redis only after Gate C. Match memory-provider TTL/invalidation behavior
   and fall back safely when Redis is unavailable.
8. Keep secrets in environment inputs with safe examples, not committed image
   layers, frontend bundles, Compose values, or logs.
9. Validate from a clean environment, service health, migration/seed ordering,
   app connectivity, restart behavior, and the documented demo command.

## Release checklist

- PostgreSQL becomes healthy before migration.
- Migration and seed complete before backend readiness.
- Admin and demo reach the backend using container-correct URLs.
- Optional Redis failure does not break evaluation.
- README and troubleshooting docs distinguish baseline from final workflow.

## Sources

- `docs/plan/recommended-enhancements-roadmap.md`
- `README.md`
- `.env.example`
- `docs/release/troubleshooting.md`
- `docs/release/security-review.md`
