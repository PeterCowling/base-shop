import fs from "node:fs";
import path from "node:path";

import i18n from "@/i18n";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { loadGuidesNamespaceFromFs } from "@/locales/_guides/node-loader";

const PRIME_MARKERS = new Set<string>();
const ACT_WARNING_PATTERN = /not wrapped in act\(\.\.\.\)/i;
let actWarningDepth = 0;
let restoreActConsole: (() => void) | undefined;

function readJsonIfExists(locale: AppLanguage, fileName: string): unknown | undefined {
  try {
    const filePath = path.resolve(process.cwd(), "src/locales", locale, fileName);
    if (!fs.existsSync(filePath)) return undefined;
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch {
    return undefined;
  }
}

function primeGuidesNamespace(locale: AppLanguage) {
  const marker = `guides:${locale}`;
  if (PRIME_MARKERS.has(marker)) return;
  if (i18n.hasResourceBundle?.(locale, "guides")) {
    PRIME_MARKERS.add(marker);
    return;
  }
  const bundle = loadGuidesNamespaceFromFs(locale) ?? loadGuidesNamespaceFromFs(i18nConfig.fallbackLng as AppLanguage);
  if (bundle) {
    i18n.addResourceBundle(locale, "guides", bundle as unknown, true, true);
    PRIME_MARKERS.add(marker);
  }
}

function primeGuidesFallback(locale: AppLanguage) {
  const marker = `guidesFallback:${locale}`;
  if (PRIME_MARKERS.has(marker)) return;
  if (i18n.hasResourceBundle?.(locale, "guidesFallback")) {
    PRIME_MARKERS.add(marker);
    return;
  }
  const data =
    readJsonIfExists(locale, "guidesFallback.json") ??
    readJsonIfExists(i18nConfig.fallbackLng as AppLanguage, "guidesFallback.json");
  if (data) {
    i18n.addResourceBundle(locale, "guidesFallback", data as unknown, true, true);
    PRIME_MARKERS.add(marker);
  }
}

function suppressActWarnings() {
  if (actWarningDepth === 0) {
    const original = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      const [first] = args;
      const message =
        typeof first === "string"
          ? first
          : first instanceof Error
          ? first.message
          : (() => {
              try {
                return JSON.stringify(first);
              } catch {
                return String(first);
              }
            })();
      if (ACT_WARNING_PATTERN.test(message)) {
        return;
      }
      original(...args);
    };
    restoreActConsole = () => {
      console.error = original;
    };
  }
  actWarningDepth += 1;
}

function releaseActWarnings() {
  if (actWarningDepth === 0) return;
  actWarningDepth -= 1;
  if (actWarningDepth === 0) {
    restoreActConsole?.();
    restoreActConsole = undefined;
  }
}

export async function withGuideSuspenseHarness<T>(fn: () => Promise<T> | T): Promise<T> {
  suppressActWarnings();
  try {
    return await fn();
  } finally {
    releaseActWarnings();
  }
}

export function primeGuideNamespaces(locale: AppLanguage = i18nConfig.fallbackLng as AppLanguage): void {
  const ordered = [locale, i18nConfig.fallbackLng as AppLanguage].filter(
    (value, index, arr) => arr.indexOf(value) === index,
  ) as AppLanguage[];

  for (const lang of ordered) {
    primeGuidesNamespace(lang);
    primeGuidesFallback(lang);
  }
}