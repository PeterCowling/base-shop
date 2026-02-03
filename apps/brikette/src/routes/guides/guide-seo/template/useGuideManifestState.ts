import { useEffect, useMemo, useState } from "react";

import { IS_DEV, PREVIEW_TOKEN } from "@/config/env";
import type { AppLanguage } from "@/i18n.config";
import getGuideResource from "@/routes/guides/utils/getGuideResource";
import { ensureGuideContent } from "@/utils/ensureGuideContent";

import type { ChecklistSnapshot, GuideChecklistItem, GuideManifestEntry } from "../../guide-manifest";
import { buildGuideChecklist, getGuideManifestEntry, resolveDraftPathSegment } from "../../guide-manifest";
import type { ManifestOverrides } from "../../guide-manifest-overrides";

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
  serverOverrides?: ManifestOverrides;
}) {
  const { guideKey, lang, canonicalPathname, preferManualWhenUnlocalized, loaderData, serverOverrides } = params;
  const [checklistVersion, setChecklistVersion] = useState(0);
  const [overrides, setOverrides] = useState<ManifestOverrides>(serverOverrides ?? {});

  const manifestEntry = useMemo<GuideManifestEntry | null>(
    () => getGuideManifestEntry(guideKey) ?? null,
    [guideKey],
  );

  // Fetch manifest overrides (includes SEO audit results)
  // Skip if server-provided overrides already contain this guide's data
  useEffect(() => {
    if (!manifestEntry) return;

    const previewToken = PREVIEW_TOKEN ?? "";
    if (!previewToken) return;

    // Skip fetch if serverOverrides already provided this guide's data
    if (serverOverrides?.[guideKey]) {
      if (IS_DEV) console.debug("[useGuideManifestState] Using server-loaded overrides for", guideKey);
      return;
    }

    let active = true;

    const fetchOverrides = async () => {
      try {
        const response = await fetch(`/api/guides/${guideKey}/manifest`, {
          headers: {
            "x-preview-token": previewToken,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        if (active && data.ok && data.override) {
          setOverrides((prev) => ({
            ...prev,
            [guideKey]: data.override,
          }));
        }
      } catch (err) {
        if (IS_DEV) console.debug("[useGuideManifestState] Failed to fetch overrides", err);
      }
    };

    void fetchOverrides();

    return () => {
      active = false;
    };
  }, [guideKey, manifestEntry, checklistVersion, serverOverrides]);

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
    let active = true;
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
      } finally {
        if (active) {
          setChecklistVersion((prev) => prev + 1);
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [lang, manifestEntry, preferManualWhenUnlocalized]);

  const resolvedStatus = (loaderData?.status ?? overrides[guideKey]?.status ?? manifestEntry?.status ?? "draft") as GuideManifestEntry["status"];

  const checklistSnapshot = useMemo<ChecklistSnapshot | undefined>(() => {
    const raw = loaderData?.checklist;
    const fallbackStatus = (loaderData?.status ?? overrides[guideKey]?.status ?? manifestEntry?.status ?? "draft") as ChecklistSnapshot["status"];
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
    return manifestEntry
      ? buildGuideChecklist(manifestEntry, { includeDiagnostics: true, lang, overrides })
      : undefined;
  }, [loaderData?.checklist, loaderData?.status, manifestEntry, lang, checklistVersion, overrides, guideKey]);

  const draftUrl = useMemo(() => {
    if (!manifestEntry) return undefined;
    const overridePath = overrides[guideKey]?.draftPathSegment;
    return `/${lang}/draft/${resolveDraftPathSegment(manifestEntry, overridePath)}`;
  }, [lang, manifestEntry, overrides, guideKey]);

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
