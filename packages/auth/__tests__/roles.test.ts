import { z } from "zod";
import * as roles from "../src/types/roles.js";

const { isRole, extendRoles, READ_ROLES, WRITE_ROLES } = roles;

describe("isRole", () => {
  const valid: unknown[] = [
    "admin",
    "ShopAdmin",
    "CatalogManager",
    "ThemeEditor",
    "viewer",
  ];

  for (const role of valid) {
    it(`${String(role)} -> true`, () => {
      expect(isRole(role)).toBe(true);
    });
  }

  const invalid: unknown[] = ["bad", null, undefined, 0];

  for (const role of invalid) {
    it(`${String(role)} -> false`, () => {
      expect(isRole(role)).toBe(false);
    });
  }
});

describe("extendRoles", () => {
  const originalRead = [...READ_ROLES];
  const originalWrite = [...WRITE_ROLES];

  afterEach(() => {
    READ_ROLES.splice(0, READ_ROLES.length, ...originalRead);
    WRITE_ROLES.splice(0, WRITE_ROLES.length, ...originalWrite);
    (roles as any).RoleSchema = z.enum(READ_ROLES as [roles.Role, ...roles.Role[]]);
  });

  it("adds read/write roles and updates RoleSchema", () => {
    extendRoles({ write: ["author"], read: ["reader"] });

    expect(WRITE_ROLES).toContain("author");
    expect(WRITE_ROLES).not.toContain("reader");
    expect(READ_ROLES).toEqual(expect.arrayContaining(["author", "reader"]));

    expect(roles.RoleSchema.safeParse("author").success).toBe(true);
    expect(roles.RoleSchema.safeParse("reader").success).toBe(true);
    expect(isRole("author")).toBe(true);
    expect(isRole("reader")).toBe(true);
  });
});
