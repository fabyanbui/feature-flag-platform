# Phase 3 Request Context X-Request-Id Middleware Fix — Full Codex Response Reference

Purpose: standalone reference expanded from the latest two Codex responses about debugging and fixing the missing `X-Request-Id: req_test_123` response header during Phase 3 backend foundation work.

## Original request context

The user was implementing Phase 3 of `docs/plan/implementation-roadmap.md`, specifically the backend foundation item:

- correlation ID or request context support for logs

During Step 4, the backend request-context middleware was expected to echo an incoming request ID:

```bash
curl -i -H "X-Request-Id: req_test_123" http://localhost:3000/v1
```

Expected response header:

```http
X-Request-Id: req_test_123
```

Actual response initially did not include the header on `GET /v1`:

```http
HTTP/1.1 200 OK
X-Powered-By: Express
Vary: Origin
Content-Type: text/html; charset=utf-8
Content-Length: 12
...
Hello World!
```

The backend was a NestJS app with global prefix `v1`, an `AppController` root route returning `Hello World!`, and a `RequestContextMiddleware` intended to set `X-Request-Id` on every response.

Relevant repo guardrails:

- Keep control-plane and data-plane concerns separated.
- Preserve safe defaults and deterministic behavior.
- Future mutation flows must write append-only audit logs in the same transaction.
- Request IDs should be shared by logs, errors, and future audit entries.
- Do not expose secrets or unnecessary PII in logs or metadata.

## Full response reference

### Initial debug finding

The first debugging pass inspected these files:

```txt
apps/backend/src/app.module.ts
apps/backend/src/main.ts
apps/backend/src/common/constants/api.constants.ts
apps/backend/src/common/middleware/request-context.middleware.ts
apps/backend/src/common/request-context/request-context.service.ts
```

The middleware implementation itself was correct. It read the incoming request ID, generated one if missing, set the response header, and stored request context through `AsyncLocalStorage`:

```ts
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly requestContext: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const incomingRequestId = req.header(REQUEST_ID_HEADER);
    const requestId =
      incomingRequestId && incomingRequestId.trim().length > 0
        ? incomingRequestId.trim()
        : `req_${randomUUID()}`;

    const incomingActor = req.header(ACTOR_HEADER);
    const actor =
      incomingActor && incomingActor.trim().length > 0
        ? incomingActor.trim()
        : undefined;

    res.setHeader(RESPONSE_REQUEST_ID_HEADER, requestId);

    this.requestContext.run(
      {
        requestId,
        actor,
      },
      next,
    );
  }
}
```

The initial route registration in `AppModule` was:

```ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
```

When Codex tried to start the built backend on an alternate port, NestJS logged a route-conversion warning:

```txt
Unsupported route path: "/v1/*". In previous versions, the symbols ?, *, and + were used to denote optional or repeating path parameters. The latest version of "path-to-regexp" now requires the use of named parameters.
```

The first attempted fix changed the middleware registration to a named wildcard:

```ts
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestContextMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
```

This removed the NestJS wildcard warning and the backend build passed:

```bash
npm run build --workspace=@ffp/backend
```

However, the user still could not see the header on:

```bash
curl -i -H "X-Request-Id: req_test_123" http://localhost:3000/v1
```

### Second debug finding

Codex then tested both the root route and a child route:

```bash
curl -i -H "X-Request-Id: req_test_123" http://localhost:3000/v1
curl -i -H "X-Request-Id: req_test_456" http://localhost:3000/v1/unknown
```

The child route response included the request ID:

```http
HTTP/1.1 404 Not Found
X-Powered-By: Express
Vary: Origin
X-Request-Id: req_test_456
Content-Type: application/json; charset=utf-8
...
```

But the global-prefix root route `/v1` still did not include `X-Request-Id`.

Conclusion:

- The middleware logic was correct.
- The named wildcard route-bound registration matched child paths such as `/v1/unknown`.
- It did not match the global-prefix root route `/v1`.
- Therefore, a route-bound Nest middleware wildcard was too fragile for this project’s request context requirement.

### Final fix

The final fix moved request-context registration from route-bound Nest middleware in `AppModule` to app-level middleware in `main.ts`.

This makes the middleware run before Nest route matching and covers both:

```txt
/v1
/v1/anything
```

