// src/routes/assistance/use-help-guides.ts
import { useMemo } from "react";

import { IS_PROD } from "@/config/env";
import { HELP_GUIDES } from "@/data/guides.index";
import type { AppLanguage } from "@/i18n.config";
import { guideNamespace } from "@/routes.guides-helpers";

export function useHelpGuides(lang: AppLanguage) {
  return useMemo(() => {
    const isProd = IS_PROD;
    const publishedOnly = (g: { status?: string }) =>
      !isProd || (g.status !== "draft" && g.status !== "review");
    return HELP_GUIDES.filter(publishedOnly).filter((guide) => {
      const namespace = guideNamespace(lang, guide.key);
      return namespace.baseKey !== "howToGetHere";
    });
  }, [lang]);
}
