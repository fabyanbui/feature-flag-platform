import {
  createFeatureFlagClient,
  isClientEvaluationError,
  type SdkEvaluationResult,
} from "@ffp/js-sdk";
import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import type { CartView, DemoAccount, Product } from "./data/demoAccounts";
import {
  addCartItem,
  clearCart,
  getCart,
  listProducts,
  updateCartQuantity,
} from "./services/commerceDb";
import { listDemoAccounts } from "./services/demoAccountService";

type FeatureKey =
  | "beta-dashboard"
  | "new-checkout"
  | "express-payment"
  | "shipping-progress-meter"
  | "personalized-recommendations"
  | "trending-products"
  | "holiday-promo-banner";
type FeatureResultMap = Partial<Record<FeatureKey, SdkEvaluationResult>>;
type FeatureGroupKey = "checkout" | "recommendations" | "standalone";

type DemoFeature = {
  key: FeatureKey;
  group: FeatureGroupKey;
  label: string;
  description: string;
  enabledCopy: string;
  disabledCopy: string;
};

const demoFeatures: DemoFeature[] = [
  {
    key: "new-checkout",
    group: "checkout",
    label: "One-page checkout",
    description: "Condenses cart, payment, and review into one flow.",
    enabledCopy: "One-step payment is visible.",
    disabledCopy: "Classic multi-step checkout stays active.",
  },
  {
    key: "express-payment",
    group: "checkout",
    label: "Express payment",
    description: "Shows a fast pay action for eligible customers.",
    enabledCopy: "Express pay button is available.",
    disabledCopy: "Standard payment action is shown.",
  },
  {
    key: "shipping-progress-meter",
    group: "checkout",
    label: "Shipping progress",
    description: "Shows how close the cart is to free shipping.",
    enabledCopy: "Free-shipping meter is visible.",
    disabledCopy: "Shipping is summarized only at checkout.",
  },
  {
    key: "personalized-recommendations",
    group: "recommendations",
    label: "Personalized picks",
    description: "Prioritizes products that match the selected customer.",
    enabledCopy: "Personalized recommendation shelf is active.",
    disabledCopy: "Default recommendation shelf is active.",
  },
  {
    key: "trending-products",
    group: "recommendations",
    label: "Trending products",
    description: "Adds a trending-now shelf to the storefront.",
    enabledCopy: "Trending shelf is visible.",
    disabledCopy: "Trending shelf is hidden.",
  },
  {
    key: "holiday-promo-banner",
    group: "standalone",
    label: "Holiday promo banner",
    description: "Shows a seasonal promotion outside any group.",
    enabledCopy: "Standalone promo banner is visible.",
    disabledCopy: "Standalone promo banner is hidden.",
  },
  {
    key: "beta-dashboard",
    group: "standalone",
    label: "Priority dashboard",
    description: "Upgrades the account dashboard for priority customers.",
    enabledCopy: "Priority dashboard is active.",
    disabledCopy: "Standard dashboard is active.",
  },
];

