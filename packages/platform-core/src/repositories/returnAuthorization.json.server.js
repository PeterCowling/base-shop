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
exports.jsonReturnAuthorizationRepository = void 0;
/* eslint-disable security/detect-non-literal-fs-filename -- ABC-123: Paths derive from controlled DATA_ROOT */
require("server-only");
const types_1 = require("@acme/types");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const dataRoot_1 = require("../dataRoot");
const zod_1 = require("zod");
function raPath() {
    return path.join((0, dataRoot_1.resolveDataRoot)(), "..", "return-authorizations.json");
}
const raListSchema = zod_1.z.array(types_1.returnAuthorizationSchema);
async function readReturnAuthorizations() {
    try {
        const buf = await fs_1.promises.readFile(raPath(), "utf8");
        const parsed = raListSchema.safeParse(JSON.parse(buf));
        if (parsed.success)
            return parsed.data;
    }
    catch (err) {
        if (err.code !== "ENOENT")
            throw err;
    }
    return [];
}
async function writeReturnAuthorizations(data) {
    const file = raPath();
    const tmp = `${file}.${Date.now()}.tmp`;
    await fs_1.promises.mkdir(path.dirname(file), { recursive: true });
    await fs_1.promises.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await fs_1.promises.rename(tmp, file);
}
async function addReturnAuthorization(ra) {
    const list = await readReturnAuthorizations();
    list.push(ra);
    await writeReturnAuthorizations(list);
}
async function getReturnAuthorization(raId) {
    const list = await readReturnAuthorizations();
    return list.find((r) => r.raId === raId);
}
exports.jsonReturnAuthorizationRepository = {
    readReturnAuthorizations,
    writeReturnAuthorizations,
    addReturnAuthorization,
    getReturnAuthorization,
};
