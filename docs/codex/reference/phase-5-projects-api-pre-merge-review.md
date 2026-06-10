# Phase 5 Projects API Pre-Merge Review — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response.

## Original request context

The user asked Codex to review the Phase 5 Step 3 Projects API before
implementation or merge, focusing on architecture, correctness,
maintainability, and consistency with the existing NestJS + Prisma backend.

The requested review areas were:

1. Actor validation and possible duplication between `ActorRequiredGuard` and
   `ProjectsService`.
2. Project creation race conditions and duplicate project keys.
3. Empty `PATCH` requests and avoiding no-op audit logs.
4. Transaction boundaries for project creation, default environment creation,
   and audit log creation.
5. Audit logging snapshot contents.
6. API contract consistency, DTOs, Swagger, and pagination response shape.
7. Repository responsibilities.
8. Error handling for conflicts, validation, and not-found cases.
9. Future extensibility for Feature Flags, Rules, Environments, and Sample
   Users.

Relevant project guardrails:

- Required MVP deliverables come before recommended enhancements.
- Preserve control-plane/data-plane separation.
- Project, feature flag, and rule mutations must write append-only audit log
  entries in the same transaction as the mutation.
- Audit entries must contain actor, target, action, and before/after snapshots.
- Control-plane APIs use consistent `/v1` JSON API conventions, validation,
  pagination, and error response shapes.

## Full response reference

### Review verdict

Do not merge Step 3 yet.

The overall Projects API architecture is mostly on the right path, but several
issues should be fixed before continuing Phase 5.

Codex ran:

```bash
npm run test --workspace=@ffp/backend -- --runInBand
npm run build --workspace=@ffp/backend
```

Results:

- Tests passed.
- Build failed because `AuditSnapshot` was not assignable to
  `Prisma.InputJsonValue`.
- `ProjectsModule` was not registered in `AppModule`, so the routes would not
  be active.

### Critical issue 1: `ProjectsModule` is not registered

`apps/backend/src/app.module.ts` did not import or register `ProjectsModule`.
Without this, the `/v1/projects` routes will not exist.

Minimal fix:

```ts
import { ProjectsModule } from './projects/projects.module';
```

Then add `ProjectsModule` to the `imports` array.

### Critical issue 2: audit snapshot type mismatch

The build failed with errors like:

```text
Type 'AuditSnapshot' is not assignable to type 'InputJsonValue | null | undefined'
```

The current `cleanAuditSnapshot()` returned:

```ts
Record<string, unknown> | null
```

But `AuditLogService.record()` expects:

```ts
Prisma.InputJsonValue | null
```

Minimal fix: update `apps/backend/src/common/utils/audit-snapshot.util.ts` to
return Prisma-compatible JSON:

```ts
import { Prisma } from '@prisma/client';

export type AuditSnapshot = Prisma.InputJsonObject | null;

export function cleanAuditSnapshot<T extends Record<string, unknown>>(
  value: T | null | undefined,
): AuditSnapshot {
  if (!value) {
    return null;
  }

  return removeUndefinedAndNormalize(value) as Prisma.InputJsonObject;
}

function removeUndefinedAndNormalize(
  value: unknown,
): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => removeUndefinedAndNormalize(item))
      .filter((item): item is Prisma.InputJsonValue => item !== undefined);
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .map(([key, item]) => [key, removeUndefinedAndNormalize(item)])
        .filter(([, item]) => item !== undefined),
    ) as Prisma.InputJsonObject;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  return String(value);
}
```

### Critical issue 3: empty `PATCH` currently creates bad behavior

Current behavior permits:

```http
PATCH /v1/projects/demo-project
{}
```

This can call Prisma update and write an audit log even though no business
state changed.

That should be rejected.

Add this near the start of `ProjectsService.update()`:

```ts
if (body.name === undefined && body.description === undefined) {
  throw validationError('At least one project field must be provided.', [
    {
      field: 'body',
      message: 'Provide name or description.',
    },
  ]);
}
```

Also avoid audit logs for no-op updates:

```ts
const hasChange =
  (body.name !== undefined && body.name !== existing.name) ||
  (body.description !== undefined &&
    body.description !== existing.description);

if (!hasChange) {
  return existing;
}
```

This should happen inside the transaction after loading `existing`, before
calling update.

### Recommended improvement 1: actor validation is duplicated

The controller already uses:

```ts
@UseGuards(ActorRequiredGuard)
```

on mutation endpoints.

However, `ProjectsService` also has a `getRequiredActor()` method that repeats
the same validation. This duplicates actor enforcement.

Recommended minimal change:

- Keep `ActorRequiredGuard` as the single HTTP enforcement point.
- In the service, only read the actor for audit.

