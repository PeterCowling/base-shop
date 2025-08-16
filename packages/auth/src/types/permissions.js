// packages/auth/src/types/permissions.ts
import permissionsConfig from "../permissions.json";
import { z } from "zod";
const config = permissionsConfig;
const allPermissionsFromConfig = [
    ...new Set(Object.values(config).flat()),
];
export const PERMISSIONS = [...allPermissionsFromConfig];
const PermissionSchema = z.enum(allPermissionsFromConfig);
export function isPermission(permission) {
    return PermissionSchema.safeParse(permission).success;
}
export { PermissionSchema };
