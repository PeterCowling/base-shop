import "server-only";

import {
  getGuideContent,
  readGuideRepo,
} from "@acme/platform-core/repositories/guides.server";
import type {
  GuideContentInput,
  GuidePublication,
} from "@acme/types";

import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";

const SHOP_ID = "brikette";
const TRUTHY_FLAG_VALUES = new Set(["1", "on", "true", "yes"]);

function normalizeFlag(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

export function isCentralGuidesEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return TRUTHY_FLAG_VALUES.has(normalizeFlag(env["USE_CENTRAL_GUIDES"]));
}

export type CentralGuideBundle = {
  guide: GuidePublication;
  localizedContent: GuideContentInput | null;
  englishContent: GuideContentInput | null;
};

export async function readCentralGuideBundle(
  lang: AppLanguage,
  guideKey: GuideKey,
): Promise<CentralGuideBundle | null> {
  if (!isCentralGuidesEnabled()) {
    return null;
  }

  try {
    const guides = await readGuideRepo<GuidePublication>(SHOP_ID);
    const guide = guides.find((entry) => entry.key === guideKey);
    if (!guide) {
      return null;
    }

    const localizedContent = await getGuideContent(SHOP_ID, guide.key, lang);
    const englishContent =
      lang === "en"
        ? localizedContent
        : await getGuideContent(SHOP_ID, guide.key, "en");

    if (!localizedContent && !englishContent) {
      return null;
    }

    return {
      guide,
      localizedContent,
      englishContent,
    };
  } catch {
    return null;
  }
}
