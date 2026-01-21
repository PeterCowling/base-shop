import type { TFunction } from "i18next";

import appI18n from "@/i18n";

export function getGuidesFallbackTranslator(locale: string): TFunction<"guidesFallback"> {
  const fixed = appI18n.getFixedT(locale, "guidesFallback");
  if (typeof fixed === "function") {
    return fixed as TFunction<"guidesFallback">;
  }
  return appI18n.getFixedT("en", "guidesFallback") as TFunction<"guidesFallback">;
}

export function getGuidesTranslator(locale: string): TFunction<"guides"> {
  const fixed = appI18n.getFixedT(locale, "guides");
  if (typeof fixed === "function") {
    return fixed as TFunction<"guides">;
  }
  return appI18n.getFixedT("en", "guides") as TFunction<"guides">;
}
