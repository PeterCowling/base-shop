// file path: src/i18n.server.ts
// Server-only i18n backend helpers
//
// NOTE: This file is imported by Next.js when server components try to use
// @/i18n due to the Next.js TypeScript plugin's module resolution. We must
// export a default that matches what i18n.ts exports.

import "server-only";
import i18n from "i18next";

// Re-export the i18next instance as default for compatibility with imports
// that expect @/i18n to provide the main i18n singleton
export default i18n;

export async function loadGuidesFromFs(lng: string) {
  try {
    const { loadGuidesNamespaceFromFs } = await import("@/locales/_guides/node-loader");
    return loadGuidesNamespaceFromFs(lng);
  } catch {
    return null;
  }
}

export async function loadHowToGetHereFromFs(lng: string) {
  try {
    const { loadHowToGetHereLocaleFromFs } = await import("@/locales/_how-to-get-here/node-loader");
    return loadHowToGetHereLocaleFromFs(lng);
  } catch {
    return null;
  }
}
