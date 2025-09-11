import { jest } from "@jest/globals";

const getCustomerSession = jest.fn();
const hasPermission = jest.fn();

jest.mock("../session", () => ({ getCustomerSession }));
jest.mock("../permissions", () => ({ hasPermission }));

describe("requirePermission", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("rejects with Unauthorized when no session", async () => {
    getCustomerSession.mockResolvedValue(null);

    const { requirePermission } = await import("../requirePermission");

    await expect(
      requirePermission("manage_orders")
    ).rejects.toThrow("Unauthorized");
  });

  it("propagates errors from getCustomerSession", async () => {
    const customError = new Error("session failed");
    getCustomerSession.mockRejectedValue(customError);

    const { requirePermission } = await import("../requirePermission");

    await expect(requirePermission("manage_orders")).rejects.toBe(customError);
    expect(hasPermission).not.toHaveBeenCalled();
  });

  it("rejects with Unauthorized when permission is missing", async () => {
    getCustomerSession.mockResolvedValue({
      customerId: "cust",
      role: "viewer",
    });
    hasPermission.mockReturnValue(false);

    const { requirePermission } = await import("../requirePermission");

    await expect(
      requirePermission("manage_orders")
    ).rejects.toThrow("Unauthorized");
    expect(hasPermission).toHaveBeenCalledWith("viewer", "manage_orders");
  });

  it("returns session when permission is granted", async () => {
    const session = { customerId: "cust", role: "admin" } as const;
    getCustomerSession.mockResolvedValue(session);
    hasPermission.mockReturnValue(true);

    const { requirePermission } = await import("../requirePermission");

    await expect(
      requirePermission("manage_orders")
    ).resolves.toEqual(session);
    expect(hasPermission).toHaveBeenCalledWith("admin", "manage_orders");
  });
});

