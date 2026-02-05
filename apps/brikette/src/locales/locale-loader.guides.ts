// src/locales/locale-loader.guides.ts
// ---------------------------------------------------------------------------
// Guides-only locale loader.
//
// This module intentionally owns the recursive guides context (guides/**),
// and must not be imported by the always-on AppLayout path. Only import it
// inside guides routes / guides namespace backends.
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
    cachedContext = context ?? null;
  } catch {
    cachedContext = null;
  }
  return cachedContext;
};

const getWebpackContextFn = (): WebpackContext | undefined =>
  getWebpackContextFromMeta("./", true, /^\.\/[a-z]{2}\/guides(?:\/.*)?\.json$/) as
    | WebpackContext
    | undefined;

export const loadGuidesLocaleResource = async (
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
      /* webpackInclude: /(^|\/)[a-z]{2}\/guides(?:\/.*)?\.json$/ */
      `./${lang}/${ns}.json`
    );
    return unwrapDefault(mod);
  } catch {
    return undefined;
  }
};
