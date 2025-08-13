import { PERMISSIONS, isPermission } from "../src/types/permissions";
import { hasPermission } from "../src/permissions";

describe("isPermission", () => {
  for (const perm of PERMISSIONS) {
    it(`${perm} -> true`, () => {
      expect(isPermission(perm)).toBe(true);
    });
  }

  const invalid: unknown[] = ["bad", null, undefined, 0];

  for (const perm of invalid) {
    it(`${String(perm)} -> false`, () => {
      expect(isPermission(perm)).toBe(false);
    });
  }
});

describe("hasPermission", () => {
  it("viewer can view products but not checkout", () => {
    expect(hasPermission("viewer", "view_products")).toBe(true);
    expect(hasPermission("viewer", "add_to_cart")).toBe(false);
  });

  it("customer can checkout", () => {
    expect(hasPermission("customer", "checkout")).toBe(true);
  });

  it("customer can view orders and change password but not manage orders or sessions", () => {
    expect(hasPermission("customer", "view_orders")).toBe(true);
    expect(hasPermission("customer", "change_password")).toBe(true);
    expect(hasPermission("customer", "manage_orders")).toBe(false);
    expect(hasPermission("customer", "manage_sessions")).toBe(false);
  });

  it("admin can manage orders and sessions", () => {
    expect(hasPermission("admin", "manage_orders")).toBe(true);
    expect(hasPermission("admin", "manage_sessions")).toBe(true);
  });
});
