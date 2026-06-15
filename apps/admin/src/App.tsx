import { useState } from 'react';
import './App.css';
import { FlagListPage } from './pages/FlagListPage';
import { ProjectListPage } from './pages/ProjectListPage';

type AdminView = 'projects' | 'flags' | 'flag-form' | 'rules';

function App() {
  const [view, setView] = useState<AdminView>('projects');
  const [selectedProjectKey, setSelectedProjectKey] = useState<string | null>(
    null,
  );
  const [selectedFlagKey, setSelectedFlagKey] = useState<string | null>(null);

  function openProject(projectKey: string) {
    setSelectedProjectKey(projectKey);
    setSelectedFlagKey(null);
    setView('flags');
  }

  function openProjects() {
    setSelectedProjectKey(null);
    setSelectedFlagKey(null);
    setView('projects');
  }

  function openCreateFlag() {
    setSelectedFlagKey(null);
    setView('flag-form');
  }

  function openEditFlag(flagKey: string) {
    setSelectedFlagKey(flagKey);
    setView('flag-form');
  }

  function openRules(flagKey: string) {
    setSelectedFlagKey(flagKey);
    setView('rules');
  }

  return (
    <main className="app-shell">
      <nav className="top-nav" aria-label="Admin navigation">
        <div>
          <strong>Feature Flag Platform</strong>
          <span>
            {selectedProjectKey
              ? `Project: ${selectedProjectKey}`
              : 'Admin Dashboard'}
          </span>
        </div>

        <div className="top-nav-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={openProjects}
          >
            Projects
          </button>

          {selectedProjectKey ? (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setView('flags')}
            >
              Flags
            </button>
          ) : null}
        </div>
      </nav>

      {view === 'projects' ? (
        <ProjectListPage onOpenProject={openProject} />
      ) : null}

      {view === 'flags' && selectedProjectKey ? (
        <FlagListPage
          projectKey={selectedProjectKey}
          onBackToProjects={openProjects}
          onCreateFlag={openCreateFlag}
          onEditFlag={openEditFlag}
          onEditRules={openRules}
        />
      ) : null}

      {view === 'flag-form' && selectedProjectKey ? (
        <section className="page-stack">
          <div className="state-card">
            <h1>Flag form coming in Step 7</h1>
            <p>
              Project: <code>{selectedProjectKey}</code>
              {selectedFlagKey ? (
                <>
                  {' '}
                  / Flag: <code>{selectedFlagKey}</code>
                </>
              ) : null}
            </p>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setView('flags')}
            >
              Back to flags
            </button>
          </div>
        </section>
      ) : null}

      {view === 'rules' && selectedProjectKey && selectedFlagKey ? (
        <section className="page-stack">
          <div className="state-card">
            <h1>Rule editor coming in Step 8</h1>
            <p>
              Project: <code>{selectedProjectKey}</code> / Flag:{' '}
              <code>{selectedFlagKey}</code>
            </p>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setView('flags')}
            >
              Back to flags
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

export default App;