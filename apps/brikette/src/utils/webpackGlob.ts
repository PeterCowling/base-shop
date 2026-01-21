// src/utils/webpackGlob.ts
// Lightweight webpack glob helpers to replace Vite's import.meta.glob.

type RequireContext = {
  keys: () => string[];
  (id: string): unknown;
};

type WebpackContextFactory = (
  path: string,
  options: { recursive?: boolean; regExp?: RegExp }
) => RequireContext;

const { webpackContext } = import.meta as { webpackContext?: WebpackContextFactory };

export const supportsWebpackGlob = typeof webpackContext === "function";

export const getWebpackContext = (
  path: string,
  recursive: boolean,
  pattern: RegExp
): RequireContext | undefined => {
  if (typeof webpackContext !== "function") return undefined;
  return webpackContext(path, { recursive, regExp: pattern });
};

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
