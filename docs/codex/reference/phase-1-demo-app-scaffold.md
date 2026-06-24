# Phase 1 Demo App Scaffold — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response.

## Original request context

The user reported `Step 4 done` after scaffolding the Phase 1 admin dashboard.
Codex continued the Phase 1 implementation workflow with Step 5: scaffold the
demo app.

Minimal earlier context needed:

- The project is a mini feature flag management platform.
- Phase 1 is limited to project scaffold and local workflow.
- The demo app is separate from the admin dashboard.
- The admin dashboard is the control-plane UI.
- The demo app is the data-plane consumer that will later call the evaluation
  API.
- Do not implement database models, Prisma migrations, feature flag CRUD, or
  evaluation logic during Phase 1.

## Full response reference

Step 5 creates the demo application shell using Vite, React, and TypeScript.
The demo app lives at:

```text
apps/demo
```

Its intended future role is to call:

```text
POST /v1/evaluate
```

For Phase 1, the app must remain a clean placeholder. It should clearly
communicate that it is the demo application and that real evaluation is not yet
implemented.

### 5.1 Scaffold the Vite demo app

From the repository root, run:

```bash
npm create vite@latest apps/demo -- --template react-ts
```

If prompted, choose:

```text
React
TypeScript
```

### 5.2 Rename the workspace package

Open:

```text
apps/demo/package.json
```

Change the package name to:

```json
"name": "@ffp/demo"
```

Ensure it has:

```json
"private": true
```

The top of `apps/demo/package.json` should look like:

```json
{
  "name": "@ffp/demo",
  "private": true,
  "version": "0.0.0"
}
```

The exact remaining fields may differ depending on the Vite version, but the
package name and privacy flag should be present.

### 5.3 Install from the repository root

From the repository root, run:

```bash
npm install
```

Do not run install inside `apps/demo`. The project uses npm workspaces, so the
root install should update the root `package-lock.json`.

### 5.4 Connect demo TypeScript to shared config

Open:

```text
apps/demo/tsconfig.app.json
```

Add this top-level field:

```json
"extends": "../../tsconfig.base.json"
```

The file should have this shape:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
  },
  "include": ["src"]
}
```

Preserve the generated Vite compiler options. The shared config supplies common
strict TypeScript settings, while the app-specific Vite config keeps
browser/bundler settings local to the frontend.

### 5.5 Add demo environment example

Create:

```text
apps/demo/.env.example
```

Add:

```bash
VITE_API_BASE_URL=http://localhost:3000/v1
VITE_DEFAULT_PROJECT_KEY=demo-project
VITE_DEFAULT_FLAG_KEY=new-checkout
```

These values document the future evaluation API base URL and default demo keys.
They are not secrets.

### 5.6 Replace the default demo placeholder

Open:

```text
apps/demo/src/App.tsx
```

Replace it with:

```tsx
import './App.css';

function App() {
  return (
    <main className="demo-shell">
      <section className="demo-card">
        <p className="eyebrow">Feature Flag Platform</p>
        <h1>Demo Application</h1>
        <p>
          Data-plane client that will call the evaluation API and show whether a
          feature is runtime On or Off for a selected sample context.
        </p>

        <dl className="result-grid" aria-label="Phase 1 demo scaffold status">
          <div>
            <dt>Evaluation API</dt>
            <dd>{import.meta.env.VITE_API_BASE_URL ?? 'Not configured'}</dd>
          </div>
          <div>
            <dt>Project key</dt>
            <dd>{import.meta.env.VITE_DEFAULT_PROJECT_KEY ?? 'demo-project'}</dd>
          </div>
          <div>
            <dt>Flag key</dt>
            <dd>{import.meta.env.VITE_DEFAULT_FLAG_KEY ?? 'new-checkout'}</dd>
          </div>
          <div>
            <dt>Runtime state</dt>
            <dd>Not evaluated in Phase 1</dd>
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
apps/demo/src/App.css
```

Replace it with:

```css
#root {
  min-height: 100vh;
}

.demo-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  background:
    radial-gradient(circle at top right, rgba(34, 197, 94, 0.2), transparent 32rem),
    #111827;
  color: #ecfdf5;
}

