import {
  createFeatureFlagClient,
  isClientEvaluationError,
  type EvaluationContext,
  type SdkEvaluationResult,
} from '@ffp/js-sdk';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

type DemoScenario = {
  id: string;
  title: string;
  scenarioSummary: string;
  expectedOutcome: string;
  expectedReason: string;
  businessFeature: 'Checkout experience' | 'Beta dashboard panel' | 'Safe fallback';
  projectKey: string;
  flagKey: string;
  context: EvaluationContext;
  presenterNote: string;
};

const demoScenarios: DemoScenario[] = [
  {
    id: 'global-toggle',
    title: 'Global Toggle',
    scenarioSummary:
      'Evaluates beta-dashboard for the optional customer insights panel. Toggle this flag in Admin, then retry evaluation here.',
    expectedOutcome: 'Beta dashboard panel visible when beta-dashboard returns On.',
    expectedReason: 'GLOBAL_ON',
    businessFeature: 'Beta dashboard panel',
    projectKey: 'demo-project',
    flagKey: 'beta-dashboard',
    context: {
      targetingKey: 'demo-user-global',
      userId: 'demo-user-global',
      roles: ['user'],
    },
    presenterNote:
      'Change beta-dashboard in Admin, then evaluate again. This flag never controls checkout.',
  },
  {
    id: 'role-targeting-on',
    title: 'Role Targeting — Beta Tester',
    scenarioSummary:
      'Evaluates new-checkout for a beta tester who should match the role targeting rule.',
    expectedOutcome: 'New One-Page Checkout visible for this customer segment.',
    expectedReason: 'ROLE_MATCH',
    businessFeature: 'Checkout experience',
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
    scenarioSummary:
      'Evaluates new-checkout for a regular user who falls inside the deterministic rollout bucket.',
    expectedOutcome: 'New One-Page Checkout visible for this stable rollout key.',
    expectedReason: 'PERCENTAGE_ROLLOUT',
    businessFeature: 'Checkout experience',
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
    scenarioSummary:
      'Evaluates new-checkout for a regular user who falls outside the deterministic rollout bucket.',
    expectedOutcome: 'Classic Checkout remains active for this stable rollout key.',
    expectedReason: 'DEFAULT_OFF',
    businessFeature: 'Checkout experience',
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
    scenarioSummary:
      'Demonstrates safe fallback when the requested project or flag does not exist.',
    expectedOutcome: 'Classic Checkout remains active because missing config fails closed.',
    expectedReason: 'NOT_FOUND',
    businessFeature: 'Safe fallback',
    projectKey: 'missing-project',
    flagKey: 'missing-flag',
    context: {
      targetingKey: 'demo-missing-user',
      userId: 'demo-missing-user',
      roles: ['user'],
    },
    presenterNote: 'Expected reason: NOT_FOUND; fallback stays active.',
  },
];

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/v1';
const environmentKey = import.meta.env.VITE_ENVIRONMENT_KEY ?? 'production';
const sdkTimeoutMs = 1500;

function formatRoles(roles: string[] | undefined) {
  return roles?.length ? roles.join(', ') : 'None';
}

function isResultForScenario(
  result: SdkEvaluationResult | null,
  scenario: DemoScenario,
) {
  return (
    result?.projectKey === scenario.projectKey && result.flagKey === scenario.flagKey
  );
}

function getDecisionSource(
  result: SdkEvaluationResult | null,
  isLoading: boolean,
) {
  if (isLoading) {
    return 'Loading';
  }

  if (!result) {
    return 'Not evaluated';
  }

  return isClientEvaluationError(result) ? 'Client fallback' : 'Backend evaluation';
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
      <h2 id="cart-heading">Cart & customer segment</h2>
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
          <dt>Preview scenario</dt>
          <dd>{scenario.title}</dd>
        </div>
        <div>
          <dt>Targeting key</dt>
          <dd>{scenario.context.targetingKey ?? 'None'}</dd>
        </div>
        <div>
          <dt>Roles</dt>
          <dd>{formatRoles(scenario.context.roles)}</dd>
        </div>
      </dl>
    </section>
  );
}

