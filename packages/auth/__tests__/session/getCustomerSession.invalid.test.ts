import { jest } from "@jest/globals";
import type { Role } from "../../src/types";
import {
  importSessionModule,
  queueRandomUUIDs,
  resetSessionMocks,
  restoreEnv,
  sessionMocks,
} from "./testUtils";

const baseSession = {
  sessionId: "s1",
  customerId: "cust",
  role: "customer" as Role,
};

describe("getCustomerSession invalid flows", () => {
  afterAll(() => {
    restoreEnv();
  });

  beforeEach(() => {
    resetSessionMocks();
  });

  it("returns null when the session cookie is missing", async () => {
    const { getCustomerSession } = await importSessionModule();

    await expect(getCustomerSession()).resolves.toBeNull();
  });

  it("returns null when unsealing fails and skips the session store", async () => {
    const { getCustomerSession, CUSTOMER_SESSION_COOKIE } = await importSessionModule();

    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token-1");
    sessionMocks.unsealData.mockRejectedValueOnce(new Error("invalid"));

    await expect(getCustomerSession()).resolves.toBeNull();
    expect(sessionMocks.sessionStore.get).not.toHaveBeenCalled();
  });

  it("returns null when the session secret is missing", async () => {
    resetSessionMocks({ sessionSecret: undefined });
    const { getCustomerSession, CUSTOMER_SESSION_COOKIE } = await importSessionModule();

    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token");

    await expect(getCustomerSession()).resolves.toBeNull();
    expect(sessionMocks.unsealData).not.toHaveBeenCalled();
  });

  it("returns null when the token lacks a session id", async () => {
    const { getCustomerSession, CUSTOMER_SESSION_COOKIE } = await importSessionModule();

    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token");
    sessionMocks.unsealData.mockResolvedValueOnce({
      customerId: baseSession.customerId,
      role: baseSession.role,
    });

    await expect(getCustomerSession()).resolves.toBeNull();
  });

  it("returns null when the token lacks a role", async () => {
    const { getCustomerSession, CUSTOMER_SESSION_COOKIE } = await importSessionModule();

    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token");
    sessionMocks.unsealData.mockResolvedValueOnce({
      sessionId: baseSession.sessionId,
      customerId: baseSession.customerId,
    });

    await expect(getCustomerSession()).resolves.toBeNull();
  });

  it("passes the session ttl when unsealing", async () => {
    const { getCustomerSession, CUSTOMER_SESSION_COOKIE } = await importSessionModule();

    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token");
    sessionMocks.unsealData.mockImplementationOnce(async (_token, options) => {
      expect(options).toEqual({ password: "secret", ttl: sessionMocks.sessionTtlSeconds });
      return baseSession;
    });
    sessionMocks.sessionStore.get.mockResolvedValueOnce({
      ...baseSession,
      createdAt: new Date(),
      userAgent: "agent",
    });
    sessionMocks.sessionStore.delete.mockResolvedValueOnce();
    sessionMocks.sessionStore.set.mockResolvedValueOnce();
    queueRandomUUIDs(["new-session", "csrf"]);

    await getCustomerSession();
  });

  it("returns null when the session store has no record", async () => {
    const { getCustomerSession, CUSTOMER_SESSION_COOKIE } = await importSessionModule();

    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token");
    sessionMocks.unsealData.mockResolvedValueOnce(baseSession);
    sessionMocks.sessionStore.get.mockResolvedValueOnce(null);

    await expect(getCustomerSession()).resolves.toBeNull();
  });

  it("rejects when the session store lookup throws", async () => {
    const { getCustomerSession, CUSTOMER_SESSION_COOKIE } = await importSessionModule();

    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token");
    sessionMocks.unsealData.mockResolvedValueOnce(baseSession);
    const error = new Error("store-fail");
    sessionMocks.sessionStore.get.mockRejectedValueOnce(error);

    await expect(getCustomerSession()).rejects.toThrow(error);
    expect(sessionMocks.randomUUID).not.toHaveBeenCalled();
    expect(sessionMocks.cookies.set).not.toHaveBeenCalled();
    expect(sessionMocks.sessionStore.set).not.toHaveBeenCalled();
  });

  it("removes expired session records and returns null", async () => {
    const { getCustomerSession, CUSTOMER_SESSION_COOKIE } = await importSessionModule();

    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token");
    sessionMocks.unsealData.mockResolvedValueOnce(baseSession);
    sessionMocks.sessionStore.get.mockResolvedValueOnce({
      ...baseSession,
      createdAt: new Date(Date.now() - sessionMocks.sessionTtlSeconds * 1000 - 1000),
      userAgent: "agent",
    });

    await expect(getCustomerSession()).resolves.toBeNull();
    expect(sessionMocks.sessionStore.delete).toHaveBeenCalledWith(baseSession.sessionId);
  });

  it("respects overridden ttl when evaluating session age", async () => {
    resetSessionMocks({ sessionTtlSeconds: 1 });
    const { getCustomerSession, CUSTOMER_SESSION_COOKIE } = await importSessionModule();

    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token");
    sessionMocks.unsealData.mockResolvedValueOnce(baseSession);
    sessionMocks.sessionStore.get.mockResolvedValueOnce({
      ...baseSession,
      createdAt: new Date(Date.now() - 2000),
      userAgent: "agent",
    });

    await expect(getCustomerSession()).resolves.toBeNull();
    expect(sessionMocks.sessionStore.delete).toHaveBeenCalledWith(baseSession.sessionId);
  });

  it("returns null when the sealed session has expired", async () => {
    resetSessionMocks({ sessionTtlSeconds: 1 });
    const { getCustomerSession, CUSTOMER_SESSION_COOKIE } = await importSessionModule();

    const createdAt = Date.now();
    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token");
    sessionMocks.unsealData.mockImplementationOnce(async () => {
      if (Date.now() - createdAt > 1000) {
        throw new Error("expired");
      }
      return baseSession;
    });

    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(createdAt + 1500);

    await expect(getCustomerSession()).resolves.toBeNull();

    nowSpy.mockRestore();
  });
});
