// _shared/guideLabelReaderFactory.ts
// Shared factory for createGuideLabelReader used by how-to-get-here route modules.
// Each route module calls this with its own GUIDE_KEY, getGuidesFallbackTranslator, and TOC_LABEL_KEY_MAP.
import type { TFunction } from "i18next";

import type { GuideSeoTemplateContext } from "@/routes/guides/_GuideSeoTemplate";

export function createGuideLabelReaderFactory(
  guideKey: string,
  getGuidesFallbackTranslator: (lang: string) => TFunction<"guidesFallback">,
  tocLabelKeyMap: Record<string, string>,
): (context: GuideSeoTemplateContext, fallbackLabels: Record<string, string>) => (key: string) => string | undefined {
  return (context, fallbackLabels) => {
    const guidesFallbackLocal = getGuidesFallbackTranslator(context.lang);
    const guidesFallbackEn = getGuidesFallbackTranslator("en");

    return (key: string): string | undefined => {
      const translationKey = `content.${guideKey}.${key}`;
      const primary = context.translateGuides(translationKey);
      if (typeof primary === "string" && primary.trim().length > 0 && primary !== translationKey) {
        return primary.trim();
      }

      const fallbackLocal = guidesFallbackLocal(`${guideKey}.${key}`, { defaultValue: "" });
      if (typeof fallbackLocal === "string" && fallbackLocal.trim().length > 0) {
        return fallbackLocal.trim();
      }

      const fallbackEn = guidesFallbackEn(`${guideKey}.${key}`, { defaultValue: "" });
      if (typeof fallbackEn === "string" && fallbackEn.trim().length > 0) {
        return fallbackEn.trim();
      }

      const mapped = tocLabelKeyMap[key];
      if (mapped) {
        return fallbackLabels[mapped] ?? mapped;
      }

      return undefined;
    };
  };
}
