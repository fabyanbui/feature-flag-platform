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

type DemoUser = {
  label: string;
  description: string;
  context: {
    targetingKey: string;
    userId: string;
    roles: string[];
  };
};

const demoUsers: DemoUser[] = [
  {
    label: 'Beta tester',
    description: 'Expected to match ROLE_TARGETING and see New Checkout.',
    context: {
      targetingKey: 'demo-user-beta',
      userId: 'demo-user-beta',
      roles: ['beta-tester'],
    },
  },
  {
    label: 'Regular user',
    description: 'Expected to fall through to DEFAULT_OFF.',
    context: {
      targetingKey: 'demo-user-regular',
      userId: 'demo-user-regular',
      roles: ['user'],
    },
  },
];

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/v1';
const projectKey = import.meta.env.VITE_DEFAULT_PROJECT_KEY ?? 'phase6-demo';
const flagKey = import.meta.env.VITE_DEFAULT_FLAG_KEY ?? 'new-checkout';

function App() {
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [result, setResult] = useState<EvaluationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedUser = useMemo(
    () => demoUsers[selectedUserIndex],
    [selectedUserIndex],
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
          projectKey,
          flagKey,
          context: selectedUser.context,
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
  }, [selectedUser]);

  useEffect(() => {
    void evaluateFlag();
  }, [evaluateFlag]);

  const runtimeState = result?.enabled ? 'On' : 'Off';

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
          <h2 id="scenario-heading">Scenario</h2>
          <div className="scenario-options">
            {demoUsers.map((user, index) => (
              <label className="scenario-option" key={user.label}>
                <input
                  checked={selectedUserIndex === index}
                  name="demo-user"
                  onChange={() => setSelectedUserIndex(index)}
                  type="radio"
                />
                <span>
                  <strong>{user.label}</strong>
                  <small>{user.description}</small>
                </span>
              </label>
            ))}
          </div>

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
            <dd>{result?.projectKey ?? projectKey}</dd>
          </div>
          <div>
            <dt>Flag key</dt>
            <dd>{result?.flagKey ?? flagKey}</dd>
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