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
    set: jest.fn((name: string, value: string, opts?: unknown) => {
      jar.set(name, value);
      return opts;
    }),
    delete: jest.fn((opts: { name: string }) => {
      jar.delete(opts.name);
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
    mockHeaders.mockImplementation(() => ({ get: () => null }));
    jest.resetModules();
    // Ensure no lingering mocks from isolate tests
    jest.unmock("@acme/config/env/core");
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

  it("stores user agent on session creation", async () => {
    await jest.isolateModulesAsync(async () => {
      const store = createStore();
      mockCookies.mockResolvedValue(store);
      mockHeaders.mockImplementation(() => ({ get: () => "CreateUA" }));
      const set = jest.fn();
      jest
        .spyOn(await import("../src/store"), "createSessionStore")
        .mockResolvedValue({ set } as unknown as { set: typeof set });
      const { createCustomerSession } = await import("../src/session");
      await createCustomerSession({ customerId: "abc", role: "customer" as Role });
      expect(set).toHaveBeenCalledWith({
        sessionId: expect.any(String),
        customerId: "abc",
        userAgent: "CreateUA",
        createdAt: expect.any(Date),
      });
    });
  });

  it("parses a valid token", async () => {
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const { createCustomerSession, getCustomerSession } = await import("../src/session");
    const session = { customerId: "abc", role: "customer" as Role };
    await createCustomerSession(session);
    await expect(getCustomerSession()).resolves.toEqual(session);
  });

  it("defaults user agent to unknown when header missing", async () => {
    const store = createStore();
    mockCookies.mockResolvedValue(store);

    const sessionStore = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };

    jest.doMock("../src/store", () => {
      const actual = jest.requireActual("../src/store");
      return {
        __esModule: true,
        ...actual,
        createSessionStore: async () => sessionStore,
      };
    });

    const { createCustomerSession, getCustomerSession } = await import("../src/session");

    mockHeaders.mockReturnValue({ get: () => null });

    const session = { customerId: "abc", role: "customer" as Role };
    await createCustomerSession(session);

    const sessionId = sessionStore.set.mock.calls[0][0].sessionId;
    sessionStore.get.mockResolvedValue({
      sessionId,
      customerId: session.customerId,
      userAgent: "ua",
      createdAt: new Date(),
    });

    sessionStore.set.mockClear();

    await getCustomerSession();

    expect(sessionStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ userAgent: "unknown" }),
    );
  });

  it("sets csrf token cookie when missing", async () => {
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const { createCustomerSession, getCustomerSession, CSRF_TOKEN_COOKIE } = await import("../src/session");
    const session = { customerId: "abc", role: "customer" as Role };
    await createCustomerSession(session);
    store.delete({ name: CSRF_TOKEN_COOKIE });
    store.set.mockClear();
    await getCustomerSession();
    expect(store.set).toHaveBeenCalledWith(
      CSRF_TOKEN_COOKIE,
      expect.any(String),
      expect.anything(),
    );
  });

  it("does not set csrf token cookie when present", async () => {
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const { createCustomerSession, getCustomerSession, CSRF_TOKEN_COOKIE } = await import("../src/session");
    const session = { customerId: "abc", role: "customer" as Role };
    await createCustomerSession(session);
    expect(store.get(CSRF_TOKEN_COOKIE)).toBeDefined();
    store.set.mockClear();
    await expect(getCustomerSession()).resolves.toEqual(session);
    expect(store.set.mock.calls.find(([name]) => name === CSRF_TOKEN_COOKIE)).toBeUndefined();
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

  it("respects overridden SESSION_TTL_S", async () => {
    const store = createStore();
    mockCookies.mockResolvedValue(store);

    jest.doMock("../src/store", () => {
      const actual = jest.requireActual("../src/store");
      const { MemorySessionStore } = jest.requireActual("../src/memoryStore");
      return {
        __esModule: true,
        ...actual,
        SESSION_TTL_S: 1,
        createSessionStore: async () => new MemorySessionStore(1),
      };
    });

    const { createCustomerSession, getCustomerSession } = await import(
      "../src/session"
    );
    const session = { customerId: "abc", role: "customer" as Role };
    let now = Date.now();
    const spy = jest.spyOn(Date, "now").mockImplementation(() => now);

    await createCustomerSession(session);
    now += 2000;
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

  it("returns null when session store lookup fails", async () => {
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    jest.doMock("../src/store", () => ({
      __esModule: true,
      SESSION_TTL_S: 1,
      createSessionStore: async () => ({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn(),
        delete: jest.fn(),
      }),
    }));
    const { createCustomerSession, getCustomerSession } = await import(
      "../src/session"
    );
    const session = { customerId: "abc", role: "customer" as Role };
    await createCustomerSession(session);
    await expect(getCustomerSession()).resolves.toBeNull();
  });

  it("rejects and does not update cookies when sessionStore.set fails", async () => {
    jest.resetModules();
    const { sealData } = await import("iron-session");
    const { SESSION_TTL_S } = jest.requireActual("../src/store");
    const session = {
      customerId: "abc",
      role: "customer" as Role,
      sessionId: "sess-1",
    };
    const token = await sealData(session, {
      password: process.env.SESSION_SECRET!,
      ttl: SESSION_TTL_S,
    });
    const store = createStore();
    store.set("customer_session", token);
    store.set("csrf_token", "csrf");
    store.set.mockClear();
    mockCookies.mockResolvedValue(store);
    const error = new Error("set fail");
    jest.doMock("../src/store", () => {
      const actual = jest.requireActual("../src/store");
      return {
        __esModule: true,
        ...actual,
        createSessionStore: async () => ({
          get: jest
            .fn()
            .mockResolvedValue({
              sessionId: session.sessionId,
              customerId: session.customerId,
              userAgent: "ua",
              createdAt: new Date(),
            }),
          set: jest.fn().mockRejectedValue(error),
          delete: jest.fn().mockResolvedValue(undefined),
        }),
      };
    });
    const { getCustomerSession } = await import("../src/session");
    await expect(getCustomerSession()).rejects.toThrow(error);
    expect(store.set).not.toHaveBeenCalled();
  });

  it("rejects and does not update cookies when sessionStore.delete fails", async () => {
    jest.resetModules();
    const { sealData } = await import("iron-session");
    const { SESSION_TTL_S } = jest.requireActual("../src/store");
    const session = {
      customerId: "abc",
      role: "customer" as Role,
      sessionId: "sess-1",
    };
    const token = await sealData(session, {
      password: process.env.SESSION_SECRET!,
      ttl: SESSION_TTL_S,
    });
    const store = createStore();
    store.set("customer_session", token);
    store.set("csrf_token", "csrf");
    store.set.mockClear();
    mockCookies.mockResolvedValue(store);
    const error = new Error("delete fail");
    jest.doMock("../src/store", () => {
      const actual = jest.requireActual("../src/store");
      return {
        __esModule: true,
        ...actual,
        createSessionStore: async () => ({
          get: jest
            .fn()
            .mockResolvedValue({
              sessionId: session.sessionId,
              customerId: session.customerId,
              userAgent: "ua",
              createdAt: new Date(),
            }),
          set: jest.fn().mockResolvedValue(undefined),
          delete: jest.fn().mockRejectedValue(error),
        }),
      };
    });
    const { getCustomerSession } = await import("../src/session");
    await expect(getCustomerSession()).rejects.toThrow(error);
    expect(store.set).not.toHaveBeenCalled();
  });

  it("returns null when session cookie is missing", async () => {
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const { getCustomerSession } = await import("../src/session");
    await expect(getCustomerSession()).resolves.toBeNull();
  });

  it("returns null when SESSION_SECRET is undefined", async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock("@acme/config/env/core", () => ({
        coreEnv: {
          SESSION_SECRET: undefined,
          COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
        },
      }));
      const store = createStore();
      mockCookies.mockResolvedValue(store);
      const { getCustomerSession } = await import("../src/session");
      await expect(getCustomerSession()).resolves.toBeNull();
    });
  });

  it("creates session with default cookie options", async () => {
    delete process.env.COOKIE_DOMAIN;
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const { createCustomerSession, CUSTOMER_SESSION_COOKIE } = await import(
      "../src/session"
    );
    await createCustomerSession({ customerId: "abc", role: "customer" as Role });
    const [, , opts] = store.set.mock.calls.find(
      ([name]) => name === CUSTOMER_SESSION_COOKIE
    )!;
    expect(opts).toMatchObject({
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      path: "/",
      domain: undefined,
    });
  });

  it("creates session with custom cookie attributes", async () => {
    process.env.COOKIE_DOMAIN = "custom.example";
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const { createCustomerSession, CUSTOMER_SESSION_COOKIE } = await import(
      "../src/session"
    );
    await createCustomerSession({ customerId: "abc", role: "customer" as Role });
    const [, , opts] = store.set.mock.calls.find(
      ([name]) => name === CUSTOMER_SESSION_COOKIE
    )!;
    expect(opts?.domain).toBe("custom.example");
  });

  it("sets long-lived cookies when remember is true", async () => {
    const REMEMBER_ME_TTL_S = 60 * 60 * 24 * 30;
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const {
      createCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await import("../src/session");
    await createCustomerSession(
      { customerId: "abc", role: "customer" as Role },
      { remember: true },
    );

    const sessionCall = store.set.mock.calls.find(
      ([name]) => name === CUSTOMER_SESSION_COOKIE,
    )!;
    const csrfCall = store.set.mock.calls.find(
      ([name]) => name === CSRF_TOKEN_COOKIE,
    )!;
    expect(sessionCall[2]?.maxAge).toBe(REMEMBER_ME_TTL_S);
    expect(csrfCall[2]?.maxAge).toBe(REMEMBER_ME_TTL_S);
  });

  it("destroyCustomerSession without cookie clears cookies", async () => {
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const {
      destroyCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await import("../src/session");
    await destroyCustomerSession();
    expect(store.delete).toHaveBeenCalledWith({
      name: CUSTOMER_SESSION_COOKIE,
      path: "/",
      domain: "example.com",
    });
    expect(store.delete).toHaveBeenCalledWith({
      name: CSRF_TOKEN_COOKIE,
      path: "/",
      domain: "example.com",
    });
  });

  it("destroyCustomerSession deletes store entry and clears cookies", async () => {
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const sessionStore = {
      set: jest.fn(),
      delete: jest.fn(),
    };
    jest.doMock("../src/store", () => ({
      __esModule: true,
      SESSION_TTL_S: 1,
      createSessionStore: async () => sessionStore,
    }));
    const {
      createCustomerSession,
      destroyCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await import("../src/session");
    await createCustomerSession({ customerId: "abc", role: "customer" as Role });
    const sessionId = sessionStore.set.mock.calls[0][0].sessionId;
    await destroyCustomerSession();
    expect(sessionStore.delete).toHaveBeenCalledWith(sessionId);
    expect(store.delete).toHaveBeenCalledWith({
      name: CUSTOMER_SESSION_COOKIE,
      path: "/",
      domain: "example.com",
    });
    expect(store.delete).toHaveBeenCalledWith({
      name: CSRF_TOKEN_COOKIE,
      path: "/",
      domain: "example.com",
    });
  });

  it("destroyCustomerSession removes cookies but skips store delete for corrupted token", async () => {
    const { sealData } = await import("iron-session");
    const { SESSION_TTL_S } = jest.requireActual("../src/store");
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const valid = await sealData(
      { customerId: "abc", role: "customer" as Role, sessionId: "sess-1" },
      {
        password: process.env.SESSION_SECRET!,
        ttl: SESSION_TTL_S,
      },
    );
    store.set("customer_session", valid + "corrupt");
    store.set("csrf_token", "csrf");
    const sessionStore = { delete: jest.fn() };
    jest.doMock("../src/store", () => {
      const actual = jest.requireActual("../src/store");
      return {
        __esModule: true,
        ...actual,
        createSessionStore: async () => sessionStore,
      };
    });
    const {
      destroyCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await import("../src/session");
    await destroyCustomerSession();
    expect(sessionStore.delete).not.toHaveBeenCalled();
    expect(store.delete).toHaveBeenCalledWith({
      name: CUSTOMER_SESSION_COOKIE,
      path: "/",
      domain: "example.com",
    });
    expect(store.delete).toHaveBeenCalledWith({
      name: CSRF_TOKEN_COOKIE,
      path: "/",
      domain: "example.com",
    });
  });

  it("destroyCustomerSession clears cookies even when store delete fails", async () => {
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const error = new Error("boom");
    const sessionStore = {
      set: jest.fn(),
      delete: jest.fn().mockRejectedValue(error),
    };
    jest.doMock("../src/store", () => ({
      __esModule: true,
      SESSION_TTL_S: 1,
      createSessionStore: async () => sessionStore,
    }));
    const {
      createCustomerSession,
      destroyCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await import("../src/session");
    await createCustomerSession({ customerId: "abc", role: "customer" as Role });
    await expect(destroyCustomerSession()).rejects.toThrow(error);
    expect(store.delete).toHaveBeenCalledWith({
      name: CUSTOMER_SESSION_COOKIE,
      path: "/",
      domain: "example.com",
    });
    expect(store.delete).toHaveBeenCalledWith({
      name: CSRF_TOKEN_COOKIE,
      path: "/",
      domain: "example.com",
    });
  });

  it("destroyCustomerSession clears cookies when token is invalid", async () => {
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const sessionStore = {
      set: jest.fn(),
      delete: jest.fn(),
    };
    jest.doMock("../src/store", () => ({
      __esModule: true,
      SESSION_TTL_S: 1,
      createSessionStore: async () => sessionStore,
    }));
    const {
      destroyCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await import("../src/session");
    store.set(CUSTOMER_SESSION_COOKIE, "invalid-token");
    await expect(destroyCustomerSession()).resolves.toBeUndefined();
    expect(sessionStore.delete).not.toHaveBeenCalled();
    expect(store.delete).toHaveBeenCalledWith({
      name: CUSTOMER_SESSION_COOKIE,
      path: "/",
      domain: "example.com",
    });
    expect(store.delete).toHaveBeenCalledWith({
      name: CSRF_TOKEN_COOKIE,
      path: "/",
      domain: "example.com",
    });
  });

  it("destroyCustomerSession clears cookies when SESSION_SECRET missing", async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock("@acme/config/env/core", () => ({
        coreEnv: {
          SESSION_SECRET: undefined,
          COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
        },
      }));
      const store = createStore();
      mockCookies.mockResolvedValue(store);
      const {
        destroyCustomerSession,
        CUSTOMER_SESSION_COOKIE,
        CSRF_TOKEN_COOKIE,
      } = await import("../src/session");
      store.set(CUSTOMER_SESSION_COOKIE, "token");
      await expect(destroyCustomerSession()).resolves.toBeUndefined();
      expect(store.delete).toHaveBeenCalledWith({
        name: CUSTOMER_SESSION_COOKIE,
        path: "/",
        domain: "example.com",
      });
      expect(store.delete).toHaveBeenCalledWith({
        name: CSRF_TOKEN_COOKIE,
        path: "/",
        domain: "example.com",
      });
    });
  });

  it("throws when SESSION_SECRET is missing", async () => {
    jest.resetModules();
    delete process.env.SESSION_SECRET;
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: {
        SESSION_SECRET: undefined,
        COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
      },
    }));
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const { createCustomerSession } = await import("../src/session");
    await expect(
      createCustomerSession({ customerId: "abc", role: "customer" as Role })
    ).rejects.toThrow("SESSION_SECRET is not set");
  });
});

