// src/locales/locale-loader.ts
// ---------------------------------------------------------------------------
// Runtime-safe locale loader that works in Next (webpack) and Node contexts.
// ---------------------------------------------------------------------------

type WebpackContext = {
  keys(): string[];
  <T = unknown>(id: string): T;
};

type WebpackRequire = NodeRequire & {
  context?: (path: string, recursive?: boolean, filter?: RegExp) => WebpackContext;
};

// `require` is only available in webpack or CJS runtimes.
declare const require: WebpackRequire | undefined;

const unwrapDefault = (mod: unknown): unknown => {
  if (mod && typeof mod === "object" && "default" in mod) {
    return (mod as { default?: unknown }).default ?? mod;
  }
  return mod;
};

let cachedContext: WebpackContext | null | undefined;

const getWebpackContext = (): WebpackContext | null => {
  if (cachedContext !== undefined) return cachedContext;
  try {
    if (typeof require === "function" && typeof require.context === "function") {
      cachedContext = require.context("./", true, /\.json$/);
    } else {
      cachedContext = null;
    }
  } catch {
    cachedContext = null;
  }
  return cachedContext;
};

export const loadLocaleResource = async (
  lang: string,
  ns: string,
): Promise<unknown | undefined> => {
  const key = `./${lang}/${ns}.json`;
  const context = getWebpackContext();

  if (context) {
    try {
      return unwrapDefault(context(key));
    } catch {
      // Fall through to dynamic import below.
    }
  }

  try {
    const mod = await import(
      /* webpackInclude: /\.json$/ */
      `./${lang}/${ns}.json`
    );
    return unwrapDefault(mod);
  } catch {
    return undefined;
  }
};
