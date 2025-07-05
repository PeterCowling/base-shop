import type { CmsUser } from "@types";
import type { Role } from "../auth/roles";
export interface RbacDB {
    users: Record<string, CmsUser>;
    roles: Record<string, Role | Role[]>;
}
export declare function readRbac(): Promise<RbacDB>;
export declare function writeRbac(db: RbacDB): Promise<void>;
//# sourceMappingURL=rbacStore.d.ts.map