describe("session management", () => {
  it("lists sessions for a customer", async () => {
    jest.resetModules();
    const result = [{ sessionId: "1" }];
    const list = jest.fn().mockResolvedValue(result);
    jest.doMock("../src/store", () => ({
      __esModule: true,
      SESSION_TTL_S: 1,
      createSessionStore: async () => ({ list }),
    }));
    const { listSessions } = await import("../src/session");
    await expect(listSessions("cust-1")).resolves.toBe(result);
    expect(list).toHaveBeenCalledWith("cust-1");
  });

  it("revokes a session id", async () => {
    jest.resetModules();
    const del = jest.fn().mockResolvedValue(undefined);
    jest.doMock("../src/store", () => ({
      __esModule: true,
      SESSION_TTL_S: 1,
      createSessionStore: async () => ({ delete: del }),
    }));
    const { revokeSession } = await import("../src/session");
    await revokeSession("sess-1");
    expect(del).toHaveBeenCalledWith("sess-1");
  });

  it("bubbles up revoke errors", async () => {
    jest.resetModules();
    const error = new Error("fail");
    const del = jest.fn().mockRejectedValue(error);
    jest.doMock("../src/store", () => ({
      __esModule: true,
      SESSION_TTL_S: 1,
      createSessionStore: async () => ({ delete: del }),
    }));
    const { revokeSession } = await import("../src/session");
    await expect(revokeSession("sess-1")).rejects.toThrow(error);
  });
});

