import { jest } from "@jest/globals";

jest.mock("@acme/zod-utils/initZod", () => ({ initZod: jest.fn() }));

const mockCookies = jest.fn();
const mockHeaders = jest.fn(() => ({ get: () => null }));
jest.mock("next/headers", () => ({
  cookies: () => mockCookies(),
  headers: () => mockHeaders(),
}));

import type { Role } from "../src/types";

function createStore() {
  const jar = new Map<string, string>();
  return {
    get: jest.fn((name: string) => {
      const value = jar.get(name);
      return value ? { name, value } : undefined;
    }),
    set: jest.fn((name: string, value: string) => {
      jar.set(name, value);
    }),
    delete: jest.fn((name: string) => {
      jar.delete(name);
    }),
  };
}

describe("session token", () => {
  const originalSecret = process.env.SESSION_SECRET;
  const originalDomain = process.env.COOKIE_DOMAIN;

  beforeEach(() => {
    process.env.SESSION_SECRET = "0123456789abcdefghijklmnopqrstuvwxyz012345"; // 40 chars
    process.env.COOKIE_DOMAIN = "example.com";
    mockCookies.mockReset();
    jest.resetModules();
  });

  afterAll(() => {
    if (originalSecret !== undefined) process.env.SESSION_SECRET = originalSecret; else delete process.env.SESSION_SECRET;
    if (originalDomain !== undefined) process.env.COOKIE_DOMAIN = originalDomain; else delete process.env.COOKIE_DOMAIN;
  });

  it("creates a session token", async () => {
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const { createCustomerSession, CUSTOMER_SESSION_COOKIE } = await import("../src/session");
    await createCustomerSession({ customerId: "abc", role: "customer" as Role });
    const [name, token] = store.set.mock.calls[0];
    expect(name).toBe(CUSTOMER_SESSION_COOKIE);
    expect(typeof token).toBe("string");
    expect(token).not.toHaveLength(0);
  });

  it("parses a valid token", async () => {
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const { createCustomerSession, getCustomerSession } = await import("../src/session");
    const session = { customerId: "abc", role: "customer" as Role };
    await createCustomerSession(session);
    await expect(getCustomerSession()).resolves.toEqual(session);
  });

  it("handles expired tokens", async () => {
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const { createCustomerSession, getCustomerSession } = await import("../src/session");
    const { SESSION_TTL_S } = await import("../src/store");
    const session = { customerId: "abc", role: "customer" as Role };
    let now = Date.now();
    const spy = jest.spyOn(Date, "now").mockImplementation(() => now);

    await createCustomerSession(session);
    now += (SESSION_TTL_S + 1) * 1000;
    await expect(getCustomerSession()).resolves.toBeNull();

    spy.mockRestore();
  });

  it("rejects tokens with invalid signature", async () => {
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const {
      createCustomerSession,
      getCustomerSession,
      CUSTOMER_SESSION_COOKIE,
    } = await import("../src/session");
    const session = { customerId: "abc", role: "customer" as Role };
    await createCustomerSession(session);
    const token = store.set.mock.calls[0][1];
    store.set(CUSTOMER_SESSION_COOKIE, token + "tampered");
    await expect(getCustomerSession()).resolves.toBeNull();
  });
});

