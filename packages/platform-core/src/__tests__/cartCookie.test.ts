/** @jest-environment node */

const SECRET = "test_secret";

describe("cartCookie", () => {
  beforeEach(() => {
    process.env.CART_COOKIE_SECRET = SECRET;
    jest.resetModules();
  });

  afterEach(() => {
    delete process.env.CART_COOKIE_SECRET;
    jest.resetModules();
    jest.unmock("@acme/config/env/core");
  });

  it("caches secret and throws when missing", async () => {
    const mod = await import("../cartCookie");
    expect(mod.__test.getSecret()).toBe(SECRET);
    expect(mod.__test.getSecret()).toBe(SECRET);

    delete process.env.CART_COOKIE_SECRET;
    jest.resetModules();
    jest.doMock("@acme/config/env/core", () => ({ loadCoreEnv: () => ({}) }));
    await expect(
      import("../cartCookie").then((m) => m.__test.getSecret())
    ).rejects.toThrow("env.CART_COOKIE_SECRET is required");
  });

  it("encodes JSON and decodes original object", async () => {
    const { encodeCartCookie, decodeCartCookie } = await import("../cartCookie");
    const value = { foo: "bar" };
    const token = encodeCartCookie(JSON.stringify(value));
    expect(token.split(".")).toHaveLength(2);
    expect(decodeCartCookie(token)).toEqual(value);
  });

  it("encodes plain string and decodes raw value", async () => {
    const { encodeCartCookie, decodeCartCookie } = await import("../cartCookie");
    const value = "hello";
    const token = encodeCartCookie(value);
    expect(decodeCartCookie(token)).toBe(value);
  });

  it("returns null and warns on tampered signature", async () => {
    const { encodeCartCookie, decodeCartCookie } = await import("../cartCookie");
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const token = encodeCartCookie(JSON.stringify({ id: 1 }));
    const [payload] = token.split(".");
    const tampered = `${payload}.deadbeef`;
    expect(decodeCartCookie(tampered)).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith("Invalid cart cookie");
    warnSpy.mockRestore();
  });

  it("returns null for missing, empty, or invalid raw values", async () => {
    const { encodeCartCookie, decodeCartCookie } = await import("../cartCookie");
    const valid = encodeCartCookie("payload");
    const [, sig] = valid.split(".");
    const cases = [undefined, null, "", "abc", `.${sig}`, "payload."];
    for (const raw of cases) {
      expect(decodeCartCookie(raw as any)).toBeNull();
    }
  });

  it("builds Set-Cookie header", async () => {
    const { asSetCookieHeader, CART_COOKIE } = await import("../cartCookie");
    const header = asSetCookieHeader("value");
    expect(header).toMatch(
      new RegExp(`^${CART_COOKIE}=value; Path=/; Max-Age=\\d+; SameSite=Strict; Secure; HttpOnly$`)
    );
    const noAge = asSetCookieHeader("value", null);
    expect(noAge).toBe(
      `${CART_COOKIE}=value; Path=/; SameSite=Strict; Secure; HttpOnly`
    );
  });
});

