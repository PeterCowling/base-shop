import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { createRequire } from "module";
import ts from "typescript";
import { tokens as baseTokensSrc, } from "@themes/base";
function typedEntries(obj) {
    return Object.entries(obj);
}
export const baseTokens = Object.fromEntries(typedEntries(baseTokensSrc).map(([k, v]) => [k, v.light]));
function transpileTokens(filePath, requireFn) {
    const source = readFileSync(filePath, "utf8");
    const transpiled = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    const sandbox = {
        module: { exports: {} },
        exports: {},
        require: requireFn,
    };
    sandbox.exports = sandbox.module.exports;
    runInNewContext(transpiled, sandbox);
    return sandbox.module.exports.tokens;
}
export function loadThemeTokensNode(theme) {
    if (!theme || theme === "base")
        return {};
    // obtain a `require` function in both CJS and ESM environments
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const requireFn = typeof require !== "undefined" ? require : createRequire(import.meta.url);
    try {
        // attempt to load compiled module
        const mod = requireFn(
        /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$)/ */
        `@themes/${theme}/tailwind-tokens`);
        return mod.tokens;
    }
    catch {
        const modPath = join("packages", "themes", theme, "tailwind-tokens.ts");
        const srcPath = join("packages", "themes", theme, "src", "tailwind-tokens.ts");
        if (existsSync(modPath))
            return transpileTokens(modPath, requireFn);
        if (existsSync(srcPath))
            return transpileTokens(srcPath, requireFn);
        return {};
    }
}
export async function loadThemeTokensBrowser(theme) {
    if (!theme || theme === "base")
        return baseTokens;
    try {
        const mod = await import(
        /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$)/ */
        `@themes/${theme}`);
        if ("tokens" in mod) {
            return Object.fromEntries(typedEntries(mod.tokens).map(([k, v]) => [k, v.light]));
        }
    }
    catch {
        /* fall through to tailwind-tokens */
    }
    try {
        const mod = await import(
        /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$)/ */
        `@themes/${theme}/tailwind-tokens`);
        return mod.tokens;
    }
    catch {
        return baseTokens;
    }
}
export async function loadThemeTokens(theme) {
    if (typeof window === "undefined") {
        return loadThemeTokensNode(theme);
    }
    return loadThemeTokensBrowser(theme);
}
