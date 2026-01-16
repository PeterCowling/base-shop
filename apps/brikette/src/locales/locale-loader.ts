// src/locales/locale-loader.ts
// ---------------------------------------------------------------------------
// Runtime-safe locale loader that works in Next (webpack) and Node contexts.
// ---------------------------------------------------------------------------

import { getWebpackContext as getWebpackContextFromMeta } from "../utils/webpackGlob";

type WebpackContext = {
  keys(): string[];
  <T = unknown>(id: string): T;
};

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
    const context = getWebpackContextFn();
    if (context) {
      cachedContext = context;
    } else {
      cachedContext = null;
    }
  } catch {
    cachedContext = null;
  }
  return cachedContext;
};

const getWebpackContextFn = (): WebpackContext | undefined =>
  getWebpackContextFromMeta("./", true, /\.json$/) as WebpackContext | undefined;

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
