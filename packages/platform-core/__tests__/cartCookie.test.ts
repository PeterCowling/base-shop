import {
  asSetCookieHeader,
  CART_COOKIE,
  decodeCartCookie,
  encodeCartCookie,
} from "../src/cartCookie";

jest.mock("@acme/config/env/core", () => ({
  loadCoreEnv: () => ({ CART_COOKIE_SECRET: "test-secret" }),
}));

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

  it("sets cookie with expiration and domain", () => {
    const encoded = "value";
    expect(asSetCookieHeader(encoded, 60, { domain: "example.com" })).toBe(
      `${CART_COOKIE}=${encoded}; Path=/; Max-Age=60; Domain=example.com; SameSite=Lax; Secure; HttpOnly`
    );
  });

  it("sets cookie without expiration or domain", () => {
    const encoded = "value";
    expect(asSetCookieHeader(encoded, null)).toBe(
      `${CART_COOKIE}=${encoded}; Path=/; SameSite=Lax; Secure; HttpOnly`
    );
  });
});
