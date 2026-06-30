import {
  createFeatureFlagClient,
  isClientEvaluationError,
  type EvaluationContext,
  type SdkEvaluationResult,
} from '@ffp/js-sdk';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

type BusinessFeature = 'Checkout experience';

type DemoScenario = {
  id: string;
  title: string;
  customerLabel: string;
  accountGroup: string;
  scenarioSummary: string;
  expectedOutcome: string;
  expectedReason: string;
  businessFeature: BusinessFeature;
  projectKey: string;
  flagKey: string;
  context: EvaluationContext;
  presenterNote: string;
};

const checkoutRolloutAccounts: DemoScenario[] = [
  ['01', 'demo-rollout-01', 'DEFAULT_OFF', 'Classic Checkout remains active for this rollout account.'],
  ['02', 'demo-rollout-03', 'PERCENTAGE_ROLLOUT', 'New One-Page Checkout is visible for this rollout account.'],
  ['03', 'demo-rollout-06', 'PERCENTAGE_ROLLOUT', 'New One-Page Checkout is visible for this rollout account.'],
  ['04', 'demo-rollout-08', 'DEFAULT_OFF', 'Classic Checkout remains active for this rollout account.'],
  ['05', 'demo-rollout-11', 'PERCENTAGE_ROLLOUT', 'New One-Page Checkout is visible for this rollout account.'],
  ['06', 'demo-rollout-13', 'DEFAULT_OFF', 'Classic Checkout remains active for this rollout account.'],
  ['07', 'demo-rollout-17', 'PERCENTAGE_ROLLOUT', 'New One-Page Checkout is visible for this rollout account.'],
  ['08', 'demo-rollout-18', 'DEFAULT_OFF', 'Classic Checkout remains active for this rollout account.'],
  ['09', 'demo-rollout-20', 'PERCENTAGE_ROLLOUT', 'New One-Page Checkout is visible for this rollout account.'],
  ['10', 'demo-rollout-24', 'DEFAULT_OFF', 'Classic Checkout remains active for this rollout account.'],
  ['11', 'demo-rollout-32', 'PERCENTAGE_ROLLOUT', 'New One-Page Checkout is visible for this rollout account.'],
  ['12', 'demo-rollout-34', 'DEFAULT_OFF', 'Classic Checkout remains active for this rollout account.'],
].map(([accountNumber, targetingKey, expectedReason, expectedOutcome]) => ({
  id: `rollout-account-${accountNumber}`,
  title: `Rollout account ${accountNumber}`,
  customerLabel: `Customer account ${accountNumber}`,
  accountGroup: 'Staged checkout rollout',
  scenarioSummary:
    'Regular shopper in the staged account series. Switch accounts to see gradual release behavior.',
  expectedOutcome,
  expectedReason,
  businessFeature: 'Checkout experience' as const,
  projectKey: 'demo-project',
  flagKey: 'new-checkout',
  context: {
    targetingKey,
    userId: targetingKey,
    roles: ['user'],
  },
  presenterNote:
    'Regular account in the deterministic rollout series. Re-evaluate the same account to show the result stays stable.',
}));

const demoScenarios: DemoScenario[] = [
  {
    id: 'role-targeting-on',
    title: 'Early-access customer',
    customerLabel: 'Beta customer',
    accountGroup: 'Role-based early access',
    scenarioSummary:
      'Shows a customer segment that receives the newest checkout experience before general rollout.',
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
    presenterNote: 'Expected technical reason: ROLE_MATCH.',
  },
  ...checkoutRolloutAccounts,
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
          <p className="eyebrow">Customer preview</p>
          <h2 id="scenario-heading">Switch customer accounts</h2>
        </div>
        <button disabled={isLoading} onClick={onEvaluate} type="button">
          {isLoading ? 'Refreshing...' : 'Refresh preview'}
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
              <dd>{formatRoles(selectedScenario.context.roles)}</dd>
            </div>
            <div>
              <dt>Targeting ID</dt>
              <dd>{selectedScenario.context.targetingKey ?? 'None'}</dd>
            </div>
            <div>
              <dt>User ID</dt>
              <dd>{selectedScenario.context.userId ?? 'None'}</dd>
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
            Select different accounts to show that rollout is deterministic:
            some users receive New One-Page Checkout while others keep Classic
            Checkout.
          </p>
        </section>
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
    <details className="shop-card details-panel">
      <summary>Show technical diagnostics</summary>
      <p className="eyebrow">SDK evaluation details</p>
      <h2>Current SDK result</h2>
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
          <dd>{selectedScenario.expectedReason} (presentation guide)</dd>
        </div>
        <div>
          <dt>Expected customer outcome</dt>
          <dd>{selectedScenario.expectedOutcome}</dd>
        </div>
        <div>
          <dt>Presenter note</dt>
          <dd>{selectedScenario.presenterNote}</dd>
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
    </details>
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
        'Could not prepare this preview. Check the browser-safe SDK configuration and retry.',
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
  const liveStatus = isLoading
    ? `Refreshing ${selectedScenario.customerLabel}. Classic Checkout remains active while loading.`
    : currentResult
      ? `${selectedScenario.customerLabel} preview refreshed. Runtime state is ${currentResult.enabled ? 'On' : 'Off'
      }.`
      : `${selectedScenario.customerLabel} has not been refreshed. Classic Checkout remains active.`;

  return (
    <main className="demo-shell">
      <section className="demo-card" aria-labelledby="app-heading">
        <header className="hero-section">
          <div>
            <p className="eyebrow">Premium Audio Store</p>
            <h1 id="app-heading">ShopEase Checkout</h1>
            <p>
              Preview a deployed storefront where different customer accounts
              can safely receive different checkout experiences without a
              frontend redeploy.
            </p>
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
            <h2>Checkout preview unavailable</h2>
            <p>
              We could not refresh this checkout preview. Classic Checkout
              remains active so the customer experience stays safe.
            </p>
            <details>
              <summary>Show SDK fallback message</summary>
              <p>{errorMessage}</p>
              {currentResult && isClientEvaluationError(currentResult) ? (
                <p>
                  The client failed closed, so Classic Checkout remains active.
                  This is not a backend evaluation decision.
                </p>
              ) : null}
            </details>
            <button onClick={evaluateFlag} type="button">
              Retry preview
            </button>
          </section>
        ) : null}

        <div className="commerce-layout">
          <div className="commerce-main">
            <ProductShowcase />
            <CheckoutExperience
              isNewCheckoutOn={isNewCheckoutOn}
              result={currentResult}
            />
          </div>
          <aside className="commerce-sidebar" aria-label="Order summary">
            <CartSummary scenario={selectedScenario} />
          </aside>
        </div>

        <footer className="technical-footer" aria-label="Technical diagnostics">
          <EvaluationDetails
            selectedScenario={selectedScenario}
            result={currentResult}
            isLoading={isLoading}
          />
        </footer>
      </section>
    </main>
  );
}

export default App;
