import {
  importSessionModule,
  resetSessionMocks,
  restoreEnv,
  sessionMocks,
} from "./testUtils";

describe("destroyCustomerSession", () => {
  const expectCookieCleared = (name: string) => {
    expect(sessionMocks.cookies.delete).toHaveBeenCalledWith({
      name,
      path: "/",
    });
    expect(sessionMocks.cookies.delete).toHaveBeenCalledWith({
      name,
      path: "/",
      domain: "example.com",
    });
  };

  afterAll(() => {
    restoreEnv();
  });

  beforeEach(() => {
    resetSessionMocks();
  });

  it("deletes the stored session and clears cookies", async () => {
    const {
      destroyCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await importSessionModule();

    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token");
    sessionMocks.unsealData.mockResolvedValueOnce({ sessionId: "session" });
    sessionMocks.sessionStore.delete.mockResolvedValueOnce();

    await destroyCustomerSession();

    expect(sessionMocks.sessionStore.delete).toHaveBeenCalledWith("session");
    expectCookieCleared(CUSTOMER_SESSION_COOKIE);
    expectCookieCleared(CSRF_TOKEN_COOKIE);
  });

  it("still clears cookies when the session store delete fails", async () => {
    const {
      destroyCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await importSessionModule();

    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token");
    sessionMocks.unsealData.mockResolvedValueOnce({ sessionId: "session" });
    const error = new Error("delete-fail");
    sessionMocks.sessionStore.delete.mockRejectedValueOnce(error);

    await expect(destroyCustomerSession()).rejects.toThrow(error);

    expectCookieCleared(CUSTOMER_SESSION_COOKIE);
    expectCookieCleared(CSRF_TOKEN_COOKIE);
  });

  it("clears cookies even when no session cookie is present", async () => {
    const {
      destroyCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await importSessionModule();

    await destroyCustomerSession();

    expect(sessionMocks.sessionStore.delete).not.toHaveBeenCalled();
    expectCookieCleared(CUSTOMER_SESSION_COOKIE);
    expectCookieCleared(CSRF_TOKEN_COOKIE);
  });

  it("skips the session store when the secret is undefined", async () => {
    resetSessionMocks({ sessionSecret: undefined });
    const {
      destroyCustomerSession,
      CUSTOMER_SESSION_COOKIE,
    } = await importSessionModule();

    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token");
    sessionMocks.unsealData.mockRejectedValue(new Error("should-not-run"));

    await destroyCustomerSession();

    expect(sessionMocks.unsealData).not.toHaveBeenCalled();
    expect(sessionMocks.sessionStore.delete).not.toHaveBeenCalled();
  });

  it("ignores invalid tokens but still clears cookies", async () => {
    const {
      destroyCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await importSessionModule();

    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token");
    sessionMocks.unsealData.mockRejectedValueOnce(new Error("bad-token"));

    await destroyCustomerSession();

    expect(sessionMocks.sessionStore.delete).not.toHaveBeenCalled();
    expectCookieCleared(CUSTOMER_SESSION_COOKIE);
    expectCookieCleared(CSRF_TOKEN_COOKIE);
  });

  it("skips the store when the token lacks a session id", async () => {
    const { destroyCustomerSession, CUSTOMER_SESSION_COOKIE } = await importSessionModule();

    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token");
    sessionMocks.unsealData.mockResolvedValueOnce({});

    await destroyCustomerSession();

    expect(sessionMocks.sessionStore.delete).not.toHaveBeenCalled();
  });

  it("clears cookies when unsealing throws even if the secret exists", async () => {
    const {
      destroyCustomerSession,
      CUSTOMER_SESSION_COOKIE,
      CSRF_TOKEN_COOKIE,
    } = await importSessionModule();

    sessionMocks.cookies.jar.set(CUSTOMER_SESSION_COOKIE, "token");
    sessionMocks.unsealData.mockImplementationOnce(async () => {
      throw new Error("boom");
    });

    await destroyCustomerSession();

    expect(sessionMocks.sessionStore.delete).not.toHaveBeenCalled();
    expectCookieCleared(CUSTOMER_SESSION_COOKIE);
    expectCookieCleared(CSRF_TOKEN_COOKIE);
  });
});
