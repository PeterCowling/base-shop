jest.mock("@cms/auth/options", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

import { ensureAuthorized } from "../auth";
import { getServerSession } from "next-auth";

describe("ensureAuthorized", () => {
  beforeEach(() => {
    (getServerSession as jest.Mock).mockReset();
  });

  it("throws when session is null", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    await expect(ensureAuthorized()).rejects.toThrow("Forbidden");
  });

  it("throws when user role is viewer", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "viewer" } });
    await expect(ensureAuthorized()).rejects.toThrow("Forbidden");
  });

  it("resolves when user role is admin", async () => {
    const session = { user: { role: "admin" } } as any;
    (getServerSession as jest.Mock).mockResolvedValue(session);
    await expect(ensureAuthorized()).resolves.toBe(session);
  });
});