Change this:

```ts
private getRequiredActor(): string {
  const actor = this.requestContext.getActor();

  if (!actor) {
    throw validationError(...);
  }

  return actor || DEFAULT_ACTOR;
}
```

To:

```ts
private getAuditActor(): string {
  return this.requestContext.getActor() as string;
}
```

Then use:

```ts
const actor = this.getAuditActor();
```

Also remove:

```ts
import { DEFAULT_ACTOR } from '../common/constants/api.constants';
```

Rationale: `system` should be reserved for seed/internal flows, not normal HTTP
mutation APIs.

### Recommended improvement 2: project creation race condition handling

The create flow currently does:

```ts
const existing = await findByKey(...);
if (existing) throw conflictError(...);
create project...
```

This precheck is acceptable for friendly error messages, but it is not
race-safe by itself. Two concurrent requests can both pass the precheck.

The actual correctness mechanism is the database unique constraint:

```prisma
key String @unique
```

The global exception filter already maps Prisma `P2002` unique constraint
errors to `409 CONFLICT`, so concurrent duplicates are still handled correctly.

Recommendation:

- Keeping the precheck is acceptable.
- Do not rely on the precheck as the correctness guarantee.
- Database uniqueness plus Prisma `P2002` handling is the real guarantee.

Optional future improvement: make the `P2002` response message more specific.

### Recommended improvement 3: remove redundant fields from audit snapshot

Current project snapshot:

```ts
{
  id,
  key,
  name,
  description
}
```

This is acceptable, but `id` is already stored as `targetId`.

Recommended snapshot:

```ts
private projectSnapshot(project: {
  key: string;
  name: string;
  description: string | null;
}) {
  return cleanAuditSnapshot({
    key: project.key,
    name: project.name,
    description: project.description,
  });
}
```

Rationale: audit snapshots should contain meaningful business state and avoid
duplicating structural fields already present in the audit entry.

### Recommended improvement 4: do not set environment fields on project audit entries

Current project creation audit includes:

```ts
environmentId: environment.id,
environmentKey: environment.key,
```

For a `PROJECT_CREATED` event, this is misleading because the audit target is
the project, not the environment.

Recommended:

```ts
await this.auditLogService.record(tx, {
  projectId: createdProject.id,
  projectKey: createdProject.key,
  targetType: AuditTargetType.PROJECT,
  targetId: createdProject.id,
  targetKey: createdProject.key,
  action: AuditAction.PROJECT_CREATED,
  actor,
  before: null,
  after: this.projectSnapshot(createdProject),
  metadata: {
    source: 'api',
    defaultEnvironmentKey: environment.key,
  },
  requestId,
});
```

Keep the default environment key in metadata only.

### Recommended improvement 5: Swagger response for list endpoint is incorrect

Current controller documentation:

```ts
@ApiOkResponse({ type: ProjectResponseDto, isArray: true })
```

But the actual response shape is:

```json
{
  "items": [],
  "page": {
    "limit": 20,
    "offset": 0,
    "total": 0,
    "hasNext": false
  }
}
```

Create a specific DTO:

```ts
import { ApiProperty } from '@nestjs/swagger';
import { ProjectResponseDto } from './project-response.dto';

class PageMetadataDto {
  @ApiProperty()
  limit!: number;

  @ApiProperty()
  offset!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  hasNext!: boolean;
}

export class ProjectPageResponseDto {
  @ApiProperty({ type: [ProjectResponseDto] })
  items!: ProjectResponseDto[];

  @ApiProperty({ type: PageMetadataDto })
  page!: PageMetadataDto;
}
```

Then use:

```ts
@ApiOkResponse({ type: ProjectPageResponseDto })
```

### Positive finding: transaction boundaries

Project creation is correctly structured:

```ts
transaction {
  create project
  create default environment
  write audit log
}
```

If default environment creation or audit creation fails, project creation rolls
back. This satisfies the same-transaction audit requirement.

Project update also reads, mutates, and audits inside one transaction. This is
good.

### Positive finding: repository responsibilities

Repositories remain thin database wrappers.

Business decisions remain in the service:

- duplicate handling
- default environment creation
- audit logging
- snapshot construction
- sorting validation

This pattern is suitable for later Phase 5 APIs such as Feature Flags, Rules,
and Sample Users.

### Positive finding: error handling direction

The implementation is generally aligned with the existing error model by using:

- `conflictError`
- `notFoundError`
- `validationError`
- global Prisma `P2002` unique constraint handling

The missing piece is empty `PATCH` validation.

## Key decisions and rationale

1. **Do not merge yet.** The build failure and inactive route registration are
   blocking issues.
