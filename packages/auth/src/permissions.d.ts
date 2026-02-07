import type { Permission } from "./types/permissions.js";
import type { Role } from "./types/roles.js";

declare const ROLE_PERMISSIONS: Record<Role, Permission[]>;
export declare function hasPermission(role: Role, perm: Permission): boolean;
export { ROLE_PERMISSIONS };
//# sourceMappingURL=permissions.d.ts.map