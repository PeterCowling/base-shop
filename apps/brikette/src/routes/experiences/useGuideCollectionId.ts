import { useMemo } from "react";

import type { AppLanguage } from "@/i18n.config";
import { getSlug } from "@/utils/slug";

export function useGuideCollectionId(lang: AppLanguage): string {
  return useMemo(() => {
    const experiencesSlug = getSlug("experiences", lang);
    const guidesSlug = getSlug("guides", lang);
    return `${experiencesSlug}-${guidesSlug}`;
  }, [lang]);
}
