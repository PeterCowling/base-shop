// apps/cms/src/actions/common/auth.ts
import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@cms/auth/options";

import { hasPermission } from "@acme/auth";
import { canRead } from "@acme/auth/rbac";
import type { Permission, Role } from "@acme/auth/types";

type AppSession = Session & { user?: (Session["user"] & { role?: string; id?: string }) };

export async function ensureAuthorized(): Promise<AppSession> {
  let session = (await getServerSession(authOptions)) as AppSession | null;
  // If the central next-auth test mock has set a global session, prefer it.
  const injected = (globalThis as Record<string, unknown>).__MOCK_SESSION as AppSession | undefined;
  if (typeof injected !== "undefined") {
    session = injected;
  }
  if (session && session.user?.role !== "viewer") {
    return session;
  }
  // In unit/integration tests it's valuable to exercise downstream logic
  // without wiring a full auth flow. Allow opting into an admin session via
  // an explicit env flag. Real runtimes are unaffected.
  // Only assume admin when tests didn't explicitly set a mock session
  // SECURITY: Only allow in test environment to prevent accidental production bypass
  if (
    process.env.NODE_ENV === "test" &&
    process.env.CMS_TEST_ASSUME_ADMIN === "1" &&
    !(globalThis as Record<string, unknown>).__NEXTAUTH_MOCK_SET
  ) {
    return { user: { role: "admin" } } as AppSession;
  }
  throw new Error("Forbidden");
}

/**
 * Ensures the current user has at least read access to the CMS.
 * - Any authenticated role included in READ_ROLES is allowed.
 * - Falls back to test helpers when running under tests.
 */
export async function ensureCanRead(): Promise<AppSession> {
  let session = (await getServerSession(authOptions)) as AppSession | null;
  const injected = (globalThis as Record<string, unknown>).__MOCK_SESSION as
    | AppSession
    | undefined;
  if (typeof injected !== "undefined") {
    session = injected;
  }
  if (session && canRead(session.user?.role)) {
    return session;
  }
  // SECURITY: Only allow in test environment to prevent accidental production bypass
  if (
    process.env.NODE_ENV === "test" &&
    process.env.CMS_TEST_ASSUME_ADMIN === "1" &&
    !(globalThis as Record<string, unknown>).__NEXTAUTH_MOCK_SET
  ) {
    return { user: { role: "admin" } } as AppSession;
  }
  throw new Error("Unauthorized");
}

export async function ensureHasPermission(permission: Permission): Promise<AppSession> {
  const session = await ensureAuthorized();
  const role = session.user?.role;
  if (typeof role !== "string") throw new Error("Forbidden");
  if (!hasPermission(role as Role, permission)) throw new Error("Forbidden");
  return session;
}

/**
 * Ensures the current user has one of the specified roles.
 * Use when specific roles are required (e.g., admin, ShopAdmin).
 *
 * @example
 * await ensureRole(['admin', 'ShopAdmin']);
 */
export async function ensureRole(allowedRoles: Role[]): Promise<AppSession> {
  let session = (await getServerSession(authOptions)) as AppSession | null;
  const injected = (globalThis as Record<string, unknown>).__MOCK_SESSION as
    | AppSession
    | undefined;
  if (typeof injected !== "undefined") {
    session = injected;
  }
  if (session && session.user?.role && allowedRoles.includes(session.user.role as Role)) {
    return session;
  }
  // Test helper - only when tests didn't explicitly set a mock session
  if (
    process.env.NODE_ENV === "test" &&
    process.env.CMS_TEST_ASSUME_ADMIN === "1" &&
    !(globalThis as Record<string, unknown>).__NEXTAUTH_MOCK_SET
  ) {
    return { user: { role: "admin" } } as AppSession;
  }
  throw new Error("Forbidden");
}
