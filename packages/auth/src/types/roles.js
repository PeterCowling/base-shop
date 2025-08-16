// packages/auth/src/types/roles.ts
import rolesConfig from "../roles.json";
import { z } from "zod";
const config = rolesConfig;
const allRolesFromConfig = [
    ...new Set([...config.write, ...config.read]),
];
export const WRITE_ROLES = [...config.write];
export const READ_ROLES = [...allRolesFromConfig];
let RoleSchema = z.enum(allRolesFromConfig);
export function isRole(role) {
    return RoleSchema.safeParse(role).success;
}
export function extendRoles(extension) {
    if (extension.write) {
        for (const role of extension.write) {
            if (!WRITE_ROLES.includes(role)) {
                WRITE_ROLES.push(role);
            }
            if (!READ_ROLES.includes(role)) {
                READ_ROLES.push(role);
            }
        }
    }
    if (extension.read) {
        for (const role of extension.read) {
            if (!READ_ROLES.includes(role)) {
                READ_ROLES.push(role);
            }
        }
    }
    RoleSchema = z.enum(READ_ROLES);
}
export { RoleSchema };