2. **Use `ActorRequiredGuard` as the single HTTP actor enforcement point.**
   Services can assume guarded HTTP mutation calls have an actor and should
   only read it for audit. This avoids duplicate validation behavior.
3. **Database uniqueness is the true duplicate-key guarantee.** Application
   prechecks improve error friendliness but do not protect against concurrent
   create requests.
4. **Reject empty `PATCH` bodies.** A request that changes no business state
   should not generate a database update or audit log.
5. **No-op updates should not emit audit entries.** Audit logs should represent
   real configuration changes.
6. **Project audit snapshots should store business state only.** Avoid
   duplicating `targetId` inside snapshots and avoid assigning environment
   scope to project target audit entries.
7. **Swagger must reflect actual response shapes.** A paginated endpoint should
   document `{ items, page }`, not an array.
8. **The service-layer transaction pattern is reusable.** The Projects API can
   become the template for feature flags, rules, sample users, and future
   environments if these targeted issues are fixed.

## Commands, files, and artifacts

### Commands run during review

```bash
npm run test --workspace=@ffp/backend -- --runInBand
npm run build --workspace=@ffp/backend
```

Observed result:

- Jest test suites passed.
- `nest build` failed due to audit snapshot type incompatibility with
  `Prisma.InputJsonValue`.

### Primary files reviewed

- `apps/backend/src/app.module.ts`
- `apps/backend/src/projects/projects.controller.ts`
- `apps/backend/src/projects/projects.service.ts`
- `apps/backend/src/projects/projects.module.ts`
- `apps/backend/src/projects/dto/create-project.dto.ts`
- `apps/backend/src/projects/dto/update-project.dto.ts`
- `apps/backend/src/projects/dto/project-query.dto.ts`
- `apps/backend/src/projects/dto/project-response.dto.ts`
- `apps/backend/src/common/guards/actor-required.guard.ts`
- `apps/backend/src/common/errors/api-exception.helpers.ts`
- `apps/backend/src/common/utils/audit-snapshot.util.ts`
- `apps/backend/src/common/dto/page-response.dto.ts`
- `apps/backend/src/common/dto/pagination-query.dto.ts`
- `apps/backend/src/common/filters/api-exception.filter.ts`

### Targeted fixes before continuing Phase 5

1. Register `ProjectsModule` in `AppModule`.
2. Fix `AuditSnapshot` typing.
3. Reject empty `PATCH {}` requests.
4. Avoid audit logs for no-op updates.
5. Remove duplicated actor validation from `ProjectsService`.
6. Fix list endpoint Swagger response.
7. Remove `environmentId` and `environmentKey` from project audit entries.

## Validation checklist

After applying the targeted fixes, run:

```bash
npm run format --workspace=@ffp/backend
npm run test --workspace=@ffp/backend -- --runInBand
npm run build --workspace=@ffp/backend
git diff --check
```

Step 3 is safe to continue only when:

- `ProjectsModule` is registered and routes are active.
- `POST /v1/projects` and `PATCH /v1/projects/:projectKey` require
  `X-Actor`.
- Project creation, default environment creation, and audit log write occur in
  the same transaction.
- Empty PATCH requests return `VALIDATION_ERROR`.
- No-op updates do not write audit logs.
- Duplicate project keys return `409 CONFLICT`, including concurrent requests
  protected by the database unique constraint.
- Audit snapshots are Prisma JSON-compatible.
- Swagger documents list responses as paginated objects.
- Repository methods remain thin, with business logic in the service.

## Risks and caveats

- The pre-create duplicate check is not race-safe alone. Keep the database
  unique constraint and global Prisma `P2002` handling as the source of
  correctness.
- If services are called outside guarded HTTP controllers in the future, actor
  assumptions may need a separate application-service boundary or explicit
  system actor flow for seeds/internal jobs.
- Returning `existing` for no-op updates avoids unnecessary audit logs, but API
  semantics should be documented if clients expect PATCH to always update
  `updatedAt`.
- The suggested Swagger pagination DTO is project-specific. A generic reusable
  paginated Swagger DTO helper may be useful later, but the targeted
  project-specific DTO is enough for the MVP.

## Reuse prompts

Use these prompts to continue the work:

```text
Apply the targeted Step 3 Projects API review fixes with minimal code changes.
Do not rewrite the implementation. Preserve repository/service/controller
separation and run backend test/build/diff validation.
```

```text
Review the fixed Projects API after applying the pre-merge feedback. Verify
actor enforcement, no-op PATCH behavior, audit snapshots, transaction
boundaries, route registration, and Swagger pagination.
```

```text
Use the corrected Projects API pattern to teach Step 4 Feature Flags API,
including transactional audit logging and default flag environment config.
```

