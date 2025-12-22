import { useMemo } from "react";

import type { AppLanguage } from "@/i18n.config";
import { getSlug } from "@/utils/slug";

export function useClearFilterHref(lang: AppLanguage): string {
  return useMemo(() => {
    const experiencesSlug = getSlug("experiences", lang);
    return `/${lang}/${experiencesSlug}`;
  }, [lang]);
}
