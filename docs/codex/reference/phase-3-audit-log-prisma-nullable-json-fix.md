# Phase 3 Audit Log Prisma Nullable JSON Fix — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response.

## Original request context

During Phase 3 backend foundation work for the feature flag platform, the
backend audit logging service was added as an append-only service for future
same-transaction mutation audit logs. When building the backend after Step 9,
TypeScript failed in `apps/backend/src/audit/audit-log.service.ts` because
nullable Prisma `Json` fields were assigned plain TypeScript `null` values.

The reported build command was:

```bash
npm run build --workspace=@ffp/backend
```

The relevant errors were:

```text
src/audit/audit-log.service.ts:23:17 - error TS2322: Type 'InputJsonValue | null' is not assignable to type 'NullableJsonNullValueInput | InputJsonValue | undefined'.
  Type 'null' is not assignable to type 'NullableJsonNullValueInput | InputJsonValue | undefined'.

23                 before: input.before ?? null,
                   ~~~~~~

src/audit/audit-log.service.ts:24:17 - error TS2322: Type 'InputJsonValue | null' is not assignable to type 'NullableJsonNullValueInput | InputJsonValue | undefined'.
  Type 'null' is not assignable to type 'NullableJsonNullValueInput | InputJsonValue | undefined'.

24                 after: input.after ?? null,
                   ~~~~~
```

## Full response reference

The issue was fixed by changing how the audit log service writes nullable JSON
fields for `before` and `after` snapshots.

Prisma nullable `Json` fields do not accept plain TypeScript `null` in create
input. The Prisma schema contains nullable JSON columns similar to:

```prisma
before Json? @db.JsonB
after  Json? @db.JsonB
```

For these fields, Prisma expects either a JSON value, `undefined`, or one of
Prisma's nullable JSON null sentinel values. To store database `NULL`, use:

```ts
Prisma.DbNull
```

instead of:

```ts
null
```

The fix was applied in:

```text
apps/backend/src/audit/audit-log.service.ts
```

The previous code was:

```ts
before: input.before ?? null,
after: input.after ?? null,
```

The corrected code is:

```ts
before: input.before ?? Prisma.DbNull,
after: input.after ?? Prisma.DbNull,
```

The service also needs this import:

```ts
import { Prisma } from '@prisma/client';
```

After the fix, the build command passed:

```bash
npm run build --workspace=@ffp/backend
```

Expected successful output shape:

```text
> @ffp/backend@0.0.1 build
> nest build
```

No TypeScript errors should be emitted.

## Key decisions and rationale

- Use `Prisma.DbNull` for absent audit `before` and `after` snapshots because
  the intended database representation is SQL `NULL`, not JSON literal `null`.
- Keep the public audit contract semantics as nullable snapshots. API responses
  may later serialize missing snapshots as `null`, but Prisma create input must
  use the proper Prisma sentinel value.
- Preserve append-only audit logging: this fix only changes create input typing;
  it does not introduce audit update, delete, or mutation methods.
- Preserve same-transaction readiness: `AuditLogService.record(tx, input)` still
  accepts a `TransactionClient`, so future project, flag, and rule mutations can
  create audit entries in the same database transaction.
- Avoid logging or exposing secrets. The fix does not inspect or print
  connection strings, `.env` values, or sensitive metadata.

## Commands, files, and artifacts

Files involved:

```text
apps/backend/src/audit/audit-log.service.ts
apps/backend/src/audit/audit-log.types.ts
apps/backend/src/database/transaction.service.ts
apps/backend/prisma/schema.prisma
```

The important service shape after the fix:

```ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TransactionClient } from '../database/transaction.service';
import { RecordAuditLogInput } from './audit-log.types';

@Injectable()
export class AuditLogService {
  async record(tx: TransactionClient, input: RecordAuditLogInput) {
    return tx.auditLogEntry.create({
      data: {
        projectId: input.projectId,
        projectKey: input.projectKey,

        environmentId: input.environmentId ?? null,
        environmentKey: input.environmentKey ?? null,

        targetType: input.targetType,
        targetId: input.targetId,
        targetKey: input.targetKey ?? null,

        action: input.action,
        actor: input.actor,

        before: input.before ?? Prisma.DbNull,
        after: input.after ?? Prisma.DbNull,
        metadata: input.metadata ?? { source: 'api' },

        requestId: input.requestId,
      },
    });
  }
}
```

Validation command:

```bash
npm run build --workspace=@ffp/backend
```

Reference-document validation command:

```bash
git diff --check -- docs/codex/reference/phase-3-audit-log-prisma-nullable-json-fix.md
```

Optional, if `markdownlint` is installed:

```bash
markdownlint docs/codex/reference/phase-3-audit-log-prisma-nullable-json-fix.md
```

## Validation checklist

Use this checklist when encountering the same issue again:

```text
[ ] Audit log Prisma model has nullable Json fields, e.g. Json? @db.JsonB
[ ] AuditLogService imports Prisma from @prisma/client
[ ] before uses input.before ?? Prisma.DbNull
[ ] after uses input.after ?? Prisma.DbNull
[ ] AuditLogService.record still accepts TransactionClient
[ ] AuditLogService only creates audit log entries
[ ] No audit update/delete method exists
[ ] npm run build --workspace=@ffp/backend passes
```

## Risks and caveats

- Do not replace `Prisma.DbNull` with plain `null` for nullable JSON create
  input; TypeScript will reject it and Prisma distinguishes database null from
  JSON null.
- Do not use `Prisma.JsonNull` unless the intended stored value is a JSON
  literal `null`. For absent audit snapshots, database null is the better fit.
- Do not add audit-log update or delete methods while fixing this typing issue;
  audit logs must remain append-only.
- Do not store secrets, full request bodies, connection strings, or unnecessary
  PII inside `before`, `after`, or `metadata` snapshots.

## Reuse prompts

- "Apply the Phase 3 audit log Prisma nullable JSON fix and verify the backend
  build."
- "Review `AuditLogService.record` for append-only semantics and Prisma JSON
  null handling."
- "When implementing Phase 5 mutation services, use `TransactionService.run`
  and `AuditLogService.record` in the same transaction, preserving the
  `Prisma.DbNull` snapshot behavior."
