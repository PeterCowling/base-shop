"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonPricingRepository = void 0;
/* eslint-disable security/detect-non-literal-fs-filename -- ABC-123: Paths are derived from controlled DATA_ROOT + validated inputs */
require("server-only");
const types_1 = require("@acme/types");
const node_fs_1 = require("node:fs");
const path = __importStar(require("path"));
const dataRoot_1 = require("../dataRoot");
function pricingPath() {
    return path.join((0, dataRoot_1.resolveDataRoot)(), "..", "rental", "pricing.json");
}
async function read() {
    const buf = await node_fs_1.promises.readFile(pricingPath(), "utf8");
    const parsed = types_1.pricingSchema.safeParse(JSON.parse(buf));
    if (!parsed.success) {
        throw new Error("Invalid pricing data"); // i18n-exempt -- ABC-123: Server-side internal error, not user-facing
    }
    return parsed.data;
}
async function write(data) {
    const parsed = types_1.pricingSchema.safeParse(data);
    if (!parsed.success) {
        throw new Error("Invalid pricing data"); // i18n-exempt -- ABC-123: Server-side internal error, not user-facing
    }
    const file = pricingPath();
    const tmp = `${file}.${Date.now()}.tmp`;
    await node_fs_1.promises.mkdir(path.dirname(file), { recursive: true });
    await node_fs_1.promises.writeFile(tmp, JSON.stringify(parsed.data, null, 2), "utf8");
    await node_fs_1.promises.rename(tmp, file);
}
exports.jsonPricingRepository = {
    read,
    write,
};
