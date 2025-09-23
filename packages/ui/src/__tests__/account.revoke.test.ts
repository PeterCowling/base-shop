// packages/ui/src/__tests__/account.revoke.test.ts
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
} from "@auth";
import { revalidatePath } from "next/cache";
import { revoke } from "../account";

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
    expect(result).toEqual({ success: false, error: "Failed to revoke session." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

