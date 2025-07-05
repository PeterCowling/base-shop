// packages/platform-core/createShop/utils/loadThemeTokens.ts
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import ts from "typescript";
import { runInNewContext } from "vm";

/**
 * Load Tailwind token mappings for the given theme.
 * Returns an empty object when the theme does not provide tokens.
 */
export function loadThemeTokens(theme: string): Record<string, string> {
  if (theme === "base") return {};
  const modPath = join("packages", "themes", theme, "tailwind-tokens.ts");
  if (!existsSync(modPath)) return {};
  const source = readFileSync(modPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const sandbox: {
    module: { exports: Record<string, unknown> };
    exports: Record<string, unknown>;
    require: (id: string) => unknown;
  } = {
    module: { exports: {} },
    exports: {},
    require,
  };
  sandbox.exports = sandbox.module.exports;
  runInNewContext(transpiled, sandbox);
  return sandbox.module.exports.tokens as Record<string, string>;
}
