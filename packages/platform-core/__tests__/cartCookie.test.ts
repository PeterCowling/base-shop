// packages/platform-core/__tests__/cartCookie.test.ts
import {
  asSetCookieHeader,
  CART_COOKIE,
  decodeCartCookie,
  encodeCartCookie,
  type CartState,
} from "../src/cartCookie";

const sku = {
  id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  slug: "sample",
  title: "Sample",
  price: 100,
  deposit: 10,
  forSale: true,
  forRental: false,
  image: "/img.png",
  sizes: [],
  description: "",
};

describe("cart cookie helpers", () => {
  const state: CartState = {
    [sku.id]: { sku, qty: 2 },
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
