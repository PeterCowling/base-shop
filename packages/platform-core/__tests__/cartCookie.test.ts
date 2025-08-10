// packages/platform-core/__tests__/cartCookie.test.ts
import {
  asSetCookieHeader,
  CART_COOKIE,
  decodeCartCookie,
  encodeCartCookie,
} from "../src/cartCookie";

describe("cart cookie helpers", () => {
  it("encodes and decodes the cart id", () => {
    const id = "test-id";
    const encoded = encodeCartCookie(id);
    expect(decodeCartCookie(encoded)).toBe(id);
  });

  it("decodeCartCookie handles invalid input", () => {
    expect(decodeCartCookie("bad" as any)).toBeNull();
    expect(decodeCartCookie(null)).toBeNull();
  });

  it("formats Set-Cookie header", () => {
    const encoded = "value";

    expect(asSetCookieHeader(encoded)).toBe(
      `${CART_COOKIE}=${encoded}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure; HttpOnly`
    );
  });
});
