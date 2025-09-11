jest.mock("@cms/auth/options", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

import { ensureAuthorized } from "../auth";
import { getServerSession } from "next-auth";

const mockGetServerSession = getServerSession as jest.Mock;

describe("ensureAuthorized", () => {
  beforeEach(() => {
    mockGetServerSession.mockReset();
  });

  it("throws when session is null", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    await expect(ensureAuthorized()).rejects.toThrow("Forbidden");
  });

  it("throws when user role is viewer", async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: { role: "viewer" } });
    await expect(ensureAuthorized()).rejects.toThrow("Forbidden");
  });

  it("returns session when user role is admin", async () => {
    const session = { user: { role: "admin" } } as any;
    mockGetServerSession.mockResolvedValueOnce(session);
    await expect(ensureAuthorized()).resolves.toBe(session);
  });
});

