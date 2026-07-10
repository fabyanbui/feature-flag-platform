# Phase 19 Docker Compose Stabilization — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a reference, not a transcript.

## Scope

The user asked Codex to implement Phase 19 from
`docs/plan/recommended-enhancements-roadmap.md` after completing the MVP and
recommended Phases 10 through 18. The Phase 19 goal was to make the Docker
workflow reliable from a clean environment after schema, RBAC, SDK, cache, and
optional Redis work were known.

This session used these repo skills:

- `.agents/skills/workflow-feature-delivery/SKILL.md`
- `.agents/skills/docker-compose-delivery/SKILL.md`
- `.agents/skills/workflow-quality-review/SKILL.md` for the Phase 20 readiness
  decision

The final answer to the Phase 20 readiness question was: yes, it is safe to
move to Phase 20 after committing the Phase 19 changes.

## High-signal outcomes

- `docker compose up --build` is now the documented final local demo workflow.
- Compose now has one-shot `migrate` and `demo-seed` services.
- Runtime ordering is now:

  ```text
  postgres healthy
  -> migrate exits 0
  -> demo-seed exits 0
  -> backend healthy
  -> admin and demo healthy
  ```

- The backend no longer starts before migration and seed complete.
- Redis remains optional under the existing `redis` profile and is not part of
  the stable demo startup path.
- The demo seed was changed to be non-destructive for automatic Compose reruns:
  it creates missing demo records but does not reset existing flag state, rules,
  group kill switches, lifecycle state, group assignments, or sample users.
- Documentation now describes clean-environment startup, troubleshooting, demo
  setup, and Phase 19 completion evidence.
- Phase 19 completion evidence was added to
  `docs/plan/recommended-enhancements-roadmap.md`.

## Files and artifacts

Edited files:

- `docker-compose.yml`
  - added shared backend build and environment anchors,
  - added `migrate` one-shot service,
  - added `demo-seed` one-shot service,
  - made `backend` depend on `demo-seed: service_completed_successfully`,
  - kept frontend build args browser-facing via `VITE_API_BASE_URL`,
  - kept Redis optional under profile `redis`.
- `apps/backend/prisma/seed.ts`
  - changed seed `upsert` update branches to `{}` for demo records,
  - added a comment documenting non-destructive Phase 19 seed behavior,
  - changed the final log message to `Seed data is present.`
- `.env.example`
  - renamed Docker Compose section from baseline to demo workflow,
  - clarified that Compose migration, seed, and backend containers use the
    `postgres` service host.
- `README.md`
  - replaced Phase 17 baseline instructions with the Phase 19 demo workflow,
  - documented `docker compose up --build`, detached mode, expected service
    order, safe seed reruns, optional Redis profile, endpoint checks, and data
    volume cleanup.
- `docs/release/troubleshooting.md`
  - updated Compose troubleshooting for `migrate` and `demo-seed`,
  - documented non-destructive seed behavior,
  - added Docker Buildx-missing workaround using the legacy builder,
  - added checks for `docker compose ps -a`, migration logs, seed logs, and
    backend logs.
- `docs/release/demo-script.md`
  - updated pre-demo setup to prefer the Phase 19 Docker workflow,
  - preserved npm-local fallback commands,
  - added common Docker recovery commands.
- `docs/plan/recommended-enhancements-roadmap.md`
  - added Phase 19 completion evidence and validation summary.

No files were intentionally removed or renamed.

## Decisions and guardrails

- Preserve the completed MVP and Phases 10-18 as the protected baseline.
- Treat Phase 19 as stabilization, not as a product-feature expansion.
- Use one-shot Compose services instead of putting migration/seed logic inside
  the long-running backend process.
- Keep the normal npm-local workflow available:

  ```bash
  npm run dev:backend
  npm run dev:admin
  npm run dev:demo
  npm run prisma:migrate --workspace=@ffp/backend
  npm run db:seed --workspace=@ffp/backend
  ```

- Keep Redis optional; the stable demo path uses memory cache by default.
- Do not make seed destructive on restart. This preserves presenter edits and
  proves migration/seed rerun safety.
- Keep frontend API URLs browser-resolvable. Do not bundle
  `http://backend:3000/v1` into admin or demo assets because browser requests
  originate from the host, not from inside the Docker network.
- Preserve control-plane/data-plane separation, deterministic evaluation,
  safe defaults, append-only audit logging, and stable non-PII rollout keys.

## Validation and caveats

Validation completed successfully:

```bash
docker compose config --quiet
npm run prisma:validate --workspace=@ffp/backend
npm run lint
npm run test
npm run test:integration --workspace=@ffp/backend
npm run test:e2e --workspace=@ffp/backend
npm run build
npm run diff:check
```

Observed passing results:

- backend unit tests: 52 suites, 401 tests passed,
- JavaScript SDK tests: 21 tests passed,
- integration tests: 11 tests passed,
- E2E tests: 44 tests passed.

Docker validation used an isolated Compose project with alternate host ports to
avoid conflicting with local services. The clean stack reached:

```text
postgres healthy
migrate exited 0
demo-seed exited 0
backend healthy
admin healthy
demo healthy
```

Additional Docker checks passed:

- backend health returned OK,
- admin and demo returned HTTP 200,
- seeded evaluations returned `ROLE_MATCH` for `new-checkout` and `GLOBAL_ON`
  for `beta-dashboard`,
- CORS preflight allowed the configured admin and demo origins,
- compiled admin and demo bundles contained the browser-resolvable API URL and
  did not contain `backend:3000`,
- rerunning `migrate` reported no pending migrations,
- rerunning `demo-seed` completed successfully,
- after changing the group kill switch in the isolated stack, rerunning
  `demo-seed` preserved the edited switch and evaluation still returned
  `GROUP_KILL_SWITCH`,
- optional Redis profile started and returned `PONG`.

Caveats:

- The local Docker Buildx plugin was unavailable during validation, so Docker
  image validation used Docker's legacy builder:

  ```bash
  COMPOSE_DOCKER_CLI_BUILD=0 DOCKER_BUILDKIT=0 docker compose up --build
  ```

- `markdownlint` was not installed, so Markdown lint validation was skipped.
- Phase 19 files were still uncommitted at the Phase 20 readiness question.
  Recommended next action before Phase 20 is to commit the Phase 19 changes.

## Best reusable next prompt

Continue from the completed Phase 19 Docker Compose stabilization. First verify
that the Phase 19 changes are committed. Then implement Phase 20 as a final
recommended release review, not a broad feature expansion. Use
`docs/plan/recommended-enhancements-roadmap.md` as the active source, preserve
the MVP and Phases 10-19 regression baseline, run the strongest validation
sequence, update requirement traceability, README/design/research/report/slide
and demo documentation, and clearly distinguish completed recommended features
from optional future work.

## Source notes

This reference summarizes the current visible Codex conversation, not a raw
session log. Durable project sources used during the session:

- `AGENTS.md`
- `docs/plan/project-goal.md`
- `docs/plan/implementation-roadmap.md`
- `docs/plan/recommended-enhancements-roadmap.md`
- `docs/requirement/requirement-init.md`
- `docs/requirement/info-init.md`
- `docs/release/demo-script.md`
- `docs/release/troubleshooting.md`
- `.agents/skills/workflow-feature-delivery/SKILL.md`
- `.agents/skills/docker-compose-delivery/SKILL.md`
- `.agents/skills/workflow-quality-review/SKILL.md`
