import {
  importSessionModule,
  resetSessionMocks,
  restoreEnv,
  sessionMocks,
} from "./testUtils";

describe("session store helpers", () => {
  afterAll(() => {
    restoreEnv();
  });

  beforeEach(() => {
    resetSessionMocks();
  });

  it("lists sessions for a customer", async () => {
    const { listSessions } = await importSessionModule();
    const records = [
      {
        sessionId: "a",
        customerId: "cust",
        userAgent: "ua",
        createdAt: new Date(),
      },
    ];
    sessionMocks.sessionStore.list.mockResolvedValueOnce(records);

    await expect(listSessions("cust")).resolves.toEqual(records);
    expect(sessionMocks.sessionStore.list).toHaveBeenCalledWith("cust");
  });

  it("propagates list errors", async () => {
    const { listSessions } = await importSessionModule();
    const error = new Error("list-fail");
    sessionMocks.sessionStore.list.mockRejectedValueOnce(error);

    await expect(listSessions("cust")).rejects.toThrow(error);
  });

  it("revokes a session id", async () => {
    const { revokeSession } = await importSessionModule();

    await revokeSession("session");

    expect(sessionMocks.sessionStore.delete).toHaveBeenCalledWith("session");
  });

  it("propagates revoke errors", async () => {
    const { revokeSession } = await importSessionModule();
    const error = new Error("delete-fail");
    sessionMocks.sessionStore.delete.mockRejectedValueOnce(error);

    await expect(revokeSession("session")).rejects.toThrow(error);
  });
});
