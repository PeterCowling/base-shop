// packages/auth/src/permissions.ts
import permissionsConfig from "./permissions.json" assert { type: "json" };
// Role to permission mapping loaded from configuration.
// Includes granular permissions such as view_orders and manage_sessions.
const ROLE_PERMISSIONS = permissionsConfig;
export function hasPermission(role, perm) {
    return ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
}
export { ROLE_PERMISSIONS };