.demo-card {
  width: min(100%, 56rem);
  padding: 2rem;
  border: 1px solid rgba(134, 239, 172, 0.24);
  border-radius: 1.5rem;
  background: rgba(17, 24, 39, 0.82);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3);
}

.eyebrow {
  margin: 0 0 0.75rem;
  color: #86efac;
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
  color: #d1fae5;
  line-height: 1.7;
}

.result-grid {
  display: grid;
  gap: 1rem;
  margin-top: 2rem;
}

.result-grid div {
  padding: 1rem;
  border: 1px solid rgba(134, 239, 172, 0.2);
  border-radius: 1rem;
  background: rgba(31, 41, 55, 0.76);
}

dt {
  color: #a7f3d0;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
}

dd {
  margin: 0.35rem 0 0;
  color: #f0fdf4;
  font-weight: 600;
}
```

### 5.7 Run and validate demo

From the repository root, run:

```bash
npm run dev:demo
```

Open:

```text
http://localhost:5174
```

Then build:

```bash
npm run build --workspace=@ffp/demo
```

Finally:

```bash
npm run diff:check
```

## Key decisions and rationale

- Use `apps/demo` to keep the demo application separate from the admin
  dashboard.
- Name the workspace `@ffp/demo` to match the root npm workspace scripts.
- Use `private: true` because this is an application workspace, not a package
  intended for publication.
- Extend `../../tsconfig.base.json` so shared strict TypeScript defaults apply
  consistently across backend, admin, and demo.
- Preserve Vite-generated frontend compiler options because browser apps need
  bundler-oriented TypeScript settings.
- Use `VITE_API_BASE_URL=http://localhost:3000/v1` to align with the Phase 0
  API base path.
- Show `Project key` and `Flag key` placeholders using stable demo keys:
  `demo-project` and `new-checkout`.
- Keep the runtime state as `Not evaluated in Phase 1` to avoid pretending the
  evaluation API exists before backend evaluation work is implemented.
- Maintain the control-plane/data-plane distinction: the admin app manages
  configuration, while the demo app will consume evaluation decisions.

## Commands, files, and artifacts

Commands:

```bash
npm create vite@latest apps/demo -- --template react-ts
npm install
npm run dev:demo
npm run build --workspace=@ffp/demo
npm run diff:check
```

Files and paths:

```text
apps/demo/package.json
apps/demo/tsconfig.app.json
apps/demo/.env.example
apps/demo/src/App.tsx
apps/demo/src/App.css
tsconfig.base.json
package.json
package-lock.json
```

Expected local URL:

```text
http://localhost:5174
```

Expected environment values:

```bash
VITE_API_BASE_URL=http://localhost:3000/v1
VITE_DEFAULT_PROJECT_KEY=demo-project
VITE_DEFAULT_FLAG_KEY=new-checkout
```

## Validation checklist

Step 5 is complete when:

- `apps/demo` exists.
- `apps/demo/package.json` is named `@ffp/demo`.
- `apps/demo/package.json` has `private: true`.
- `apps/demo/tsconfig.app.json` extends `../../tsconfig.base.json`.
- `apps/demo/.env.example` exists.
- `npm run dev:demo` starts on port `5174`.
- `npm run build --workspace=@ffp/demo` succeeds.
- The demo screen clearly says `Demo Application`, not `Admin Dashboard`.
- No real evaluation API call is implemented yet.
- `npm run diff:check` succeeds.

## Risks and caveats

- Do not add real evaluation logic in Phase 1. Evaluation belongs to later
  backend/data-plane phases.
- Do not add Prisma schema, migrations, seed data, or database access in this
  step.
- Do not confuse feature flag lifecycle status labels
  (`Enabled`/`Disabled`/`Archived`) with runtime evaluation state (`On`/`Off`).
- Do not expose secrets in Vite environment variables. Vite `VITE_*` values are
  browser-exposed and must only contain safe public configuration.
- Keep demo user and rollout keys stable and non-PII.

## Reuse prompts

- `Continue Phase 1 from the demo app scaffold and guide me through local environment cleanup.`
- `Review apps/demo against the Phase 1 demo scaffold reference.`
- `Validate that the demo app remains data-plane only and has no premature evaluation logic.`
- `Create a short README quickstart section for running backend, admin, and demo after Phase 1.`
