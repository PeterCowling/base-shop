// packages/ui/src/actions/__tests__/revokeSession.test.ts
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
  listSessions: jest.fn(),
  hasPermission: jest.fn(),
  revokeSession: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import {
  getCustomerSession,
  listSessions,
  hasPermission,
  revokeSession as authRevokeSession,
} from "@acme/auth";
import { revalidatePath } from "next/cache";
import { revoke } from "../revokeSession";

describe("revoke", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns error when session is missing", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue(null);

    const result = await revoke("id");

    expect(result).toEqual({ success: false, error: "account.sessions.errors.revokeFailed" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns error when session lacks permission", async () => {
    const session = { role: "user", customerId: "123" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const result = await revoke("id");

    expect(hasPermission).toHaveBeenCalledWith(session.role, "manage_sessions");
    expect(result).toEqual({ success: false, error: "account.sessions.errors.revokeFailed" });
    expect(listSessions).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns error when session does not belong to user", async () => {
    const session = { role: "admin", customerId: "123" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    (hasPermission as jest.Mock).mockReturnValue(true);
    (listSessions as jest.Mock).mockResolvedValue([{ sessionId: "other" }]);

    const result = await revoke("target");

    expect(listSessions).toHaveBeenCalledWith(session.customerId);
    expect(result).toEqual({
      success: false,
      error: "account.sessions.errors.notOwned",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns error when listSessions rejects", async () => {
    const session = { role: "admin", customerId: "123" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    (hasPermission as jest.Mock).mockReturnValue(true);
    (listSessions as jest.Mock).mockRejectedValue(new Error("boom"));

    const result = await revoke("target");

    expect(listSessions).toHaveBeenCalledWith(session.customerId);
    expect(result).toEqual({ success: false, error: "account.sessions.errors.revokeFailed" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns error when revokeSession throws", async () => {
    const session = { role: "admin", customerId: "123" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    (hasPermission as jest.Mock).mockReturnValue(true);
    (listSessions as jest.Mock).mockResolvedValue([{ sessionId: "target" }]);
    (authRevokeSession as jest.Mock).mockRejectedValue(new Error("boom"));

    const result = await revoke("target");

    expect(authRevokeSession).toHaveBeenCalledWith("target");
    expect(result).toEqual({ success: false, error: "account.sessions.errors.revokeFailed" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("revokes session and revalidates path", async () => {
    const session = { role: "admin", customerId: "123" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    (hasPermission as jest.Mock).mockReturnValue(true);
    (listSessions as jest.Mock).mockResolvedValue([{ sessionId: "target" }]);
    (authRevokeSession as jest.Mock).mockResolvedValue(undefined);

    const result = await revoke("target");

    expect(result).toEqual({ success: true });
    expect(authRevokeSession).toHaveBeenCalledWith("target");
    expect(revalidatePath).toHaveBeenCalledWith("/account/sessions");
  });
});
