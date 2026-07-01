import {
  createFeatureFlagClient,
  isClientEvaluationError,
  type SdkEvaluationResult,
} from '@ffp/js-sdk';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import {
  fallbackDemoScenarios,
  listDemoAccounts,
  type DemoScenario,
} from './services/demoAccountService';

type DemoFlagKey = 'beta-dashboard' | 'new-checkout';

type BusinessFeature = 'Account dashboard' | 'Checkout experience';

type DemoFeature = {
  flagKey: DemoFlagKey;
  businessFeature: BusinessFeature;
  displayName: string;
  diagnosticSummary: string;
  expectedReason: string;
  expectedOutcome: string;
};

type EvaluationResultMap = Partial<Record<DemoFlagKey, SdkEvaluationResult>>;

const demoFeatures: DemoFeature[] = [
  {
    flagKey: 'beta-dashboard',
    businessFeature: 'Account dashboard',
    displayName: 'Beta Account Dashboard',
    diagnosticSummary: 'Global business dashboard module controlled by the beta-dashboard flag.',
    expectedReason: 'GLOBAL_ON',
    expectedOutcome: 'Beta Account Dashboard is visible while the seeded global enablement is active.',
  },
  {
    flagKey: 'new-checkout',
    businessFeature: 'Checkout experience',
    displayName: 'New One-Page Checkout',
    diagnosticSummary: 'Targeted checkout module controlled by role and percentage rollout rules.',
    expectedReason: 'Scenario-specific',
    expectedOutcome: 'Checkout visibility depends on the selected customer context.',
  },
];

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/v1';
const environmentKey = import.meta.env.VITE_ENVIRONMENT_KEY ?? 'production';
const sdkTimeoutMs = 1500;

function formatRoles(roles: string[] | undefined) {
  return roles?.length ? roles.join(', ') : 'None';
}

function isResultForFeature(
  result: SdkEvaluationResult | undefined,
  scenario: DemoScenario,
  feature: DemoFeature,
) {
  return (
    result?.projectKey === scenario.projectKey && result.flagKey === feature.flagKey
  );
}

function getDecisionSource(
  results: SdkEvaluationResult[],
  isLoading: boolean,
) {
  if (isLoading) {
    return 'Loading';
  }

  if (results.length === 0) {
    return 'Not evaluated';
  }

  return results.some((result) => isClientEvaluationError(result))
    ? 'Client fallback for at least one flag'
    : 'Backend evaluation for all flags';
}

function getFeatureResult(
  results: EvaluationResultMap,
  scenario: DemoScenario,
  feature: DemoFeature,
) {
  const result = results[feature.flagKey];

  return isResultForFeature(result, scenario, feature) ? result : null;
}

function ProductShowcase() {
  return (
    <section className="shop-card product-card" aria-labelledby="product-heading">
      <p className="eyebrow">Today&apos;s cart</p>
      <h2 id="product-heading">Premium Wireless Headphones</h2>
      <p>
        Noise-cancelling audio, 40-hour battery life, and free returns for a
        presentational checkout journey.
      </p>
      <div className="product-meta" aria-label="Product details">
        <span>$129.00</span>
        <span>★ 4.8 rating</span>
        <span>Free shipping</span>
      </div>
      <button className="secondary-action" type="button">
        View product details
      </button>
    </section>
  );
}

type CartSummaryProps = {
  scenario: DemoScenario;
};

function CartSummary({ scenario }: CartSummaryProps) {
  return (
    <section className="shop-card" aria-labelledby="cart-heading">
      <p className="eyebrow">Order summary</p>
      <h2 id="cart-heading">Cart & customer preview</h2>
      <dl className="summary-list">
        <div>
          <dt>Subtotal</dt>
          <dd>$129.00</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>$0.00</dd>
        </div>
        <div className="summary-total">
          <dt>Total</dt>
          <dd>$129.00</dd>
        </div>
        <div>
          <dt>Preview customer</dt>
          <dd>{scenario.customerLabel}</dd>
        </div>
        <div>
          <dt>Account group</dt>
          <dd>{scenario.accountGroup}</dd>
        </div>
      </dl>
    </section>
  );
}

type CheckoutExperienceProps = {
  isNewCheckoutOn: boolean;
  result: SdkEvaluationResult | null;
};

