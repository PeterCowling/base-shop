import type { CmsUser } from "@acme/types";
import type { Role } from "../auth/roles";
export interface RbacDB {
    users: Record<string, CmsUser>;
    roles: Record<string, Role | Role[]>;
    permissions: Record<Role, string[]>;
}
export declare function readRbac(): Promise<RbacDB>;
export declare function writeRbac(db: RbacDB): Promise<void>;
//# sourceMappingURL=rbacStore.d.ts.map
