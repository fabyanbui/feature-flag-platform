# Repository Test Validation Commands — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response.

## Original request context

The user asked Codex not to run commands, but to list all test commands for the
feature flag platform repository. The response focused on runnable npm scripts
available from the root workspace and the backend workspace.

Relevant repo guardrails from `AGENTS.md`:

- Use root npm workspace commands documented in `README.md`.
- Validate implementation work with tests, lint checks, builds, and whitespace
  checks before submission.
- Prioritize deterministic evaluation, validation/error handling, audit logging,
  and the backend/API MVP deliverables.

## Full response reference

Use these commands when a future Codex session or developer needs to run the
project test suite or related validation checks.

```bash
# Run all workspace tests that define a test script
npm run test

# Backend unit tests
npm run test --workspace=@ffp/backend

# Backend integration tests
npm run test:integration --workspace=@ffp/backend

# Backend e2e tests
npm run test:e2e --workspace=@ffp/backend

# Backend coverage
npm run test:cov --workspace=@ffp/backend

# Backend watch mode
npm run test:watch --workspace=@ffp/backend

# Backend debug mode
npm run test:debug --workspace=@ffp/backend
```

Recommended full pre-submit validation sequence:

```bash
npm run lint
npm run test
npm run test:integration --workspace=@ffp/backend
npm run test:e2e --workspace=@ffp/backend
npm run build
npm run diff:check
```

Optional Prisma schema validation:

```bash
npm run prisma:validate --workspace=@ffp/backend
```

## Key decisions and rationale

- `npm run test` is the root workspace command and runs tests for workspaces
  that define a `test` script.
- The backend has the active Jest test scripts, including unit, integration,
  e2e, coverage, watch, and debug modes.
- `npm run lint`, `npm run build`, and `npm run diff:check` are included in the
  pre-submit sequence because they are repository-level validation commands,
  even though they are not strictly test commands.
- `prisma:validate` is listed as optional because it validates the Prisma schema
  for the backend persistence layer without running application tests.

## Commands, files, and artifacts

Commands referenced:

- `npm run test`
- `npm run test --workspace=@ffp/backend`
- `npm run test:integration --workspace=@ffp/backend`
- `npm run test:e2e --workspace=@ffp/backend`
- `npm run test:cov --workspace=@ffp/backend`
- `npm run test:watch --workspace=@ffp/backend`
- `npm run test:debug --workspace=@ffp/backend`
- `npm run lint`
- `npm run build`
- `npm run diff:check`
- `npm run prisma:validate --workspace=@ffp/backend`

Files that define these scripts:

- `package.json`
- `apps/backend/package.json`

Current workspace note inferred from the inspected scripts: `apps/admin` and
`apps/demo` expose build, lint, dev, and preview scripts, but they do not define
workspace-specific test scripts in the inspected package files.

## Validation checklist

For a full local pre-submit pass, run:

1. `npm run lint`
2. `npm run test`
3. `npm run test:integration --workspace=@ffp/backend`
4. `npm run test:e2e --workspace=@ffp/backend`
5. `npm run build`
6. `npm run diff:check`
7. Optionally, `npm run prisma:validate --workspace=@ffp/backend`

When integration or e2e tests need local server binding or database access,
ensure the local environment allows those operations and that the database
configuration is available. Do not print connection strings or secrets.

## Risks and caveats

- Integration and e2e tests may require local network binding through Supertest
  and may require PostgreSQL access, depending on the test file.
- Sandbox environments can block local `listen` calls or database connections.
  Such failures are environmental unless reproduced in an unrestricted local
  development shell.
- The backend `lint` script uses `--fix`, so it may modify TypeScript files.
  Review `git diff` after running it.
- If frontend test scripts are added later, update this reference and the root
  pre-submit validation sequence.

## Reuse prompts

- "Run the full pre-submit validation sequence from
  `docs/codex/reference/repository-test-validation-commands.md`."
- "Update the repository test command reference after adding frontend tests."
- "Compare `package.json` scripts with the test command reference and fix any
  drift."
- "Explain which validation commands are required before the July submission
  and which are optional developer conveniences."
