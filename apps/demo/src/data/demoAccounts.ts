import type { EvaluationContext } from '@ffp/js-sdk';

export type DemoAccountRole =
  | 'shop-admin'
  | 'beta-customer'
  | 'regular-customer';

export type DemoAccountRecord = {
  id: string;
  userLabel: string;
  scenarioSummary: string;
  organizationId: string;
  userId: string;
  targetingId: string;
  role: DemoAccountRole;
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
