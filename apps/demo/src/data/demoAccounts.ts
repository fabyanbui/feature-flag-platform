import type { EvaluationContext } from '@ffp/js-sdk';

export type DemoAccountRole = 'admin' | 'beta-tester' | 'user';

export type DemoAccountRecord = {
  id: string;
  title: string;
  customerLabel: string;
  accountGroup: string;
  scenarioSummary: string;
  expectedOutcome: string;
  expectedReason: string;
  userId: string;
  targetingId: string;
  role: DemoAccountRole;
  presenterNote: string;
};

export type DemoAccount = DemoAccountRecord & {
  projectKey: string;
  context: EvaluationContext;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  rating: number;
  badge: string;
  accent: string;
};

export type CartLine = {
  productId: string;
  quantity: number;
};

export type CartLineView = CartLine & {
  product: Product;
  lineTotal: number;
};

export type CartView = {
  accountId: string;
  lines: CartLineView[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
};
