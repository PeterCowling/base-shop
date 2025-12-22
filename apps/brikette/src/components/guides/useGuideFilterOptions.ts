// src/components/guides/useGuideFilterOptions.ts
import { useMemo } from "react";

import type { GuideMeta } from "@/data/guides.index";

export type GuideFilterOption = {
  value: string;
  label: string;
  count: number;
};

export const useGuideFilterOptions = (guides: readonly GuideMeta[]): GuideFilterOption[] =>
  useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();

    for (const guide of guides) {
      for (const raw of guide.tags) {
        if (typeof raw !== "string") continue;

        const trimmed = raw.trim();
        if (!trimmed) continue;

        const normalized = trimmed.toLowerCase();
        const current = counts.get(normalized);
        if (current) {
          current.count += 1;
          continue;
        }

        counts.set(normalized, { label: trimmed, count: 1 });
      }
    }

    return Array.from(counts.entries())
      .map(([value, meta]) => ({ value, label: meta.label, count: meta.count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
      });
  }, [guides]);
