// packages/auth/src/rbac.ts

import {
  READ_ROLES,
  WRITE_ROLES,
  isRole,
  type Role,
} from "./types/roles";

export { READ_ROLES, WRITE_ROLES };

const PERMISSIONS = {
  checkout: [...WRITE_ROLES, "customer"] as Role[],
  manage_cart: [...WRITE_ROLES, "customer"] as Role[],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(
  role: unknown,
  permission: Permission
): boolean {
  return isRole(role) ? PERMISSIONS[permission].includes(role) : false;
}

export function canWrite(role?: unknown): boolean {
  return isRole(role) ? WRITE_ROLES.includes(role) : false;
}

export function canRead(role?: unknown): boolean {
  return isRole(role) ? READ_ROLES.includes(role) : false;
}

export type { Role };
