// src/utils/guideContentFallbackRegistry.ts
import type { AppLanguage } from "@/i18n.config";

const registry = new Map<AppLanguage | string, Set<string>>();

const normaliseLang = (lang: string | AppLanguage | undefined): AppLanguage | string => {
  if (typeof lang !== "string") return "";
  return lang.toLowerCase();
};

export function markGuideContentFallback(lang: string | AppLanguage | undefined, key: string): void {
  const normalisedLang = normaliseLang(lang);
  if (!normalisedLang || typeof key !== "string" || key.trim().length === 0) {
    return;
  }
  const trimmedKey = key.trim();
  const existing = registry.get(normalisedLang) ?? new Set<string>();
  existing.add(trimmedKey);
  registry.set(normalisedLang, existing);
}

export function clearGuideContentFallback(lang: string | AppLanguage | undefined, key: string): void {
  const normalisedLang = normaliseLang(lang);
  if (!normalisedLang || typeof key !== "string" || key.trim().length === 0) {
    return;
  }
  const trimmedKey = key.trim();
  const existing = registry.get(normalisedLang);
  if (!existing) return;
  existing.delete(trimmedKey);
  if (existing.size === 0) {
    registry.delete(normalisedLang);
  }
}

export function isGuideContentFallback(lang: string | AppLanguage | undefined, key: string): boolean {
  const normalisedLang = normaliseLang(lang);
  if (!normalisedLang || typeof key !== "string" || key.trim().length === 0) {
    return false;
  }
  const trimmedKey = key.trim();
  return registry.get(normalisedLang)?.has(trimmedKey) ?? false;
}

export function resetGuideContentFallbacks(): void {
  registry.clear();
}
