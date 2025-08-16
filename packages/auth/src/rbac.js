// packages/auth/src/rbac.ts
import { READ_ROLES, WRITE_ROLES, isRole, } from "./types/roles";
export { READ_ROLES, WRITE_ROLES };
export function canWrite(role) {
    return isRole(role) ? WRITE_ROLES.includes(role) : false;
}
export function canRead(role) {
    return isRole(role) ? READ_ROLES.includes(role) : false;
}
