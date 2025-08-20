import { readFileSync } from "fs";
import { join } from "path";
import ts from "typescript";
import { runInNewContext } from "vm";
import { loadThemeTokensNode } from "../themeTokens";
/**
 * Load the base Tailwind token mappings.
 *
 * The base theme defines tokens with optional dark variants. For the
 * create-shop script we only need the light values, so this reads the
 * TypeScript module and returns a plain mapping of token names to their
 * default (light) value.
 */
export function loadBaseTokens() {
    const modPath = join("packages", "themes", "base", "tokens.ts");
    const source = readFileSync(modPath, "utf8");
    const transpiled = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    const sandbox = {
        module: { exports: {} },
        exports: {},
        require,
    };
    sandbox.exports = sandbox.module.exports;
    runInNewContext(transpiled, sandbox);
    const tokenMap = sandbox.module.exports.tokens;
    return Object.fromEntries(Object.entries(tokenMap).map(([k, v]) => [k, v.light]));
}
/** Load theme tokens combined with base tokens. */
export function loadTokens(theme) {
    return Object.assign(Object.assign({}, loadBaseTokens()), loadThemeTokensNode(theme));
}
