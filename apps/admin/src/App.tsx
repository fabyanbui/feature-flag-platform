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