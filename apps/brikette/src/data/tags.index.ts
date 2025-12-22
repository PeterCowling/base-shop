// src/data/tags.index.ts
import { GUIDES_INDEX } from "@/data/guides.index";

export interface TagSummary {
  tag: string;
  count: number;
}

// Aggregate tags across all guides with counts, stable sorted by tag
const map = new Map<string, number>();
for (const g of GUIDES_INDEX) {
  for (const t of g.tags) {
    map.set(t, (map.get(t) ?? 0) + 1);
  }
}

export const TAGS_SUMMARY: TagSummary[] = Array.from(map.entries())
  .map(([tag, count]) => ({ tag, count }))
  .sort((a, b) => a.tag.localeCompare(b.tag));

