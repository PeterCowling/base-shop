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
exports.DATA_ROOT = void 0;
exports.resolveDataRoot = resolveDataRoot;
const fsSync = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const PRIVATE_PREFIX = "/private";
function stripPrivatePrefix(p) {
    // macOS may resolve temporary directories under "/private" even when
    // callers provide paths starting with "/var". Normalise such paths so
    // tests comparing against the original "/var" location succeed.
    return p.startsWith(`${PRIVATE_PREFIX}/`) ? p.slice(PRIVATE_PREFIX.length) : p;
}
/**
 * Walk upward from the current working directory to locate the monorepo-level
 * `data/shops` folder. Falls back to `<cwd>/data/shops` if the search reaches
 * the filesystem root without a hit. The `DATA_ROOT` environment variable may
 * be used to override the lookup path.
 */
function resolveDataRoot() {
    const env = process.env.DATA_ROOT;
    if (env) {
        return stripPrivatePrefix(path.resolve(env));
    }
    let dir = process.cwd();
    let found;
    while (true) {
        const candidate = path.join(dir, "data", "shops");
        // Some tests mock `node:fs` and may omit `existsSync`. Guard the call
        // so we don't attempt to invoke `undefined`.
        if (fsSync.existsSync?.(candidate)) {
            found = candidate;
        }
        const parent = path.dirname(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    const resolved = found ?? path.resolve(process.cwd(), "data", "shops");
    return stripPrivatePrefix(resolved);
}
exports.DATA_ROOT = resolveDataRoot();
