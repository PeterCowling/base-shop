import type { CmsUser } from "@acme/types";
import type { Role } from "../auth/roles";
export type Permission = string;
export interface RbacDB {
    users: Record<string, CmsUser>;
    roles: Record<string, Role | Role[]>;
    permissions: Record<Role, Permission[]>;
}
export declare function readRbac(): Promise<RbacDB>;
export declare function writeRbac(db: RbacDB): Promise<void>;
//# sourceMappingURL=rbacStore.d.ts.map
