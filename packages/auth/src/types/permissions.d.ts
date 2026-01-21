import { z } from "zod";

declare const allPermissionsFromConfig: readonly string[];
export type Permission = (typeof allPermissionsFromConfig)[number];
export declare const PERMISSIONS: Permission[];
declare const PermissionSchema: z.ZodEnum<[string, ...string[]]>;
export declare function isPermission(permission: unknown): permission is Permission;
export { PermissionSchema };
//# sourceMappingURL=permissions.d.ts.map