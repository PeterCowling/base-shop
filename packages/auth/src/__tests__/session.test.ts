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

let SESSION_TTL_S_MOCK = 3600;
jest.mock("../store", () => ({
  createSessionStore,
  get SESSION_TTL_S() {
    return SESSION_TTL_S_MOCK;
  },
}));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  SESSION_TTL_S_MOCK = 3600;
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
  } = await import("../session");

  mockHeaders.get.mockReturnValue("agent");
  randomUUID.mockReturnValueOnce("session-id").mockReturnValueOnce("csrf-token");
  sealData.mockResolvedValue("sealed-token");

  await createCustomerSession({ customerId: "cust", role: "customer" });

  expect(sealData).toHaveBeenCalledWith(
    { customerId: "cust", role: "customer", sessionId: "session-id" },
    { password: "secret", ttl: SESSION_TTL_S_MOCK }
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

it("createCustomerSession uses extended maxAge when remember is true", async () => {
  const {
    createCustomerSession,
    CUSTOMER_SESSION_COOKIE,
    CSRF_TOKEN_COOKIE,
  } = await import("../session");

  mockHeaders.get.mockReturnValue("agent");
  randomUUID
    .mockReturnValueOnce("session-id")
    .mockReturnValueOnce("csrf-token");
  sealData.mockResolvedValue("sealed-token");

  await createCustomerSession(
    { customerId: "cust", role: "customer" },
    { remember: true },
  );

  expect(mockCookies.set).toHaveBeenCalledWith(
    CUSTOMER_SESSION_COOKIE,
    "sealed-token",
    expect.objectContaining({ maxAge: 60 * 60 * 24 * 30 }),
  );
  expect(mockCookies.set).toHaveBeenCalledWith(
    CSRF_TOKEN_COOKIE,
    "csrf-token",
    expect.objectContaining({ maxAge: 60 * 60 * 24 * 30 }),
  );
});

it("createCustomerSession propagates store errors after setting cookies", async () => {
  const { createCustomerSession, CUSTOMER_SESSION_COOKIE, CSRF_TOKEN_COOKIE } =
    await import("../session");

  randomUUID
    .mockReturnValueOnce("session-id")
    .mockReturnValueOnce("csrf-token");
  sealData.mockResolvedValue("sealed-token");
  mockSessionStore.set.mockRejectedValueOnce(new Error("store fail"));

  await expect(
    createCustomerSession({ customerId: "cust", role: "customer" })
  ).rejects.toThrow("store fail");
  expect(mockCookies.set).toHaveBeenCalledWith(
    CUSTOMER_SESSION_COOKIE,
    "sealed-token",
    expect.any(Object),
  );
  expect(mockCookies.set).toHaveBeenCalledWith(
    CSRF_TOKEN_COOKIE,
    "csrf-token",
    expect.any(Object),
  );
});

it("createCustomerSession propagates seal errors without setting cookies or storing session", async () => {
  const { createCustomerSession } = await import("../session");

  sealData.mockRejectedValueOnce(new Error("seal fail"));

  await expect(
    createCustomerSession({ customerId: "cust", role: "customer" })
  ).rejects.toThrow("seal fail");
  expect(mockCookies.set).not.toHaveBeenCalled();
  expect(mockSessionStore.set).not.toHaveBeenCalled();
});

it("createCustomerSession throws when SESSION_SECRET is undefined", async () => {
  const { createCustomerSession } = await import("../session");
  const originalSecret = process.env.SESSION_SECRET;
  delete process.env.SESSION_SECRET;

  await expect(
    createCustomerSession({ customerId: "cust", role: "customer" })
  ).rejects.toThrow(
    "SESSION_SECRET is not set in core environment configuration"
  );

  process.env.SESSION_SECRET = originalSecret;
});

it("getCustomerSession returns null for missing token", async () => {
  const { getCustomerSession } = await import("../session");

  mockCookies.get.mockReturnValue(undefined);

  await expect(getCustomerSession()).resolves.toBeNull();
});

it("getCustomerSession returns null for invalid token", async () => {
  const { getCustomerSession } = await import("../session");

  mockCookies.get.mockReturnValue({ value: "bad" });
  unsealData.mockRejectedValue(new Error("bad"));

  await expect(getCustomerSession()).resolves.toBeNull();
});

it("getCustomerSession skips session store when token invalid", async () => {
  const { getCustomerSession } = await import("../session");

  mockCookies.get.mockReturnValue({ value: "bad" });
  unsealData.mockRejectedValue(new Error("bad"));

  await expect(getCustomerSession()).resolves.toBeNull();
  expect(mockSessionStore.get).not.toHaveBeenCalled();
});

it("getCustomerSession returns null when SESSION_SECRET is undefined", async () => {
  delete process.env.SESSION_SECRET;
  const { getCustomerSession } = await import("../session");

  mockCookies.get.mockReturnValue({ value: "token" });

  await expect(getCustomerSession()).resolves.toBeNull();
  expect(unsealData).not.toHaveBeenCalled();
});

it("getCustomerSession returns null for malformed token", async () => {
  const { getCustomerSession } = await import("../session");

  mockCookies.get.mockReturnValue({ value: "token" });
  // missing required fields like sessionId
  unsealData.mockResolvedValue({});

  await expect(getCustomerSession()).resolves.toBeNull();
});

it("getCustomerSession returns null when token missing role", async () => {
  const { getCustomerSession } = await import("../session");

  mockCookies.get.mockReturnValue({ value: "token" });
  unsealData.mockResolvedValue({ sessionId: "s1", customerId: "cust" });

  await expect(getCustomerSession()).resolves.toBeNull();
});

it("getCustomerSession returns null when session not found", async () => {
  const { getCustomerSession } = await import("../session");

  mockCookies.get.mockReturnValue({ value: "token" });
  unsealData.mockResolvedValue({
    sessionId: "s1",
    customerId: "cust",
    role: "customer",
  });
  mockSessionStore.get.mockResolvedValue(null);

  await expect(getCustomerSession()).resolves.toBeNull();
  expect(mockSessionStore.get).toHaveBeenCalledWith("s1");
});

it("getCustomerSession returns null when session token expired", async () => {
  SESSION_TTL_S_MOCK = 1;
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2023-01-01T00:00:00Z"));
  sealData.mockImplementation(async (session) =>
    JSON.stringify({ session, createdAt: Date.now() })
  );
  unsealData.mockImplementation(async (token, { ttl }) => {
    const data = JSON.parse(token);
    if (Date.now() - data.createdAt > ttl * 1000) {
      throw new Error("expired");
    }
    return data.session;
  });
  const {
    createCustomerSession,
    getCustomerSession,
    CUSTOMER_SESSION_COOKIE,
  } = await import("../session");
  randomUUID
    .mockReturnValueOnce("session-id")
    .mockReturnValueOnce("csrf-token");
  mockHeaders.get.mockReturnValue("agent");
  await createCustomerSession({ customerId: "cust", role: "customer" });
  const token = mockCookies.set.mock.calls.find(
    ([name]) => name === CUSTOMER_SESSION_COOKIE
  )[1];
  mockCookies.get.mockImplementation((name: string) =>
    name === CUSTOMER_SESSION_COOKIE ? { value: token } : undefined
  );
  jest.setSystemTime(new Date(Date.now() + 2000));
  await expect(getCustomerSession()).resolves.toBeNull();
  expect(mockSessionStore.get).not.toHaveBeenCalled();
  jest.useRealTimers();
});

it("getCustomerSession rotates session id, updates store, and creates csrf when absent", async () => {
  const {
    getCustomerSession,
    CUSTOMER_SESSION_COOKIE,
    CSRF_TOKEN_COOKIE,
  } = await import("../session");

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
  expect(sealData).toHaveBeenCalledWith(
    { sessionId: "new-id", customerId: "cust", role: "customer" },
    { password: "secret", ttl: SESSION_TTL_S_MOCK }
  );
  expect(mockSessionStore.set).toHaveBeenCalledWith(
    expect.objectContaining({ sessionId: "new-id", customerId: "cust" })
  );
  expect(mockSessionStore.delete).toHaveBeenCalledWith("old");
});

it("getCustomerSession propagates delete errors without setting cookies", async () => {
  const {
    getCustomerSession,
    CUSTOMER_SESSION_COOKIE,
  } = await import("../session");

  mockCookies.get.mockImplementation((name: string) =>
    name === CUSTOMER_SESSION_COOKIE ? { value: "token" } : undefined,
  );
  unsealData.mockResolvedValue({
    sessionId: "old",
    customerId: "cust",
    role: "customer",
  });
  mockSessionStore.get.mockResolvedValue({ sessionId: "old" });
  randomUUID.mockReturnValue("new-id");
  sealData.mockResolvedValue("new-token");
  const error = new Error("delete fail");
  mockSessionStore.delete.mockRejectedValueOnce(error);

  await expect(getCustomerSession()).rejects.toThrow(error);
  expect(mockSessionStore.set).toHaveBeenCalledWith(
    expect.objectContaining({ sessionId: "new-id", customerId: "cust" }),
  );
  expect(mockSessionStore.delete).toHaveBeenCalledWith("old");
  expect(mockCookies.set).not.toHaveBeenCalled();
  expect(randomUUID).toHaveBeenCalledTimes(1);
});

it("getCustomerSession stores 'unknown' userAgent when header missing", async () => {
  const { getCustomerSession, CUSTOMER_SESSION_COOKIE } = await import("../session");

  mockCookies.get.mockImplementation((name: string) =>
    name === CUSTOMER_SESSION_COOKIE ? { value: "token" } : undefined,
  );
  unsealData.mockResolvedValue({
    sessionId: "old",
    customerId: "cust",
    role: "customer",
  });
  mockSessionStore.get.mockResolvedValue({ sessionId: "old" });
  randomUUID.mockReturnValueOnce("new-id").mockReturnValueOnce("new-csrf");
  sealData.mockResolvedValue("new-token");
  mockHeaders.get.mockReturnValue(null);

  await expect(getCustomerSession()).resolves.toEqual({
    customerId: "cust",
    role: "customer",
  });

  expect(mockSessionStore.set).toHaveBeenCalledWith(
    expect.objectContaining({ userAgent: "unknown" }),
  );
});

it("destroyCustomerSession removes cookies and deletes session", async () => {
  const {
    destroyCustomerSession,
    CUSTOMER_SESSION_COOKIE,
    CSRF_TOKEN_COOKIE,
  } = await import("../session");

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

it("destroyCustomerSession clears cookies even when store delete fails", async () => {
  const {
    destroyCustomerSession,
    CUSTOMER_SESSION_COOKIE,
    CSRF_TOKEN_COOKIE,
  } = await import("../session");

  mockCookies.get.mockReturnValue({ value: "token" });
  unsealData.mockResolvedValue({ sessionId: "s1" });
  const error = new Error("boom");
  mockSessionStore.delete.mockRejectedValueOnce(error);

  await expect(destroyCustomerSession()).rejects.toThrow(error);

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
});

it("destroyCustomerSession removes cookies even when session cookie missing", async () => {
  const {
    destroyCustomerSession,
    CUSTOMER_SESSION_COOKIE,
    CSRF_TOKEN_COOKIE,
  } = await import("../session");

  mockCookies.get.mockReturnValue(undefined);

  await destroyCustomerSession();

  expect(mockSessionStore.delete).not.toHaveBeenCalled();
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
});

it("listSessions delegates to session store", async () => {
  const { listSessions } = await import("../session");
  const sessions = [{ sessionId: "a" }];
  mockSessionStore.list.mockResolvedValue(sessions);

  await expect(listSessions("cust")).resolves.toEqual(sessions);
  expect(mockSessionStore.list).toHaveBeenCalledWith("cust");
});

it("revokeSession deletes from session store", async () => {
  const { revokeSession } = await import("../session");

  await revokeSession("sid");

  expect(mockSessionStore.delete).toHaveBeenCalledWith("sid");
});

it("validateCsrfToken compares token with cookie", async () => {
  const { validateCsrfToken, CSRF_TOKEN_COOKIE } = await import("../session");

  mockCookies.get.mockImplementation((name: string) =>
    name === CSRF_TOKEN_COOKIE ? { value: "csrf" } : undefined
  );

  await expect(validateCsrfToken("csrf")).resolves.toBe(true);
  await expect(validateCsrfToken("other")).resolves.toBe(false);
  await expect(validateCsrfToken(null)).resolves.toBe(false);
});

it("validateCsrfToken returns false when cookie is missing", async () => {
  const { validateCsrfToken } = await import("../session");

  mockCookies.get.mockReturnValue(undefined);

  await expect(validateCsrfToken("csrf")).resolves.toBe(false);
});

it("validateCsrfToken returns false when token mismatches cookie", async () => {
  const { validateCsrfToken, CSRF_TOKEN_COOKIE } = await import("../session");

  mockCookies.get.mockImplementation((name: string) =>
    name === CSRF_TOKEN_COOKIE ? { value: "csrf" } : undefined
  );

  await expect(validateCsrfToken("different")).resolves.toBe(false);
});

it("validateCsrfToken returns false for empty token", async () => {
  const { validateCsrfToken, CSRF_TOKEN_COOKIE } = await import("../session");

  mockCookies.get.mockImplementation((name: string) =>
    name === CSRF_TOKEN_COOKIE ? { value: "csrf" } : undefined
  );

  await expect(validateCsrfToken("")).resolves.toBe(false);
});

it("createCustomerSession uses 'unknown' user-agent when header absent", async () => {
  const {
    createCustomerSession,
    CUSTOMER_SESSION_COOKIE,
    CSRF_TOKEN_COOKIE,
  } = await import("../session");

  mockHeaders.get.mockReturnValue(null);
  randomUUID.mockReturnValueOnce("session-id").mockReturnValueOnce("csrf-token");
  sealData.mockResolvedValue("sealed-token");

  await createCustomerSession({ customerId: "cust", role: "customer" });

  expect(mockCookies.set).toHaveBeenCalledWith(
    CUSTOMER_SESSION_COOKIE,
    "sealed-token",
    expect.any(Object)
  );
  expect(mockSessionStore.set).toHaveBeenCalledWith(
    expect.objectContaining({ userAgent: "unknown" })
  );
});

it("getCustomerSession does not create csrf token if already present", async () => {
  const {
    getCustomerSession,
    CUSTOMER_SESSION_COOKIE,
    CSRF_TOKEN_COOKIE,
  } = await import("../session");

  mockCookies.get.mockImplementation((name: string) =>
    name === CUSTOMER_SESSION_COOKIE
      ? { value: "token" }
      : { value: "existing" }
  );
  unsealData.mockResolvedValue({
    sessionId: "old",
    customerId: "cust",
    role: "customer",
  });
  mockSessionStore.get.mockResolvedValue({ sessionId: "old" });
  randomUUID.mockReturnValue("new-id");
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
  expect(mockCookies.set).not.toHaveBeenCalledWith(
    CSRF_TOKEN_COOKIE,
    expect.anything(),
    expect.anything()
  );
  expect(randomUUID).toHaveBeenCalledTimes(1);
});

it(
  "destroyCustomerSession skips session store when SESSION_SECRET is undefined",
  async () => {
    delete process.env.SESSION_SECRET;
    const {
      destroyCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await import("../session");

    mockCookies.get.mockReturnValue({ value: "token" });

    await destroyCustomerSession();

    expect(unsealData).not.toHaveBeenCalled();
    expect(mockSessionStore.delete).not.toHaveBeenCalled();
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
  }
);

it(
  "destroyCustomerSession removes cookies when SESSION_SECRET missing even with invalid token",
  async () => {
    delete process.env.SESSION_SECRET;
    const {
      destroyCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await import("../session");

    mockCookies.get.mockReturnValue({ value: "token" });
    unsealData.mockRejectedValue(new Error("bad"));

    await destroyCustomerSession();

    expect(unsealData).not.toHaveBeenCalled();
    expect(mockSessionStore.delete).not.toHaveBeenCalled();
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
  }
);

it("destroyCustomerSession ignores invalid token", async () => {
  const {
    destroyCustomerSession,
    CUSTOMER_SESSION_COOKIE,
    CSRF_TOKEN_COOKIE,
  } = await import("../session");

  mockCookies.get.mockReturnValue({ value: "token" });
  unsealData.mockRejectedValue(new Error("bad"));

  await destroyCustomerSession();

  expect(mockSessionStore.delete).not.toHaveBeenCalled();
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
});

it("destroyCustomerSession clears cookies when session cookie is malformed", async () => {
  const {
    destroyCustomerSession,
    CUSTOMER_SESSION_COOKIE,
    CSRF_TOKEN_COOKIE,
  } = await import("../session");

  mockCookies.get.mockReturnValue({ value: "malformed" });
  unsealData.mockImplementationOnce(async () => {
    throw new Error("bad");
  });

  await expect(destroyCustomerSession()).resolves.toBeUndefined();

  expect(unsealData).toHaveBeenCalledWith("malformed", {
    password: "secret",
    ttl: SESSION_TTL_S_MOCK,
  });
  expect(mockSessionStore.delete).not.toHaveBeenCalled();
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
});

