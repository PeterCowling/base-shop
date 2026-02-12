import "server-only";

import type { GuideContentInput } from "@acme/types";

import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import { readCentralGuideBundle } from "@/routes/guides/central-guides-adapter.server";
import { extractGuideBundle } from "@/utils/extractGuideBundle";

import { getTranslations } from "./i18n-server";

type GuideI18nBundle = {
  serverGuides?: Record<string, unknown>;
  serverGuidesEn?: Record<string, unknown>;
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function injectGuideContent(
  baseBundle: Record<string, unknown> | undefined,
  guideKey: GuideKey,
  content: GuideContentInput | null | undefined,
): Record<string, unknown> | undefined {
  const base = asRecord(baseBundle) ?? {};
  if (!content) {
    return Object.keys(base).length > 0 ? base : undefined;
  }

  const baseContent = asRecord(base["content"]) ?? {};
  return {
    ...base,
    content: {
      ...baseContent,
      [guideKey]: content,
    },
  };
}

export async function loadGuideI18nBundle(
  lang: AppLanguage,
  guideKey: GuideKey,
): Promise<GuideI18nBundle> {
  // Populate i18n stores in the server render path before extracting.
  await getTranslations(lang, ["guides"]);

  const legacyGuides = extractGuideBundle(lang, guideKey);
  const legacyGuidesEn = lang === "en" ? undefined : extractGuideBundle("en", guideKey);
  const centralBundle = await readCentralGuideBundle(lang, guideKey);

  if (!centralBundle) {
    return {
      serverGuides: legacyGuides,
      serverGuidesEn: legacyGuidesEn,
    };
  }

  const localizedContent =
    centralBundle.localizedContent ?? centralBundle.englishContent;

  return {
    serverGuides: injectGuideContent(legacyGuides, guideKey, localizedContent),
    serverGuidesEn:
      lang === "en"
        ? undefined
        : injectGuideContent(
            legacyGuidesEn,
            guideKey,
            centralBundle.englishContent,
          ),
  };
}
