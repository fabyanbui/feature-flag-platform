import { useState } from 'react';
import './App.css';
import { FlagListPage } from './pages/FlagListPage';
import { ProjectListPage } from './pages/ProjectListPage';
import { FlagForm } from './pages/FlagForm';
import { RuleEditorPage } from './pages/RuleEditorPage';

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
        <FlagForm
          projectKey={selectedProjectKey}
          flagKey={selectedFlagKey}
          onCancel={() => setView('flags')}
          onSaved={() => setView('flags')}
        />
      ) : null}

      {view === 'rules' && selectedProjectKey && selectedFlagKey ? (
        <RuleEditorPage
          projectKey={selectedProjectKey}
          flagKey={selectedFlagKey}
          onBackToFlags={() => setView('flags')}
        />
      ) : null}
    </main>
  );
}

export default App;