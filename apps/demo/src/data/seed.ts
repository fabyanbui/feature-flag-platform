import type {
  CartLine,
  DemoAccountRecord,
  DemoAccountRole,
  Product,
} from './demoAccounts';

type OrganizationAccountPlan = {
  organizationId: string;
  organizationName: string;
  shopAdmins: number;
  betaCustomers: number;
  regularCustomers: number;
};

type CheckoutRolloutAccountSeedRow = [
  accountNumber: string,
  targetingId: string,
  organizationId: string,
  organizationName: string,
  role: DemoAccountRole,
];

const organizationAccountPlans: readonly OrganizationAccountPlan[] = [
  {
    organizationId: 'org-alpha',
    organizationName: 'Alpha Audio Collective',
    shopAdmins: 1,
    betaCustomers: 8,
    regularCustomers: 21,
  },
  {
    organizationId: 'org-beta',
    organizationName: 'Beta Retail Lab',
    shopAdmins: 1,
    betaCustomers: 5,
    regularCustomers: 19,
  },
  {
    organizationId: 'org-gamma',
    organizationName: 'Gamma Gadget Market',
    shopAdmins: 1,
    betaCustomers: 4,
    regularCustomers: 15,
  },
  {
    organizationId: 'org-delta',
    organizationName: 'Delta Digital Supply',
    shopAdmins: 1,
    betaCustomers: 2,
    regularCustomers: 12,
  },
  {
    organizationId: 'org-epsilon',
    organizationName: 'Epsilon Electronics',
    shopAdmins: 1,
    betaCustomers: 1,
    regularCustomers: 8,
  },
];

function createCheckoutRolloutAccountSeed(): CheckoutRolloutAccountSeedRow[] {
  let nextAccountNumber = 1;

  return organizationAccountPlans.flatMap((organization) => {
    const roles: DemoAccountRole[] = [
      ...Array.from(
        { length: organization.shopAdmins },
        () => 'shop-admin' as const,
      ),
      ...Array.from(
        { length: organization.betaCustomers },
        () => 'beta-customer' as const,
      ),
      ...Array.from(
        { length: organization.regularCustomers },
        () => 'regular-customer' as const,
      ),
    ];

    return roles.map((role): CheckoutRolloutAccountSeedRow => {
      const accountNumber = String(nextAccountNumber).padStart(3, '0');
      nextAccountNumber += 1;

      return [
        accountNumber,
        `demo-rollout-${accountNumber}`,
        organization.organizationId,
        organization.organizationName,
        role,
      ];
    });
  });
}

const checkoutRolloutAccountSeed: readonly CheckoutRolloutAccountSeedRow[] =
  createCheckoutRolloutAccountSeed();

const checkoutRolloutAccounts: DemoAccountRecord[] = checkoutRolloutAccountSeed.map(
  ([accountNumber, targetingId, organizationId, organizationName, role]) => ({
    id: `rollout-account-${accountNumber}`,
    userLabel: `User account ${accountNumber}`,
    scenarioSummary:
      'Returning shopper with saved cart details and a familiar checkout setup.',
    organizationId,
    organizationName,
    userId: targetingId,
    targetingId,
    role,
  }),
);

export const demoAccountSeed: readonly DemoAccountRecord[] = [
  ...checkoutRolloutAccounts,
];

export const productSeed: readonly Product[] = [
  {
    id: 'headphones-pro',
    name: 'Premium Wireless Headphones',
    category: 'Audio',
    description: 'Noise-cancelling audio, 40-hour battery life, and soft travel-ready ear cushions.',
    price: 129,
    rating: 4.8,
    badge: 'Best seller',
    accent: 'green',
  },
  {
    id: 'speaker-mini',
    name: 'Mini Bluetooth Speaker',
    category: 'Audio',
    description: 'Pocket-size speaker with rich bass and waterproof build for weekend trips.',
    price: 59,
    rating: 4.6,
    badge: 'Travel pick',
    accent: 'blue',
  },
  {
    id: 'charging-dock',
    name: '3-in-1 Charging Dock',
    category: 'Accessories',
    description: 'Fast wireless charging stand for phone, watch, and earbuds in one clean setup.',
    price: 79,
    rating: 4.7,
    badge: 'New',
    accent: 'purple',
  },
  {
    id: 'audio-case',
    name: 'Protective Audio Case',
    category: 'Accessories',
    description: 'Compact hard-shell case with cable storage and soft recycled lining.',
    price: 24,
    rating: 4.5,
    badge: 'Add-on',
    accent: 'orange',
  },
  {
    id: 'studio-stand',
    name: 'Adjustable Studio Stand',
    category: 'Accessories',
    description: 'Weighted desktop stand that keeps headphones displayed, protected, and easy to reach.',
    price: 39,
    rating: 4.7,
    badge: 'Desk setup',
    accent: 'blue',
  },
];

export const cartSeed: Record<string, CartLine[]> = {
  'rollout-account-006': [{ productId: 'audio-case', quantity: 2 }],
};
