import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { runInNewContext } from "node:vm";

import { baseTokens, type TokenMap } from "./base";

// Prevent webpack from statically following the `typescript` import.
// A plain `import ts from "typescript"` causes webpack to read the TypeScript
// compiler's entire 22 MB `lib/` during module-graph resolution, OOMing the
// Next 16 --webpack CMS build. Using a variable `_req` (cf. emailService.ts)
// breaks webpack's static tracing without affecting runtime behaviour.
// ESM-interop: handle jest mock ({__esModule, default}) and real CJS module.
// (TASK-12 spike fix)
const _req: NodeRequire =
  typeof require === "function" ? require : createRequire(process.cwd() + "/");
const _tsRaw = _req("typescript") as
  | { __esModule: true; default: typeof import("typescript") }
  | typeof import("typescript");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ts: typeof import("typescript") = (_tsRaw as any).__esModule
  ? (_tsRaw as { __esModule: true; default: typeof import("typescript") }).default
  : (_tsRaw as typeof import("typescript"));

function transpileTokens(filePath: string): TokenMap {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 path is constructed from controlled workspace locations
  const source = readFileSync(filePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const sandbox: {
    module: { exports: Record<string, unknown> };
    exports: Record<string, unknown>;
  } = {
    module: { exports: {} },
    exports: {},
  };
  sandbox.exports = sandbox.module.exports;
  runInNewContext(transpiled, sandbox);
  return sandbox.module.exports.tokens as TokenMap;
}

export function loadThemeTokensNode(theme: string): TokenMap {
  if (!theme || theme === "base") return {};
  const tryRoot = (rootDir: string): TokenMap | undefined => {
    const baseDir = join(rootDir, "packages", "themes", theme);
    const candidates = [
      join(baseDir, "tailwind-tokens.js"),
      join(baseDir, "tailwind-tokens.ts"),
      join(baseDir, "src", "tailwind-tokens.ts"),
    ];
    for (const file of candidates) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 existence check on controlled workspace path
      if (existsSync(file)) {
        return transpileTokens(file);
      }
    }
    return undefined;
  };

  // First, look relative to this file location. This allows callers to load
  // tokens without relying on their current working directory.
  const localRoot = join(__dirname, "../../../..");
  const localTokens = tryRoot(localRoot);
  if (localTokens) return localTokens;

  // Fall back to a bounded set of candidate roots derived from cwd/env. This
  // avoids unbounded parent traversal that can over-expand bundler file
  // patterns in compile-time analysis.
  const cwd = process.cwd();
  const workspaceRootCandidates = [
    process.env.PNPM_WORKSPACE_ROOT,
    process.env.INIT_CWD,
    process.env.PROJECT_CWD,
    cwd,
  ];

  for (const candidate of workspaceRootCandidates) {
    if (!candidate) continue;
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 existence check on bounded, internal candidate roots
    if (!existsSync(join(candidate, "pnpm-workspace.yaml"))) continue;
    const tokens = tryRoot(candidate);
    if (tokens) return tokens;
  }

  return {};
}

export async function loadThemeTokens(theme: string): Promise<TokenMap> {
  return loadThemeTokensNode(theme);
}

export { baseTokens };
export type { TokenMap };
