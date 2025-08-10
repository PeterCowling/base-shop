// packages/platform-core/__tests__/cartCookie.test.ts
import type { CartState } from "@types";
import {
  asSetCookieHeader,
  CART_COOKIE,
  decodeCartCookie,
  encodeCartCookie,
} from "../src/cartCookie";
import { PRODUCTS } from "../src/products";

describe("cart cookie helpers", () => {
  const sku = { ...PRODUCTS[0], id: "01H7M4QJ1FD6C6BVK7VNQNR3FA" } as (typeof PRODUCTS)[number];
  const state: CartState = {
    [sku.id]: { sku, qty: 2 },
  };

  it("encodes and decodes the cart", () => {
    const encoded = encodeCartCookie(state);
    expect(encoded).toContain(".");
    expect(decodeCartCookie(encoded)).toEqual(state);
  });

  it("decodeCartCookie handles invalid input", () => {
    expect(decodeCartCookie("%E0%A4%A")).toEqual({});
    expect(decodeCartCookie(null)).toEqual({});
  });

  it("rejects tampered cookies", () => {
    const encoded = encodeCartCookie(state);
    const idx = encoded.lastIndexOf(".");
    const payload = encoded.slice(0, idx);
    const signature = encoded.slice(idx + 1);
    const tampered = `${payload}tampered.${signature}`;
    expect(decodeCartCookie(tampered)).toEqual({});
  });

  it("formats Set-Cookie header", () => {
    const encoded = "value";

    expect(asSetCookieHeader(encoded)).toBe(
      `${CART_COOKIE}=${encoded}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure; HttpOnly`
    );
  });
});
