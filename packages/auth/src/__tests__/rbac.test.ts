import { canRead, canWrite, READ_ROLES, WRITE_ROLES } from "../rbac";

describe("canRead", () => {
  it.each(READ_ROLES)("%s role can read", (role) => {
    expect(canRead(role)).toBe(true);
  });

  it("returns false for undefined role", () => {
    expect(canRead(undefined)).toBe(false);
  });

  it("returns false for invalid role", () => {
    expect(canRead("ghost")).toBe(false);
  });
});

describe("canWrite", () => {
  it.each(WRITE_ROLES)("%s role can write", (role) => {
    expect(canWrite(role)).toBe(true);
  });

  it("returns false for roles not in WRITE_ROLES", () => {
    expect(canWrite("viewer")).toBe(false);
  });

  it("returns false for invalid role", () => {
    expect(canWrite("ghost")).toBe(false);
  });
});
