import { useEffect, useMemo } from "react";

import { IS_DEV } from "@/config/env";
import getGuideResource from "@/routes/guides/utils/getGuideResource";
import { ensureGuideContent } from "@/utils/ensureGuideContent";

import type { ChecklistSnapshot, GuideChecklistItem, GuideManifestEntry } from "../../guide-manifest";
import { buildGuideChecklist, getGuideManifestEntry, resolveDraftPathSegment } from "../../guide-manifest";
import type { AppLanguage } from "@/i18n.config";

type LoaderData = {
  status?: GuideManifestEntry["status"];
  checklist?: ChecklistSnapshot | GuideChecklistItem[];
} | undefined;

export function useGuideManifestState(params: {
  guideKey: GuideManifestEntry["key"];
  lang: AppLanguage;
  canonicalPathname?: string;
  preferManualWhenUnlocalized: boolean;
  loaderData?: LoaderData;
}) {
  const { guideKey, lang, canonicalPathname, preferManualWhenUnlocalized, loaderData } = params;

  const manifestEntry = useMemo<GuideManifestEntry | null>(
    () => getGuideManifestEntry(guideKey) ?? null,
    [guideKey],
  );

  useEffect(() => {
    if (!manifestEntry) return;
    const contentKey = manifestEntry.contentKey;
    if (typeof contentKey !== "string" || contentKey.trim().length === 0) return;
    const langKey = typeof lang === "string" && lang.trim().length > 0 ? lang : undefined;
    const normalizedLangKey = langKey?.trim().toLowerCase();
    if (preferManualWhenUnlocalized && normalizedLangKey && normalizedLangKey !== "en") {
      return;
    }
    if (!langKey) return;
    const load = async () => {
      try {
        const loaders = {
          en: () => getGuideResource("en", `content.${contentKey}`),
          ...(langKey === "en"
            ? {}
            : {
                local: () =>
                  getGuideResource(langKey, `content.${contentKey}`, { includeFallback: false }),
              }),
        };
        await ensureGuideContent(langKey, contentKey, loaders);
      } catch (err) {
        if (IS_DEV) console.debug("[GuideSeoTemplate] ensureGuideContent failed", err);
      }
    };
    void load();
  }, [lang, manifestEntry, preferManualWhenUnlocalized]);

  const resolvedStatus = (loaderData?.status ?? manifestEntry?.status ?? "draft") as GuideManifestEntry["status"];

  const checklistSnapshot = useMemo<ChecklistSnapshot | undefined>(() => {
    const raw = loaderData?.checklist;
    const fallbackStatus = (loaderData?.status ?? manifestEntry?.status ?? "draft") as ChecklistSnapshot["status"];
    if (Array.isArray(raw)) {
      return { status: fallbackStatus, items: raw as GuideChecklistItem[] } satisfies ChecklistSnapshot;
    }
    if (raw && typeof raw === "object") {
      const candidate = raw as Partial<ChecklistSnapshot>;
      if (Array.isArray(candidate.items)) {
        const status = typeof candidate.status === "string" ? candidate.status : fallbackStatus;
        return { status: status as ChecklistSnapshot["status"], items: candidate.items };
      }
    }
    return manifestEntry ? buildGuideChecklist(manifestEntry) : undefined;
  }, [loaderData?.checklist, loaderData?.status, manifestEntry]);

  const draftUrl = useMemo(() => {
    if (!manifestEntry) return undefined;
    return `/${lang}/draft/${resolveDraftPathSegment(manifestEntry)}`;
  }, [lang, manifestEntry]);

  const isDraftRoute = Boolean(canonicalPathname?.includes("/draft/"));
  const shouldShowEditorialPanel = Boolean(manifestEntry) && (isDraftRoute || resolvedStatus !== "live");

  return {
    manifestEntry,
    resolvedStatus,
    checklistSnapshot,
    draftUrl,
    isDraftRoute,
    shouldShowEditorialPanel,
  };
}
