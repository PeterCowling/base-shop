import { decodeCartCookie, encodeCartCookie } from "@acme/platform-core/cartCookie";
import {
  createCart,
  getCart,
  incrementQty,
  setCart,
} from "@acme/platform-core/cartStore";
import { PRODUCTS } from "@acme/platform-core/products";

// Minimal NextResponse mock using the native Response class
jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

jest.mock("@upstash/redis", () => ({ Redis: class {} }));

export const TEST_SKU = PRODUCTS[0];

export function createRequest(
  body: any,
  cookie?: string,
  url = "http://localhost/api/cart",
): any {
  return {
    json: async () => body,
    cookies: {
      get: (name: string) => (cookie ? { name, value: cookie } : undefined),
    },
    nextUrl: Object.assign(new URL(url), { clone: () => new URL(url) }),
  } as any;
}

export async function createCartWithItem(qty = 1) {
  const sku = { ...TEST_SKU };
  const size = sku.sizes[0];
  const idKey = `${sku.id}:${size}`;
  const cart = { [idKey]: { sku, qty, size } };
  const cartId = await createCart();
  await setCart(cartId, cart);
  return { cart, cartId, idKey, sku, size };
}

export function withOutOfStockSku() {
  const original = TEST_SKU.stock;
  TEST_SKU.stock = 0;
  return () => {
    TEST_SKU.stock = original;
  };
}

export function invalidSize() {
  return "ZZ";
}

export {
  createCart,
  decodeCartCookie,
  encodeCartCookie,
  getCart,
  incrementQty,
  setCart,
};