function CheckoutExperience({
  isNewCheckoutOn,
  result,
}: CheckoutExperienceProps) {
  const isClientFallback = result ? isClientEvaluationError(result) : false;
  const safeFallbackCopy = isClientFallback
    ? 'Classic Checkout remains active while the checkout preview is unavailable.'
    : 'Classic Checkout remains active while the new experience is not confirmed available for this customer.';

  return (
    <section
      className={
        isNewCheckoutOn
          ? 'shop-card checkout-card checkout-card-on'
          : 'shop-card checkout-card checkout-card-off'
      }
      aria-labelledby="checkout-heading"
      aria-live="polite"
    >
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Checkout experience</p>
          <h2 id="checkout-heading">
            {isNewCheckoutOn ? 'New One-Page Checkout' : 'Classic Checkout'}
          </h2>
        </div>
        <span className={isNewCheckoutOn ? 'status-pill status-on' : 'status-pill'}>
          {isNewCheckoutOn ? 'New experience' : 'Classic active'}
        </span>
      </div>

      {isNewCheckoutOn ? (
        <>
          <p>
            This customer sees the streamlined one-page checkout experience for
            the current release preview.
          </p>
          <ul className="feature-list">
            <li>Smart discount recommendation</li>
            <li>Express payment row</li>
            <li>Saved delivery preferences</li>
            <li>Beta/New checkout badge</li>
          </ul>
          <div className="checkout-preview new-checkout-preview">
            <span>Saved delivery to District 1</span>
            <strong>Pay in one step</strong>
            <button type="button">Continue with express checkout</button>
          </div>
        </>
      ) : (
        <>
          <p>{safeFallbackCopy}</p>
          <ul className="feature-list">
            <li>Standard address form</li>
            <li>Manual coupon box</li>
            <li>Standard payment button</li>
          </ul>
          <div className="checkout-preview classic-checkout-preview">
            <label>
              Delivery address
              <input readOnly value="123 Demo Street" />
            </label>
            <label>
              Coupon code
              <input readOnly value="Optional" />
            </label>
            <button type="button">Continue to payment</button>
          </div>
        </>
      )}
    </section>
  );
}

type AccountDashboardExperienceProps = {
  isDashboardOn: boolean;
  result: SdkEvaluationResult | null;
};

function AccountDashboardExperience({
  isDashboardOn,
  result,
}: AccountDashboardExperienceProps) {
  const isClientFallback = result ? isClientEvaluationError(result) : false;
  const safeFallbackCopy = isClientFallback
    ? 'The beta dashboard is hidden while the dashboard flag preview is unavailable.'
    : 'The beta dashboard is hidden until the beta-dashboard flag is confirmed on.';

  return (
    <section
      className={
        isDashboardOn
          ? 'shop-card beta-panel beta-panel-on'
          : 'shop-card beta-panel beta-panel-off'
      }
      aria-labelledby="dashboard-heading"
      aria-live="polite"
    >
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Account dashboard</p>
          <h2 id="dashboard-heading">
            {isDashboardOn ? 'Beta Account Dashboard' : 'Standard Account View'}
          </h2>
        </div>
        <span className={isDashboardOn ? 'status-pill status-on' : 'status-pill'}>
          {isDashboardOn ? 'Dashboard flag on' : 'Dashboard flag off'}
        </span>
      </div>

      {isDashboardOn ? (
        <>
          <p>
            The second admin flag unlocks account insights without changing the
            checkout rollout flag.
          </p>
          <div className="insight-grid" aria-label="Beta dashboard widgets">
            <span>
              <strong>Gold tier</strong>
              Loyalty status
            </span>
            <span>
              <strong>3 orders</strong>
              Recent activity
            </span>
            <span>
              <strong>Express ready</strong>
              Saved checkout profile
            </span>
          </div>
          <p className="decision-copy">
            Controlled by <code>beta-dashboard</code>; seeded as global-on so
            every selected customer can see this separate demo feature.
          </p>
        </>
      ) : (
        <>
          <p>{safeFallbackCopy}</p>
          <ul className="feature-list">
            <li>Basic order history</li>
            <li>Standard profile summary</li>
            <li>No beta insight widgets</li>
          </ul>
        </>
      )}
    </section>
  );
}

type ScenarioSelectorProps = {
  demoScenarios: DemoScenario[];
  accountSource: string;
  selectedScenario: DemoScenario;
  isLoading: boolean;
  onScenarioChange: (scenarioId: string) => void;
  onEvaluate: () => void;
};

