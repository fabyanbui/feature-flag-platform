# Feature Flag Platform Tech Stack Decisions — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response.

## Original request context

The user wanted to review the chosen technology stack before implementing
Phase 1 of the roadmap. They asked for all planned technologies, the trade-offs,
and the reasons for choosing them.

Relevant repo guardrails:

- Preserve the MVP stack from `AGENTS.md` and architecture docs: NestJS,
  Prisma, PostgreSQL, REST/Swagger, Jest, and in-memory cache.
- Required MVP deliverables come before recommended enhancements.
- Keep control-plane management/dashboard concerns separate from data-plane
  evaluation concerns.
- Preserve deterministic rule evaluation, fail-closed defaults, append-only
  audit logging, and stable non-PII rollout keys.

## Full response reference

Before implementing Phase 1, the stack should be clear and explainable. The
recommended stack below is aligned with the existing architecture documents and
project guardrails.

### 1. Language: TypeScript

Used for:

- Backend.
- Admin app.
- Demo app.
- Shared contracts.

Reasons to choose it:

- One language across backend and frontend.
- Strong typing helps avoid API contract drift.
- Good fit for NestJS, React, Prisma, and Jest.
- Safer for rule evaluation logic where correctness matters.

Trade-offs:

- More setup than plain JavaScript.
- Requires understanding types, DTOs, generics, and build configuration.
- Compilation adds some complexity.

Decision rationale: for this project, correctness and maintainability matter
more than raw simplicity.

### 2. Monorepo: npm Workspaces

Used for:

```text
apps/api
apps/admin
apps/demo
packages/contracts
```

Reasons to choose it:

- Keeps backend, admin, demo, and shared contracts in one repository.
- Easy to run everything locally.
- Good fit for a mini project with multiple closely related apps.
- Avoids publishing shared packages externally.

Trade-offs:

- Slightly more complex than a single app repository.
- Workspace scripts need to be managed carefully.
- Dependency boundaries can become messy without discipline.

Decision rationale: this project has multiple apps, but they are tightly
related. A monorepo is the cleanest option.

### 3. Backend Framework: NestJS

Used for:

- Management APIs.
- Evaluation API.
- Validation.
- Swagger docs.
- Future Prisma integration.
- Future audit logging service.

Reasons to choose it:

- Professional backend structure through modules, controllers, services, and
  DTOs.
- Strong fit for REST APIs.
- Works well with Prisma and Swagger.
- Encourages clean separation between API layer and business logic.
- Easy to explain in the presentation as an enterprise-style Node.js framework.

Trade-offs:

- More boilerplate than Express.
- Steeper learning curve.
- Can feel heavy for very small APIs.

Decision rationale: feature flag systems need clear boundaries across
controllers, services, evaluation engine, audit logging, and persistence. NestJS
supports that structure well.

### 4. API Style: REST JSON API

Used for:

- `/v1/projects`
- `/v1/projects/{projectKey}/flags`
- `/v1/projects/{projectKey}/flags/{flagKey}/rules`
- `/v1/evaluate`
- `/v1/projects/{projectKey}/audit-logs`

Reasons to choose it:

- Simple and familiar.
- Easy to test with curl, Postman, or Swagger.
- Easy for the demo app to call.
- Matches the project requirements.

Trade-offs:

- Less flexible than GraphQL for complex querying.
- Multiple endpoints may be needed as the system grows.
- Clients must manually coordinate some requests.

Decision rationale: REST is best for this MVP because the required workflows are
straightforward CRUD plus evaluation.

### 5. API Documentation: Swagger / OpenAPI

Used for:

- API exploration.
- Mentor/demo explanation.
- Contract documentation.

Reasons to choose it:

- NestJS integrates well with Swagger.
- Reviewers can quickly inspect the API.
- Helps frontend development.
- Supports presentation-readiness.

Trade-offs:

- Requires DTO annotations for the best output.
- Docs can become inaccurate if not maintained.

Decision rationale: this project needs to be explainable. Swagger makes the
backend easier to review and demo.

### 6. Database: PostgreSQL

Used for:

- Projects.
- Feature flags.
- Rules.
- Sample user contexts.
- Audit logs.

Reasons to choose it:

- Strong relational integrity.
- Good support for foreign keys and uniqueness constraints.
- Reliable for transactional audit logging.
- Supports JSON fields for flexible rule parameters.
- Industry-standard and easy to justify.

Trade-offs:

- Requires local setup.
- More operational overhead than SQLite.
- Slightly more complex than an in-memory database.

Decision rationale: audit logging and relational consistency are core
requirements. PostgreSQL is the right professional choice.

### 7. ORM and Migrations: Prisma

Used for:

- Database schema.
- Migrations.
- Type-safe database access.
- Seed scripts.

