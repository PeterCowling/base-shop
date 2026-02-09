import { useMemo } from "react";

import type { AppLanguage } from "@/i18n.config";

import type { GuideManifestEntry } from "../../guide-manifest";
import { getGuideManifestEntry } from "../../guide-manifest";

export function useGuideManifestState(params: {
  guideKey: GuideManifestEntry["key"];
  lang: AppLanguage;
  preferManualWhenUnlocalized: boolean;
}) {
  const { guideKey } = params;

  const manifestEntry = useMemo<GuideManifestEntry | null>(
    () => getGuideManifestEntry(guideKey) ?? null,
    [guideKey],
  );

  return { manifestEntry };
}
