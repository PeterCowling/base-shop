import { IS_DEV } from "@/config/env";
import getGuideResource from "@/routes/guides/utils/getGuideResource";

import {
  isWhatToPackGuide,
  shouldSuppressGenericForGuide,
} from "../utils/templatePolicies";

export function resolveShouldRenderGenericContent(params: {
  shouldRenderGenericContentForLocale: boolean;
  guideKey: string;
  hasStructuredLocalInitial: boolean;
  hasAnyLocalized: boolean;
  lang: string;
}): boolean {
  const {
    shouldRenderGenericContentForLocale,
    guideKey,
    hasStructuredLocalInitial,
    hasAnyLocalized,
    lang,
  } = params;

  if (!shouldRenderGenericContentForLocale) {
    return false;
  }
  // Use centralized policy for guides that suppress GenericContent
  // based on localized content availability (luggageStorage,
  // weekend48Positano, ecoFriendlyAmalfi, workCafes).
  if (shouldSuppressGenericForGuide(guideKey, hasStructuredLocalInitial, hasAnyLocalized)) {
    return false;
  }
  // whatToPack: treat either localized translator-backed arrays or
  // runtime-provided arrays as sufficient to enable GenericContent.
  // Suppress only when both are absent for the active locale.
  if (isWhatToPackGuide(guideKey)) {
    const hasRuntime = (() => {
      try {
        const normalize = (v: unknown): string[] =>
          Array.isArray(v)
            ? (v as unknown[])
                .map((x) => (typeof x === "string" ? x.trim() : String(x ?? "").trim()))
                .filter((s) => s.length > 0)
            : [];
        const intro = getGuideResource<unknown>(lang as any, `content.${guideKey}.intro`);
        const sections = getGuideResource<unknown>(lang as any, `content.${guideKey}.sections`);
        const introOk = normalize(intro).length > 0;
        const sectionsOk = Array.isArray(sections)
          ? (sections as unknown[]).some((s) => {
              if (!s || typeof s !== "object") return false;
              const rec = s as Record<string, unknown>;
              const title = typeof rec["title"] === "string" ? rec["title"].trim() : "";
              const body = normalize(rec["body"] ?? rec["items"]);
              return title.length > 0 || body.length > 0;
            })
          : false;
        return introOk || sectionsOk;
      } catch (err) {
        if (IS_DEV) console.debug("[GuideSeoTemplate] localized check", err);
        return false;
      }
    })();
    if (!(hasAnyLocalized || hasRuntime)) {
      return false;
    }
  }
  return true;
}
