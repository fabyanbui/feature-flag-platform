import type {
  CartLine,
  DemoAccountRecord,
  DemoAccountRole,
  Product,
} from './demoAccounts';

const checkoutRolloutAccountSeed: readonly [
  accountNumber: string,
  targetingId: string,
  organizationId: string,
  role: DemoAccountRole,
][] = [
  ['01', 'demo-rollout-01', 'demo-org-rollout-01', 'shop-admin'],
  ['02', 'demo-rollout-03', 'demo-org-rollout-02', 'beta-customer'],
  ['03', 'demo-rollout-06', 'demo-org-rollout-03', 'regular-customer'],
  ['04', 'demo-rollout-08', 'demo-org-rollout-04', 'regular-customer'],
  ['05', 'demo-rollout-11', 'demo-org-rollout-05', 'regular-customer'],
  ['06', 'demo-rollout-13', 'demo-org-rollout-06', 'regular-customer'],
  ['07', 'demo-rollout-17', 'demo-org-rollout-07', 'regular-customer'],
  ['08', 'demo-rollout-18', 'demo-org-rollout-08', 'regular-customer'],
  ['09', 'demo-rollout-20', 'demo-org-rollout-09', 'regular-customer'],
  ['10', 'demo-rollout-24', 'demo-org-rollout-10', 'regular-customer'],
  ['11', 'demo-rollout-32', 'demo-org-rollout-11', 'regular-customer'],
  ['12', 'demo-rollout-34', 'demo-org-rollout-12', 'regular-customer'],
];

const checkoutRolloutAccounts: DemoAccountRecord[] = checkoutRolloutAccountSeed.map(
  ([accountNumber, targetingId, organizationId, role]) => ({
    id: `rollout-account-${accountNumber}`,
    userLabel: `User account ${accountNumber}`,
    scenarioSummary:
      'Returning shopper with saved cart details and a familiar checkout setup.',
    organizationId,
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
  'rollout-account-06': [{ productId: 'audio-case', quantity: 2 }],
};
