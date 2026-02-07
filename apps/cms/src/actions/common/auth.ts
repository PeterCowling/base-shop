// apps/cms/src/actions/common/auth.ts
import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@cms/auth/options";

import { hasPermission } from "@acme/auth";
import { canRead } from "@acme/auth/rbac";
import type { Permission, Role } from "@acme/auth/types";

type AppSession = Session & { user?: (Session["user"] & { role?: string; id?: string; allowedShops?: string[] }) };

/** Roles that have global access to all shops */
const GLOBAL_ADMIN_ROLES: readonly string[] = ["admin"];

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

/**
 * Ensures the current user has access to a specific shop.
 *
 * Access rules:
 * - Global admins (role: "admin") can access all shops
 * - Other authenticated users need explicit shop assignment via `allowedShops`
 * - The wildcard "*" in `allowedShops` grants access to all shops
 *
 * @param shop - The shop ID to check access for
 * @throws Error with "Forbidden" message if access is denied
 *
 * @example
 * await ensureShopAccess("my-shop");
 */
export async function ensureShopAccess(shop: string): Promise<AppSession> {
  const session = await ensureAuthorized();
  const role = session.user?.role;
  const allowedShops = session.user?.allowedShops;

  // Global admins can access all shops
  if (role && GLOBAL_ADMIN_ROLES.includes(role)) {
    return session;
  }

  // Check explicit shop assignment
  if (allowedShops) {
    // Wildcard grants access to all shops
    if (allowedShops.includes("*")) {
      return session;
    }
    // Check if the specific shop is in the allowed list
    if (allowedShops.includes(shop)) {
      return session;
    }
  }

  // Test helper - only when tests didn't explicitly set a mock session
  if (
    process.env.NODE_ENV === "test" &&
    process.env.CMS_TEST_ASSUME_ADMIN === "1" &&
    !(globalThis as Record<string, unknown>).__NEXTAUTH_MOCK_SET
  ) {
    return session;
  }

  throw new Error("Forbidden");
}

/**
 * Ensures the current user can read from a specific shop.
 * Similar to ensureShopAccess but only requires read permission.
 *
 * @param shop - The shop ID to check read access for
 * @throws Error with "Forbidden" message if access is denied
 */
export async function ensureShopReadAccess(shop: string): Promise<AppSession> {
  const session = await ensureCanRead();
  const role = session.user?.role;
  const allowedShops = session.user?.allowedShops;

  // Global admins can read all shops
  if (role && GLOBAL_ADMIN_ROLES.includes(role)) {
    return session;
  }

  // Check explicit shop assignment
  if (allowedShops) {
    if (allowedShops.includes("*") || allowedShops.includes(shop)) {
      return session;
    }
  }

  // Test helper
  if (
    process.env.NODE_ENV === "test" &&
    process.env.CMS_TEST_ASSUME_ADMIN === "1" &&
    !(globalThis as Record<string, unknown>).__NEXTAUTH_MOCK_SET
  ) {
    return session;
  }

  throw new Error("Forbidden");
}
