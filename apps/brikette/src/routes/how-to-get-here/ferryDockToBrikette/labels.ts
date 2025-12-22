import type { GuideSeoTemplateContext } from "@/routes/guides/_GuideSeoTemplate";

import { GUIDE_KEY } from "./constants";
import { getGuidesFallbackTranslator, TOC_LABEL_KEY_MAP } from "./i18n";
import type { GuideExtras } from "./types";

export function createGuideLabelReader(
  context: GuideSeoTemplateContext,
  fallbackLabels: GuideExtras["labels"],
) {
  const guidesFallbackLocal = getGuidesFallbackTranslator(context.lang);
  const guidesFallbackEn = getGuidesFallbackTranslator("en");

  return (key: string): string | undefined => {
    const translationKey = `content.${GUIDE_KEY}.${key}`;
    const primary = context.translateGuides(translationKey);
    if (typeof primary === "string" && primary.trim().length > 0 && primary !== translationKey) {
      return primary.trim();
    }

    const fallbackLocal = guidesFallbackLocal(`${GUIDE_KEY}.${key}`, { defaultValue: "" });
    if (typeof fallbackLocal === "string" && fallbackLocal.trim().length > 0) {
      return fallbackLocal.trim();
    }

    const fallbackEn = guidesFallbackEn(`${GUIDE_KEY}.${key}`, { defaultValue: "" });
    if (typeof fallbackEn === "string" && fallbackEn.trim().length > 0) {
      return fallbackEn.trim();
    }

    const mapped = TOC_LABEL_KEY_MAP[key];
    if (mapped) {
      return fallbackLabels[mapped] ?? mapped;
    }

    return undefined;
  };
}
