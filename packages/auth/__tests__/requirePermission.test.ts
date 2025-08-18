import { requirePermission } from "../src/requirePermission.js";
import { getCustomerSession } from "../src/session.js";
import type { Role } from "../src/types/index.js";

jest.mock("../src/session.js", () => ({
  getCustomerSession: jest.fn(),
}));

const mockedGetSession = getCustomerSession as jest.Mock;

describe("requirePermission", () => {
  beforeEach(() => {
    mockedGetSession.mockReset();
  });

  it("rejects when session is missing", async () => {
    mockedGetSession.mockResolvedValue(null);
    await expect(requirePermission("checkout")).rejects.toThrow("Unauthorized");
  });

  it("rejects when role lacks permission", async () => {
    mockedGetSession.mockResolvedValue({ customerId: "1", role: "viewer" as Role });
    await expect(requirePermission("checkout")).rejects.toThrow("Unauthorized");
  });

  it("allows when role has permission", async () => {
    mockedGetSession.mockResolvedValue({ customerId: "1", role: "customer" as Role });
    await expect(requirePermission("checkout")).resolves.toBeDefined();
  });
});
