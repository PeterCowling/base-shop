// packages/ui/src/__tests__/account.revoke.test.ts
import { revalidatePath } from "next/cache";

import {
  getCustomerSession,
  hasPermission,
  listSessions,
  revokeSession as authRevokeSession,
} from "@acme/auth";

import { revoke } from "../account";

jest.mock("@acme/auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
  listSessions: jest.fn(),
  hasPermission: jest.fn(),
  revokeSession: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("account revoke (server export)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("mirrors revoke behavior when permitted and matching", async () => {
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

  it("returns error when not permitted", async () => {
    const session = { role: "user", customerId: "123" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    (hasPermission as jest.Mock).mockReturnValue(false);

    const result = await revoke("target");
    expect(result).toEqual({ success: false, error: "account.sessions.errors.revokeFailed" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns error when there is no current session", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue(null);
    const result = await revoke("target");
    expect(result).toEqual({ success: false, error: "account.sessions.errors.revokeFailed" });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(authRevokeSession).not.toHaveBeenCalled();
  });

  it("returns error when target session does not belong to user", async () => {
    const session = { role: "admin", customerId: "abc" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    (hasPermission as jest.Mock).mockReturnValue(true);
    (listSessions as jest.Mock).mockResolvedValue([{ sessionId: "other" }]);

    const result = await revoke("target");

    expect(result).toEqual({
      success: false,
      error: "account.sessions.errors.notOwned",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(authRevokeSession).not.toHaveBeenCalled();
  });

  it("handles thrown errors and returns generic failure", async () => {
    (getCustomerSession as jest.Mock).mockRejectedValue(new Error("boom"));

    const result = await revoke("any");
    expect(result).toEqual({ success: false, error: "account.sessions.errors.revokeFailed" });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(authRevokeSession).not.toHaveBeenCalled();
  });
});
