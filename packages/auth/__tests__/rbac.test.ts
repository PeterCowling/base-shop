import { canRead, canWrite } from "../src/rbac";

describe("canRead", () => {
  const cases: [unknown, boolean][] = [
    ["admin", true],
    ["ShopAdmin", true],
    ["CatalogManager", true],
    ["ThemeEditor", true],
    ["viewer", true],
    ["bad", false],
    [null, false],
  ];

  for (const [role, expected] of cases) {
    it(`${String(role)} -> ${expected}`, () => {
      expect(canRead(role)).toBe(expected);
    });
  }
});

describe("canWrite", () => {
  const cases: [unknown, boolean][] = [
    ["admin", true],
    ["ShopAdmin", true],
    ["CatalogManager", true],
    ["ThemeEditor", true],
    ["viewer", false],
    ["bad", false],
  ];

  for (const [role, expected] of cases) {
    it(`${String(role)} -> ${expected}`, () => {
      expect(canWrite(role)).toBe(expected);
    });
  }
});
