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

type ExperienceKey = "beta-dashboard" | "new-checkout";
type ExperienceResultMap = Partial<Record<ExperienceKey, SdkEvaluationResult>>;

type Experience = {
  key: ExperienceKey;
  label: string;
};

const experiences: Experience[] = [
  { key: "beta-dashboard", label: "Account dashboard" },
  { key: "new-checkout", label: "Checkout" },
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
  experience: Experience,
) {
  return (
    result?.projectKey === account.projectKey &&
    result.flagKey === experience.key
  );
}

function getExperienceResult(
  results: ExperienceResultMap,
  account: DemoAccount,
  experience: Experience,
) {
  const result = results[experience.key];
  return isResultForExperience(result, account, experience) ? result : null;
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
      <p className="eyebrow">Account</p>
      <h2 id="account-switcher-heading">
        {selectedAccount ? "Signed in as" : "Browsing as guest"}
      </h2>
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
  selectedAccount: DemoAccount | null;
  onQuantityChange: (productId: string, quantity: number) => void;
  onCheckout: () => void;
};

function CartPanel({
  cart,
  isOnePageCheckout,
  selectedAccount,
  onQuantityChange,
  onCheckout,
}: CartPanelProps) {
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
  results: ExperienceResultMap;
  isLoading: boolean;
}) {
  if (!account) {
    return null;
  }

  const evaluatedResults = experiences
    .map((experience) => getExperienceResult(results, account, experience))
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
        {experiences.map((experience) => {
          const result = getExperienceResult(results, account, experience);

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
  const [results, setResults] = useState<ExperienceResultMap>({});
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
        experiences.map(async (experience) => {
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
        evaluations.reduce<ExperienceResultMap>(
          (nextResults, [key, result]) => {
            nextResults[key] = result;
            return nextResults;
          },
          {},
        ),
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

  const dashboardResult = selectedAccount
    ? getExperienceResult(results, selectedAccount, experiences[0])
    : null;
  const checkoutResult = selectedAccount
    ? getExperienceResult(results, selectedAccount, experiences[1])
    : null;
  const hasEnhancedDashboard = dashboardResult?.enabled === true;
  const hasOnePageCheckout = checkoutResult?.enabled === true;

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
        <header className="hero-section">
          <div className="hero-copy">
            <nav className="store-nav" aria-label="Store highlights">
              <span className="brand-lockup">
                <span className="brand-mark" aria-hidden="true">
                  SE
                </span>
                Premium Audio Store
              </span>
              <span>Free shipping over $100</span>
              <span>2-year warranty</span>
            </nav>
            <p className="eyebrow">Summer audio event</p>
            <h1 id="app-heading">ShopEase Checkout</h1>
            <p>
              Shop premium audio gear with saved carts, member benefits, and a
              checkout experience that adapts automatically to the selected
              customer.
            </p>
            <div className="hero-actions" aria-label="Store assurances">
              <span>Fast delivery</span>
              <span>Secure checkout</span>
              <span>Easy returns</span>
            </div>
          </div>
          <AccountSwitcher
            accounts={accounts}
            selectedAccount={selectedAccount}
            isLoading={isLoading}
            onAccountChange={handleAccountChange}
          />
        </header>

        {message ? <div className="toast-message">{message}</div> : null}

        <div className="store-layout">
          <div className="store-main">
            <CustomerDashboard
              account={selectedAccount}
              isEnhanced={hasEnhancedDashboard}
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