describe("validateCsrfToken", () => {
  it("returns true for matching token", async () => {
    jest.resetModules();
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const { validateCsrfToken, CSRF_TOKEN_COOKIE } = await import("../src/session");
    store.set(CSRF_TOKEN_COOKIE, "token");
    await expect(validateCsrfToken("token")).resolves.toBe(true);
  });

  it("returns false for mismatched token", async () => {
    jest.resetModules();
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const { validateCsrfToken, CSRF_TOKEN_COOKIE } = await import("../src/session");
    store.set(CSRF_TOKEN_COOKIE, "correct");
    await expect(validateCsrfToken("wrong")).resolves.toBe(false);
  });

  it("returns false when csrf cookie is missing", async () => {
    jest.resetModules();
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const { validateCsrfToken } = await import("../src/session");
    await expect(validateCsrfToken("token")).resolves.toBe(false);
  });

  it("returns false when token is missing", async () => {
    jest.resetModules();
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const { validateCsrfToken } = await import("../src/session");
    await expect(validateCsrfToken(null)).resolves.toBe(false);
  });

  it("returns false when csrf cookie is missing", async () => {
    jest.resetModules();
    const store = { get: jest.fn(() => undefined) };
    mockCookies.mockResolvedValue(store);
    const { validateCsrfToken, CSRF_TOKEN_COOKIE } = await import("../src/session");
    await expect(validateCsrfToken("token")).resolves.toBe(false);
    expect(store.get).toHaveBeenCalledWith(CSRF_TOKEN_COOKIE);
  });
});

