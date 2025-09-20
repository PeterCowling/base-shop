jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

import { ensureAuthorized } from "../auth";
import { __setMockSession, __resetMockSession } from "next-auth";

describe("ensureAuthorized", () => {
  beforeEach(() => {
    __resetMockSession();
  });

  it("throws when session is null", async () => {
    __setMockSession(null as any);
    await expect(ensureAuthorized()).rejects.toThrow("Forbidden");
  });

  it("throws when user role is viewer", async () => {
    __setMockSession({ user: { role: "viewer" } } as any);
    await expect(ensureAuthorized()).rejects.toThrow("Forbidden");
  });

  it("returns session when user role is admin", async () => {
    const session = { user: { role: "admin" } } as any;
    __setMockSession(session);
    await expect(ensureAuthorized()).resolves.toEqual(session);
  });
});
