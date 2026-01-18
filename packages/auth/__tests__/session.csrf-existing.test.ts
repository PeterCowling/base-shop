import { jest } from "@jest/globals";
import type { Mock } from "jest-mock";


type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
  maxAge?: number;
  domain?: string;
};

type CookieStore = {
  get: Mock<{ name: string; value: string } | undefined, [string]>;
  set: Mock<void, [string, string, CookieOptions?]>;
  delete: Mock<void, [{ name: string; path?: string; domain?: string }]>;
};

type HeadersStore = {
  get: Mock<string | null, [string]>;
};

jest.mock("@acme/zod-utils/initZod", () => ({ initZod: jest.fn() }));

const mockCookies = jest.fn<Promise<CookieStore>, []>();
const mockHeaders = jest.fn<HeadersStore, []>(() => ({ get: jest.fn<string | null, [string]>(() => null) }));
jest.mock("next/headers", () => ({
  cookies: () => mockCookies(),
  headers: () => mockHeaders(),
}));

import type { Role } from "../src/types";

function createStore(): CookieStore {
  const jar = new Map<string, string>();
  return {
    get: jest.fn<{ name: string; value: string } | undefined, [string]>((name: string) => {
      const value = jar.get(name);
      return value ? { name, value } : undefined;
    }),
    set: jest.fn<void, [string, string, CookieOptions?]>((name: string, value: string, opts?: CookieOptions) => {
      jar.set(name, value);
      return opts;
    }),
    delete: jest.fn<void, [{ name: string; path?: string; domain?: string }]>(opts => {
      jar.delete(opts.name);
    }),
  };
}

describe("getCustomerSession", () => {
  const originalSecret = process.env.SESSION_SECRET;
  const originalDomain = process.env.COOKIE_DOMAIN;

  beforeEach(() => {
    process.env.SESSION_SECRET = "0123456789abcdefghijklmnopqrstuvwxyz012345"; // 40 chars
    process.env.COOKIE_DOMAIN = "example.com";
    mockCookies.mockReset();
    jest.resetModules();
    jest.unmock("@acme/config/env/core");
  });

  afterAll(() => {
    if (originalSecret !== undefined) process.env.SESSION_SECRET = originalSecret; else delete process.env.SESSION_SECRET;
    if (originalDomain !== undefined) process.env.COOKIE_DOMAIN = originalDomain; else delete process.env.COOKIE_DOMAIN;
  });

  it("does not set csrf token when already present", async () => {
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const { createCustomerSession, getCustomerSession, CSRF_TOKEN_COOKIE } = await import("../src/session");
    const session = { customerId: "abc", role: "customer" as Role };
    await createCustomerSession(session);
    store.set.mockClear();
    await getCustomerSession();
    expect(store.set).not.toHaveBeenCalledWith(
      CSRF_TOKEN_COOKIE,
      expect.anything(),
      expect.anything(),
    );
  });
});
