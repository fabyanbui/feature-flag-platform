import { useState } from 'react';
import './App.css';
import { ProjectListPage } from './pages/ProjectListPage';

function App() {
  const [selectedProjectKey, setSelectedProjectKey] = useState<string | null>(
    null,
  );

  return (
    <main className="app-shell">
      <nav className="top-nav" aria-label="Admin navigation">
        <div>
          <strong>Feature Flag Platform</strong>
          <span>Admin Dashboard</span>
        </div>

        <div className="top-nav-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setSelectedProjectKey(null)}
          >
            Projects
          </button>
        </div>
      </nav>

      <ProjectListPage onOpenProject={setSelectedProjectKey} />

      {selectedProjectKey ? (
        <aside className="toast" role="status" aria-live="polite">
          Selected project: <strong>{selectedProjectKey}</strong>. Flag list is
          coming in Step 6.
        </aside>
      ) : null}
    </main>
  );
}

export default App;