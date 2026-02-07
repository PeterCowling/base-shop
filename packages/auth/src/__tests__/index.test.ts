import { describe, expect, it, jest } from "@jest/globals";

type RbacModule = typeof import("../rbac");
type RolesModule = typeof import("../types/roles");
type PermissionsModule = typeof import("../permissions");
type SessionModule = typeof import("../session");
type StoreModule = typeof import("../store");
type MfaModule = typeof import("../mfa");

jest.mock("../rbac", () => ({
  canRead: jest.fn(() => true),
  canWrite: jest.fn(() => true),
  READ_ROLES: ["reader"],
  WRITE_ROLES: ["writer"],
}));

jest.mock("../types/roles", () => ({
  extendRoles: jest.fn(),
  isRole: jest.fn(() => true),
}));

jest.mock("../permissions", () => ({
  hasPermission: jest.fn(() => true),
}));

const requirePermissionMock = jest.fn();
jest.mock("../requirePermission", () => ({
  requirePermission: requirePermissionMock,
}));

jest.mock("../session", () => ({
  CUSTOMER_SESSION_COOKIE: "customer",
  CSRF_TOKEN_COOKIE: "csrf",
  getCustomerSession: jest.fn(),
  createCustomerSession: jest.fn(),
  destroyCustomerSession: jest.fn(),
  listSessions: jest.fn(),
  revokeSession: jest.fn(),
  validateCsrfToken: jest.fn(),
}));

jest.mock("../store", () => ({
  setSessionStoreFactory: jest.fn(),
}));

jest.mock("../mfa", () => ({
  enrollMfa: jest.fn(),
  verifyMfa: jest.fn(),
  isMfaEnabled: jest.fn(),
  generateMfaToken: jest.fn(),
  verifyMfaToken: jest.fn(),
}));

describe("package entrypoint", () => {
  it("re-exports the public API", async () => {
    jest.resetModules();
    const mod = await import("../index");

    const rbac = jest.requireMock("../rbac") as jest.Mocked<RbacModule>;
    expect(mod.canRead).toBe(rbac.canRead);
    expect(mod.canWrite).toBe(rbac.canWrite);
    expect(mod.READ_ROLES).toBe(rbac.READ_ROLES);
    expect(mod.WRITE_ROLES).toBe(rbac.WRITE_ROLES);

    const roles = jest.requireMock("../types/roles") as jest.Mocked<RolesModule>;
    expect(mod.extendRoles).toBe(roles.extendRoles);
    expect(mod.isRole).toBe(roles.isRole);

    const permissions = jest.requireMock("../permissions") as jest.Mocked<PermissionsModule>;
    expect(mod.hasPermission).toBe(permissions.hasPermission);

    expect(mod.requirePermission).toBe(requirePermissionMock);

    const session = jest.requireMock("../session") as jest.Mocked<SessionModule>;
    expect(mod.CUSTOMER_SESSION_COOKIE).toBe(session.CUSTOMER_SESSION_COOKIE);
    expect(mod.CSRF_TOKEN_COOKIE).toBe(session.CSRF_TOKEN_COOKIE);
    expect(mod.getCustomerSession).toBe(session.getCustomerSession);
    expect(mod.createCustomerSession).toBe(session.createCustomerSession);
    expect(mod.destroyCustomerSession).toBe(session.destroyCustomerSession);
    expect(mod.listSessions).toBe(session.listSessions);
    expect(mod.revokeSession).toBe(session.revokeSession);
    expect(mod.validateCsrfToken).toBe(session.validateCsrfToken);

    const store = jest.requireMock("../store") as jest.Mocked<StoreModule>;
    expect(mod.setSessionStoreFactory).toBe(store.setSessionStoreFactory);

    const mfa = jest.requireMock("../mfa") as jest.Mocked<MfaModule>;
    expect(mod.enrollMfa).toBe(mfa.enrollMfa);
    expect(mod.verifyMfa).toBe(mfa.verifyMfa);
    expect(mod.isMfaEnabled).toBe(mfa.isMfaEnabled);
    expect(mod.generateMfaToken).toBe(mfa.generateMfaToken);
    expect(mod.verifyMfaToken).toBe(mfa.verifyMfaToken);
  });
});
