import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';

type EvaluationResponse = {
  projectKey: string;
  flagKey: string;
  enabled: boolean;
  variant: 'on' | 'off';
  reason: string;
  matchedRuleId: string | null;
};

type EvaluationContext = {
  targetingKey?: string;
  userId?: string;
  roles?: string[];
  attributes?: Record<string, unknown>;
};

type DemoScenario = {
  id: string;
  title: string;
  description: string;
  projectKey: string;
  flagKey: string;
  context: EvaluationContext;
  presenterNote: string;
};

const demoScenarios: DemoScenario[] = [
  {
    id: 'global-toggle',
    title: 'Global Toggle',
    description:
      'Evaluates a globally served flag. Toggle this flag in the admin dashboard, then retry evaluation here.',
    projectKey: 'demo-project',
    flagKey: 'beta-dashboard',
    context: {
      targetingKey: 'demo-user-global',
      userId: 'demo-user-global',
      roles: ['user'],
    },
    presenterNote:
      'Use the admin dashboard to enable/disable or kill-switch beta-dashboard, then click Evaluate.',
  },
  {
    id: 'role-targeting-on',
    title: 'Role Targeting — Beta Tester',
    description:
      'A beta tester should match the ROLE_TARGETING rule for new-checkout.',
    projectKey: 'demo-project',
    flagKey: 'new-checkout',
    context: {
      targetingKey: 'demo-user-beta',
      userId: 'demo-user-beta',
      roles: ['beta-tester'],
      attributes: { plan: 'pro' },
    },
    presenterNote: 'Expected reason: ROLE_MATCH.',
  },
  {
    id: 'percentage-on',
    title: 'Percentage Rollout — Included User',
    description:
      'This user has no matching role but falls inside the deterministic 50% rollout bucket.',
    projectKey: 'demo-project',
    flagKey: 'new-checkout',
    context: {
      targetingKey: 'demo-rollout-on',
      userId: 'demo-rollout-on',
      roles: ['user'],
    },
    presenterNote: 'Expected reason: PERCENTAGE_ROLLOUT.',
  },
  {
    id: 'percentage-off',
    title: 'Percentage Rollout — Excluded User',
    description:
      'This user has no matching role and falls outside the deterministic 50% rollout bucket.',
    projectKey: 'demo-project',
    flagKey: 'new-checkout',
    context: {
      targetingKey: 'demo-rollout-off',
      userId: 'demo-rollout-off',
      roles: ['user'],
    },
    presenterNote: 'Expected reason: DEFAULT_OFF.',
  },
  {
    id: 'not-found',
    title: 'Missing Project / Flag',
    description:
      'Demonstrates safe fallback when the project or flag does not exist.',
    projectKey: 'missing-project',
    flagKey: 'missing-flag',
    context: {
      targetingKey: 'demo-missing-user',
      userId: 'demo-missing-user',
      roles: ['user'],
    },
    presenterNote: 'Expected result: enabled=false, reason=NOT_FOUND.',
  },
];

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/v1';

function App() {
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    demoScenarios[0].id,
  );

  const [result, setResult] = useState<EvaluationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedScenario = useMemo(
    () =>
      demoScenarios.find((scenario) => scenario.id === selectedScenarioId) ??
      demoScenarios[0],
    [selectedScenarioId],
  );

  const evaluateFlag = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectKey: selectedScenario.projectKey,
          flagKey: selectedScenario.flagKey,
          context: selectedScenario.context,
        }),
      });

      if (!response.ok) {
        throw new Error(`Evaluation failed with status ${response.status}`);
      }

      const data = (await response.json()) as EvaluationResponse;
      setResult(data);
    } catch {
      setResult(null);
      setErrorMessage(
        'Could not evaluate the feature flag. Check that the backend is running and the Phase 6 project exists.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedScenario]);

  useEffect(() => {
    void evaluateFlag();
  }, [evaluateFlag]);

  const runtimeState = result ? (result.enabled ? 'On' : 'Off') : 'Not evaluated';

  return (
    <main className="demo-shell">
      <section className="demo-card">
        <p className="eyebrow">Feature Flag Platform</p>
        <h1>New Checkout Demo</h1>
        <p>
          This demo app calls the data-plane evaluation API and shows whether the
          New Checkout feature is runtime On or Off for the selected user
          context.
        </p>

        <section className="panel" aria-labelledby="scenario-heading">
          <h2 id="scenario-heading">Demo scenario</h2>

          <div className="scenario-options">
            {demoScenarios.map((scenario) => (
              <label className="scenario-option" key={scenario.id}>
                <input
                  checked={selectedScenario.id === scenario.id}
                  name="demo-scenario"
                  onChange={() => setSelectedScenarioId(scenario.id)}
                  type="radio"
                />
                <span>
                  <strong>{scenario.title}</strong>
                  <small>{scenario.description}</small>
                </span>
              </label>
            ))}
          </div>

          <p className="presenter-note">{selectedScenario.presenterNote}</p>

          <button disabled={isLoading} onClick={evaluateFlag} type="button">
            {isLoading ? 'Evaluating...' : 'Evaluate flag'}
          </button>
        </section>

        {errorMessage ? (
          <section className="error-panel" role="alert">
            <h2>Evaluation unavailable</h2>
            <p>{errorMessage}</p>
            <button onClick={evaluateFlag} type="button">
              Retry
            </button>
          </section>
        ) : null}

        <dl className="result-grid" aria-label="Evaluation result">
          <div>
            <dt>Evaluation API</dt>
            <dd>{apiBaseUrl}</dd>
          </div>
          <div>
            <dt>Project key</dt>
            <dd>{result?.projectKey ?? selectedScenario.projectKey}</dd>
          </div>
          <div>
            <dt>Flag key</dt>
            <dd>{result?.flagKey ?? selectedScenario.flagKey}</dd>
          </div>
          <div>
            <dt>Targeting key</dt>
            <dd>{selectedScenario.context.targetingKey ?? 'None'}</dd>
          </div>
          <div>
            <dt>User roles</dt>
            <dd>
              {selectedScenario.context.roles?.length
                ? selectedScenario.context.roles.join(', ')
                : 'None'}
            </dd>
          </div>
          <div>
            <dt>Runtime state</dt>
            <dd>{isLoading ? 'Loading...' : runtimeState}</dd>
          </div>
          <div>
            <dt>Enabled</dt>
            <dd>{result ? String(result.enabled) : 'Not evaluated'}</dd>
          </div>
          <div>
            <dt>Reason</dt>
            <dd>{result?.reason ?? 'Not evaluated'}</dd>
          </div>
        </dl>

        <section
          className={result?.enabled ? 'feature-card feature-on' : 'feature-card feature-off'}
          aria-live="polite"
        >
          {result?.enabled ? (
            <>
              <p className="eyebrow">Feature On</p>
              <h2>New Checkout Widget</h2>
              <p>
                This user can see the new checkout because the feature flag
                evaluated to On.
              </p>
            </>
          ) : (
            <>
              <p className="eyebrow">Feature Off</p>
              <h2>Checkout remains hidden</h2>
              <p>
                The new checkout is hidden for this user context. This is the
                safe default when no targeting rule matches.
              </p>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
