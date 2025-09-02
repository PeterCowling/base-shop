import {
  asSetCookieHeader,
  CART_COOKIE,
  decodeCartCookie,
  encodeCartCookie,
} from "../src/cartCookie";

describe("cart cookie helpers", () => {
  it("parses valid cookie data", () => {
    const data = { id: "test" };
    const encoded = encodeCartCookie(JSON.stringify(data));
    expect(decodeCartCookie(encoded)).toEqual(data);
  });

  it("handles malformed or missing cookie", () => {
    expect(decodeCartCookie("bad" as any)).toBeNull();
    expect(decodeCartCookie(null)).toBeNull();
  });

  it("sets cookie with expiration", () => {
    const encoded = "value";
    expect(asSetCookieHeader(encoded)).toBe(
      `${CART_COOKIE}=${encoded}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Strict; Secure; HttpOnly`
    );
  });

  it("sets cookie without expiration", () => {
    const encoded = "value";
    expect(asSetCookieHeader(encoded, null)).toBe(
      `${CART_COOKIE}=${encoded}; Path=/; SameSite=Strict; Secure; HttpOnly`
    );
  });
});
