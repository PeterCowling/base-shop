// packages/auth/src/permissions.ts

import permissionsConfig from "./permissions.json";
import type { Role } from "./types/roles";
import type { Permission } from "./types/permissions";

// Role to permission mapping loaded from configuration.
// Includes granular permissions such as view_orders and manage_sessions.
const ROLE_PERMISSIONS: Record<Role, Permission[]> = permissionsConfig as Record<Role, Permission[]>;

export function hasPermission(role: Role, perm: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
}

export { ROLE_PERMISSIONS };
