"use strict";
// packages/auth/src/permissions.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = void 0;
exports.hasPermission = hasPermission;
const permissions_json_1 = __importDefault(require("./permissions.json"));
// Role to permission mapping loaded from configuration.
// Includes granular permissions such as view_orders and manage_sessions.
const ROLE_PERMISSIONS = permissions_json_1.default;
exports.ROLE_PERMISSIONS = ROLE_PERMISSIONS;
function hasPermission(role, perm) {
    return ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
}
