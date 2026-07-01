import type { DemoAccountRecord } from './demoAccounts';

const checkoutRolloutAccountSeed: readonly [
  accountNumber: string,
  targetingId: string,
  expectedReason: string,
  expectedOutcome: string,
][] = [
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
];

const checkoutRolloutAccounts: DemoAccountRecord[] = checkoutRolloutAccountSeed.map(
  ([accountNumber, targetingId, expectedReason, expectedOutcome]) => ({
  id: `rollout-account-${accountNumber}`,
  title: `Rollout account ${accountNumber}`,
  customerLabel: `Customer account ${accountNumber}`,
  accountGroup: 'Staged checkout rollout',
  scenarioSummary:
    'Regular shopper in the staged account series. Switch accounts to see gradual release behavior.',
  expectedOutcome,
  expectedReason,
  userId: targetingId,
  targetingId,
  role: 'user',
  presenterNote:
    'Regular account in the deterministic rollout series. Re-evaluate the same account to show the result stays stable.',
}),
);

export const demoAccountSeed: readonly DemoAccountRecord[] = [
  {
    id: 'role-targeting-on',
    title: 'Early-access customer',
    customerLabel: 'Beta customer',
    accountGroup: 'Role-based early access',
    scenarioSummary:
      'Shows a customer segment that receives the newest checkout experience before general rollout.',
    expectedOutcome: 'New One-Page Checkout visible for this customer segment.',
    expectedReason: 'ROLE_MATCH',
    userId: 'demo-user-beta',
    targetingId: 'demo-user-beta',
    role: 'beta-tester',
    presenterNote: 'Expected technical reason: ROLE_MATCH.',
  },
  {
    id: 'regular-customer',
    title: 'Regular customer',
    customerLabel: 'Regular customer',
    accountGroup: 'Standard customers',
    scenarioSummary:
      'Shows a standard ecommerce customer with one user ID, one targeting ID, and one role.',
    expectedOutcome:
      'Checkout visibility depends on deterministic percentage rollout for this account.',
    expectedReason: 'DEFAULT_OFF or PERCENTAGE_ROLLOUT',
    userId: 'demo-user-regular',
    targetingId: 'demo-user-regular',
    role: 'user',
    presenterNote:
      'Use Customer account 01–12 for a more predictable included/excluded rollout series.',
  },
  {
    id: 'admin-preview-customer',
    title: 'Admin preview customer',
    customerLabel: 'Admin preview customer',
    accountGroup: 'Admin allowlist preview',
    scenarioSummary:
      'Shows an ecommerce preview customer that is explicitly allowlisted by user ID.',
    expectedOutcome: 'New One-Page Checkout visible for the allowlisted preview account.',
    expectedReason: 'USER_ALLOWLIST',
    userId: 'demo-user-admin',
    targetingId: 'demo-user-admin',
    role: 'admin',
    presenterNote:
      'This is only a storefront sample account, not login, registration, or RBAC authentication.',
  },
  ...checkoutRolloutAccounts,
];
