// packages/platform-core/createShop/utils/loadBaseTokens.ts
import { readFileSync } from "fs";
import { join } from "path";
import ts from "typescript";
import { runInNewContext } from "vm";

/**
 * Load the base Tailwind token mappings.
 *
 * The base theme defines tokens with optional dark variants. For the
 * create-shop script we only need the light values, so this reads the
 * TypeScript module and returns a plain mapping of token names to their
 * default (light) value.
 */
export function loadBaseTokens(): Record<string, string> {
  const modPath = join("packages", "themes", "base", "tokens.ts");
  const source = readFileSync(modPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const sandbox: {
    module: { exports: Record<string, unknown> };
    exports: Record<string, unknown>;
    require: NodeRequire;
  } = {
    module: { exports: {} },
    exports: {},
    require,
  };
  sandbox.exports = sandbox.module.exports;
  runInNewContext(transpiled, sandbox);
  const tokenMap = sandbox.module.exports.tokens as Record<
    string,
    { light: string }
  >;
  return Object.fromEntries(
    Object.entries(tokenMap).map(([k, v]) => [k, v.light])
  );
}
