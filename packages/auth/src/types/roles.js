"use strict";
// packages/auth/src/types/roles.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleSchema = exports.READ_ROLES = exports.WRITE_ROLES = void 0;
exports.isRole = isRole;
exports.extendRoles = extendRoles;
const roles_json_1 = __importDefault(require("../roles.json"));
const zod_1 = require("zod");
const config = roles_json_1.default;
const allRolesFromConfig = [
    ...new Set([...config.write, ...config.read]),
];
exports.WRITE_ROLES = [...config.write];
exports.READ_ROLES = [...allRolesFromConfig];
let RoleSchema = zod_1.z.enum(exports.READ_ROLES);
exports.RoleSchema = RoleSchema;
function isRole(role) {
    return RoleSchema.safeParse(role).success;
}
function extendRoles(extension) {
    if (extension.write) {
        for (const role of extension.write) {
            if (!exports.WRITE_ROLES.includes(role)) {
                exports.WRITE_ROLES.push(role);
            }
            if (!exports.READ_ROLES.includes(role)) {
                exports.READ_ROLES.push(role);
            }
        }
    }
    if (extension.read) {
        for (const role of extension.read) {
            if (!exports.READ_ROLES.includes(role)) {
                exports.READ_ROLES.push(role);
            }
        }
    }
    exports.RoleSchema = RoleSchema = zod_1.z.enum(exports.READ_ROLES);
}
