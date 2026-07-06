import type { EvaluationContext } from '@ffp/js-sdk'
import type {
  CartLine,
  DemoAccountRecord,
  Product,
} from '../src/data/demoAccounts.js'
import { cartSeed, demoAccountSeed, productSeed } from '../src/data/seed.js'

export const demoProjectKey = 'demo-project'

export type DemoBackendAccount = DemoAccountRecord & {
  projectKey: string
  context: EvaluationContext
}

export type DemoFeatureKey =
  | 'beta-dashboard'
  | 'new-checkout'
  | 'express-payment'
  | 'shipping-progress-meter'
  | 'coupon-engine'
  | 'personalized-recommendations'
  | 'trending-products'
  | 'holiday-promo-banner'
  | 'live-support-widget'

export type CartLineView = CartLine & {
  product: Product
  lineTotal: number
}

export type CartView = {
  accountId: string
  lines: CartLineView[]
  subtotal: number
  shipping: number
  discount: number
  total: number
}

const accounts = demoAccountSeed.map(toDemoAccount)
const products = [...productSeed]
const cartsByAccount = new Map<string, CartLine[]>(
  Object.entries(cartSeed).map(([accountId, lines]) => [
    accountId,
    lines.map((line) => ({ ...line })),
  ]),
)

function toDemoAccount(account: DemoAccountRecord): DemoBackendAccount {
  return {
    ...account,
    projectKey: demoProjectKey,
    context: {
      targetingKey: account.targetingId,
      userId: account.userId,
      roles: [account.role],
      attributes: {
        organizationId: account.organizationId,
        organizationName: account.organizationName,
      },
    },
  }
}

function cloneProduct(product: Product): Product {
  return { ...product }
}

function getMutableCart(accountId: string): CartLine[] {
  const existingCart = cartsByAccount.get(accountId)

  if (existingCart) {
    return existingCart
  }

  const nextCart: CartLine[] = []
  cartsByAccount.set(accountId, nextCart)
  return nextCart
}

function toCartView(accountId: string, lines: CartLine[]): CartView {
  const cartLines = lines
    .map((line) => {
      const product = products.find((item) => item.id === line.productId)

      if (!product) {
        return null
      }

      return {
        ...line,
        product: cloneProduct(product),
        lineTotal: product.price * line.quantity,
      }
    })
    .filter((line): line is NonNullable<typeof line> => line !== null)

  const subtotal = cartLines.reduce((sum, line) => sum + line.lineTotal, 0)
  const shipping = subtotal >= 100 || subtotal === 0 ? 0 : 8
  const discount = Math.min(20, Math.round(subtotal * 0.15))

  return {
    accountId,
    lines: cartLines,
    subtotal,
    shipping,
    discount,
    total: subtotal + shipping - discount,
  }
}

export function findDemoAccount(accountId: string): DemoBackendAccount | null {
  return accounts.find((account) => account.id === accountId) ?? null
}

export function getCheckoutSession(accountId: string) {
  const cart = toCartView(accountId, getMutableCart(accountId))

  return {
    cart,
    paymentMethods: [
      {
        id: 'saved-card',
        label: 'Saved card ending in 4242',
        type: 'card',
      },
      {
        id: 'wallet',
        label: 'Express wallet',
        type: 'wallet',
      },
    ],
    fulfillment: {
      shippingSpeed:
        cart.subtotal >= 100 ? 'Free standard shipping' : 'Standard shipping',
      returns: '30-day free returns',
    },
  }
}

function getRecommendationFeed(account: DemoBackendAccount) {
  const preferredCategory =
    account.role === 'shop-admin'
      ? 'Accessories'
      : account.role === 'beta-customer'
        ? 'Audio'
        : null
  const selectedProducts = preferredCategory
    ? products.filter((product) => product.category === preferredCategory)
    : products

  return {
    strategy: preferredCategory
      ? `Personalized for ${preferredCategory}`
      : 'Popular products fallback',
    products: selectedProducts.slice(0, 3).map(cloneProduct),
  }
}

function getCartSummary(accountId: string) {
  const cart = toCartView(accountId, getMutableCart(accountId))

  return {
    lineCount: cart.lines.length,
    subtotal: cart.subtotal,
    total: cart.total,
  }
}

export function getFeatureDemoPayload(
  featureKey: DemoFeatureKey,
  account: DemoBackendAccount,
): Record<string, unknown> {
  switch (featureKey) {
    case 'beta-dashboard':
      return {
        dashboard: 'priority-account-dashboard',
        supportTier: account.role === 'shop-admin' ? 'admin-priority' : 'member',
        organizationName: account.organizationName,
      }
    case 'new-checkout':
      return {
        checkoutMode: 'one-page',
        session: getCheckoutSession(account.id),
      }
    case 'express-payment':
      return {
        paymentMode: 'express',
        authorization: 'demo-authorized',
        cart: getCartSummary(account.id),
      }
    case 'shipping-progress-meter': {
      const cart = getCartSummary(account.id)
      const target = 100
      const subtotal = Number(cart.subtotal)

      return {
        target,
        subtotal,
        remaining: Math.max(0, target - subtotal),
        progressPercent: Math.min(100, Math.round((subtotal / target) * 100)),
      }
    }
    case 'coupon-engine':
      return {
        code: 'AUDIO15',
        discountType: 'percentage',
        discountPercent: 15,
        maximumDiscount: 20,
      }
    case 'personalized-recommendations':
      return getRecommendationFeed(account)
    case 'trending-products':
      return {
        products: products
          .filter((product) => product.rating >= 4.7)
          .slice(0, 3)
          .map(cloneProduct),
      }
    case 'holiday-promo-banner':
      return {
        campaign: 'holiday-audio-bundle',
        headline: 'Holiday audio bundle: save 15% on accessories',
      }
    case 'live-support-widget':
      return {
        chatSessionId: `chat-${account.organizationId}`,
        queue: 'checkout-specialist',
        estimatedWaitSeconds: 30,
      }
  }
}
