# Phase 3 Health Endpoint Type-Only Import Fix — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response.

## Original request context

During Phase 3 backend foundation work, the health endpoint replaced the
default NestJS `Hello World` route. The user then ran:

```bash
npm run build --workspace=@ffp/backend
```

and received this TypeScript error:

```text
src/app.controller.ts:19:16 - error TS1272: A type referenced in a decorated signature must be imported with 'import type' or a namespace import when 'isolatedModules' and 'emitDecoratorMetadata' are enabled.

19   getHealth(): HealthResponse {
                  ~~~~~~~~~~~~~~

  src/app.controller.ts:3:22
    3 import { AppService, HealthResponse } from './app.service';
                           ~~~~~~~~~~~~~~
    'HealthResponse' was imported here.
```

The latest Codex response explained and fixed the error.

## Full response reference

The backend failed to build because `HealthResponse` was imported as a runtime
value from `./app.service`:

```ts
import { AppService, HealthResponse } from './app.service';
```

However, `HealthResponse` is only a TypeScript type used as the return type of
a decorated NestJS controller method:

```ts
getHealth(): HealthResponse {
  return this.appService.getHealth();
}
```

The backend TypeScript configuration has both of these options enabled:

```json
{
  "isolatedModules": true,
  "emitDecoratorMetadata": true
}
```

With decorated signatures and emitted decorator metadata, TypeScript requires
type-only references to be imported with `import type` or a namespace import.
The correct fix is to separate the runtime service import from the type-only
response import.

The corrected import in `apps/backend/src/app.controller.ts` is:

```ts
import { AppService } from './app.service';
import type { HealthResponse } from './app.service';
```

After this change, Codex ran:

```bash
npm run build --workspace=@ffp/backend
```

and the build passed.

The user should continue Step 11 verification with:

```bash
npm run test --workspace=@ffp/backend
```

Then test the health endpoint:

```bash
curl -i -H "X-Request-Id: req_health_123" http://localhost:3000/v1/health
```

The expected health response is:

```json
{
  "status": "ok",
  "service": "feature-flag-backend"
}
```

The expected response header includes:

```http
X-Request-Id: req_health_123
```

## Key decisions and rationale

- Keep `AppService` as a normal runtime import because NestJS needs the service
  class at runtime.
- Import `HealthResponse` with `import type` because it is erased at runtime and
  exists only for TypeScript checking.
- Preserve the Phase 3 request context guardrail by continuing to verify
  `X-Request-Id` on `/v1/health`.
- Keep the endpoint as `GET /v1/health`, not `GET /v1`, so the backend has a
  clear health route instead of the default NestJS scaffold route.

## Commands, files, and artifacts

Changed file:

```text
apps/backend/src/app.controller.ts
```

Corrected imports:

```ts
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import type { HealthResponse } from './app.service';
```

Validation command run by Codex:

```bash
npm run build --workspace=@ffp/backend
```

Recommended follow-up commands:

```bash
npm run test --workspace=@ffp/backend
curl -i -H "X-Request-Id: req_health_123" http://localhost:3000/v1/health
```

## Validation checklist

- [x] `HealthResponse` is imported with `import type`.
- [x] `AppService` remains a runtime import.
- [x] Backend build passes.
- [ ] Backend tests pass.
- [ ] `GET /v1/health` returns `{ "status": "ok", "service": "feature-flag-backend" }`.
- [ ] `GET /v1/health` echoes `X-Request-Id`.
- [ ] Swagger still documents the health endpoint under the Health tag.

## Risks and caveats

- Do not disable `isolatedModules` or `emitDecoratorMetadata` just to avoid this
  error; those settings are compatible with NestJS when type-only imports are
  used correctly.
- Avoid importing interfaces or type aliases as runtime values in decorated
  NestJS signatures.
- If future DTOs/classes are used for Swagger runtime metadata, import those as
  normal values. Use `import type` only for TypeScript-only interfaces and type
  aliases.

## Reuse prompts

- "Check the backend for other TS1272 errors caused by non-type imports in
  decorated NestJS signatures."
- "Review Phase 3 health endpoint and request ID behavior before moving to
  Phase 4."
- "Verify Swagger health endpoint documentation after the type-only import fix."
