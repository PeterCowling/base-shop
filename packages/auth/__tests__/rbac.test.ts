import { z } from "zod";
import { canRead, canWrite, READ_ROLES, WRITE_ROLES } from "../src/rbac.js";
import { extendRoles } from "../src/types/roles.js";
import * as roles from "../src/types/roles.js";

const originalRead = [...READ_ROLES];
const originalWrite = [...WRITE_ROLES];

afterEach(() => {
  READ_ROLES.splice(0, READ_ROLES.length, ...originalRead);
  WRITE_ROLES.splice(0, WRITE_ROLES.length, ...originalWrite);
  (roles as any).RoleSchema = z.enum(
    READ_ROLES as [roles.Role, ...roles.Role[]]
  );
});

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

describe("extendRoles integration", () => {
  it("new roles affect canRead and canWrite", () => {
    extendRoles({ write: ["author"], read: ["reader"] });

    expect(canWrite("author")).toBe(true);
    expect(canRead("author")).toBe(true);
    expect(canRead("reader")).toBe(true);
    expect(canWrite("reader")).toBe(false);
  });
});

describe("case sensitivity", () => {
  const cases = ["Admin", "shopadmin", "VIEWER", "catalogmanager"]; // invalid casing
  for (const role of cases) {
    it(`${role} is rejected`, () => {
      expect(canRead(role)).toBe(false);
      expect(canWrite(role)).toBe(false);
    });
  }
});

describe("non-string roles", () => {
  const values: unknown[] = [123, Symbol("sym")];
  for (const value of values) {
    it(`${String(value)} -> false`, () => {
      expect(() => canRead(value)).not.toThrow();
      expect(canRead(value)).toBe(false);
      expect(() => canWrite(value)).not.toThrow();
      expect(canWrite(value)).toBe(false);
    });
  }
});
