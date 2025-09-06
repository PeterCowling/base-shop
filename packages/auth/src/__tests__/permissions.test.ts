import { hasPermission } from "../permissions";

describe("hasPermission", () => {
  it("returns true when role has permission", () => {
    expect(hasPermission("admin", "manage_orders")).toBe(true);
  });

  it("returns false when role lacks permission", () => {
    expect(hasPermission("viewer", "checkout")).toBe(false);
  });
});
