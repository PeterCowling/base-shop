import { createCustomerSession, getCustomerSession, CUSTOMER_SESSION_COOKIE } from "../src/session";
import type { Role } from "../src/types";

const mockCookies = jest.fn();
jest.mock("next/headers", () => ({
  cookies: () => mockCookies(),
}));

describe("customer session", () => {
  const originalSecret = process.env.SESSION_SECRET;
  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret";
    mockCookies.mockReset();
  });
  afterAll(() => {
    if (originalSecret !== undefined) {
      process.env.SESSION_SECRET = originalSecret;
    } else {
      delete process.env.SESSION_SECRET;
    }
  });

  it("creates and retrieves a valid session", async () => {
    const store = { get: jest.fn(), set: jest.fn(), delete: jest.fn() };
    mockCookies.mockResolvedValue(store);
    const session = { customerId: "abc", role: "customer" as Role };

    await createCustomerSession(session);
    const [name, value, opts] = store.set.mock.calls[0];
    expect(name).toBe(CUSTOMER_SESSION_COOKIE);
    expect(opts).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: expect.any(Number),
      expires: expect.any(Date),
    });

    store.get.mockReturnValue({ value });
    await expect(getCustomerSession()).resolves.toEqual(session);
  });

  it("rejects tampered tokens", async () => {
    const store = { get: jest.fn(), set: jest.fn(), delete: jest.fn() };
    mockCookies.mockResolvedValue(store);
    const session = { customerId: "abc", role: "customer" as Role };
    await createCustomerSession(session);
    const token = store.set.mock.calls[0][1] as string;
    store.get.mockReturnValue({ value: token + "tamper" });
    await expect(getCustomerSession()).resolves.toBeNull();
  });

  it("rejects expired tokens", async () => {
    const store = { get: jest.fn(), set: jest.fn(), delete: jest.fn() };
    mockCookies.mockResolvedValue(store);
    const session = { customerId: "abc", role: "customer" as Role };
    await createCustomerSession(session);
    const token = store.set.mock.calls[0][1] as string;
    const payload = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString("utf8"));
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(payload.exp + 1000);
    store.get.mockReturnValue({ value: token });
    await expect(getCustomerSession()).resolves.toBeNull();
    nowSpy.mockRestore();
  });
});
