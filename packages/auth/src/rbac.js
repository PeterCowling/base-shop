"use strict";
// packages/auth/src/rbac.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.WRITE_ROLES = exports.READ_ROLES = void 0;
exports.canWrite = canWrite;
exports.canRead = canRead;
const roles_1 = require("./types/roles");
Object.defineProperty(exports, "READ_ROLES", { enumerable: true, get: function () { return roles_1.READ_ROLES; } });
Object.defineProperty(exports, "WRITE_ROLES", { enumerable: true, get: function () { return roles_1.WRITE_ROLES; } });
function canWrite(role) {
    return (0, roles_1.isRole)(role) ? roles_1.WRITE_ROLES.includes(role) : false;
}
function canRead(role) {
    return (0, roles_1.isRole)(role) ? roles_1.READ_ROLES.includes(role) : false;
}