const featureGroups: Array<{
  key: FeatureGroupKey;
  label: string;
  summary: string;
}> = [
  {
    key: "checkout",
    label: "Checkout experience",
    summary:
      "Three independent checkout features grouped for a group kill-switch demo.",
  },
  {
    key: "recommendations",
    label: "Recommendations",
    summary:
      "Two merchandising features grouped for recommendation experiments.",
  },
  {
    key: "standalone",
    label: "Standalone features",
    summary: "Individual features without a shared operational group.",
  },
];

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/v1";
const environmentKey = import.meta.env.VITE_ENVIRONMENT_KEY ?? "production";
const sdkTimeoutMs = 1500;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function getAccountInitials(label: string) {
  return label
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function isResultForExperience(
  result: SdkEvaluationResult | undefined,
  account: DemoAccount,
  feature: DemoFeature,
) {
  return (
    result?.projectKey === account.projectKey && result.flagKey === feature.key
  );
}

function getFeatureResult(
  results: FeatureResultMap,
  account: DemoAccount,
  feature: DemoFeature,
) {
  const result = results[feature.key];
  return isResultForExperience(result, account, feature) ? result : null;
}

function getFeatureResultByKey(
  results: FeatureResultMap,
  account: DemoAccount | null,
  key: FeatureKey,
) {
  if (!account) {
    return null;
  }

  const feature = demoFeatures.find((item) => item.key === key);

  return feature ? getFeatureResult(results, account, feature) : null;
}

function isFeatureEnabled(
  results: FeatureResultMap,
  account: DemoAccount | null,
  key: FeatureKey,
) {
  return getFeatureResultByKey(results, account, key)?.enabled === true;
}

type AccountSwitcherProps = {
  accounts: DemoAccount[];
  selectedAccount: DemoAccount | null;
  isLoading: boolean;
  onAccountChange: (accountId: string | null) => void;
};

function AccountSwitcher({
  accounts,
  selectedAccount,
  isLoading,
  onAccountChange,
}: AccountSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const initials = selectedAccount
    ? getAccountInitials(selectedAccount.customerLabel)
    : "GU";

  const chooseAccount = (accountId: string | null) => {
    setIsOpen(false);
    onAccountChange(accountId);
  };

  return (
    <aside
      className="account-switcher"
      aria-labelledby="account-switcher-heading"
    >
      <div className="account-switcher-top">
        <div>
          <p className="eyebrow">Customer account</p>
          <h2 id="account-switcher-heading">
            {selectedAccount ? "Signed in" : "Guest browsing"}
          </h2>
        </div>
        <span className="switcher-badge">Switch</span>
      </div>
      <div className="account-card">
        <button
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="account-card-button"
          disabled={isLoading}
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span className="account-avatar" aria-hidden="true">
            {initials}
          </span>
          <span className="account-copy">
            <strong>
              {selectedAccount?.customerLabel ?? "Guest customer"}
            </strong>
            <span>
              {selectedAccount?.accountGroup ??
                "Choose an account to personalize the store"}
            </span>
            <small>
              {selectedAccount
                ? "Saved cart and member preferences loaded"
                : "No customer account selected"}
            </small>
          </span>
          <span className="account-chevron" aria-hidden="true" />
        </button>

        {isOpen ? (
          <div className="account-menu" role="listbox">
            <button
              aria-selected={!selectedAccount}
              className="account-menu-item"
              onClick={() => chooseAccount(null)}
              role="option"
              type="button"
            >
              <span>Continue as guest</span>
              <small>Browse catalog without saved checkout</small>
            </button>
            {accounts.map((account) => (
              <button
                aria-selected={account.id === selectedAccount?.id}
                className="account-menu-item"
                key={account.id}
                onClick={() => chooseAccount(account.id)}
                role="option"
                type="button"
              >
                <span>{account.customerLabel}</span>
                <small>{account.accountGroup}</small>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <p
        className={isOpen ? "account-hint account-hint-hidden" : "account-hint"}
      >
        The storefront updates automatically for the selected account.
      </p>
    </aside>
  );
}

type ProductCatalogProps = {
  products: Product[];
  selectedAccount: DemoAccount | null;
  onAddToCart: (productId: string) => void;
};

function ProductCatalog({
  products,
  selectedAccount,
  onAddToCart,
}: ProductCatalogProps) {
  return (
    <section
      className="section-card catalog-section"
      aria-labelledby="catalog-heading"
    >
      <div className="section-heading-row catalog-heading-row">
        <div>
          <p className="eyebrow">Shop catalog</p>
          <h2 id="catalog-heading">Popular picks for your setup</h2>
        </div>
        <span className="soft-pill">{products.length} in stock</span>
      </div>

      <div className="catalog-toolbar" aria-label="Catalog filters preview">
        <label className="search-field">
          <span>Search</span>
          <input
            readOnly
            value="Wireless audio, speakers, accessories"
            aria-label="Search products"
          />
        </label>
        <div className="category-tabs" aria-label="Product categories">
          <button className="category-tab active" type="button">
            All
          </button>
          <button className="category-tab" type="button">
            Audio
          </button>
          <button className="category-tab" type="button">
            Accessories
          </button>
        </div>
      </div>

      <div className="product-grid">
        {products.map((product) => (
          <article
            className={`product-card product-${product.accent}`}
            key={product.id}
          >
            <div className="product-media">
              <span className="product-badge">{product.badge}</span>
              <div className="product-art" aria-hidden="true">
                <span />
              </div>
            </div>
            <div className="product-body">
              <div className="product-kicker">
                <span>{product.category}</span>
                <span>In stock</span>
              </div>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <div className="product-meta">
                <strong>{formatCurrency(product.price)}</strong>
                <span aria-label={`${product.rating} star rating`}>
                  ★ {product.rating}
                </span>
              </div>
            </div>
            <div className="product-actions">
              <button
                disabled={!selectedAccount}
                onClick={() => onAddToCart(product.id)}
                type="button"
              >
                {selectedAccount ? "Add to cart" : "Sign in to add"}
              </button>
              <button className="ghost-button" type="button">
                Details
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

type CustomerDashboardProps = {
  account: DemoAccount | null;
  isEnhanced: boolean;
};

function CustomerDashboard({ account, isEnhanced }: CustomerDashboardProps) {
  if (!account) {
    return (
      <section
        className="section-card signed-out-panel"
        aria-labelledby="guest-heading"
      >
        <p className="eyebrow">Guest checkout preview</p>
        <h2 id="guest-heading">Welcome to ShopEase</h2>
        <p>
          Browse the store freely. Choose a customer from the account menu to
          unlock saved baskets, member offers, and checkout preferences.
        </p>
        <div className="guest-callout">
          <strong>No account selected</strong>
          <span>Open the profile card in the header to switch customers.</span>
        </div>
        <div className="benefit-grid">
          <span>
            <strong>Saved cart</strong>
            Account-specific basket
          </span>
          <span>
            <strong>Personalized dashboard</strong>
            Customer-specific account view
          </span>
          <span>
            <strong>Checkout preference</strong>
            Classic or one-page checkout
          </span>
        </div>
      </section>
    );
  }

  return (
    <section
      className={
        isEnhanced
          ? "section-card dashboard-card dashboard-enhanced"
          : "section-card dashboard-card"
      }
      aria-labelledby="dashboard-heading"
    >
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Customer dashboard</p>
          <h2 id="dashboard-heading">
            {isEnhanced
              ? "Priority account dashboard"
              : "Standard account dashboard"}
          </h2>
        </div>
        <span className={isEnhanced ? "status-pill status-on" : "status-pill"}>
          {isEnhanced ? "Priority view" : "Standard view"}
        </span>
      </div>
      <p>{account.scenarioSummary}</p>
      <div className="member-strip">
        <span>Member rewards active</span>
        <span>Free returns</span>
        <span>{isEnhanced ? "Priority support" : "Standard support"}</span>
      </div>
      <div className="benefit-grid">
        <span>
          <strong>{account.customerLabel}</strong>
          {account.accountGroup}
        </span>
        <span>
          <strong>{isEnhanced ? "Gold tier" : "Member"}</strong>
          Loyalty profile
        </span>
        <span>
          <strong>{isEnhanced ? "Express ready" : "Classic checkout"}</strong>
          Saved preference
        </span>
      </div>
    </section>
  );
}

type CartPanelProps = {
  cart: CartView | null;
  isOnePageCheckout: boolean;
  hasExpressPayment: boolean;
  hasShippingProgress: boolean;
  selectedAccount: DemoAccount | null;
  onQuantityChange: (productId: string, quantity: number) => void;
  onCheckout: () => void;
};

function CartPanel({
  cart,
  isOnePageCheckout,
  hasExpressPayment,
  hasShippingProgress,
  selectedAccount,
  onQuantityChange,
  onCheckout,
}: CartPanelProps) {
  const freeShippingTarget = 100;
  const shippingProgress = cart
    ? Math.min(100, Math.round((cart.subtotal / freeShippingTarget) * 100))
    : 0;
  const freeShippingRemaining = cart
    ? Math.max(0, freeShippingTarget - cart.subtotal)
    : freeShippingTarget;

  return (
    <aside className="section-card cart-panel" aria-labelledby="cart-heading">
      <div className="cart-heading">
        <div>
          <p className="eyebrow">Cart</p>
          <h2 id="cart-heading">Order summary</h2>
        </div>
        <span className="soft-pill">Secure</span>
      </div>
      <ol className="checkout-steps" aria-label="Checkout progress">
        <li className="active">Cart</li>
        <li className={isOnePageCheckout ? "active" : ""}>Payment</li>
        <li>Done</li>
      </ol>
      {!selectedAccount ? (
        <p className="empty-copy">
          Choose an account to load a saved cart and continue checkout.
        </p>
      ) : cart && cart.lines.length > 0 ? (
        <>
          <div className="cart-lines">
            {cart.lines.map((line) => (
              <div className="cart-line" key={line.productId}>
                <div>
                  <strong>{line.product.name}</strong>
                  <span>{formatCurrency(line.product.price)} each</span>
                </div>
                <div
                  className="quantity-control"
                  aria-label={`Quantity for ${line.product.name}`}
                >
                  <button
                    onClick={() =>
                      onQuantityChange(line.productId, line.quantity - 1)
                    }
                    type="button"
                  >
                    −
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    onClick={() =>
                      onQuantityChange(line.productId, line.quantity + 1)
                    }
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
          {hasShippingProgress ? (
            <div className="shipping-meter">
              <div className="shipping-meter-copy">
                <strong>Free shipping progress</strong>
                <span>
                  {freeShippingRemaining === 0
                    ? "Free shipping unlocked"
                    : `${formatCurrency(freeShippingRemaining)} away from free shipping`}
                </span>
              </div>
              <div className="shipping-meter-track" aria-hidden="true">
                <span style={{ width: `${shippingProgress}%` }} />
              </div>
            </div>
          ) : null}
          <dl className="summary-list">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatCurrency(cart.subtotal)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>
                {cart.shipping === 0 ? "Free" : formatCurrency(cart.shipping)}
              </dd>
            </div>
            <div className="summary-total">
              <dt>Total</dt>
              <dd>{formatCurrency(cart.total)}</dd>
            </div>
          </dl>
          <div className="checkout-footer">
            <p>Taxes calculated at payment. 30-day free returns included.</p>
            {hasExpressPayment ? (
              <button
                className="express-pay-button"
                onClick={onCheckout}
                type="button"
              >
                Express Pay
              </button>
            ) : null}
            <button
              className="checkout-button"
              onClick={onCheckout}
              type="button"
            >
              {isOnePageCheckout ? "Pay in one step" : "Continue to payment"}
            </button>
          </div>
        </>
      ) : (
        <p className="empty-copy">
          Your cart is empty. Add an item from the catalog.
        </p>
      )}
    </aside>
  );
}

type PromoBannerProps = {
  isVisible: boolean;
};

function PromoBanner({ isVisible }: PromoBannerProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <section className="promo-banner" aria-label="Seasonal promotion">
      <div>
        <p className="eyebrow">Limited offer</p>
        <strong>Holiday audio bundle: save 15% on accessories</strong>
      </div>
      <span>Standalone store promotion</span>
    </section>
  );
}

type RecommendationPanelProps = {
  products: Product[];
  hasPersonalizedRecommendations: boolean;
  hasTrendingProducts: boolean;
  selectedAccount: DemoAccount | null;
  onAddToCart: (productId: string) => void;
};

function RecommendationPanel({
  products,
  hasPersonalizedRecommendations,
  hasTrendingProducts,
  selectedAccount,
  onAddToCart,
}: RecommendationPanelProps) {
  const recommendationProducts = hasPersonalizedRecommendations
    ? products
        .filter((product) => product.category === "Accessories")
        .slice(0, 2)
    : products.slice(0, 2);
  const trendingProducts = products
    .filter((product) => product.rating >= 4.7)
    .slice(0, 3);

  return (
    <section
      className="section-card recommendation-section"
      aria-labelledby="recommendation-heading"
    >
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Recommendations</p>
          <h2 id="recommendation-heading">
            {hasPersonalizedRecommendations
              ? "Picked for this customer"
              : "Popular with shoppers"}
          </h2>
        </div>
        <span
          className={
            hasPersonalizedRecommendations
              ? "status-pill status-on"
              : "status-pill"
          }
        >
          {hasPersonalizedRecommendations ? "Personalized" : "Default"}
        </span>
      </div>
      <div className="recommendation-grid">
        {recommendationProducts.map((product) => (
          <article className="recommendation-card" key={product.id}>
            <span>{product.badge}</span>
            <strong>{product.name}</strong>
            <small>
              {formatCurrency(product.price)} · ★ {product.rating}
            </small>
            <button
              disabled={!selectedAccount}
              onClick={() => onAddToCart(product.id)}
              type="button"
            >
              Add
            </button>
          </article>
        ))}
      </div>
      {hasTrendingProducts ? (
        <div className="trending-shelf">
          <strong>Trending now</strong>
          <div>
            {trendingProducts.map((product) => (
              <span key={product.id}>{product.name}</span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

type FeatureShowcaseProps = {
  account: DemoAccount | null;
  results: FeatureResultMap;
};

function FeatureShowcase({ account, results }: FeatureShowcaseProps) {
  if (!account) {
    return null;
  }

  return (
    <section
      className="section-card feature-showcase"
      aria-labelledby="feature-showcase-heading"
    >
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Experience coverage</p>
          <h2 id="feature-showcase-heading">Demo feature matrix</h2>
        </div>
        <span className="soft-pill">{demoFeatures.length} features</span>
      </div>
      <div className="feature-group-grid">
        {featureGroups.map((group) => {
          const groupFeatures = demoFeatures.filter(
            (feature) => feature.group === group.key,
          );

          return (
            <article className="feature-group-card" key={group.key}>
              <div>
                <h3>{group.label}</h3>
                <p>{group.summary}</p>
              </div>
              <div className="feature-pill-grid">
                {groupFeatures.map((feature) => {
                  const result = getFeatureResult(results, account, feature);
                  const isEnabled = result?.enabled === true;

                  return (
                    <span
                      className={
                        isEnabled
                          ? "feature-pill feature-pill-on"
                          : "feature-pill"
                      }
                      key={feature.key}
                    >
                      <strong>{feature.label}</strong>
                      <small>
                        {result
                          ? isEnabled
                            ? feature.enabledCopy
                            : feature.disabledCopy
                          : "Loading account experience"}
                      </small>
                    </span>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AccountDetails({ account }: { account: DemoAccount | null }) {
  if (!account) {
    return null;
  }

  return (
    <details className="section-card details-panel account-details-panel">
      <summary>View customer account details</summary>
      <dl className="detail-grid">
        <div>
          <dt>Customer</dt>
          <dd>{account.customerLabel}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{account.role}</dd>
        </div>
        <div>
          <dt>User ID</dt>
          <dd>{account.userId}</dd>
        </div>
        <div>
          <dt>Targeting ID</dt>
          <dd>{account.targetingId}</dd>
        </div>
      </dl>
    </details>
  );
}

function DeveloperDiagnostics({
  account,
  results,
  isLoading,
}: {
  account: DemoAccount | null;
  results: FeatureResultMap;
  isLoading: boolean;
}) {
  if (!account) {
    return null;
  }

  const evaluatedResults = demoFeatures
    .map((experience) => getFeatureResult(results, account, experience))
    .filter((result): result is SdkEvaluationResult => result !== null);

  return (
    <details className="section-card details-panel diagnostics-panel">
      <summary>Developer diagnostics</summary>
      <dl className="detail-grid">
        <div>
          <dt>Preview source</dt>
          <dd>
            {isLoading
              ? "Loading"
              : evaluatedResults.some(isClientEvaluationError)
                ? "Local safe fallback"
                : "Personalization service"}
          </dd>
        </div>
        {demoFeatures.map((experience) => {
          const result = getFeatureResult(results, account, experience);

          return (
            <div key={experience.key}>
              <dt>{experience.label}</dt>
              <dd>
                {result
                  ? `${result.enabled ? "On" : "Off"} · ${result.reason}`
                  : "Not loaded"}
              </dd>
            </div>
          );
        })}
      </dl>
    </details>
  );
}

function App() {
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [cart, setCart] = useState<CartView | null>(null);
  const [results, setResults] = useState<FeatureResultMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId],
  );

  const client = useMemo(
    () =>
      createFeatureFlagClient({
        baseUrl: apiBaseUrl,
        projectKey: selectedAccount?.projectKey ?? "demo-project",
        environmentKey,
        timeoutMs: sdkTimeoutMs,
      }),
    [selectedAccount?.projectKey],
  );

  useEffect(() => {
    let isMounted = true;

    Promise.all([listDemoAccounts(), listProducts()]).then(
      ([nextAccounts, nextProducts]) => {
        if (!isMounted) {
          return;
        }

        setAccounts(nextAccounts);
        setProducts(nextProducts);
      },
    );

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      if (!selectedAccountId) {
        if (!isCancelled) {
          setCart(null);
        }
        return;
      }

      const nextCart = await getCart(selectedAccountId);

      if (!isCancelled) {
        setCart(nextCart);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [selectedAccountId]);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      if (!selectedAccount) {
        if (!isCancelled) {
          setResults({});
          setIsLoading(false);
        }
        return;
      }

      const requestId = requestSequence.current + 1;
      requestSequence.current = requestId;

      if (!isCancelled) {
        setIsLoading(true);
        setMessage(null);
      }

      const evaluations = await Promise.all(
        demoFeatures.map(async (experience) => {
          const result = await client.evaluate(
            experience.key,
            selectedAccount.context,
          );
          return [experience.key, result] as const;
        }),
      );

      if (isCancelled || requestSequence.current !== requestId) {
        return;
      }

      setResults(
        evaluations.reduce<FeatureResultMap>((nextResults, [key, result]) => {
          nextResults[key] = result;
          return nextResults;
        }, {}),
      );

      if (evaluations.some(([, result]) => isClientEvaluationError(result))) {
        setMessage(
          "Some personalized sections could not load, so standard shopping stays active.",
        );
      }

      setIsLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [client, selectedAccount]);

  const hasEnhancedDashboard = isFeatureEnabled(
    results,
    selectedAccount,
    "beta-dashboard",
  );
  const hasOnePageCheckout = isFeatureEnabled(
    results,
    selectedAccount,
    "new-checkout",
  );
  const hasExpressPayment = isFeatureEnabled(
    results,
    selectedAccount,
    "express-payment",
  );
  const hasShippingProgress = isFeatureEnabled(
    results,
    selectedAccount,
    "shipping-progress-meter",
  );
  const hasPersonalizedRecommendations = isFeatureEnabled(
    results,
    selectedAccount,
    "personalized-recommendations",
  );
  const hasTrendingProducts = isFeatureEnabled(
    results,
    selectedAccount,
    "trending-products",
  );
  const hasHolidayPromoBanner = isFeatureEnabled(
    results,
    selectedAccount,
    "holiday-promo-banner",
  );

  const handleAccountChange = (accountId: string | null) => {
    requestSequence.current += 1;
    setSelectedAccountId(accountId);
    setResults({});
    setMessage(null);
  };

  const handleAddToCart = async (productId: string) => {
    if (!selectedAccount) {
      setMessage("Choose a customer account before adding products to cart.");
      return;
    }

    setCart(await addCartItem(selectedAccount.id, productId));
    setMessage("Added to cart.");
  };

  const handleQuantityChange = async (productId: string, quantity: number) => {
    if (!selectedAccount) {
      return;
    }

    setCart(await updateCartQuantity(selectedAccount.id, productId, quantity));
  };

  const handleCheckout = async () => {
    if (!selectedAccount) {
      return;
    }

    setCart(await clearCart(selectedAccount.id));
    setMessage(
      hasOnePageCheckout
        ? "Order placed with one-page checkout."
        : "Order is ready for the payment step.",
    );
  };

  return (
    <main className="demo-shell">
      <section className="app-frame" aria-labelledby="app-heading">
        <header className="store-header">
          <div className="store-navbar">
            <a className="brand-lockup" href="#app-heading">
              <span className="brand-mark" aria-hidden="true">
                SE
              </span>
              <span>ShopEase</span>
            </a>
            <label className="header-search">
              <span className="search-icon" aria-hidden="true">
                ⌕
              </span>
              <input
                readOnly
                value="Search headphones, speakers, and accessories"
                aria-label="Search store products"
              />
            </label>
            <nav className="header-links" aria-label="Store navigation">
              <a href="#catalog-heading">Shop</a>
              <a href="#cart-heading">Cart</a>
              <a href="#guest-heading">Support</a>
            </nav>
          </div>

          <div className="hero-section">
            <div className="hero-copy">
              <p className="eyebrow">Premium audio store</p>
              <h1 id="app-heading">Upgrade your sound, checkout faster.</h1>
              <p>
                Discover premium audio gear with saved carts, member benefits,
                and a checkout experience tailored to the selected customer.
              </p>
              <div className="hero-cta-row">
                <a className="primary-link" href="#catalog-heading">
                  Shop best sellers
                </a>
                <a className="secondary-link" href="#cart-heading">
                  View cart
                </a>
              </div>
              <div className="hero-actions" aria-label="Store assurances">
                <span>Free shipping over $100</span>
                <span>2-year warranty</span>
                <span>30-day returns</span>
              </div>
            </div>
            <AccountSwitcher
              accounts={accounts}
              selectedAccount={selectedAccount}
              isLoading={isLoading}
              onAccountChange={handleAccountChange}
            />
          </div>
        </header>

        <PromoBanner isVisible={hasHolidayPromoBanner} />

        {message ? <div className="toast-message">{message}</div> : null}

        <FeatureShowcase account={selectedAccount} results={results} />

        <div className="store-layout">
          <div className="store-main">
            <CustomerDashboard
              account={selectedAccount}
              isEnhanced={hasEnhancedDashboard}
            />
            <RecommendationPanel
              products={products}
              hasPersonalizedRecommendations={hasPersonalizedRecommendations}
              hasTrendingProducts={hasTrendingProducts}
              selectedAccount={selectedAccount}
              onAddToCart={handleAddToCart}
            />
            <ProductCatalog
              products={products}
              selectedAccount={selectedAccount}
              onAddToCart={handleAddToCart}
            />
          </div>
          <div className="store-sidebar">
            <CartPanel
              cart={cart}
              isOnePageCheckout={hasOnePageCheckout}
              hasExpressPayment={hasExpressPayment}
              hasShippingProgress={hasShippingProgress}
              selectedAccount={selectedAccount}
              onQuantityChange={handleQuantityChange}
              onCheckout={handleCheckout}
            />
          </div>
        </div>

        <footer className="footer-panels">
          <AccountDetails account={selectedAccount} />
          <DeveloperDiagnostics
            account={selectedAccount}
            results={results}
            isLoading={isLoading}
          />
        </footer>
      </section>
    </main>
  );
}

export default App;
