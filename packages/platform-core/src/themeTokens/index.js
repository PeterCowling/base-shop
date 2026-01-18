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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseTokens = void 0;
exports.loadThemeTokensNode = loadThemeTokensNode;
exports.loadThemeTokensBrowser = loadThemeTokensBrowser;
exports.loadThemeTokens = loadThemeTokens;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_vm_1 = require("node:vm");
const typescript_1 = __importDefault(require("typescript"));
const src_1 = require("../../../themes/base/src");
function typedEntries(obj) {
    return Object.entries(obj);
}
exports.baseTokens = Object.fromEntries(typedEntries(src_1.tokens).map(([k, v]) => [k, v.light]));
function transpileTokens(filePath) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 path is constructed from controlled workspace locations
    const source = (0, node_fs_1.readFileSync)(filePath, "utf8");
    const transpiled = typescript_1.default.transpileModule(source, {
        compilerOptions: { module: typescript_1.default.ModuleKind.CommonJS },
    }).outputText;
    const sandbox = {
        module: { exports: {} },
        exports: {},
    };
    sandbox.exports = sandbox.module.exports;
    (0, node_vm_1.runInNewContext)(transpiled, sandbox);
    return sandbox.module.exports.tokens;
}
function loadThemeTokensNode(theme) {
    if (!theme || theme === "base")
        return {};
    const tryRoot = (rootDir) => {
        const baseDir = (0, node_path_1.join)(rootDir, "packages", "themes", theme);
        const candidates = [
            (0, node_path_1.join)(baseDir, "tailwind-tokens.js"),
            (0, node_path_1.join)(baseDir, "tailwind-tokens.ts"),
            (0, node_path_1.join)(baseDir, "src", "tailwind-tokens.ts"),
        ];
        for (const file of candidates) {
            // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 existence check on controlled workspace path
            if ((0, node_fs_1.existsSync)(file)) {
                return transpileTokens(file);
            }
        }
        return undefined;
    };
    // First, look relative to this file's location. This allows callers to load
    // tokens without relying on their current working directory.
    const localRoot = (0, node_path_1.join)(__dirname, "../../../..");
    const localTokens = tryRoot(localRoot);
    if (localTokens)
        return localTokens;
    // Fall back to resolving the workspace root from the process cwd. Jest can
    // virtualize `__dirname`, so this ensures resolution still works.
    let cwd = process.cwd();
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 existence check on controlled workspace path
    while (!(0, node_fs_1.existsSync)((0, node_path_1.join)(cwd, "pnpm-workspace.yaml"))) {
        const parent = (0, node_path_1.join)(cwd, "..");
        if (parent === cwd)
            return {};
        cwd = parent;
    }
    const workspaceTokens = tryRoot(cwd);
    return workspaceTokens ?? {};
}
async function loadThemeTokensBrowser(theme) {
    if (!theme || theme === "base")
        return exports.baseTokens;
    try {
        const mod = await Promise.resolve(`${
        /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$|__tests__\/)/ */
        `@themes/${theme}`}`).then(s => __importStar(require(s)));
        if ("tokens" in mod) {
            return Object.fromEntries(Object.entries(mod.tokens).map(([k, v]) => [k, typeof v === "string" ? v : v.light]));
        }
    }
    catch {
        // Try package-local theme fixtures used in some tests
        try {
            const mod = await Promise.resolve(`${
            /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$|__tests__\/)/ */
            `@themes-local/${theme}`}`).then(s => __importStar(require(s)));
            if ("tokens" in mod) {
                return Object.fromEntries(Object.entries(mod.tokens).map(([k, v]) => [k, typeof v === "string" ? v : v.light]));
            }
        }
        catch {
            /* fall through to tailwind-tokens */
        }
    }
    try {
        const mod = await Promise.resolve(`${
        /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$)/ */
        `@themes/${theme}/tailwind-tokens`}`).then(s => __importStar(require(s)));
        return mod.tokens;
    }
    catch {
        try {
            const mod = await Promise.resolve(`${
            /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$)/ */
            `@themes-local/${theme}/tailwind-tokens`}`).then(s => __importStar(require(s)));
            return mod.tokens;
        }
        catch {
            return exports.baseTokens;
        }
    }
}
async function loadThemeTokens(theme) {
    const hasWindow = typeof globalThis !== "undefined" &&
        typeof globalThis.window !== "undefined";
    if (!hasWindow) {
        return loadThemeTokensNode(theme);
    }
    return loadThemeTokensBrowser(theme);
}
