// packages/ui/__tests__/Sessions.test.tsx
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getCustomerSession,
  hasPermission,
  listSessions,
  revokeSession,
} from "@acme/auth";

import SessionsPage, { revoke } from "../src/components/account/Sessions";

jest.mock("@acme/auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
  listSessions: jest.fn(),
  revokeSession: jest.fn(),
  hasPermission: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  redirect: jest.fn(),
}));

describe("SessionsPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("redirects unauthenticated users", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue(null);
    await SessionsPage({});
    expect(getCustomerSession).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith(
      "/login?callbackUrl=%2Faccount%2Fsessions",
    );
  });

  it("shows empty state when no sessions", async () => {
    const session = { customerId: "cust1", role: "customer" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    (hasPermission as jest.Mock).mockReturnValue(true);
    (listSessions as jest.Mock).mockResolvedValue([]);
    const element = await SessionsPage({});
    expect(listSessions).toHaveBeenCalledWith(session.customerId);
    expect(hasPermission).toHaveBeenCalledWith(session.role, "manage_sessions");
    // Component returns a full page layout div
    expect(element.type).toBe("div");
  });

  it("lists active sessions", async () => {
    const session = { customerId: "cust1", role: "customer" };
    const sessions = [
      { sessionId: "s1", userAgent: "ua1", createdAt: new Date() },
      { sessionId: "s2", userAgent: "ua2", createdAt: new Date() },
    ];
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    (hasPermission as jest.Mock).mockReturnValue(true);
    (listSessions as jest.Mock).mockResolvedValue(sessions);
    const element = await SessionsPage({});
    expect(hasPermission).toHaveBeenCalledWith(session.role, "manage_sessions");
    // Component returns a full page layout div
    expect(element.type).toBe("div");
  });

  it("hides sessions without permission", async () => {
    const session = { customerId: "cust1", role: "viewer" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    (hasPermission as jest.Mock).mockReturnValue(false);
    const element = await SessionsPage({});
    expect(hasPermission).toHaveBeenCalledWith(session.role, "manage_sessions");
    expect(listSessions).not.toHaveBeenCalled();
    // Component returns a full page layout div
    expect(element.type).toBe("div");
  });
});

describe("revoke", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("revokes a session", async () => {
    const session = { customerId: "cust1", role: "customer" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    (hasPermission as jest.Mock).mockReturnValue(true);
    (listSessions as jest.Mock).mockResolvedValue([{ sessionId: "s1" }]);
    await revoke("s1");
    expect(hasPermission).toHaveBeenCalledWith(session.role, "manage_sessions");
    expect(revokeSession).toHaveBeenCalledWith("s1");
    expect(revalidatePath).toHaveBeenCalledWith("/account/sessions");
  });

  it("fails if session does not belong to user", async () => {
    const session = { customerId: "cust1", role: "customer" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    (hasPermission as jest.Mock).mockReturnValue(true);
    (listSessions as jest.Mock).mockResolvedValue([{ sessionId: "s2" }]);
    const result = await revoke("s1");
    expect(hasPermission).toHaveBeenCalledWith(session.role, "manage_sessions");
    expect(listSessions).toHaveBeenCalledWith(session.customerId);
    expect(revokeSession).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "account.sessions.errors.notOwned",
    });
  });

  it("fails to revoke a session without permission", async () => {
    const session = { customerId: "cust1", role: "viewer" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    (hasPermission as jest.Mock).mockReturnValue(false);
    const result = await revoke("s1");
    expect(hasPermission).toHaveBeenCalledWith(session.role, "manage_sessions");
    expect(listSessions).not.toHaveBeenCalled();
    expect(revokeSession).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });
});