Reasons to choose it:

- Type-safe queries.
- Clean schema file.
- Easy migrations.
- Good developer experience.
- Works very well with TypeScript.

Trade-offs:

- Abstracts SQL, which can hide database details.
- Some advanced SQL patterns are harder.
- Prisma Client generation adds a build step.

Decision rationale: Prisma gives strong productivity without sacrificing enough
correctness for this MVP.

### 8. Validation: class-validator + class-transformer

Used for:

- DTO validation in NestJS.
- Request body validation.
- Key format validation.
- Error handling foundation.

Reasons to choose it:

- Standard NestJS validation approach.
- Keeps validation at the API boundary.
- Prevents invalid data from reaching services.
- Supports clear `VALIDATION_ERROR` responses.

Trade-offs:

- Decorator-based validation can be verbose.
- Some complex validation may need custom validators.

Decision rationale: input validation is a required MVP deliverable, so it should
be added from the beginning.

### 9. Testing: Jest + Supertest

Used for:

- Unit tests.
- Evaluation engine tests.
- API integration tests.

Reasons to choose it:

- Default testing stack for NestJS.
- Great for deterministic evaluation tests.
- Supertest is good for HTTP endpoint testing.
- Easy to explain and run locally.

Trade-offs:

- Integration tests need careful database setup later.
- Jest config can become complex in monorepos.

Decision rationale: rule evaluation, audit logging, and API errors must be
tested. Jest is the safest default.

### 10. Frontend Framework: React

Used for:

- Admin dashboard.
- Demo application.

Reasons to choose it:

- Popular and familiar.
- Good ecosystem.
- Works well with Vite and TypeScript.
- Easy to build admin screens and demo panels.
- Easy to find examples and debug.

Trade-offs:

- Requires state management decisions.
- Can become messy if components are not structured well.
- More flexible than opinionated, so discipline is needed.

Decision rationale: React is practical, explainable, and fast enough for this
MVP.

### 11. Frontend Build Tool: Vite

Used for:

- Admin app.
- Demo app.

Reasons to choose it:

- Fast local development.
- Simple setup.
- Excellent TypeScript and React support.
- Lightweight compared with heavier frameworks.

Trade-offs:

- Less full-stack structure than Next.js.
- Does not provide routing or data conventions by default.
- Production deployment decisions are left to the team.

Decision rationale: the admin and demo apps are client-side MVP apps. Vite is
simpler than Next.js and avoids unnecessary complexity.

### 12. Shared Contracts Package

Used for:

```text
packages/contracts
```

Example shared types:

- `EvaluationRequest`
- `EvaluationResponse`
- `EvaluationReason`
- `ApiErrorResponse`

Reasons to choose it:

- Backend and frontend use the same API types.
- Reduces mismatch between API and UI.
- Makes evaluation response guardrails explicit.

Trade-offs:

- Requires workspace setup.
- Types do not replace runtime validation.
- Must avoid putting backend-only logic in the shared package.

Decision rationale: evaluation response shape is a non-negotiable requirement,
so shared contracts are worth adding early.

### 13. Local Infrastructure: Docker Compose

Used for:

- PostgreSQL local development.

Reasons to choose it:

- Easy database setup.
- Consistent environment for all developers.
- Good README quickstart experience.
- Avoids requiring manual PostgreSQL installation.

Trade-offs:

- Requires Docker.
- Adds some operational knowledge.
- Database startup can fail if ports are already used.

Decision rationale: the project must be easy to run and demo. Docker Compose
helps with that.

### 14. Cache: In-Memory Cache First

Used for:

- Future evaluation optimization.

Reasons to choose it:

- Simple.
- No extra infrastructure.
- Enough for MVP/demo scale.
- Matches architecture docs.

Trade-offs:

- Not shared across multiple backend instances.
- Cache is lost on restart.
- Not suitable for serious distributed production use.

Decision rationale: for the MVP, in-memory cache is enough. Redis can be
discussed as a future enhancement.

### Alternatives considered

#### NestJS vs Express

Choose NestJS because this project needs structure, not just quick routing.
Express is simpler, but NestJS gives better module boundaries, DTO validation,
Swagger integration, and testability.

#### PostgreSQL vs MongoDB

Choose PostgreSQL because the project needs relational integrity and audit
transactions. MongoDB is flexible, but this system has clear relationships:
projects, flags, rules, and audit logs.

#### Prisma vs TypeORM

Choose Prisma because its schema and generated client are easier to work with
in a TypeScript MVP. TypeORM is powerful, but Prisma has a cleaner developer
experience for this project.

#### React/Vite vs Next.js

Choose React + Vite because the admin and demo apps do not need server-side
rendering. Next.js would be useful for a production web app, but it adds
unnecessary complexity here.

