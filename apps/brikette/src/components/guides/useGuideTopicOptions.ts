// src/components/guides/useGuideTopicOptions.ts
import { useMemo } from "react";

import type { GuideMeta } from "@/data/guides.index";
import { GUIDE_TOPICS, matchesGuideTopic } from "@/data/guideTopics";
import type { AppLanguage } from "@/i18n.config";
import { getTagMeta } from "@/utils/tags/resolvers";

import type { GuideFilterOption } from "./useGuideFilterOptions";

export const useGuideTopicOptions = (
  guides: readonly GuideMeta[],
  lang: AppLanguage,
): GuideFilterOption[] =>
  useMemo(() => {
    const options: GuideFilterOption[] = [];

    for (const topic of GUIDE_TOPICS) {
      const count = guides.reduce(
        (total, guide) => total + (matchesGuideTopic(guide, topic.id) ? 1 : 0),
        0,
      );
      if (count <= 0) continue;

      const label = getTagMeta(lang, topic.id).label || topic.id;
      options.push({ value: topic.id, label, count });
    }

    return options;
  }, [guides, lang]);