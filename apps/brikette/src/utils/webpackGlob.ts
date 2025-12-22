// src/utils/webpackGlob.ts
// Lightweight webpack glob helpers to replace Vite's import.meta.glob.

type RequireContext = {
  keys: () => string[];
  (id: string): unknown;
};

export type WebpackRequire = NodeRequire & {
  context?: (path: string, recursive: boolean, pattern: RegExp) => RequireContext;
};

declare const __webpack_require__: WebpackRequire | undefined;

const hasWebpackRequire =
  typeof __webpack_require__ === "function" ||
  (typeof globalThis !== "undefined" &&
    typeof (globalThis as { __webpack_require__?: unknown }).__webpack_require__ === "function");

export const supportsWebpackGlob = hasWebpackRequire;

type GlobOptions = {
  prefix?: string;
};

const normalizeKey = (rawKey: string, prefix?: string): string => {
  if (!prefix) return rawKey;
  const trimmedPrefix = prefix.replace(/\/$/, "");
  const normalizedKey = rawKey.replace(/^\.\//, "");
  return `${trimmedPrefix}/${normalizedKey}`;
};

export const webpackContextToRecord = <Module = unknown>(
  ctx: RequireContext | undefined,
  options: GlobOptions = {}
): Record<string, Module> => {
  if (!ctx) return {};

  const modules: Record<string, Module> = {};
  for (const key of ctx.keys()) {
    modules[normalizeKey(key, options.prefix)] = ctx(key) as Module;
  }
  return modules;
};
