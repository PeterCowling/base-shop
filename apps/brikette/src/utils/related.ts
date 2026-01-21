// src/utils/related.ts
// Utilities to compute related guide keys based on tag/context

import type { GuideSection } from "@/data/guides.index";
import { GUIDES_INDEX } from "@/data/guides.index";
import type { GuideKey } from "@/routes.guides-helpers";

export function relatedGuidesByTags(
  tags: string[],
  opts: { exclude?: GuideKey | GuideKey[]; limit?: number; section?: GuideSection } = {}
): GuideKey[] {
  const tagSet = new Set((tags || []).map((t) => t.toLowerCase()));
  if (tagSet.size === 0) return [];

  const excludeSet = new Set<GuideKey>(
    ([] as GuideKey[]).concat(opts.exclude ? (Array.isArray(opts.exclude) ? opts.exclude : [opts.exclude]) : [])
  );

  type Scored = { key: GuideKey; score: number };
  const scored: Scored[] = [];
  for (const { key, tags: gtags, section } of GUIDES_INDEX) {
    if (opts.section && section !== opts.section) continue;
    if (excludeSet.has(key as GuideKey)) continue;
    const score = (gtags || []).reduce((acc, t) => (tagSet.has(t.toLowerCase()) ? acc + 1 : acc), 0);
    if (score > 0) scored.push({ key: key as GuideKey, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const limit = typeof opts.limit === "number" ? opts.limit : 3;
  return scored.slice(0, limit).map((s) => s.key);
}

