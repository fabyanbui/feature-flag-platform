# Audit Log Release Review — Phase 9

## Purpose

This document records the release-readiness evidence for append-only audit
logging. Auditability is a non-negotiable project guardrail because feature flag
configuration changes directly affect runtime behavior.

## Required Audit Behavior

Every configuration mutation should record:

- actor,
- request ID,
- timestamp,
- action,
- target type,
- target key,
- project key,
- environment key when applicable,
- before snapshot,
- after snapshot,
- metadata.

The audit entry must be written in the same transaction as the mutation.

## Mutation Coverage

| Mutation area | Required audit action examples | Evidence |
| --- | --- | --- |
| Projects | `PROJECT_CREATED`, `PROJECT_UPDATED` | `apps/backend/src/projects/projects.service.ts`; `apps/backend/src/projects/projects.service.spec.ts` |
| Feature flags | `FEATURE_FLAG_CREATED`, `FEATURE_FLAG_UPDATED`, `FEATURE_FLAG_ARCHIVED`, `FEATURE_FLAG_RESTORED` | `apps/backend/src/feature-flags/feature-flags.service.ts`; `apps/backend/src/feature-flags/feature-flags.service.spec.ts` |
| Rules | `FLAG_RULES_REPLACED` | `apps/backend/src/flag-rules/flag-rules.service.ts`; `apps/backend/src/flag-rules/flag-rules.service.spec.ts` |
| Sample users | `SAMPLE_USER_CREATED`, `SAMPLE_USER_DELETED` | `apps/backend/src/sample-users/sample-users.service.ts`; `apps/backend/src/sample-users/sample-users.service.spec.ts` |

## Same-Transaction Evidence

The service layer passes a transaction client to both the domain mutation and
the audit write.

Important evidence:

- `apps/backend/src/database/transaction.service.ts`
- `apps/backend/src/audit/audit-log.service.ts`
- `apps/backend/test/integration/phase-5-management.integration-spec.ts`

The integration test suite includes rollback evidence for project creation when
audit logging fails. This proves the mutation and audit write are tied together
transactionally.

## Append-Only Evidence

Audit entries are append-only from the API perspective:

- There is an audit log read API.
- There is no public API to update audit log entries.
- There is no public API to delete audit log entries.
- `AuditLogService.record(...)` creates rows through
  `tx.auditLogEntry.create(...)`.
- Mutation services call the audit service to add entries instead of editing
  previous audit rows.

Schema evidence:

- `apps/backend/prisma/schema.prisma`

Code evidence:

- `apps/backend/src/audit/audit-log.service.ts`
- `apps/backend/src/audit-logs/audit-logs.controller.ts`
- `apps/backend/src/audit-logs/audit-logs.service.ts`

## Query and Presentation Evidence

Audit logs can be queried with filters and pagination so reviewers can inspect
configuration history during the demo.

Evidence:

- `apps/backend/src/audit-logs/dto/audit-log-query.dto.ts`
- `apps/backend/src/audit-logs/audit-logs.service.spec.ts`
- `apps/backend/test/phase-5-management.e2e-spec.ts`
- `apps/backend/test/phase-6-vertical-slice.e2e-spec.ts`
- `apps/backend/test/phase-9-demo-flow.e2e-spec.ts`

## Demo Proof

During the presentation:

1. Use the admin dashboard to create or update a feature flag.
2. Use the demo app to evaluate the runtime result.
3. Return to the admin dashboard audit log screen.
4. Show the audit entry containing actor, action, target, and before/after
   snapshots.

This proves the project connects configuration changes to runtime behavior and
preserves accountability.

## Release Decision

The audit logging implementation is acceptable for MVP release readiness when:

1. Mutation tests pass.
2. Same-transaction integration tests pass.
3. Audit log query tests pass.
4. The demo can show at least one audit entry for a flag or rule change.
5. No API route allows audit log update or deletion.
