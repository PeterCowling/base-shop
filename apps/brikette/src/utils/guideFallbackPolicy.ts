// src/utils/guideFallbackPolicy.ts
const ENGLISH_FALLBACK_BLOCKLIST: ReadonlySet<string> = new Set(["ru"]);

export function allowEnglishGuideFallback(lang: string): boolean {
  if (typeof lang !== "string") return true;
  const normalized = lang.trim().toLowerCase();
  if (!normalized) return true;
  return !ENGLISH_FALLBACK_BLOCKLIST.has(normalized);
}
