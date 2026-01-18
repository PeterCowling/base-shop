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
exports.shopPath = shopPath;
exports.readFromShop = readFromShop;
exports.writeToShop = writeToShop;
exports.appendToShop = appendToShop;
exports.renameInShop = renameInShop;
exports.ensureShopDir = ensureShopDir;
exports.listShopsInDataRoot = listShopsInDataRoot;
const fs_1 = require("fs");
const path = __importStar(require("node:path"));
const dataRoot_1 = require("../dataRoot");
const index_1 = require("../shops/index");
function resolvedBase(base) {
    return path.resolve(base);
}
function ensureInside(base, target) {
    const baseResolved = resolvedBase(base) + path.sep;
    const targetResolved = path.resolve(target);
    if (!(targetResolved + path.sep).startsWith(baseResolved)) {
        throw new Error("Resolved path escapes base directory"); // i18n-exempt -- CORE-1010 internal error message
    }
    return targetResolved;
}
function shopPath(shop, ...segments) {
    const safeShop = (0, index_1.validateShopName)(shop);
    const candidate = path.resolve(dataRoot_1.DATA_ROOT, safeShop, ...segments);
    return ensureInside(dataRoot_1.DATA_ROOT, candidate);
}
async function readFromShop(shop, file, encoding = "utf8") {
    const p = shopPath(shop, file);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 path validated and normalized via shopPath()
    return fs_1.promises.readFile(p, encoding);
}
async function writeToShop(shop, file, data, encoding = "utf8") {
    const p = shopPath(shop, file);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 path validated and normalized via shopPath()
    await fs_1.promises.writeFile(p, data, encoding);
}
async function appendToShop(shop, file, data, encoding = "utf8") {
    const p = shopPath(shop, file);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 path validated and normalized via shopPath()
    await fs_1.promises.appendFile(p, data, encoding);
}
async function renameInShop(shop, from, to) {
    const src = shopPath(shop, from);
    const dst = shopPath(shop, to);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 path validated and normalized via shopPath()
    await fs_1.promises.rename(src, dst);
}
async function ensureShopDir(shop) {
    const dir = shopPath(shop);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 path validated and normalized via shopPath()
    await fs_1.promises.mkdir(dir, { recursive: true });
}
async function listShopsInDataRoot() {
    const base = resolvedBase(dataRoot_1.DATA_ROOT);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 directory is internal constant DATA_ROOT
    const entries = await fs_1.promises.readdir(base, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
}
