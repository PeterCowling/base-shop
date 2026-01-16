import getGuideResource from "@/routes/guides/utils/getGuideResource";

import type { BlockAccumulator } from "../blockAccumulator";
import type { FaqBlockOptions } from "../types";
import { normaliseString } from "../utils";

function normaliseFaqEntries(value: unknown): Array<{ q: string; a: string[] }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const q = normaliseString((entry as Record<string, unknown>).q ?? (entry as Record<string, unknown>).question);
      const answers = (entry as Record<string, unknown>).a ?? (entry as Record<string, unknown>).answer;
      const a = Array.isArray(answers)
        ? (answers as unknown[])
            .map((line) => normaliseString(line))
            .filter((line): line is string => typeof line === "string" && line.length > 0)
        : typeof answers === "string"
        ? [answers.trim()]
        : [];
      if (!q || a.length === 0) return null;
      return { q, a };
    })
    .filter((item): item is { q: string; a: string[] } => Boolean(item));
}

export function applyFaqBlock(acc: BlockAccumulator, options?: FaqBlockOptions): void {
  const fallbackKey = options?.fallbackKey ?? acc.manifest.contentKey;
  const fallback = (lang: string) => {
    const raw = getGuideResource<unknown>(lang, `content.${fallbackKey}.faqs`, { includeFallback: true });
    return normaliseFaqEntries(raw);
  };

  acc.mergeTemplate({
    guideFaqFallback: fallback,
    alwaysProvideFaqFallback: Boolean(options?.alwaysProvideFallback),
    preferManualWhenUnlocalized: options?.preferManualWhenUnlocalized,
    suppressFaqWhenUnlocalized: options?.suppressWhenUnlocalized,
  });
}
