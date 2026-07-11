import { useState } from 'react';
import './App.css';
import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/useAuth';
import { AuditLogPage } from './pages/AuditLogPage';
import type { AuditLogInitialFilters } from './pages/AuditLogPage';
import { FlagForm } from './pages/FlagForm';
import { FlagListPage } from './pages/FlagListPage';
import { FlagGroupPage } from './pages/FlagGroupPage';
import { ProjectListPage } from './pages/ProjectListPage';
import { RuleEditorPage } from './pages/RuleEditorPage';
import { StatisticsPage } from './pages/StatisticsPage';

type AdminView =
  | 'projects'
  | 'flags'
  | 'groups'
  | 'flag-form'
  | 'rules'
  | 'audit'
  | 'statistics';

function AdminApp() {
  const { identity, identities, configured, selectIdentity } = useAuth();
  const [view, setView] = useState<AdminView>('projects');
  const [selectedProjectKey, setSelectedProjectKey] = useState<string | null>(
    null,
  );
  const [selectedFlagKey, setSelectedFlagKey] = useState<string | null>(null);
  const [auditInitialFilters, setAuditInitialFilters] =
    useState<AuditLogInitialFilters | null>(null);

  function openProject(projectKey: string) {
    setSelectedProjectKey(projectKey);
    setSelectedFlagKey(null);
    setView('flags');
  }

  function openProjects() {
    setSelectedProjectKey(null);
    setSelectedFlagKey(null);
    setAuditInitialFilters(null);
    setView('projects');
  }

  function openAuditLogs(initialFilters?: AuditLogInitialFilters) {
    setAuditInitialFilters(initialFilters ?? null);
    setView('audit');
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

  function changeIdentity(key: typeof identity.key) {
    const nextIdentity = identities.find((candidate) => candidate.key === key);
    if (
      nextIdentity &&
      ((view === 'flag-form' && nextIdentity.role === 'VIEWER') ||
        (view === 'rules' && nextIdentity.role === 'VIEWER'))
    ) {
      setView(selectedProjectKey ? 'flags' : 'projects');
      setSelectedFlagKey(null);
    }
    selectIdentity(key);
  }

  function navButtonClass(targetView: AdminView) {
    return `button button-secondary top-nav-link${
      view === targetView ? ' top-nav-link-active' : ''
    }`;
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
          <label className="identity-selector">
            <span>Viewing as</span>
            <select
              value={identity.key}
              onChange={(event) =>
                changeIdentity(
                  event.target.value as typeof identity.key,
                )
              }
            >
              {identities.map((candidate) => (
                <option key={candidate.key} value={candidate.key}>
                  {candidate.label}
                </option>
              ))}
            </select>
          </label>

          <div className="identity-summary" aria-live="polite">
            <strong>{identity.role}</strong>
            <span>{identity.actor}</span>
          </div>

          <button
            type="button"
            className={navButtonClass('projects')}
            onClick={openProjects}
            aria-current={view === 'projects' ? 'page' : undefined}
          >
            Projects
          </button>

          {selectedProjectKey ? (
            <>
              <button
                type="button"
                className={navButtonClass('groups')}
                onClick={() => setView('groups')}
                aria-current={view === 'groups' ? 'page' : undefined}
              >
                Groups
              </button>

              <button
                type="button"
                className={navButtonClass('flags')}
                onClick={() => setView('flags')}
                aria-current={view === 'flags' ? 'page' : undefined}
              >
                Flags
              </button>

              <button
                type="button"
                className={navButtonClass('statistics')}
                onClick={() => setView('statistics')}
                aria-current={view === 'statistics' ? 'page' : undefined}
              >
                Statistics
              </button>

              <button
                type="button"
                className={navButtonClass('audit')}
                onClick={() => openAuditLogs()}
                aria-current={view === 'audit' ? 'page' : undefined}
              >
                Audit logs
              </button>
            </>
          ) : null}
        </div>
      </nav>

      {!configured ? (
        <div className="configuration-warning" role="alert">
          Demo RBAC tokens are not configured. Add the three
          <code>VITE_DEMO_*_TOKEN</code> values to
          <code>apps/admin/.env</code>.
        </div>
      ) : null}

      {view === 'projects' ? (
        <ProjectListPage key={identity.key} onOpenProject={openProject} />
      ) : null}

      {view === 'flags' && selectedProjectKey ? (
        <FlagListPage
          key={identity.key}
          projectKey={selectedProjectKey}
          onBackToProjects={openProjects}
          onCreateFlag={openCreateFlag}
          onEditFlag={openEditFlag}
          onEditRules={openRules}
        />
      ) : null}

      {view === 'flag-form' && selectedProjectKey ? (
        <FlagForm
          key={identity.key}
          projectKey={selectedProjectKey}
          flagKey={selectedFlagKey}
          onCancel={() => setView('flags')}
          onSaved={() => setView('flags')}
        />
      ) : null}

      {view === 'groups' && selectedProjectKey ? (
        <FlagGroupPage
          key={identity.key}
          projectKey={selectedProjectKey}
          onBackToFlags={() => setView('flags')}
          onOpenAuditLogs={() =>
            openAuditLogs({ targetType: 'FLAG_GROUP' })
          }
        />
      ) : null}

      {view === 'rules' && selectedProjectKey && selectedFlagKey ? (
        <RuleEditorPage
          key={identity.key}
          projectKey={selectedProjectKey}
          flagKey={selectedFlagKey}
          onBackToFlags={() => setView('flags')}
          onOpenAuditLogs={() => openAuditLogs()}
        />
      ) : null}

      {view === 'audit' && selectedProjectKey ? (
        <AuditLogPage
          key={`${identity.key}:${selectedProjectKey}:${
            auditInitialFilters?.targetType ?? 'all'
          }:${auditInitialFilters?.targetKey ?? ''}:${
            auditInitialFilters?.action ?? ''
          }:${
            auditInitialFilters?.actor ?? ''
          }`}
          projectKey={selectedProjectKey}
          initialFilters={auditInitialFilters ?? undefined}
          onBackToFlags={() => setView('flags')}
        />
      ) : null}

      {view === 'statistics' && selectedProjectKey ? (
        <StatisticsPage
          key={identity.key}
          projectKey={selectedProjectKey}
          onBackToFlags={() => setView('flags')}
        />
      ) : null}
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AdminApp />
    </AuthProvider>
  );
}
