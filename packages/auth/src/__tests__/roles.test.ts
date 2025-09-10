import { jest } from "@jest/globals";
import {
  isRole,
  extendRoles,
  READ_ROLES,
  WRITE_ROLES,
} from "../types/roles";
import { canRead, canWrite } from "../rbac";

afterAll(() => {
  jest.resetModules();
});

describe("isRole", () => {
  it("returns true for known role and false for invalid role", () => {
    expect(isRole("admin")).toBe(true);
    expect(isRole("ghost")).toBe(false);
  });
});

describe("extendRoles", () => {
  it("adds new roles and avoids duplicates", () => {
    const initialReadLength = READ_ROLES.length;
    const initialWriteLength = WRITE_ROLES.length;

    extendRoles({ write: ["editor"] });

    expect(isRole("editor")).toBe(true);
    expect(canRead("editor")).toBe(true);
    expect(canWrite("editor")).toBe(true);

    extendRoles({ read: ["auditor"] });

    expect(isRole("auditor")).toBe(true);
    expect(canRead("auditor")).toBe(true);
    expect(canWrite("auditor")).toBe(false);

    expect(READ_ROLES).toEqual(expect.arrayContaining(["editor", "auditor"]));
    expect(WRITE_ROLES).toEqual(expect.arrayContaining(["editor"]));
    expect(WRITE_ROLES).not.toContain("auditor");

    expect(READ_ROLES.length).toBe(initialReadLength + 2);
    expect(WRITE_ROLES.length).toBe(initialWriteLength + 1);
    expect(new Set(READ_ROLES).size).toBe(READ_ROLES.length);
    expect(new Set(WRITE_ROLES).size).toBe(WRITE_ROLES.length);
  });
});

