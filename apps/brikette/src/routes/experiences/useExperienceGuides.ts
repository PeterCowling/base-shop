import { useMemo } from "react";

import {
  EXPERIENCES_GUIDES,
  GUIDES_INDEX,
  HELP_GUIDES,
  type GuideMeta,
} from "@/data/guides.index";
import { IS_PROD } from "@/config/env";

export function useExperienceGuides(): ReadonlyArray<GuideMeta> {
  return useMemo(() => {
    const experienceOrder = new Map(GUIDES_INDEX.map((guide, index) => [guide.key, index]));
    const isProd = IS_PROD;
    const publishedOnly = (g: GuideMeta) => !isProd || (g as { status?: string }).status !== "draft" && (g as { status?: string }).status !== "review";
    const base = EXPERIENCES_GUIDES.filter(publishedOnly);
    const experienceKeys = new Set(base.map((guide) => guide.key));
    const beachesHelpGuides = HELP_GUIDES.filter((guide) =>
      guide.tags.some((tag) => tag.toLowerCase() === "beaches"),
    ).filter(publishedOnly);
    const extras = beachesHelpGuides.filter((guide) => !experienceKeys.has(guide.key));

    if (!extras.length) {
      return [...base];
    }

    const combined = [...base, ...extras];
    combined.sort((a, b) => {
      const aIndex = experienceOrder.get(a.key) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = experienceOrder.get(b.key) ?? Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex;
    });

    return combined as ReadonlyArray<GuideMeta>;
  }, []);
}
