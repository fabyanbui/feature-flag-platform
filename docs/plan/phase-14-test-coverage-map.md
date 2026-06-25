# Phase 14 Evaluation Statistics Test Coverage

## Purpose

Define the test-first coverage for privacy-preserving aggregate evaluation
statistics before adding the Prisma model, statistics services, read APIs, or
admin dashboard.

## Metric Recording

| Behavior                                        | Test level               |
| ----------------------------------------------- | ------------------------ |
| Cache hit produces one increment attempt        | `EvaluationService` unit |
| Cache miss produces one increment attempt       | `EvaluationService` unit |
| `NOT_FOUND` produces one increment attempt      | `EvaluationService` unit |
| `ERROR` produces one increment attempt          | `EvaluationService` unit |
| Metric failure does not alter evaluation result | Unit and E2E             |
| Metric payload excludes evaluation context      | Unit                     |
| Actual default environment key is recorded      | Repository/service unit  |
| Explicit environment key is recorded            | `EvaluationService` unit |

## Aggregation

| Behavior                                             | Test level              |
| ---------------------------------------------------- | ----------------------- |
| Equivalent dimensions increment one row              | Repository unit and E2E |
| Different reasons create separate aggregates         | E2E                     |
| Different enabled results create separate aggregates | E2E                     |
| Different environments create separate aggregates    | E2E                     |
| Different UTC hours create separate aggregates       | Unit                    |
| Increment uses an atomic upsert                      | Repository unit         |

## Statistics API

| Behavior                                                  | Test level      |
| --------------------------------------------------------- | --------------- |
| Project endpoint returns totals per flag                  | Service and E2E |
| Flag endpoint returns summary, reasons, and buckets       | Service and E2E |
| Environment filter is applied                             | E2E             |
| Time-range filter uses `[from, to)`                       | Service         |
| Empty metrics return zero totals                          | Service and E2E |
| Missing project, flag, or environment returns `NOT_FOUND` | E2E             |
| Invalid or excessive range returns `VALIDATION_ERROR`     | Unit and E2E    |

## Privacy

| Behavior                          | Test level            |
| --------------------------------- | --------------------- |
| No targeting key is stored        | Unit                  |
| No user ID is stored              | Unit                  |
| No roles or attributes are stored | Unit                  |
| No raw evaluation event is stored | Schema review and E2E |
| No matched rule ID is stored      | Unit                  |

## Planned Test Files

- `apps/backend/src/evaluation/evaluation.service.spec.ts`
- `apps/backend/src/stats/evaluation-metrics.service.spec.ts`
- `apps/backend/src/stats/stats.service.spec.ts`
- `apps/backend/src/repositories/evaluation-metrics.repository.spec.ts`
- `apps/backend/test/phase-14-evaluation-stats.e2e-spec.ts`

Only the `EvaluationService` contract tests are introduced before production
statistics code exists. Tests for future modules should be added immediately
before their corresponding implementation so failures remain behavioral and
focused rather than unresolved-import errors.
