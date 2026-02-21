// src/locales/locale-loader.ts
// ---------------------------------------------------------------------------
// Runtime-safe locale loader that works in Next (Turbopack) and Node contexts.
// ---------------------------------------------------------------------------

const unwrapDefault = (mod: unknown): unknown => {
  if (mod && typeof mod === "object" && "default" in mod) {
    return (mod as { default?: unknown }).default ?? mod;
  }
  return mod;
};

export const loadLocaleResource = async (
  lang: string,
  ns: string,
): Promise<unknown | undefined> => {
  // Core loader is intentionally top-level only.
  // Nested JSON (guides/**, how-to-get-here/routes/**, etc.) must use
  // route-specific loaders so it doesn't end up in the global layout chunk.
  if (ns.includes("/")) {
    return undefined;
  }

  try {
    const mod = await import(`./${lang}/${ns}.json`);
    return unwrapDefault(mod);
  } catch {
    return undefined;
  }
};