`apps/backend/src/app.module.ts` was simplified to only register providers:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestContextService } from './common/request-context/request-context.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
  ],
  controllers: [AppController],
  providers: [AppService, RequestContextService],
})
export class AppModule {}
```

`apps/backend/src/main.ts` now creates the middleware after the Nest app is created and before setting the global prefix:

```ts
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { API_PREFIX } from './common/constants/api.constants';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { RequestContextService } from './common/request-context/request-context.service';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const requestContext = app.get(RequestContextService);
  const requestContextMiddleware = new RequestContextMiddleware(requestContext);

  app.use(requestContextMiddleware.use.bind(requestContextMiddleware));

  app.setGlobalPrefix(API_PREFIX);

  const allowedOrigins = [
    process.env.ADMIN_ORIGIN,
    process.env.DEMO_ORIGIN,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  });

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  logger.error(`Failed to start backend application: ${message}`, stack);
  process.exit(1);
});
```

The `RequestContextMiddleware` class remains reusable and contains the request-context behavior. It is just registered at the app level rather than through route-bound `MiddlewareConsumer` matching.

### Verification performed

The backend build passed:

```bash
npm run build --workspace=@ffp/backend
```

Codex could not reliably use sandboxed local networking to reach a server started outside the same permission context, so it started the backend on an alternate port with escalated execution:

```bash
API_PORT=3011 npm run start:dev --workspace=@ffp/backend
```

Then it verified with escalated curl:

```bash
curl -i -H "X-Request-Id: req_test_123" http://localhost:3011/v1
```

Verified response:

```http
HTTP/1.1 200 OK
X-Powered-By: Express
X-Request-Id: req_test_123
Vary: Origin
Content-Type: text/html; charset=utf-8
Content-Length: 12
...
Hello World!
```

It also verified automatic request ID generation when the client omitted `X-Request-Id`:

```bash
curl -i http://localhost:3011/v1
```

Verified response included a generated ID:

```http
X-Request-Id: req_<uuid>
```

## Key decisions and rationale

### Decision: use app-level middleware for request context

The final implementation uses:

```ts
app.use(requestContextMiddleware.use.bind(requestContextMiddleware));
```

instead of Nest `MiddlewareConsumer.forRoutes(...)`.

Rationale:

- Request context must apply to all requests, not just matched controller routes.
- It must apply to the global-prefix root route `/v1`.
- It must apply before future exception filters and audit logging depend on the context.
- App-level Express middleware avoids Nest wildcard route-matching edge cases in NestJS 11 / newer `path-to-regexp` behavior.

### Decision: keep `RequestContextMiddleware` class

The class remains useful because it encapsulates request ID and actor extraction:

- reads `X-Request-Id`
- generates `req_<uuid>` when missing
- reads `X-Actor`
- sets response header `X-Request-Id`
- stores `{ requestId, actor }` in `RequestContextService`

Keeping the class avoids duplicating this logic in `main.ts`.

### Decision: keep `RequestContextService` as provider

The service uses `AsyncLocalStorage` so future code can access request metadata without manually threading parameters through every method:

```ts
this.requestContext.getRequestId();
this.requestContext.getActor();
```

This is important for future Phase 5 mutation flows that need request IDs in audit entries.

### Decision: verify `/v1`, not only `/v1/unknown`

The actual failing case was the root route `/v1`. Testing only child paths would have missed the issue. Future verification should include both root and child paths when testing app-wide middleware.

## Commands, files, and artifacts

### Files changed

```txt
apps/backend/src/app.module.ts
apps/backend/src/main.ts
```

### Files involved

```txt
apps/backend/src/common/constants/api.constants.ts
apps/backend/src/common/middleware/request-context.middleware.ts
apps/backend/src/common/request-context/request-context.service.ts
```

### Useful diagnostic commands

Check the root route:

```bash
curl -i -H "X-Request-Id: req_test_123" http://localhost:3000/v1
```

Check a child route or unknown route:

```bash
curl -i -H "X-Request-Id: req_test_456" http://localhost:3000/v1/unknown
```

Run backend build:

```bash
npm run build --workspace=@ffp/backend
```

Start backend normally:

```bash
npm run start:dev --workspace=@ffp/backend
```

Start backend on an alternate port when port `3000` is occupied:

```bash
API_PORT=3011 npm run start:dev --workspace=@ffp/backend
```

Verify on alternate port:

```bash
curl -i -H "X-Request-Id: req_test_123" http://localhost:3011/v1
```

## Validation checklist

Use this checklist after changing request-context behavior:

```txt
[ ] npm run build --workspace=@ffp/backend passes
[ ] backend starts without Nest wildcard route warnings
[ ] GET /v1 echoes incoming X-Request-Id
[ ] GET /v1 generates X-Request-Id when the header is omitted
[ ] GET /v1/unknown also includes X-Request-Id
[ ] AppModule does not use fragile wildcard route-bound middleware for request context
[ ] main.ts registers request context before app.setGlobalPrefix(API_PREFIX)
[ ] RequestContextService remains injectable for future filters, services, and audit logging
```

Expected positive curl output for incoming request ID:

```http
X-Request-Id: req_test_123
```

Expected positive curl output when omitted:

```http
X-Request-Id: req_<uuid>
```

## Risks and caveats

- If port `3000` is occupied by an old backend process, curl may still hit stale code. Stop all backend terminals and restart with:

  ```bash
  npm run start:dev --workspace=@ffp/backend
  ```

- App-level middleware registration must stay before routes are served. Keep it directly after `NestFactory.create(AppModule)` and before `app.setGlobalPrefix(API_PREFIX)`.

- Future global exception filters should use `RequestContextService.getRequestId()` to include the same request ID in error responses.

- Future audit logging should use the same request context but must still write audit entries in the same transaction as mutations.

- Do not store secrets or full request bodies in request context or audit metadata.

## Reuse prompts

Use these prompts in future Codex sessions:

```txt
Review Phase 3 request-context middleware and verify X-Request-Id is applied to /v1 and all child routes.
```

```txt
Continue Phase 3 from the request-context fix and implement the global validation pipe using the existing API error contract.
```

```txt
Implement the Phase 3 global exception filter and make it use RequestContextService.getRequestId() for error responses.
```

```txt
Before Phase 5 management APIs, review how RequestContextService requestId and actor should be used by transactional audit logging.
```
