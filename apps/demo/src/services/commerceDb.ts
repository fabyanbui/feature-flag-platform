import type {
  CartLine,
  CartView,
  DemoAccount,
  DemoAccountRecord,
  Product,
} from '../data/demoAccounts';
import { cartSeed, demoAccountSeed, productSeed } from '../data/seed';

export const demoProjectKey = 'demo-project';

const accounts = demoAccountSeed.map(toDemoAccount);
const products = [...productSeed];
const cartsByAccount = new Map<string, CartLine[]>(
  Object.entries(cartSeed).map(([accountId, lines]) => [
    accountId,
    lines.map((line) => ({ ...line })),
  ]),
);

function toDemoAccount(account: DemoAccountRecord): DemoAccount {
  return {
    ...account,
    projectKey: demoProjectKey,
    context: {
      targetingKey: account.targetingId,
      userId: account.userId,
      roles: [account.role],
    },
  };
}

function cloneAccount(account: DemoAccount): DemoAccount {
  return {
    ...account,
    context: {
      ...account.context,
      roles: [...(account.context.roles ?? [])],
    },
  };
}

function cloneProduct(product: Product): Product {
  return { ...product };
}

function getMutableCart(accountId: string): CartLine[] {
  const existingCart = cartsByAccount.get(accountId);

  if (existingCart) {
    return existingCart;
  }

  const nextCart: CartLine[] = [];
  cartsByAccount.set(accountId, nextCart);
  return nextCart;
}

function toCartView(accountId: string, lines: CartLine[]): CartView {
  const cartLines = lines
    .map((line) => {
      const product = products.find((item) => item.id === line.productId);

      if (!product) {
        return null;
      }

      return {
        ...line,
        product: cloneProduct(product),
        lineTotal: product.price * line.quantity,
      };
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);

  const subtotal = cartLines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shipping = subtotal >= 100 || subtotal === 0 ? 0 : 8;
  const discount = 0;

  return {
    accountId,
    lines: cartLines,
    subtotal,
    shipping,
    discount,
    total: subtotal + shipping - discount,
  };
}

export async function listAccounts(): Promise<DemoAccount[]> {
  return accounts.map(cloneAccount);
}

export async function listProducts(): Promise<Product[]> {
  return products.map(cloneProduct);
}

export async function getCart(accountId: string): Promise<CartView> {
  return toCartView(accountId, getMutableCart(accountId));
}

export async function addCartItem(
  accountId: string,
  productId: string,
): Promise<CartView> {
  const cart = getMutableCart(accountId);
  const line = cart.find((item) => item.productId === productId);

  if (line) {
    line.quantity += 1;
  } else {
    cart.push({ productId, quantity: 1 });
  }

  return toCartView(accountId, cart);
}

export async function updateCartQuantity(
  accountId: string,
  productId: string,
  quantity: number,
): Promise<CartView> {
  const cart = getMutableCart(accountId);
  const lineIndex = cart.findIndex((item) => item.productId === productId);

  if (lineIndex === -1) {
    return toCartView(accountId, cart);
  }

  if (quantity <= 0) {
    cart.splice(lineIndex, 1);
  } else {
    cart[lineIndex].quantity = quantity;
  }

  return toCartView(accountId, cart);
}

export async function clearCart(accountId: string): Promise<CartView> {
  cartsByAccount.set(accountId, []);
  return toCartView(accountId, []);
}
