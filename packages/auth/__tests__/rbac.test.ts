import { z } from "zod";
import { canRead, canWrite, READ_ROLES, WRITE_ROLES } from "../src/rbac";
import { extendRoles } from "../src/types/roles";
import * as roles from "../src/types/roles";
import { requirePermission } from "../src/requirePermission";
import { getCustomerSession } from "../src/session";
import type { Role } from "../src/types/index";

jest.mock("../src/session", () => ({
  getCustomerSession: jest.fn(),
}));

const mockedGetSession = getCustomerSession as jest.Mock;

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
    [undefined, false],
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
    [undefined, false],
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

describe("requirePermission conditional checks", () => {
  beforeEach(() => {
    mockedGetSession.mockReset();
  });

  it("allows access when the role has the permission", async () => {
    mockedGetSession.mockResolvedValue({
      customerId: "1",
      role: "customer" as Role,
    });

    await expect(requirePermission("checkout")).resolves.toBeDefined();
  });

  it("denies access when the role lacks the permission", async () => {
    mockedGetSession.mockResolvedValue({
      customerId: "1",
      role: "viewer" as Role,
    });

    await expect(requirePermission("checkout")).rejects.toThrow(
      "Unauthorized"
    );
  });

  it("handles undefined roles gracefully", async () => {
    mockedGetSession.mockResolvedValue({
      customerId: "1",
      role: undefined,
    });

    await expect(requirePermission("checkout")).rejects.toThrow(
      "Unauthorized"
    );
  });

  it("throws when the session is missing", async () => {
    mockedGetSession.mockResolvedValue(null);

    await expect(requirePermission("checkout")).rejects.toEqual(
      new Error("Unauthorized")
    );
  });
});