function ScenarioSelector({
  demoScenarios,
  accountSource,
  selectedScenario,
  isLoading,
  onScenarioChange,
  onEvaluate,
}: ScenarioSelectorProps) {
  return (
    <section className="shop-card scenario-panel" aria-labelledby="scenario-heading">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Customer preview</p>
          <h2 id="scenario-heading">Switch customer accounts</h2>
        </div>
        <button disabled={isLoading} onClick={onEvaluate} type="button">
          {isLoading ? 'Refreshing flags...' : 'Refresh all flags'}
        </button>
      </div>

      <div className="customer-preview-grid">
        <section
          className="customer-info-card"
          aria-labelledby="customer-info-heading"
        >
          <p className="eyebrow">Selected user</p>
          <h3 id="customer-info-heading">{selectedScenario.customerLabel}</h3>
          <p>{selectedScenario.scenarioSummary}</p>
          <dl className="customer-context-list">
            <div>
              <dt>Role</dt>
              <dd>{selectedScenario.role}</dd>
            </div>
            <div>
              <dt>Targeting ID</dt>
              <dd>{selectedScenario.targetingId}</dd>
            </div>
            <div>
              <dt>User ID</dt>
              <dd>{selectedScenario.userId}</dd>
            </div>
            <div>
              <dt>Account group</dt>
              <dd>{selectedScenario.accountGroup}</dd>
            </div>
          </dl>
        </section>

        <section
          className="customer-select-card"
          aria-labelledby="customer-select-heading"
        >
          <p className="eyebrow">User selection</p>
          <h3 id="customer-select-heading">Choose demo user</h3>
          <label className="customer-select-label" htmlFor="customer-select">
            Demo user account
          </label>
          <select
            className="customer-select"
            id="customer-select"
            onChange={(event) => onScenarioChange(event.target.value)}
            value={selectedScenario.id}
          >
            {demoScenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.customerLabel}
              </option>
            ))}
          </select>
          <p className="account-series-note">
            <span className="account-source-pill">{accountSource}</span>
            Select different accounts to evaluate both demo flags at once:
            <code> beta-dashboard </code> stays global-on, while
            <code> new-checkout </code> changes by role or deterministic rollout.
            The demo-app account database stores one <code>userId</code>, one{' '}
            <code>targetingId</code>, and one <code>role</code> per ecommerce
            customer. No login or registration is used.
          </p>
        </section>
      </div>
    </section>
  );
}

type EvaluationDetailsProps = {
  selectedScenario: DemoScenario;
  results: EvaluationResultMap;
  isLoading: boolean;
};

