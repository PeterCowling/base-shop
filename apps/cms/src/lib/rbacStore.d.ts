import type { Role } from "../auth/roles";
import type { CmsUser } from "../auth/users";
export interface RbacDB {
    users: Record<string, CmsUser>;
    roles: Record<string, Role | Role[]>;
}
export declare function readRbac(): Promise<RbacDB>;
export declare function writeRbac(db: RbacDB): Promise<void>;
//# sourceMappingURL=rbacStore.d.ts.map