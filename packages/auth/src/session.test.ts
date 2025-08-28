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

jest.mock("./store", () => ({
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
  createSessionStore.mockReset();
  createSessionStore.mockResolvedValue(mockSessionStore);
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

it("createCustomerSession sets cookies and stores session", async () => {
  const {
    createCustomerSession,
    CUSTOMER_SESSION_COOKIE,
    CSRF_TOKEN_COOKIE,
  } = await import("./session");

  mockHeaders.get.mockReturnValue("agent");
  randomUUID.mockReturnValueOnce("session-id").mockReturnValueOnce("csrf-token");
  sealData.mockResolvedValue("sealed-token");

  await createCustomerSession({ customerId: "cust", role: "customer" });

  expect(sealData).toHaveBeenCalledWith(
    { customerId: "cust", role: "customer", sessionId: "session-id" },
    { password: "secret", ttl: 3600 }
  );
  expect(mockCookies.set).toHaveBeenCalledWith(
    CUSTOMER_SESSION_COOKIE,
    "sealed-token",
    expect.objectContaining({ httpOnly: true })
  );
  expect(mockCookies.set).toHaveBeenCalledWith(
    CSRF_TOKEN_COOKIE,
    "csrf-token",
    expect.objectContaining({ httpOnly: false })
  );
  expect(mockSessionStore.set).toHaveBeenCalledWith(
    expect.objectContaining({
      sessionId: "session-id",
      customerId: "cust",
      userAgent: "agent",
    })
  );
});

it("getCustomerSession returns null for missing token", async () => {
  const { getCustomerSession } = await import("./session");

  mockCookies.get.mockReturnValue(undefined);

  await expect(getCustomerSession()).resolves.toBeNull();
});

it("getCustomerSession returns null for invalid token", async () => {
  const { getCustomerSession } = await import("./session");

  mockCookies.get.mockReturnValue({ value: "bad" });
  unsealData.mockRejectedValue(new Error("bad"));

  await expect(getCustomerSession()).resolves.toBeNull();
});

it("getCustomerSession rotates session id, updates store, and creates csrf when absent", async () => {
  const {
    getCustomerSession,
    CUSTOMER_SESSION_COOKIE,
    CSRF_TOKEN_COOKIE,
  } = await import("./session");

  mockCookies.get.mockImplementation((name: string) =>
    name === CUSTOMER_SESSION_COOKIE ? { value: "token" } : undefined
  );
  unsealData.mockResolvedValue({
    sessionId: "old",
    customerId: "cust",
    role: "customer",
  });
  mockSessionStore.get.mockResolvedValue({ sessionId: "old" });
  randomUUID.mockReturnValueOnce("new-id").mockReturnValueOnce("new-csrf");
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

it("destroyCustomerSession removes cookies and deletes session", async () => {
  const {
    destroyCustomerSession,
    CUSTOMER_SESSION_COOKIE,
    CSRF_TOKEN_COOKIE,
  } = await import("./session");

  mockCookies.get.mockReturnValue({ value: "token" });
  unsealData.mockResolvedValue({ sessionId: "s1" });

  await destroyCustomerSession();

  expect(mockCookies.delete).toHaveBeenCalledWith({
    name: CUSTOMER_SESSION_COOKIE,
    path: "/",
    domain: "example.com",
  });
  expect(mockCookies.delete).toHaveBeenCalledWith({
    name: CSRF_TOKEN_COOKIE,
    path: "/",
    domain: "example.com",
  });
  expect(mockSessionStore.delete).toHaveBeenCalledWith("s1");
});

it("validateCsrfToken compares token with cookie", async () => {
  const { validateCsrfToken, CSRF_TOKEN_COOKIE } = await import("./session");

  mockCookies.get.mockImplementation((name: string) =>
    name === CSRF_TOKEN_COOKIE ? { value: "csrf" } : undefined
  );

  await expect(validateCsrfToken("csrf")).resolves.toBe(true);
  await expect(validateCsrfToken("other")).resolves.toBe(false);
});

