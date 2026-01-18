"use strict";
// packages/auth/src/types/permissions.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionSchema = exports.PERMISSIONS = void 0;
exports.isPermission = isPermission;
const permissions_json_1 = __importDefault(require("../permissions.json"));
const zod_1 = require("zod");
const config = permissions_json_1.default;
const allPermissionsFromConfig = [
    ...new Set(Object.values(config).flat()),
];
exports.PERMISSIONS = [...allPermissionsFromConfig];
const PermissionSchema = zod_1.z.enum(allPermissionsFromConfig);
exports.PermissionSchema = PermissionSchema;
function isPermission(permission) {
    return PermissionSchema.safeParse(permission).success;
}