#### REST vs GraphQL

Choose REST because the required API flows are simple and easier to demonstrate.
GraphQL would be overkill for this MVP.

### Final recommended stack

| Area | Choice |
| --- | --- |
| Language | TypeScript |
| Monorepo | npm workspaces |
| Backend | NestJS |
| API | REST JSON under `/v1` |
| API docs | Swagger/OpenAPI |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | class-validator/class-transformer |
| Testing | Jest + Supertest |
| Admin app | React + Vite |
| Demo app | React + Vite |
| Shared contracts | TypeScript package |
| Local DB | Docker Compose |
| Cache | In-memory first, Redis later if needed |

The stack is professional, explainable, and appropriate for the July 2026
presentation. It is not the simplest possible stack, but it balances MVP speed
with engineering credibility.

## Key decisions and rationale

1. Use TypeScript everywhere to reduce API contract drift and keep rule
   evaluation code safer.
2. Use npm workspaces because the project has three apps plus shared contracts
   that should evolve together.
3. Use NestJS instead of Express to preserve clear service/module boundaries and
   make validation, Swagger, and tests easier.
4. Use REST instead of GraphQL because CRUD and evaluation endpoints are simple
   and demo-friendly.
5. Use PostgreSQL instead of MongoDB or in-memory storage because audit logging,
   uniqueness, and foreign keys are central to the MVP.
6. Use Prisma because it provides a concise schema and type-safe database access
   suitable for a TypeScript mini project.
7. Use React + Vite instead of Next.js because admin and demo apps do not need
   server-side rendering for the MVP.
8. Use Docker Compose for local PostgreSQL to make setup repeatable.
9. Use in-memory cache first and discuss Redis only as a future enhancement.

## Commands, files, and artifacts

Recommended source layout:

```text
feature-flag-platform/
  apps/
    api/
    admin/
    demo/
  packages/
    contracts/
  docker-compose.yml
  package.json
  tsconfig.base.json
  .env.example
  README.md
```

Important paths and artifacts:

- `apps/api`: NestJS backend app.
- `apps/admin`: React + Vite admin dashboard.
- `apps/demo`: React + Vite demo app.
- `packages/contracts`: shared TypeScript API contracts.
- `docker-compose.yml`: local PostgreSQL service.
- `tsconfig.base.json`: shared strict TypeScript defaults.
- `README.md`: quickstart commands and local URLs.

Important API and contract conventions:

- API base path: `/v1`.
- Evaluation endpoint: `POST /v1/evaluate`.
- Evaluation responses must include `enabled`, `reason`, `projectKey`, and
  `flagKey`.
- Missing project or flag must return `enabled=false` with `reason=NOT_FOUND`.

## Validation checklist

Use this checklist when reviewing or implementing Phase 1:

- [ ] Stack choices remain aligned with `AGENTS.md`,
      `docs/plan/project-goal.md`, and
      `docs/design/software-architecture-document.md`.
- [ ] Root workspace separates `apps/*` from `packages/*`.
- [ ] Shared contracts package exists and contains evaluation request/response
      types.
- [ ] Backend uses NestJS and sets `/v1` as the global API prefix.
- [ ] Swagger/OpenAPI is available for backend review.
- [ ] Admin and demo apps use React + Vite.
- [ ] PostgreSQL can run locally through Docker Compose.
- [ ] README includes install, run, database, build, and test commands.
- [ ] No browser-exposed `VITE_*` variable contains secrets.
- [ ] Generated build output remains ignored.

## Risks and caveats

- NestJS and monorepo workspaces add setup complexity compared with a single
  Express app.
- Prisma is productive, but advanced SQL behavior may still require raw SQL or
  careful migration review.
- React + Vite does not impose routing, data fetching, or design-system
  conventions; the team must keep frontend structure disciplined.
- In-memory cache is suitable for the MVP but not for multi-instance production
  deployments.
- Shared TypeScript contracts do not replace runtime validation at the API
  boundary.

## Reuse prompts

Use these prompts in future Codex sessions:

1. "Using `docs/codex/reference/feature-flag-platform-tech-stack-decisions.md`,
   scaffold Phase 1 with npm workspaces, NestJS, React + Vite, shared contracts,
   Docker Compose PostgreSQL, and README quickstart commands."
2. "Review the current implementation against the tech stack decisions reference
   and identify any stack drift or missing Phase 1 artifacts."
3. "Explain the chosen stack for the presentation, including trade-offs versus
   Express, MongoDB, TypeORM, Next.js, and GraphQL."
4. "Before implementing Phase 2, verify that the Phase 1 scaffold follows the
   stack decisions and preserves control-plane/data-plane separation."
