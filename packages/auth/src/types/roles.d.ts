import { z } from "zod";

type RolesConfig = {
    write: readonly string[];
    read: readonly string[];
};
declare const allRolesFromConfig: readonly string[];
export type Role = (typeof allRolesFromConfig)[number];
export declare const WRITE_ROLES: Role[];
export declare const READ_ROLES: Role[];
declare let RoleSchema: z.ZodEnum<[string, ...string[]]>;
export declare function isRole(role: unknown): role is Role;
export declare function extendRoles(extension: Partial<RolesConfig>): void;
export { RoleSchema };
//# sourceMappingURL=roles.d.ts.map