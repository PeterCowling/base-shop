"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = requirePermission;
// packages/auth/src/requirePermission.ts
const session_1 = require("./session");
const permissions_1 = require("./permissions");
async function requirePermission(perm) {
    const session = await (0, session_1.getCustomerSession)();
    if (!session || !(0, permissions_1.hasPermission)(session.role, perm)) {
        throw new Error("Unauthorized");
    }
    return session;
}
