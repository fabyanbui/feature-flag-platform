# Phase 1 Admin Dashboard Scaffold — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response.

## Original request context

The user is implementing Phase 1 of the feature flag platform roadmap step by
step. Phase 1 covers project scaffold and local workflow only:

- Backend app using NestJS.
- Admin app.
- Demo app.
- Shared TypeScript config.
- Local environment configuration.
- PostgreSQL local setup.
- README quickstart commands.

Immediately before this reference was requested, the user had completed:

1. Root npm workspace setup.
2. NestJS backend scaffold under `apps/backend`.
3. Shared TypeScript configuration with `tsconfig.base.json`.

The latest Codex response taught Step 4: scaffold the admin dashboard app using
Vite, React, and TypeScript. The response intentionally avoided implementing
feature flag CRUD, rule editing, or audit-log UI because those are later roadmap
phases.

Relevant guardrails from `AGENTS.md` and project docs:

- Required MVP deliverables take priority over enhancements.
- Keep control-plane/admin workflows separate from data-plane evaluation.
- Preserve safe defaults, deterministic evaluation, append-only audit logging,
  and stable non-PII targeting keys.
- Feature flag status labels are distinct from runtime On/Off state.

## Full response reference

### Step 4 goal

Create the admin dashboard shell in:

```text
apps/admin
```

Use Vite, React, and TypeScript. This is still Phase 1, so the app should be a
professional scaffold only. Do not build project CRUD, flag CRUD, rule editing,
or audit-log screens in this step.

### 4.1 Scaffold the Vite React app

From the repository root, run:

```bash
npm create vite@latest apps/admin -- --template react-ts
```

If prompted, choose:

```text
React
TypeScript
```

### 4.2 Rename the workspace package

Open:

```text
apps/admin/package.json
```

Change the package name to:

```json
"name": "@ffp/admin"
```

Make sure it has:

```json
"private": true
```

The top of `apps/admin/package.json` should look similar to:

```json
{
  "name": "@ffp/admin",
  "private": true,
  "version": "0.0.0"
}
```

The generated scripts and dependencies from Vite should be preserved.

### 4.3 Install dependencies from the root

From the repository root, run:

```bash
npm install
```

Do not run `npm install` inside `apps/admin`. Keeping installation at the root
preserves a single workspace-aware `package-lock.json`.

### 4.4 Connect admin TypeScript to the shared config

Open:

```text
apps/admin/tsconfig.app.json
```

Add this top-level field:

```json
"extends": "../../tsconfig.base.json"
```

The file should look similar to:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
  },
  "include": ["src"]
}
```

Preserve the generated Vite `compilerOptions`. The shared root TypeScript config
should supply common strictness, while Vite-specific compiler options remain in
the admin app.

### 4.5 Add admin environment example

Create:

```text
apps/admin/.env.example
```

Add:

```bash
VITE_API_BASE_URL=http://localhost:3000/v1
VITE_DEFAULT_PROJECT_KEY=demo-project
VITE_DEFAULT_FLAG_KEY=new-checkout
```

These values prepare the dashboard to call the backend through
`VITE_API_BASE_URL` in later phases.

### 4.6 Replace the default page with a professional placeholder

Open:

```text
apps/admin/src/App.tsx
```

Replace it with:

```tsx
import './App.css';

function App() {
  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Feature Flag Platform</p>
        <h1>Admin Dashboard</h1>
        <p>
          Control-plane workspace for managing projects, feature flags, rollout
          rules, and audit logs.
        </p>

        <dl className="status-grid" aria-label="Phase 1 admin scaffold status">
          <div>
            <dt>API base URL</dt>
            <dd>{import.meta.env.VITE_API_BASE_URL ?? 'Not configured'}</dd>
          </div>
          <div>
            <dt>Default project</dt>
            <dd>{import.meta.env.VITE_DEFAULT_PROJECT_KEY ?? 'demo-project'}</dd>
          </div>
          <div>
            <dt>Runtime state</dt>
            <dd>Not evaluated in admin scaffold</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

export default App;
```

Open:

```text
apps/admin/src/App.css
```

Replace it with:

```css
#root {
  min-height: 100vh;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 32rem),
    #0f172a;
  color: #e2e8f0;
}

