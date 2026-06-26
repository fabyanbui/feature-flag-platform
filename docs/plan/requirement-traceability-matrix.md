# Requirement Traceability Matrix

## Purpose

This matrix maps the required MVP deliverables and completed recommended
enhancements to implementation evidence, tests, documentation, and presentation
demo scenarios. It is the Phase 20 release-review source for proving that the
completed MVP baseline remains intact while recommended phases add value without
changing safe evaluation behavior.

## MVP Traceability

| Requirement | Implementation evidence | Tests / validation | Documentation | Demo scenario | Status |
| --- | --- | --- | --- | --- | --- |
| Research report explaining feature flags, rollout, kill switches, audit, caching, consistency, defaults, and endpoint security | `docs/research/feature-flag-platform-research-report.md` plus supporting research files in `docs/research/` and `docs/competitor-analysis/` | Documentation review and Phase 20 markdown/whitespace checks | Research report, slide outline, architecture document | Presenter explains deployment vs release, rollout strategies, and tradeoffs | Complete |
| Project management API | `apps/backend/src/projects/*`, Prisma `Project` model, `/v1/projects` | Backend unit, integration, and E2E suites | `docs/design/mvp-api-and-contracts.md`, `docs/design/software-architecture-document.md` | Admin opens seeded `demo-project` | Complete |
| Feature flag CRUD API | `apps/backend/src/feature-flags/*`, Prisma `FeatureFlag` and environment config models | Backend unit, integration, and E2E suites | API contracts, architecture document | Admin views `new-checkout` and `beta-dashboard` | Complete |
| Rule configuration API | `apps/backend/src/flag-rules/*`, evaluation rule models | Rule evaluation unit tests, management E2E tests | API contracts, data-plane learning docs | Presenter edits or reviews global, role, allowlist, and percentage rules | Complete |
| Evaluation API | `apps/backend/src/evaluation/*`, `POST /v1/evaluate` | Evaluation unit tests, integration tests, demo-flow E2E tests | API contracts, architecture, README | Demo app evaluates seeded flags | Complete |
| Audit log API | `apps/backend/src/audit/*`, `apps/backend/src/audit-logs/*`, Prisma `AuditLogEntry` | Management and audit E2E tests | Audit release review, API contracts, security review | Admin shows before/after audit entry after a mutation | Complete |
| Frontend dashboard | `apps/admin/src/pages/*`, `apps/admin/src/components/*` | Admin build, lint, and browser/manual release checks | README, demo script, slide outline | Project, flag, rule, group, history, audit, and statistics screens | Complete |
| Demo application | `apps/demo/src/*`, `packages/js-sdk/*` | Demo build, SDK tests, backend demo-flow E2E tests | README, demo requirements, demo script | Demo app shows feature On/Off from evaluation result | Complete |
| Persistent storage | `apps/backend/prisma/schema.prisma`, committed migrations | Prisma validation, migration, integration, and E2E suites | Architecture, data model docs | Seed data persists across app restarts and Compose restarts | Complete |
| Input validation and error handling | DTOs, validation pipe, global exception filter | API hardening E2E tests and unit tests | API contracts, README | Invalid or missing inputs return structured safe errors | Complete |
| Seed data | `apps/backend/prisma/seed.ts` | Seed rerun validation and Docker `demo-seed` validation | README and demo script | Seeded project, flags, group, sample users, and audit entries | Complete |
| Setup and run instructions | Root `README.md`, `.env.example`, Dockerfiles, Compose file | Phase 20 validation sequence and Compose smoke test | README and troubleshooting guide | Reviewer can start local npm workflow or Docker workflow | Complete |
| Short design documentation | `docs/design/software-architecture-document.md`, `docs/design/mvp-api-and-contracts.md` | Documentation review | Design docs | Presenter explains architecture and system boundaries | Complete |

## Recommended Enhancement Traceability

| Recommended requirement | Phase | Implementation evidence | Tests / validation | Documentation | Safe demo scenario | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Unit tests for rule evaluation and precedence | 10 | `apps/backend/src/evaluation/engine/*` | Evaluation engine tests in backend unit suite | Evaluation/API contracts and coverage maps | Explain deterministic precedence before live scenarios | Complete |
| Rule versioning or configuration change history | 11 | Audit-backed `GET /v1/projects/{projectKey}/flags/{flagKey}/history` and `FlagHistoryPanel` | `phase-11-flag-history.e2e-spec.ts` and service/unit tests | API contracts, architecture, demo script | Show per-flag history and before/after snapshots | Complete |
| Group kill switch | 12 | `apps/backend/src/flag-groups/*`, group config models, admin group UI | Group unit/service tests and `phase-12-group-kill-switch.e2e-spec.ts` | API contracts, architecture, README, demo script | Activate `customer-experience` kill switch and observe `GROUP_KILL_SWITCH` | Complete |
| Evaluation snapshot cache | 13 | `apps/backend/src/evaluation/cache/*` memory/no-op/Redis-ready abstraction | Cache unit tests and `phase-13-evaluation-cache.e2e-spec.ts` | Architecture, security review, README | Explain cached snapshots do not cache user decisions | Complete |
| Evaluation statistics dashboard | 14 | `apps/backend/src/stats/*`, admin `StatisticsPage` | Stats unit tests and `phase-14-evaluation-stats.e2e-spec.ts` | API contracts, architecture, research report, demo script | Show aggregate On/Off and top reason summaries | Complete |
| JavaScript SDK | 15 | `packages/js-sdk/*`, demo app SDK integration | SDK test suite, demo build, backend contract tests | SDK README, research report, slides, demo script | Demo app shows SDK client result and fail-closed behavior | Complete |
| Server-resolved demo RBAC | 16 | `apps/backend/src/auth/*`, centralized permission matrix, admin identity selector | RBAC unit tests and `phase-16-rbac.e2e-spec.ts` | Security review, API contracts, README | Switch to Viewer and show mutation controls disabled and rejected by backend | Complete |
| Docker Compose baseline and final workflow | 17, 19 | `docker-compose.yml`, Dockerfiles, idempotent migration and seed services | Docker Compose config and clean-stack smoke validation | README, troubleshooting, demo script | `docker compose up --build` starts the local demo path | Complete |
| Optional Redis cache provider | 18 | Redis cache provider, optional Compose `redis` profile | Redis provider tests and optional Compose profile smoke validation | Security review, README, architecture | Mention as optional production-style cache direction, not stable demo dependency | Complete optional |

## Final Phase 20 Acceptance Mapping

| Acceptance criterion | Evidence source |
| --- | --- |
| Original MVP acceptance criteria still pass | Full lint, unit, integration, E2E, build, Prisma, and diff validation recorded in `docs/release/final-recommended-release-review.md` |
| Each recommended requirement maps to code, API/UI behavior, tests, docs, and demo scenario | This matrix |
| Evaluation remains deterministic | Phase 10 evaluation tests, Phase 13 cache tests, Phase 15 SDK contract tests |
| Cache and metrics failures do not change safe evaluation behavior | Phase 13 cache fallback tests, Phase 14 metrics best-effort tests, security review |
| Control-plane mutations are authorized and audited | Phase 16 RBAC tests, audit/history tests, security review |
| Docker Compose works from a clean environment | Phase 19 evidence and Phase 20 Docker validation record |
| At least three recommended features are safe to demonstrate live | Demo script covers group kill switch, history/audit, statistics, SDK, and RBAC |
| Optional extensions are not mixed into the stable demo path | README, security review, and demo script keep Redis optional |
