// packages/auth/src/rbac.ts

import {
  isRole,
  READ_ROLES,
  type Role,
  WRITE_ROLES,
} from "./types/roles";

export { READ_ROLES, WRITE_ROLES };

export function canWrite(role?: unknown): boolean {
  return isRole(role) ? WRITE_ROLES.includes(role) : false;
}

export function canRead(role?: unknown): boolean {
  return isRole(role) ? READ_ROLES.includes(role) : false;
}

export type { Role };
