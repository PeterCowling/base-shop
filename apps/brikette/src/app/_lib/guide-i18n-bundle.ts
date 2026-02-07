import "server-only";

import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import { extractGuideBundle } from "@/utils/extractGuideBundle";

import { getTranslations } from "./i18n-server";

type GuideI18nBundle = {
  serverGuides?: Record<string, unknown>;
  serverGuidesEn?: Record<string, unknown>;
};

export async function loadGuideI18nBundle(
  lang: AppLanguage,
  guideKey: GuideKey,
): Promise<GuideI18nBundle> {
  // Populate i18n stores in the server render path before extracting.
  await getTranslations(lang, ["guides"]);

  return {
    serverGuides: extractGuideBundle(lang, guideKey),
    serverGuidesEn: lang === "en" ? undefined : extractGuideBundle("en", guideKey),
  };
}
