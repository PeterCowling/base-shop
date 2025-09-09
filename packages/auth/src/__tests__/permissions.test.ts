import { hasPermission } from "../permissions";

describe("hasPermission", () => {
  it("returns true when role has permission", () => {
    expect(hasPermission("admin", "manage_orders")).toBe(true);
  });

  it("returns false when role lacks permission", () => {
    expect(hasPermission("viewer", "checkout")).toBe(false);
  });

  it("returns false for unknown role", () => {
    expect(hasPermission("ghost" as any, "view_products")).toBe(false);
  });
});
