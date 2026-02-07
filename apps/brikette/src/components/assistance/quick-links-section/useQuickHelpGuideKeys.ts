import { useMemo } from "react";

import type { GuideKey } from "@/guides/slugs";

import { useAssistanceTranslations } from "./translations";
import { useResolvedQuickLinks } from "./useQuickLinks";

export function useQuickHelpGuideKeys(lang?: string): readonly GuideKey[] {
  const { resolvedLang, tAssistance, tAssistanceEn } = useAssistanceTranslations(lang);
  const quickLinks = useResolvedQuickLinks(resolvedLang, tAssistance, tAssistanceEn);

  return useMemo(() => {
    const keys: GuideKey[] = [];
    for (const item of quickLinks.items) {
      if (item.slug) keys.push(item.slug);
    }
    return keys;
  }, [quickLinks.items]);
}
