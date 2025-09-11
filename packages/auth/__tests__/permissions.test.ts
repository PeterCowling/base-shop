import { PERMISSIONS, isPermission } from "../src/types/permissions";
import { hasPermission, ROLE_PERMISSIONS } from "../src/permissions";

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

  it("customer can view orders but cannot manage them", () => {
    expect(hasPermission("customer", "view_orders")).toBe(true);
    expect(hasPermission("customer", "manage_orders")).toBe(false);
  });

  it("admin and ShopAdmin can manage orders and sessions", () => {
    expect(hasPermission("admin", "manage_orders")).toBe(true);
    expect(hasPermission("admin", "manage_sessions")).toBe(true);
    expect(hasPermission("ShopAdmin", "manage_orders")).toBe(true);
    expect(hasPermission("ShopAdmin", "manage_sessions")).toBe(true);
  });

  it("viewer cannot view orders", () => {
    expect(hasPermission("viewer", "view_orders")).toBe(false);
  });

  it("returns false for unknown permissions without throwing", () => {
    expect(() => hasPermission("viewer", "non_existent_permission")).not.toThrow();
    expect(hasPermission("viewer", "non_existent_permission")).toBe(false);
  });

  it("returns false for roles not in ROLE_PERMISSIONS", () => {
    const unknownRole = "ghost" as any;
    expect((ROLE_PERMISSIONS as Record<string, unknown>)[unknownRole]).toBeUndefined();
    expect(hasPermission(unknownRole, "view_products")).toBe(false);
  });
});
