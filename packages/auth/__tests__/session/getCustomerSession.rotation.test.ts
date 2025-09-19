import { jest } from "@jest/globals";
import type { Role } from "../../src/types";
import {
  importSessionModule,
  queueRandomUUIDs,
  resetSessionMocks,
  restoreEnv,
  sessionMocks,
} from "./testUtils";

function makeActiveSession() {
  return {
    sessionId: "old-session",
    customerId: "cust",
    role: "customer" as Role,
  };
}

describe("getCustomerSession rotation", () => {
  afterAll(() => {
    restoreEnv();
  });

  beforeEach(() => {
    resetSessionMocks();
  });

  it("rotates the session id, updates storage, and creates a csrf token when missing", async () => {
    const {
      getCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await importSessionModule();

    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token");
    const session = makeActiveSession();
    const originalId = session.sessionId;
    sessionMocks.unsealData.mockResolvedValueOnce(session);
    sessionMocks.sessionStore.get.mockResolvedValueOnce({
      ...session,
      createdAt: new Date(),
      userAgent: "ua",
    });
    sessionMocks.sealData.mockResolvedValueOnce("new-token");
    queueRandomUUIDs(["new-session", "csrf-token"]);
    sessionMocks.headers.get.mockReturnValue("Agent");

    await expect(getCustomerSession()).resolves.toEqual({
      customerId: session.customerId,
      role: session.role,
    });

    expect(sessionMocks.sealData).toHaveBeenCalledWith(
      { ...session, sessionId: "new-session" },
      { password: "secret", ttl: sessionMocks.sessionTtlSeconds },
    );
    expect(sessionMocks.sessionStore.set).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "new-session",
        customerId: "cust",
        userAgent: "Agent",
      }),
    );
    expect(sessionMocks.sessionStore.delete).toHaveBeenCalledWith(originalId);
    expect(sessionMocks.cookies.set).toHaveBeenCalledWith(
      CUSTOMER_SESSION_COOKIE,
      "new-token",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(sessionMocks.cookies.set).toHaveBeenCalledWith(
      CSRF_TOKEN_COOKIE,
      "csrf-token",
      expect.any(Object),
    );
  });

  it("does not create a csrf cookie when one already exists", async () => {
    const {
      getCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await importSessionModule();

    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token");
    sessionMocks.cookies.jar.set(CSRF_TOKEN_COOKIE, "existing");
    const session = makeActiveSession();
    sessionMocks.unsealData.mockResolvedValueOnce(session);
    sessionMocks.sessionStore.get.mockResolvedValueOnce({
      ...session,
      createdAt: new Date(),
      userAgent: "ua",
    });
    sessionMocks.sealData.mockResolvedValueOnce("new-token");
    queueRandomUUIDs(["new-session"]);

    await expect(getCustomerSession()).resolves.toEqual({
      customerId: session.customerId,
      role: session.role,
    });

    const csrfCalls = sessionMocks.cookies.set.mock.calls.filter(
      ([name]) => name === CSRF_TOKEN_COOKIE,
    );
    expect(csrfCalls).toHaveLength(0);
  });

  it("stores an unknown user agent when the header is missing", async () => {
    const { getCustomerSession, CUSTOMER_SESSION_COOKIE } = await importSessionModule();

    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token");
    const session = makeActiveSession();
    sessionMocks.unsealData.mockResolvedValueOnce(session);
    sessionMocks.sessionStore.get.mockResolvedValueOnce({
      ...session,
      createdAt: new Date(),
      userAgent: "ua",
    });
    queueRandomUUIDs(["new-session", "csrf-token"]);
    sessionMocks.headers.get.mockReturnValue(null);

    await getCustomerSession();

    expect(sessionMocks.sessionStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ userAgent: "unknown" }),
    );
  });

  it("rejects without mutating cookies when the store update fails", async () => {
    const { getCustomerSession, CUSTOMER_SESSION_COOKIE } = await importSessionModule();

    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token");
    const session = makeActiveSession();
    const originalId = session.sessionId;
    sessionMocks.unsealData.mockResolvedValueOnce(session);
    sessionMocks.sessionStore.get.mockResolvedValueOnce({
      ...session,
      createdAt: new Date(),
      userAgent: "ua",
    });
    queueRandomUUIDs(["new-session", "csrf-token"]);
    const error = new Error("set-fail");
    sessionMocks.sessionStore.set.mockRejectedValueOnce(error);

    await expect(getCustomerSession()).rejects.toThrow(error);
    expect(sessionMocks.cookies.set).not.toHaveBeenCalled();
    expect(sessionMocks.sessionStore.delete).not.toHaveBeenCalled();
  });

  it("propagates delete failures without writing cookies", async () => {
    const { getCustomerSession, CUSTOMER_SESSION_COOKIE } = await importSessionModule();

    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token");
    const session = makeActiveSession();
    const originalId = session.sessionId;
    sessionMocks.unsealData.mockResolvedValueOnce(session);
    sessionMocks.sessionStore.get.mockResolvedValueOnce({
      ...session,
      createdAt: new Date(),
      userAgent: "ua",
    });
    queueRandomUUIDs(["new-session", "csrf-token"]);
    sessionMocks.sessionStore.set.mockResolvedValueOnce();
    const error = new Error("delete-fail");
    sessionMocks.sessionStore.delete.mockRejectedValueOnce(error);

    await expect(getCustomerSession()).rejects.toThrow(error);
    expect(sessionMocks.sessionStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: "new-session" }),
    );
    expect(sessionMocks.sessionStore.delete).toHaveBeenCalledWith(originalId);
    expect(sessionMocks.cookies.set).not.toHaveBeenCalled();
    expect(sessionMocks.randomUUID).toHaveBeenCalledTimes(1);
  });
});
