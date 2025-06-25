// packages/platform-core/__tests__/cartCookie.test.ts
import {
  asSetCookieHeader,
  CART_COOKIE,
  decodeCartCookie,
  encodeCartCookie,
} from "../cartCookie";
import type { CartState } from "../contexts/CartContext";
import { PRODUCTS } from "../products";

describe("cart cookie helpers", () => {
  const state: CartState = {
    [PRODUCTS[0].id]: { sku: PRODUCTS[0], qty: 2 },
  };

  it("encodes and decodes the cart", () => {
    const encoded = encodeCartCookie(state);

    expect(encoded).toBe(encodeURIComponent(JSON.stringify(state)));
    expect(decodeCartCookie(encoded)).toEqual(state);
  });

  it("decodeCartCookie handles invalid input", () => {
    expect(decodeCartCookie("%E0%A4%A")).toEqual({});
    expect(decodeCartCookie(null)).toEqual({});
  });

  it("formats Set-Cookie header", () => {
    const encoded = "value";

    expect(asSetCookieHeader(encoded)).toBe(
      `${CART_COOKIE}=${encoded}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
    );
  });
});
