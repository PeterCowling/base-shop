// src/utils/seo/jsonld/normalize.ts
// Shared normalizers for JSON-LD builders

import { ensureArray } from "@/utils/i18nContent";
import { normalizeFaqEntries, type NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";

/**
 * Returns a trimmed string when meaningful, otherwise an empty string.
 * When a `rawKeyHint` is provided, the value equal to that key is treated as empty.
 */
export function normalizeString(value: unknown, rawKeyHint?: string): string {
  if (typeof value !== "string") return "";
  const v = value.trim();
  if (!v) return "";
  if (rawKeyHint && v === rawKeyHint) return "";
  return v;
}

/** True when a string is non-empty and not equal to the provided raw key hint. */
export function isMeaningfulString(value: unknown, rawKeyHint?: string): value is string {
  return normalizeString(value, rawKeyHint).length > 0;
}

/**
 * Normalise HowTo steps from arbitrary input into HowToStep entries.
 * Filters out steps without a valid name and trims text.
 */
export function normalizeHowToSteps(raw: unknown): Array<{
  "@type": "HowToStep";
  position: number;
  name: string;
  text?: string;
}> {
  const asArray = ensureArray<{ name?: unknown; text?: unknown }>(raw);
  const entries = asArray
    .map((step, idx) => {
      const name = normalizeString(step?.name);
      if (!name) return null;
      const text = normalizeString(step?.text);
      return {
        "@type": "HowToStep" as const,
        position: idx + 1,
        name,
        ...(text ? { text } : {}),
      };
    })
    .filter((e): e is { "@type": "HowToStep"; position: number; name: string; text?: string } => e != null);

  return entries;
}

/**
 * Deduplicate and normalise a list of FAQ entries coming from mixed sources.
 * Accepts entries with `q`/`question` and `a`/`answer` shapes, applies shared
 * normalisation and removes duplicates by question string.
 */
export function unifyNormalizedFaqEntries(raw: unknown): NormalizedFaqEntry[] {
  const normalized = normalizeFaqEntries(raw);
  const seen = new Set<string>();
  const result: NormalizedFaqEntry[] = [];
  for (const entry of normalized) {
    if (seen.has(entry.question)) continue;
    seen.add(entry.question);
    result.push(entry);
  }
  return result;
}
