import { ensureStringArray } from "@/utils/i18nContent";

import type { FaqEntry } from "./types";

type RawFaqRecord = Record<string, unknown>;

export function buildFaqEntriesForJsonLd(records: RawFaqRecord[]): FaqEntry[] {
  return records
    .map((entry) => {
      const question = typeof entry?.["q"] === "string" ? entry["q"] : undefined;
      const answer = ensureStringArray(entry?.["a"]);
      if (!question || answer.length === 0) {
        return null;
      }
      return { q: question, a: answer } satisfies FaqEntry;
    })
    .filter((entry): entry is FaqEntry => entry !== null);
}
