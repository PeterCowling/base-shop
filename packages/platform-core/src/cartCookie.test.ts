/** @jest-environment node */

jest.mock("@acme/config/env/core", () => ({
  loadCoreEnv: () => ({ CART_COOKIE_SECRET: "test-secret" }),
}));

import {
  CART_COOKIE,
  encodeCartCookie,
  decodeCartCookie,
  asSetCookieHeader,
} from "./cartCookie";

describe("cartCookie", () => {
  it("encodes then decodes JSON values", () => {
    const value = { foo: "bar" };
    const encoded = encodeCartCookie(JSON.stringify(value));
    const decoded = decodeCartCookie(encoded);
    expect(decoded).toEqual(value);
  });

  it("logs warning and returns null for invalid signature", () => {
    const encoded = encodeCartCookie(JSON.stringify({ foo: "bar" }));
    const tampered = encoded.replace(/.$/, "x");
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const result = decodeCartCookie(tampered);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith("Invalid cart cookie");
    warnSpy.mockRestore();
  });

  it("warns and returns null for completely invalid signature", () => {
    const payload = Buffer.from(JSON.stringify({ foo: "bar" }), "utf8").toString(
      "base64url"
    );
    const cookie = `${payload}.deadbeef`;
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    expect(decodeCartCookie(cookie)).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith("Invalid cart cookie");
    warnSpy.mockRestore();
  });

  it("warns and returns null for malformed cookie", () => {
    const encoded = encodeCartCookie(JSON.stringify({ foo: "bar" }));
    const truncated = encoded.slice(0, -1);
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    expect(decodeCartCookie(truncated)).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith("Invalid cart cookie");
    warnSpy.mockRestore();
  });

  it("returns null when cookie missing", () => {
    expect(decodeCartCookie(undefined)).toBeNull();
  });

  it("returns null when signature missing", () => {
    expect(decodeCartCookie("abc")).toBeNull();
  });

  it("returns null when encoded value missing", () => {
    const encoded = encodeCartCookie("payload");
    const [, sig] = encoded.split(".");
    expect(decodeCartCookie(`.${sig}`)).toBeNull();
  });

  it("returns raw string for non-JSON payload", () => {
    const payload = "hello";
    const encoded = encodeCartCookie(payload);
    const decoded = decodeCartCookie(encoded);
    expect(decoded).toBe(payload);
  });

  it("omits Max-Age when maxAge is null", () => {
    const header = asSetCookieHeader("value", null);
    expect(header.includes("Max-Age")).toBe(false);
    expect(header).toBe(
      `${CART_COOKIE}=value; Path=/; SameSite=Strict; Secure; HttpOnly`
    );
  });

  it("includes Max-Age when provided", () => {
    const header = asSetCookieHeader("value", 10);
    expect(header).toContain("Max-Age=10");
  });

  it("uses default Max-Age when omitted", () => {
    const header = asSetCookieHeader("value");
    expect(header).toMatch(/Max-Age=\d+/);
  });

  it("sets Max-Age=0 when clearing the cookie", () => {
    const header = asSetCookieHeader("gone", 0);
    expect(header).toContain("Max-Age=0");
    expect(header.startsWith(`${CART_COOKIE}=gone`)).toBe(true);
  });

  it("throws when getSecret is called without a secret", async () => {
    jest.resetModules();
    jest.doMock("@acme/config/env/core", () => ({ loadCoreEnv: () => ({}) }));
    const { __test } = await import("./cartCookie");
    expect(() => __test.getSecret()).toThrow("env.CART_COOKIE_SECRET is required");
  });

  it("throws when secret is missing", async () => {
    jest.resetModules();
    jest.doMock("@acme/config/env/core", () => ({ loadCoreEnv: () => ({}) }));
    await expect(
      import("./cartCookie").then((m) => m.encodeCartCookie("x"))
    ).rejects.toThrow("env.CART_COOKIE_SECRET is required");
  });
});

