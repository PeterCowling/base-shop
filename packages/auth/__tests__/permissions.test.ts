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
});
