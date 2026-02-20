// src/locales/locale-loader.guides.ts
// ---------------------------------------------------------------------------
// Guides-only locale loader.
//
// Uses dynamic imports so this module stays compatible with both webpack and
// Turbopack without relying on Node-only builtins in client-reachable graphs.
// ---------------------------------------------------------------------------

const unwrapDefault = (mod: unknown): unknown => {
  if (mod && typeof mod === "object" && "default" in mod) {
    return (mod as { default?: unknown }).default ?? mod;
  }
  return mod;
};

export const loadGuidesLocaleResource = async (
  lang: string,
  ns: string,
): Promise<unknown | undefined> => {
  try {
    const mod = await import(`./${lang}/${ns}.json`);
    return unwrapDefault(mod);
  } catch {
    return undefined;
  }
};
