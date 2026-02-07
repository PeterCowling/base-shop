/** @jest-environment node */

import crypto from "crypto";

import {
  asSetCookieHeader,
  CART_COOKIE,
  decodeCartCookie,
  encodeCartCookie,
} from "../cartCookie";

const SECRET = "test_secret";

jest.mock("@acme/config/env/core", () => ({
  loadCoreEnv: () => ({ CART_COOKIE_SECRET: SECRET }),
}));

describe("cartCookie helpers", () => {
  it("encodes values with HMAC and decodes original object", () => {
    const value = { foo: "bar" };
    const json = JSON.stringify(value);
    const token = encodeCartCookie(json);
    const [payload, sig] = token.split(".");
    expect(Buffer.from(payload, "base64url").toString("utf8")).toBe(json);
    const expected = crypto
      .createHmac("sha256", SECRET)
      .update(payload)
      .digest("hex");
    expect(sig).toBe(expected);
    expect(decodeCartCookie(token)).toEqual(value);
  });

  it("returns null and warns on corrupted signature", () => {
    const token = encodeCartCookie(JSON.stringify({ id: 1 }));
    const [payload] = token.split(".");
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    expect(decodeCartCookie(`${payload}.deadbeef`)).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith("Invalid cart cookie");
    warnSpy.mockRestore();
  });

  it("returns null and warns on corrupted payload", () => {
    const token = encodeCartCookie(JSON.stringify({ id: 1 }));
    const [, sig] = token.split(".");
    const tamperedPayload = token
      .split(".")[0]
      .replace(/.$/, "A");
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    expect(decodeCartCookie(`${tamperedPayload}.${sig}`)).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith("Invalid cart cookie");
    warnSpy.mockRestore();
  });

  it("falls back to raw string for non-JSON payloads", () => {
    const token = encodeCartCookie("hello");
    expect(decodeCartCookie(token)).toBe("hello");
  });

  it("returns null for missing cookie or parts", () => {
    const token = encodeCartCookie("payload");
    const [, sig] = token.split(".");
    expect(decodeCartCookie(undefined)).toBeNull();
    expect(decodeCartCookie("bcd")).toBeNull();
    expect(decodeCartCookie(`.${sig}`)).toBeNull();
  });

  it("builds Set-Cookie header with ttl and domain options", () => {
    const header = asSetCookieHeader("value", 10, { domain: "example.com" });
    expect(header).toBe(
      `${CART_COOKIE}=value; Path=/; Max-Age=10; Domain=example.com; SameSite=Lax; Secure; HttpOnly`
    );
  });

  it("omits Max-Age and Domain when not provided", () => {
    const header = asSetCookieHeader("value", null);
    expect(header).toBe(
      `${CART_COOKIE}=value; Path=/; SameSite=Lax; Secure; HttpOnly`
    );
  });

  it("serializes and parses cart state via cookie header", () => {
    const cart = { "1": 2, "2": 1 };
    const token = encodeCartCookie(JSON.stringify(cart));
    const header = asSetCookieHeader(token);
    expect(header).toContain(`${CART_COOKIE}=${token}`);
    expect(header).toContain("Path=/");
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Max-Age=2592000");

    const cookieHeader = `${CART_COOKIE}=${token}; other=1`;
    const parsed = cookieHeader
      .split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith(`${CART_COOKIE}=`))
      ?.split("=")[1];
    expect(decodeCartCookie(parsed!)).toEqual(cart);
  });

  it("returns null for malformed or missing cart cookie in header", () => {
    const invalid = "not_base64.sig";
    const cookieHeader = `${CART_COOKIE}=${invalid}; other=1`;
    const parsed = cookieHeader
      .split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith(`${CART_COOKIE}=`))
      ?.split("=")[1];
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    expect(decodeCartCookie(parsed!)).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith("Invalid cart cookie");
    warnSpy.mockRestore();

    const noCartCookie = "foo=bar";
    const missing = noCartCookie
      .split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith(`${CART_COOKIE}=`))
      ?.split("=")[1];
    expect(decodeCartCookie(missing as any)).toBeNull();
  });

  it("handles signature length mismatch without throwing", () => {
    const token = encodeCartCookie("payload");
    const [payload, sig] = token.split(".");
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    expect(decodeCartCookie(`${payload}.${sig.slice(1)}`)).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith("Invalid cart cookie");
    warnSpy.mockRestore();
  });
});

