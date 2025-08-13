// packages/auth/src/permissions.ts

import permissionsConfig from "./permissions.json";
import type { Role } from "./types/roles";
import type { Permission } from "./types/permissions";

// Role to permission mapping loaded from configuration.
// Permissions include granular actions like "view_orders",
// "manage_orders", "manage_sessions", and "change_password".
const ROLE_PERMISSIONS: Record<Role, Permission[]> =
  permissionsConfig as Record<Role, Permission[]>;

export function hasPermission(role: Role, perm: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
}

export { ROLE_PERMISSIONS };
