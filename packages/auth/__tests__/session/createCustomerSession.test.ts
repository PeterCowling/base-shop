import { jest } from "@jest/globals";
import type { Role } from "../../src/types";
import {
  importSessionModule,
  queueRandomUUIDs,
  resetSessionMocks,
  restoreEnv,
  sessionMocks,
} from "./testUtils";

describe("createCustomerSession", () => {
  const sampleSession = { customerId: "cust", role: "customer" as Role };
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    resetSessionMocks();
  });

  afterAll(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    restoreEnv();
  });

  it("stores the session record and writes both cookies", async () => {
    queueRandomUUIDs(["session-id", "csrf-id"]);
    sessionMocks.headers.get.mockReturnValue("Agent");

    const {
      createCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await importSessionModule();

    await createCustomerSession(sampleSession);

    expect(sessionMocks.sealData).toHaveBeenCalledWith(
      { ...sampleSession, sessionId: "session-id" },
      { password: "secret", ttl: sessionMocks.sessionTtlSeconds },
    );
    expect(sessionMocks.cookies.set).toHaveBeenCalledWith(
      CUSTOMER_SESSION_COOKIE,
      "sealed-token",
      expect.objectContaining({ httpOnly: true, secure: true }),
    );
    expect(sessionMocks.cookies.set).toHaveBeenCalledWith(
      CSRF_TOKEN_COOKIE,
      "csrf-id",
      expect.objectContaining({ httpOnly: false, secure: true }),
    );
    expect(sessionMocks.sessionStore.set).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session-id",
        customerId: "cust",
        userAgent: "Agent",
      }),
    );
  });

  it("disables secure cookies for development environments", async () => {
    process.env.NODE_ENV = "development";
    queueRandomUUIDs(["session-id", "csrf-id"]);

    const {
      createCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await importSessionModule();

    await createCustomerSession(sampleSession);

    expect(sessionMocks.cookies.set).toHaveBeenCalledWith(
      CUSTOMER_SESSION_COOKIE,
      "sealed-token",
      expect.objectContaining({ secure: false }),
    );
    expect(sessionMocks.cookies.set).toHaveBeenCalledWith(
      CSRF_TOKEN_COOKIE,
      "csrf-id",
      expect.objectContaining({ secure: false }),
    );
  });

  it("keeps secure cookies outside development", async () => {
    process.env.NODE_ENV = "production";
    queueRandomUUIDs(["session-id", "csrf-id"]);

    const {
      createCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await importSessionModule();

    await createCustomerSession(sampleSession);

    expect(sessionMocks.cookies.set).toHaveBeenCalledWith(
      CUSTOMER_SESSION_COOKIE,
      "sealed-token",
      expect.objectContaining({ secure: true }),
    );
    expect(sessionMocks.cookies.set).toHaveBeenCalledWith(
      CSRF_TOKEN_COOKIE,
      "csrf-id",
      expect.objectContaining({ secure: true }),
    );
  });

  it("uses the session TTL by default", async () => {
    queueRandomUUIDs(["session-id", "csrf-id"]);

    const {
      createCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await importSessionModule();

    await createCustomerSession(sampleSession);

    const sessionCookieCall = sessionMocks.cookies.set.mock.calls.find(
      ([name]) => name === CUSTOMER_SESSION_COOKIE,
    );
    const csrfCookieCall = sessionMocks.cookies.set.mock.calls.find(
      ([name]) => name === CSRF_TOKEN_COOKIE,
    );

    expect(sessionCookieCall?.[2]?.maxAge).toBe(sessionMocks.sessionTtlSeconds);
    expect(csrfCookieCall?.[2]?.maxAge).toBe(sessionMocks.sessionTtlSeconds);
  });

  it("extends cookie lifetime when remember is true", async () => {
    queueRandomUUIDs(["session", "csrf"]);

    const {
      createCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await importSessionModule();

    await createCustomerSession(sampleSession, { remember: true });

    const sessionCookieCall = sessionMocks.cookies.set.mock.calls.find(
      ([name]) => name === CUSTOMER_SESSION_COOKIE,
    );
    const csrfCookieCall = sessionMocks.cookies.set.mock.calls.find(
      ([name]) => name === CSRF_TOKEN_COOKIE,
    );

    expect(sessionCookieCall?.[2]?.maxAge).toBe(60 * 60 * 24 * 30);
    expect(csrfCookieCall?.[2]?.maxAge).toBe(60 * 60 * 24 * 30);
  });

  it("records an unknown user agent when the header is absent", async () => {
    queueRandomUUIDs(["session", "csrf"]);
    sessionMocks.headers.get.mockReturnValue(null);

    const { createCustomerSession } = await importSessionModule();

    await createCustomerSession(sampleSession);

    expect(sessionMocks.sessionStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ userAgent: "unknown" }),
    );
  });

  it("propagates store errors after writing cookies", async () => {
    queueRandomUUIDs(["session", "csrf"]);
    sessionMocks.sessionStore.set.mockRejectedValueOnce(new Error("store-fail"));

    const {
      createCustomerSession,
      CUSTOMER_SESSION_COOKIE,
    } = await importSessionModule();

    await expect(createCustomerSession(sampleSession)).rejects.toThrow("store-fail");
    expect(sessionMocks.cookies.set).toHaveBeenCalledWith(
      CUSTOMER_SESSION_COOKIE,
      "sealed-token",
      expect.any(Object),
    );
  });

  it("does not touch cookies when sealing fails", async () => {
    queueRandomUUIDs(["session", "csrf"]);
    sessionMocks.sealData.mockRejectedValueOnce(new Error("seal-fail"));

    const { createCustomerSession } = await importSessionModule();

    await expect(createCustomerSession(sampleSession)).rejects.toThrow("seal-fail");
    expect(sessionMocks.cookies.set).not.toHaveBeenCalled();
    expect(sessionMocks.sessionStore.set).not.toHaveBeenCalled();
  });

  it("throws when the session secret is missing", async () => {
    resetSessionMocks({ sessionSecret: undefined });
    queueRandomUUIDs(["session", "csrf"]);

    const { createCustomerSession } = await importSessionModule();

    await expect(createCustomerSession(sampleSession)).rejects.toThrow(
      "SESSION_SECRET is not set in core environment configuration",
    );
  });

  it("omits the cookie domain when none is configured", async () => {
    resetSessionMocks({ cookieDomain: undefined });
    queueRandomUUIDs(["session", "csrf"]);

    const {
      createCustomerSession,
      CUSTOMER_SESSION_COOKIE,
    } = await importSessionModule();

    await createCustomerSession(sampleSession);

    const sessionCookieCall = sessionMocks.cookies.set.mock.calls.find(
      ([name]) => name === CUSTOMER_SESSION_COOKIE,
    );
    expect(sessionCookieCall?.[2]).toMatchObject({
      path: "/",
      sameSite: "lax",
    });
    expect(sessionCookieCall?.[2]).not.toHaveProperty("domain");
  });

  it("ignores custom cookie domains for host-only sessions", async () => {
    resetSessionMocks({ cookieDomain: "shop.example" });
    queueRandomUUIDs(["session", "csrf"]);

    const {
      createCustomerSession,
      CUSTOMER_SESSION_COOKIE,
    } = await importSessionModule();

    await createCustomerSession(sampleSession);

    const sessionCookieCall = sessionMocks.cookies.set.mock.calls.find(
      ([name]) => name === CUSTOMER_SESSION_COOKIE,
    );
    expect(sessionCookieCall?.[2]?.domain).toBeUndefined();
  });
});