type CheckoutExperienceProps = {
  isNewCheckoutOn: boolean;
  result: SdkEvaluationResult | null;
  selectedFlagKey: string;
};

function CheckoutExperience({
  isNewCheckoutOn,
  result,
  selectedFlagKey,
}: CheckoutExperienceProps) {
  const isClientFallback = result ? isClientEvaluationError(result) : false;
  const safeFallbackCopy = isClientFallback
    ? 'Classic Checkout remains active because the SDK failed closed locally. This is not a backend evaluation decision.'
    : 'Classic Checkout remains active because the feature flag did not return a safe On decision.';

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
          {isNewCheckoutOn ? 'new-checkout On' : 'Safe fallback'}
        </span>
      </div>

      {isNewCheckoutOn ? (
        <>
          <p>
            The SDK returned enabled=true for <strong>new-checkout</strong>, so
            this customer sees the released one-page experience.
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

      <p className="decision-copy">
        Checkout is controlled only by <strong>new-checkout</strong>. Selected
        flag: <strong>{selectedFlagKey}</strong>.{' '}
        {result ? (
          <>
            Returned reason: <strong>{result.reason}</strong>.
          </>
        ) : (
          <>No SDK reason returned yet.</>
        )}
      </p>
    </section>
  );
}

type BetaDashboardPanelProps = {
  isBetaDashboardOn: boolean;
  result: SdkEvaluationResult | null;
  selectedFlagKey: string;
};

function BetaDashboardPanel({
  isBetaDashboardOn,
  result,
  selectedFlagKey,
}: BetaDashboardPanelProps) {
  const isBetaScenario = selectedFlagKey === 'beta-dashboard';

  return (
    <section
      className={
        isBetaDashboardOn
          ? 'shop-card beta-panel beta-panel-on'
          : 'shop-card beta-panel beta-panel-off'
      }
      aria-labelledby="beta-panel-heading"
      aria-live="polite"
    >
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Optional feature panel</p>
          <h2 id="beta-panel-heading">
            {isBetaDashboardOn
              ? 'Beta Customer Insights Dashboard'
              : 'Beta Dashboard hidden'}
          </h2>
        </div>
        <span className={isBetaDashboardOn ? 'status-pill status-on' : 'status-pill'}>
          {isBetaDashboardOn ? 'beta-dashboard On' : 'Hidden'}
        </span>
      </div>
      {isBetaDashboardOn ? (
        <div className="insight-grid" aria-label="Beta dashboard preview">
          <span>
            <strong>18%</strong>
            cart recovery lift
          </span>
          <span>
            <strong>42</strong>
            saved checkouts
          </span>
          <span>
            <strong>{result?.reason}</strong>
            current reason
          </span>
        </div>
      ) : (
        <p>
          {isBetaScenario
            ? 'The optional dashboard is hidden until beta-dashboard returns enabled=true.'
            : 'This scenario does not evaluate beta-dashboard, so no checkout result can reveal this panel.'}
        </p>
      )}
      <p className="decision-copy">
        Beta dashboard visibility is controlled only by <strong>beta-dashboard</strong>.
        Selected flag: <strong>{selectedFlagKey}</strong>.{' '}
        {result ? (
          <>
            Returned reason: <strong>{result.reason}</strong>.
          </>
        ) : (
          <>No SDK reason returned yet.</>
        )}
      </p>
    </section>
  );
}

type ScenarioSelectorProps = {
  selectedScenario: DemoScenario;
  isLoading: boolean;
  onScenarioChange: (scenarioId: string) => void;
  onEvaluate: () => void;
};

function ScenarioSelector({
  selectedScenario,
  isLoading,
  onScenarioChange,
  onEvaluate,
}: ScenarioSelectorProps) {
  return (
    <section className="shop-card scenario-panel" aria-labelledby="scenario-heading">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Release preview</p>
          <h2 id="scenario-heading">Preview scenario</h2>
        </div>
        <button disabled={isLoading} onClick={onEvaluate} type="button">
          {isLoading ? 'Evaluating...' : 'Evaluate flag'}
        </button>
      </div>

      <div className="scenario-options" role="radiogroup" aria-labelledby="scenario-heading">
        {demoScenarios.map((scenario) => (
          <label className="scenario-option" key={scenario.id}>
            <input
              checked={selectedScenario.id === scenario.id}
              name="preview-scenario"
              onChange={() => onScenarioChange(scenario.id)}
              type="radio"
            />
            <span>
              <strong>{scenario.title}</strong>
              <small>{scenario.scenarioSummary}</small>
              <small>
                Expected display-only metadata: {scenario.expectedReason} ·{' '}
                {scenario.expectedOutcome}
              </small>
            </span>
          </label>
        ))}
      </div>

      <div className="presenter-note">
        <strong>Presenter note:</strong> {selectedScenario.presenterNote}
      </div>
    </section>
  );
}

type EvaluationDetailsProps = {
  selectedScenario: DemoScenario;
  result: SdkEvaluationResult | null;
  isLoading: boolean;
};

function EvaluationDetails({
  selectedScenario,
  result,
  isLoading,
}: EvaluationDetailsProps) {
  const decisionSource = getDecisionSource(result, isLoading);
  const runtimeState = isLoading
    ? 'Loading...'
    : result
      ? result.enabled
        ? 'On'
        : 'Off'
      : 'Not evaluated';

  return (
    <section className="shop-card details-panel" aria-labelledby="details-heading">
      <p className="eyebrow">SDK evaluation details</p>
      <h2 id="details-heading">Current SDK result</h2>
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
          <dt>Selected scenario</dt>
          <dd>{selectedScenario.title}</dd>
        </div>
        <div>
          <dt>Business feature</dt>
          <dd>{selectedScenario.businessFeature}</dd>
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
          <dd>{formatRoles(selectedScenario.context.roles)}</dd>
        </div>
        <div>
          <dt>Runtime state</dt>
          <dd>{runtimeState}</dd>
        </div>
        <div>
          <dt>Enabled</dt>
          <dd>{result ? String(result.enabled) : 'Not evaluated'}</dd>
        </div>
        <div>
          <dt>Variant</dt>
          <dd>{result?.variant ?? 'Not evaluated'}</dd>
        </div>
        <div>
          <dt>Reason</dt>
          <dd>{result?.reason ?? 'Not evaluated'}</dd>
        </div>
        <div>
          <dt>Expected reason</dt>
          <dd>{selectedScenario.expectedReason} (display only)</dd>
        </div>
        <div>
          <dt>Decision source</dt>
          <dd>{decisionSource}</dd>
        </div>
        <div>
          <dt>Error source</dt>
          <dd>
            {result && isClientEvaluationError(result) ? result.errorSource : 'None'}
          </dd>
        </div>
        <div>
          <dt>Matched rule</dt>
          <dd>{result?.matchedRuleId ?? 'None'}</dd>
        </div>
      </dl>
    </section>
  );
}

function App() {
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    demoScenarios[0].id,
  );

  const [result, setResult] = useState<SdkEvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const selectedScenario = useMemo(
    () =>
      demoScenarios.find((scenario) => scenario.id === selectedScenarioId) ??
      demoScenarios[0],
    [selectedScenarioId],
  );

  const currentResult = isResultForScenario(result, selectedScenario)
    ? result
    : null;

  const handleScenarioChange = useCallback((scenarioId: string) => {
    requestSequence.current += 1;
    setSelectedScenarioId(scenarioId);
    setResult(null);
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

  const evaluateFlag = useCallback(async () => {
    const requestId = requestSequence.current + 1;
    requestSequence.current = requestId;
    setIsLoading(true);
    setResult(null);
    setErrorMessage(null);

    try {
      const evaluation = await client.evaluate(
        selectedScenario.flagKey,
        selectedScenario.context,
      );

      if (requestSequence.current !== requestId) {
        return;
      }

      setResult(evaluation);

      if (isClientEvaluationError(evaluation)) {
        setErrorMessage(
          evaluation.errorMessage ??
            'The SDK could not complete this evaluation safely.',
        );
      }
    } catch {
      if (requestSequence.current !== requestId) {
        return;
      }

      setResult(null);
      setErrorMessage(
        'Could not prepare this scenario. Check the browser-safe SDK configuration and retry.',
      );
    } finally {
      if (requestSequence.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [client, selectedScenario.context, selectedScenario.flagKey]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void evaluateFlag();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [evaluateFlag]);

  const isNewCheckoutOn =
    selectedScenario.flagKey === 'new-checkout' && currentResult?.enabled === true;
  const isBetaDashboardOn =
    selectedScenario.flagKey === 'beta-dashboard' && currentResult?.enabled === true;
  const liveStatus = isLoading
    ? `Evaluating ${selectedScenario.title}. Classic Checkout remains active while loading.`
    : currentResult
      ? `${selectedScenario.title} returned enabled=${String(
          currentResult.enabled,
        )}, reason=${currentResult.reason}.`
      : `${selectedScenario.title} has not been evaluated. Classic Checkout remains active.`;

  return (
    <main className="demo-shell">
      <section className="demo-card" aria-labelledby="app-heading">
        <header className="hero-section">
          <div>
            <p className="eyebrow">Feature Flag Platform</p>
            <h1 id="app-heading">FFP Shop — Feature Flag Checkout Demo</h1>
            <p>
              This is a deployed checkout application. Feature flags decide
              which customer experience is visible at runtime, without a
              frontend redeploy.
            </p>
          </div>
          <div className="hero-badge" aria-label="Runtime safety summary">
            <span>Fail closed</span>
            <strong>Classic Checkout by default</strong>
          </div>
        </header>

        <p className="sr-only" aria-live="polite">
          {liveStatus}
        </p>

        <ScenarioSelector
          selectedScenario={selectedScenario}
          isLoading={isLoading}
          onScenarioChange={handleScenarioChange}
          onEvaluate={evaluateFlag}
        />

        {errorMessage ? (
          <section className="error-panel" role="alert">
            <h2>
              {currentResult && isClientEvaluationError(currentResult)
                ? 'SDK fallback active'
                : 'Evaluation unavailable'}
            </h2>
            <p>{errorMessage}</p>
            {currentResult && isClientEvaluationError(currentResult) ? (
              <p>
                The client failed closed, so Classic Checkout remains active.
                This is not a backend evaluation decision.
              </p>
            ) : null}
            <button onClick={evaluateFlag} type="button">
              Retry selected scenario
            </button>
          </section>
        ) : null}

        <div className="commerce-layout">
          <div className="commerce-main">
            <ProductShowcase />
            <CheckoutExperience
              isNewCheckoutOn={isNewCheckoutOn}
              result={currentResult}
              selectedFlagKey={selectedScenario.flagKey}
            />
            <BetaDashboardPanel
              isBetaDashboardOn={isBetaDashboardOn}
              result={currentResult}
              selectedFlagKey={selectedScenario.flagKey}
            />
          </div>
          <aside className="commerce-sidebar" aria-label="Order and evaluation summary">
            <CartSummary scenario={selectedScenario} />
            <EvaluationDetails
              selectedScenario={selectedScenario}
              result={currentResult}
              isLoading={isLoading}
            />
          </aside>
        </div>
      </section>
    </main>
  );
}

export default App;