.hero-card {
  width: min(100%, 56rem);
  padding: 2rem;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 1.5rem;
  background: rgba(15, 23, 42, 0.78);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3);
}

.eyebrow {
  margin: 0 0 0.75rem;
  color: #93c5fd;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 6vw, 4rem);
}

p {
  max-width: 44rem;
  color: #cbd5e1;
  line-height: 1.7;
}

.status-grid {
  display: grid;
  gap: 1rem;
  margin-top: 2rem;
}

.status-grid div {
  padding: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 1rem;
  background: rgba(30, 41, 59, 0.72);
}

dt {
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
}

dd {
  margin: 0.35rem 0 0;
  color: #f8fafc;
  font-weight: 600;
}
```

This placeholder is presentation-ready but intentionally does not implement
admin feature workflows yet.

### 4.7 Run and validate admin

From the repository root, run:

```bash
npm run dev:admin
```

Open:

```text
http://localhost:5173
```

Then validate the admin build:

```bash
npm run build --workspace=@ffp/admin
```

Finally, validate whitespace:

```bash
npm run diff:check
```

## Key decisions and rationale

- **Use Vite React TypeScript for the admin app.** This matches the expected
  lightweight frontend stack and keeps dashboard development fast.
- **Name the workspace `@ffp/admin`.** Scoped workspace names make root scripts
  explicit and reduce ambiguity with future apps.
- **Install from the root only.** A single root `package-lock.json` keeps the
  monorepo dependency graph predictable.
- **Extend `tsconfig.base.json`.** Shared strictness stays centralized while
  app-specific TypeScript settings remain local.
- **Use `VITE_API_BASE_URL`.** Vite exposes only `VITE_`-prefixed variables to
  browser code, which is appropriate for non-secret frontend configuration.
- **Use a control-plane placeholder.** The admin scaffold describes project,
  flag, rule, and audit-log management without implementing those later-phase
  workflows early.
- **Avoid runtime evaluation in the admin scaffold.** This preserves the
  project distinction between control plane and data plane.

## Commands, files, and artifacts

### Commands

```bash
npm create vite@latest apps/admin -- --template react-ts
npm install
npm run dev:admin
npm run build --workspace=@ffp/admin
npm run diff:check
```

### Files created or changed

```text
apps/admin/package.json
apps/admin/tsconfig.app.json
apps/admin/.env.example
apps/admin/src/App.tsx
apps/admin/src/App.css
```

### Expected runtime URL

```text
http://localhost:5173
```

## Validation checklist

Step 4 is complete when:

- `apps/admin` exists.
- `apps/admin/package.json` is named `@ffp/admin`.
- `apps/admin/tsconfig.app.json` extends `../../tsconfig.base.json`.
- `apps/admin/.env.example` exists.
- `npm run dev:admin` starts on port `5173`.
- `npm run build --workspace=@ffp/admin` succeeds.
- `npm run diff:check` succeeds.
- The rendered screen clearly says `Admin Dashboard`.
- The admin screen describes control-plane management, not demo-app runtime
  behavior.

## Risks and caveats

- Do not implement admin CRUD screens in Phase 1. Project, flag, rule, and
  audit-log workflows belong to later roadmap phases.
- Do not add browser-exposed secrets. Only non-secret values should use
  `VITE_` variables.
- Do not confuse feature flag status labels with runtime On/Off state. The
  placeholder explicitly says runtime state is not evaluated in the admin
  scaffold.
- If `npm create vite` generates a different TypeScript config shape, preserve
  Vite's generated compiler options and add only the root `extends` field.
- If `npm run build --workspace=@ffp/admin` fails because of strict TypeScript
  options, fix the code rather than weakening shared strictness.

## Reuse prompts

- "Continue Phase 1 from the admin dashboard scaffold reference and teach me
  Step 5."
- "Review my `apps/admin` scaffold against
  `docs/codex/reference/phase-1-admin-dashboard-scaffold.md`."
- "Update the admin scaffold to improve accessibility while keeping it in
  Phase 1 scope."
- "After Step 4 is complete, help scaffold the demo app without implementing
  evaluation logic yet."
