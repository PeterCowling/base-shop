// src/locales/locale-loader.guides.ts
// ---------------------------------------------------------------------------
// Guides-only locale loader.
//
// Uses filesystem access (fs.readFileSync) instead of webpack context to
// prevent bundling 20+ MiB of guide JSON into the server handler. Guide
// pages are pre-rendered at build time (SSG), so the JSON is loaded during
// build and embedded in the HTML output. The runtime Worker only serves the
// pre-rendered HTML.
// ---------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";

const LOCALES_DIR = path.resolve(process.cwd(), "src/locales");

export const loadGuidesLocaleResource = async (
  lang: string,
  ns: string,
): Promise<unknown | undefined> => {
  try {
    const filePath = path.join(LOCALES_DIR, lang, `${ns}.json`);
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return undefined;
  }
};
