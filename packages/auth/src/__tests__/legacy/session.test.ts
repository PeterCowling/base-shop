import { jest } from "@jest/globals";

const mockCookies = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
};

const mockHeaders = {
  get: jest.fn(),
};

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => Promise.resolve(mockCookies)),
  headers: jest.fn(() => Promise.resolve(mockHeaders)),
}));

jest.mock("@acme/config/env/core", () => ({
  coreEnv: {
    get SESSION_SECRET() {
      return process.env.SESSION_SECRET;
    },
    get COOKIE_DOMAIN() {
      return process.env.COOKIE_DOMAIN;
    },
  },
}));

const sealData = jest.fn();
const unsealData = jest.fn();

jest.mock("iron-session", () => ({
  sealData,
  unsealData,
}));

const randomUUID = jest.fn();

jest.mock("crypto", () => ({
  randomUUID,
}));

let mockSessionStore: any;
const createSessionStore = jest.fn(async () => mockSessionStore);

jest.mock("../../store", () => ({
  createSessionStore,
  SESSION_TTL_S: 3600,
}));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  process.env = {
    ...ORIGINAL_ENV,
    SESSION_SECRET: "secret",
    COOKIE_DOMAIN: "example.com",
  } as NodeJS.ProcessEnv;
  mockCookies.get.mockReset();
  mockCookies.set.mockReset();
  mockCookies.delete.mockReset();
  mockHeaders.get.mockReset();
  sealData.mockReset();
  unsealData.mockReset();
  randomUUID.mockReset();
  mockSessionStore = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    list: jest.fn(),
  };
  createSessionStore.mockResolvedValue(mockSessionStore);
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("session", () => {
  it("throws when SESSION_SECRET is missing", async () => {
    const { createCustomerSession } = await import("../../session");
    delete process.env.SESSION_SECRET;

    await expect(
      createCustomerSession({ customerId: "cust", role: "customer" })
    ).rejects.toThrow(
      "SESSION_SECRET is not set in core environment configuration"
    );
  });

  it("returns null for invalid or expired tokens", async () => {
    const { getCustomerSession, CUSTOMER_SESSION_COOKIE } = await import(
      "../../session"
    );

    // invalid token
    mockCookies.get.mockReturnValue({ value: "bad" });
    unsealData.mockRejectedValue(new Error("bad"));
    await expect(getCustomerSession()).resolves.toBeNull();

    // expired token
    mockCookies.get.mockImplementation((name: string) =>
      name === CUSTOMER_SESSION_COOKIE ? { value: "tok" } : undefined
    );
    unsealData.mockResolvedValue({
      sessionId: "old",
      customerId: "cust",
      role: "customer",
    });
    mockSessionStore.get.mockResolvedValue(undefined);
    await expect(getCustomerSession()).resolves.toBeNull();
  });

  it("rotates session and creates CSRF cookie when absent", async () => {
    const {
      getCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await import("../../session");

    mockCookies.get.mockImplementation((name: string) =>
      name === CUSTOMER_SESSION_COOKIE ? { value: "tok" } : undefined
    );
    unsealData.mockResolvedValue({
      sessionId: "old",
      customerId: "cust",
      role: "customer",
    });
    mockSessionStore.get.mockResolvedValue({ sessionId: "old" });
    randomUUID
      .mockReturnValueOnce("new-id")
      .mockReturnValueOnce("new-csrf");
    sealData.mockResolvedValue("new-token");
    mockHeaders.get.mockReturnValue("agent");

    await expect(getCustomerSession()).resolves.toEqual({
      customerId: "cust",
      role: "customer",
    });

    expect(mockCookies.set).toHaveBeenCalledWith(
      CUSTOMER_SESSION_COOKIE,
      "new-token",
      expect.any(Object)
    );
    expect(mockCookies.set).toHaveBeenCalledWith(
      CSRF_TOKEN_COOKIE,
      "new-csrf",
      expect.any(Object)
    );
    expect(mockSessionStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: "new-id", customerId: "cust" })
    );
    expect(mockSessionStore.delete).toHaveBeenCalledWith("old");
  });

  it("validateCsrfToken returns true or false", async () => {
    const { validateCsrfToken, CSRF_TOKEN_COOKIE } = await import("../../session");

    mockCookies.get.mockImplementation((name: string) =>
      name === CSRF_TOKEN_COOKIE ? { value: "csrf" } : undefined
    );

    await expect(validateCsrfToken("csrf")).resolves.toBe(true);
    await expect(validateCsrfToken("nope")).resolves.toBe(false);
    await expect(validateCsrfToken(null)).resolves.toBe(false);
  });

  it("destroyCustomerSession removes cookies and deletes store entry", async () => {
    const {
      destroyCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await import("../../session");

    mockCookies.get.mockImplementation((name: string) =>
      name === CUSTOMER_SESSION_COOKIE ? { value: "tok" } : undefined
    );
    unsealData.mockResolvedValue({ sessionId: "sid" });

    await destroyCustomerSession();

    expect(mockSessionStore.delete).toHaveBeenCalledWith("sid");
    expect(mockCookies.delete).toHaveBeenCalledWith({
      name: CUSTOMER_SESSION_COOKIE,
      path: "/",
    });
    expect(mockCookies.delete).toHaveBeenCalledWith({
      name: CUSTOMER_SESSION_COOKIE,
      path: "/",
      domain: "example.com",
    });
    expect(mockCookies.delete).toHaveBeenCalledWith({
      name: CSRF_TOKEN_COOKIE,
      path: "/",
    });
    expect(mockCookies.delete).toHaveBeenCalledWith({
      name: CSRF_TOKEN_COOKIE,
      path: "/",
      domain: "example.com",
    });
  });

  it("listSessions delegates to the session store", async () => {
    const { listSessions } = await import("../../session");

    const sessions = [{ sessionId: "1" }];
    mockSessionStore.list.mockResolvedValue(sessions);

    await expect(listSessions("cust")).resolves.toEqual(sessions);
    expect(mockSessionStore.list).toHaveBeenCalledWith("cust");
  });

  it("revokeSession delegates to the session store", async () => {
    const { revokeSession } = await import("../../session");

    await revokeSession("sid");

    expect(mockSessionStore.delete).toHaveBeenCalledWith("sid");
  });
});
