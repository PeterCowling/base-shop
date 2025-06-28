import { canRead, canWrite } from "../src/rbac";
import type { Role } from "../src/types";

describe("canRead", () => {
  const cases: [Role, boolean][] = [
    ["admin", true],
    ["ShopAdmin", true],
    ["CatalogManager", true],
    ["ThemeEditor", true],
    ["viewer", true],
  ];

  for (const [role, expected] of cases) {
    it(`${role} -> ${expected}`, () => {
      expect(canRead(role)).toBe(expected);
    });
  }
});

describe("canWrite", () => {
  const cases: [Role, boolean][] = [
    ["admin", true],
    ["ShopAdmin", true],
    ["CatalogManager", true],
    ["ThemeEditor", true],
    ["viewer", false],
  ];

  for (const [role, expected] of cases) {
    it(`${role} -> ${expected}`, () => {
      expect(canWrite(role)).toBe(expected);
    });
  }
});
