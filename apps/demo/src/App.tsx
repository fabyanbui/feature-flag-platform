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