function EvaluationDetails({
  selectedScenario,
  results,
  isLoading,
}: EvaluationDetailsProps) {
  const evaluatedResults = demoFeatures
    .map((feature) => getFeatureResult(results, selectedScenario, feature))
    .filter((result): result is SdkEvaluationResult => result !== null);
  const decisionSource = getDecisionSource(evaluatedResults, isLoading);
  const runtimeState = isLoading
    ? 'Loading...'
    : evaluatedResults.length > 0
      ? demoFeatures
        .map((feature) => {
          const result = getFeatureResult(results, selectedScenario, feature);
          const state = result ? (result.enabled ? 'On' : 'Off') : 'Not evaluated';

          return `${feature.flagKey}: ${state}`;
        })
        .join(', ')
      : 'Not evaluated';

  return (
    <details className="shop-card details-panel">
      <summary>Show technical diagnostics</summary>
      <p className="eyebrow">SDK evaluation details</p>
      <h2>Current SDK results</h2>
      <p>
        The demo app requests multiple flag keys for the selected customer
        context, so diagnostics are grouped by feature instead of showing one
        singular flag key.
      </p>
      <dl className="result-grid" aria-label="Evaluation result">
        <div>
          <dt>Evaluation API</dt>
          <dd>{apiBaseUrl}</dd>
        </div>
        <div>
          <dt>SDK client</dt>
          <dd>@ffp/js-sdk</dd>
        </div>
        <div>
          <dt>Environment</dt>
          <dd>{environmentKey}</dd>
        </div>
        <div>
          <dt>Selected preview</dt>
          <dd>{selectedScenario.title}</dd>
        </div>
        <div>
          <dt>Project key</dt>
          <dd>{selectedScenario.projectKey}</dd>
        </div>
        <div>
          <dt>Flag keys requested</dt>
          <dd>
            <ul className="compact-list">
              {demoFeatures.map((feature) => (
                <li key={feature.flagKey}>
                  <code>{feature.flagKey}</code> — {feature.displayName}
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>Targeting key</dt>
          <dd>{selectedScenario.targetingId}</dd>
        </div>
        <div>
          <dt>User ID</dt>
          <dd>{selectedScenario.userId}</dd>
        </div>
        <div>
          <dt>Single account role</dt>
          <dd>{selectedScenario.role}</dd>
        </div>
        <div>
          <dt>SDK roles array</dt>
          <dd>{formatRoles(selectedScenario.context.roles)}</dd>
        </div>
        <div>
          <dt>Runtime states</dt>
          <dd>{runtimeState}</dd>
        </div>
        <div>
          <dt>Decision source</dt>
          <dd>{decisionSource}</dd>
        </div>
        {demoFeatures.map((feature) => {
          const result = getFeatureResult(results, selectedScenario, feature);
          const expectedReason = feature.flagKey === 'new-checkout'
            ? selectedScenario.expectedReason
            : feature.expectedReason;
          const expectedOutcome = feature.flagKey === 'new-checkout'
            ? selectedScenario.expectedOutcome
            : feature.expectedOutcome;

          return (
            <div className="flag-result-card" key={feature.flagKey}>
              <dt>{feature.businessFeature}</dt>
              <dd>
                <ul className="compact-list">
                  <li>
                    Flag key: <code>{feature.flagKey}</code>
                  </li>
                  <li>{feature.diagnosticSummary}</li>
                  <li>Enabled: {result ? String(result.enabled) : 'Not evaluated'}</li>
                  <li>Runtime state: {result ? (result.enabled ? 'On' : 'Off') : 'Not evaluated'}</li>
                  <li>Variant: {result?.variant ?? 'Not evaluated'}</li>
                  <li>Reason: {result?.reason ?? 'Not evaluated'}</li>
                  <li>Matched rule: {result?.matchedRuleId ?? 'None'}</li>
                  <li>Expected reason: {expectedReason} (presentation guide)</li>
                  <li>Expected outcome: {expectedOutcome}</li>
                  <li>
                    Error source:{' '}
                    {result && isClientEvaluationError(result)
                      ? result.errorSource
                      : 'None'}
                  </li>
                </ul>
              </dd>
            </div>
          );
        })}
        <div>
          <dt>Presenter note</dt>
          <dd>{selectedScenario.presenterNote}</dd>
        </div>
      </dl>
    </details>
  );
}

function App() {
  const [demoScenarios, setDemoScenarios] = useState<DemoScenario[]>(
    fallbackDemoScenarios,
  );
  const [accountSource, setAccountSource] = useState(
    'Loading demo-app account database',
  );
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    fallbackDemoScenarios[0].id,
  );

  const [results, setResults] = useState<EvaluationResultMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const selectedScenario = useMemo(
    () =>
      demoScenarios.find((scenario) => scenario.id === selectedScenarioId) ??
      demoScenarios[0],
    [demoScenarios, selectedScenarioId],
  );

  useEffect(() => {
    let isMounted = true;

    listDemoAccounts()
      .then((accounts) => {
        if (!isMounted || accounts.length === 0) {
          return;
        }

        setDemoScenarios(accounts);
        setSelectedScenarioId((currentId) =>
          accounts.some((account) => account.id === currentId)
            ? currentId
            : accounts[0].id,
        );
        setAccountSource('Demo-app local account database');
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setDemoScenarios(fallbackDemoScenarios);
        setAccountSource('Local fallback account database');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const currentResults = useMemo(
    () =>
      demoFeatures.reduce<EvaluationResultMap>((accumulator, feature) => {
        const result = getFeatureResult(results, selectedScenario, feature);

        if (result) {
          accumulator[feature.flagKey] = result;
        }

        return accumulator;
      }, {}),
    [results, selectedScenario],
  );

  const dashboardResult = currentResults['beta-dashboard'] ?? null;
  const checkoutResult = currentResults['new-checkout'] ?? null;

  const handleScenarioChange = useCallback((scenarioId: string) => {
    requestSequence.current += 1;
    setSelectedScenarioId(scenarioId);
    setResults({});
    setErrorMessage(null);
    setIsLoading(true);
  }, []);

  const client = useMemo(
    () =>
      createFeatureFlagClient({
        baseUrl: apiBaseUrl,
        projectKey: selectedScenario.projectKey,
        environmentKey,
        timeoutMs: sdkTimeoutMs,
      }),
    [selectedScenario.projectKey],
  );

  const evaluateFlags = useCallback(async () => {
    const requestId = requestSequence.current + 1;
    requestSequence.current = requestId;
    setIsLoading(true);
    setResults({});
    setErrorMessage(null);

    try {
      const evaluations = await Promise.all(
        demoFeatures.map(async (feature) => {
          const evaluation = await client.evaluate(
            feature.flagKey,
            selectedScenario.context,
          );

          return [feature.flagKey, evaluation] as const;
        }),
      );

      if (requestSequence.current !== requestId) {
        return;
      }

      const nextResults = evaluations.reduce<EvaluationResultMap>(
        (accumulator, [flagKey, evaluation]) => {
          accumulator[flagKey] = evaluation;

          return accumulator;
        },
        {},
      );

      setResults(nextResults);

      const failedEvaluations = evaluations
        .map(([, evaluation]) => evaluation)
        .filter(isClientEvaluationError);

      if (failedEvaluations.length > 0) {
        const failedFlagKeys = failedEvaluations
          .map((evaluation) => evaluation.flagKey)
          .join(', ');
        const fallbackMessage = failedEvaluations[0].errorMessage ??
          'The SDK could not complete one or more evaluations safely.';

        setErrorMessage(`${fallbackMessage} Failed flag(s): ${failedFlagKeys}.`);
      }
    } catch {
      if (requestSequence.current !== requestId) {
        return;
      }

      setResults({});
      setErrorMessage(
        'Could not prepare this preview. Check the browser-safe SDK configuration and retry.',
      );
    } finally {
      if (requestSequence.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [client, selectedScenario.context]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void evaluateFlags();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [evaluateFlags]);

  const isDashboardOn = dashboardResult?.enabled === true;
  const isNewCheckoutOn = checkoutResult?.enabled === true;
  const liveStatus = isLoading
    ? `Refreshing ${selectedScenario.customerLabel}. Safe default experiences remain active while loading.`
    : Object.keys(currentResults).length > 0
      ? `${selectedScenario.customerLabel} preview refreshed. Dashboard is ${isDashboardOn ? 'On' : 'Off'} and checkout is ${isNewCheckoutOn ? 'On' : 'Off'}.`
      : `${selectedScenario.customerLabel} has not been refreshed. Safe default experiences remain active.`;

  return (
    <main className="demo-shell">
      <section className="demo-card" aria-labelledby="app-heading">
        <header className="hero-section">
          <div>
            <p className="eyebrow">Premium Audio Store</p>
            <h1 id="app-heading">ShopEase Checkout</h1>
            <p>
              Preview a deployed storefront where multiple admin-managed flags
              can safely control separate customer experiences without a
              frontend redeploy.
            </p>
          </div>
        </header>

        <p className="sr-only" aria-live="polite">
          {liveStatus}
        </p>

        <ScenarioSelector
          demoScenarios={demoScenarios}
          accountSource={accountSource}
          selectedScenario={selectedScenario}
          isLoading={isLoading}
          onScenarioChange={handleScenarioChange}
          onEvaluate={evaluateFlags}
        />

        {errorMessage ? (
          <section className="error-panel" role="alert">
            <h2>Feature preview unavailable</h2>
            <p>
              We could not refresh every flag preview. Each affected feature
              fails closed so the customer experience stays safe.
            </p>
            <details>
              <summary>Show SDK fallback message</summary>
              <p>{errorMessage}</p>
              {Object.values(currentResults).some((result) =>
                result ? isClientEvaluationError(result) : false,
              ) ? (
                <p>
                  The client failed closed for at least one flag. This is not a
                  backend evaluation decision for that flag.
                </p>
              ) : null}
            </details>
            <button onClick={evaluateFlags} type="button">
              Retry all flags
            </button>
          </section>
        ) : null}

        <div className="commerce-layout">
          <div className="commerce-main">
            <ProductShowcase />
            <AccountDashboardExperience
              isDashboardOn={isDashboardOn}
              result={dashboardResult}
            />
            <CheckoutExperience
              isNewCheckoutOn={isNewCheckoutOn}
              result={checkoutResult}
            />
          </div>
          <aside className="commerce-sidebar" aria-label="Order summary">
            <CartSummary scenario={selectedScenario} />
          </aside>
        </div>

        <footer className="technical-footer" aria-label="Technical diagnostics">
          <EvaluationDetails
            selectedScenario={selectedScenario}
            results={currentResults}
            isLoading={isLoading}
          />
        </footer>
      </section>
    </main>
  );
}

export default App;
