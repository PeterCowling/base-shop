import { useMemo } from "react";
import type { TFunction } from "i18next";

import type { AppLanguage } from "@/i18n.config";
import { articleSlug } from "@/routes.assistance-helpers";
import { getSlug } from "@/utils/slug";

import { FALLBACK_EN_QUICK_LINKS } from "./fallbacks";
import { normaliseQuickLinks } from "./normalise";
import type { QuickLinkWithHref, ResolvedQuickLinks } from "./types";

export function useResolvedQuickLinks(
  resolvedLang: AppLanguage,
  tAssistance: TFunction<"assistance">,
  tAssistanceEn: TFunction<"assistance">
): ResolvedQuickLinks {
  return useMemo(() => {
    const raw = tAssistance("quickLinks", { returnObjects: true }) as unknown;
    const resolved = normaliseQuickLinks(raw);
    if (resolved.length > 0) {
      return { items: resolved, sourceLang: resolvedLang } satisfies ResolvedQuickLinks;
    }

    const fallbackRaw = tAssistanceEn("quickLinks", { returnObjects: true }) as unknown;
    const fallback = normaliseQuickLinks(fallbackRaw);
    if (fallback.length > 0) {
      return { items: fallback, sourceLang: "en" } satisfies ResolvedQuickLinks;
    }

    // Only treat truly missing i18n data as "missing". An explicitly empty
    // array means "no quick links" and must not trigger built-in fallbacks.
    const fallbackSourceMissing =
      fallbackRaw === undefined || fallbackRaw === null || !Array.isArray(fallbackRaw);

    if (fallbackSourceMissing && FALLBACK_EN_QUICK_LINKS.length > 0) {
      return { items: FALLBACK_EN_QUICK_LINKS, sourceLang: "en" } satisfies ResolvedQuickLinks;
    }

    return { items: [], sourceLang: resolvedLang } satisfies ResolvedQuickLinks;
  }, [resolvedLang, tAssistance, tAssistanceEn]);
}

export function useQuickLinksWithHref(
  quickLinks: ResolvedQuickLinks,
  resolvedLang: AppLanguage,
): QuickLinkWithHref[] {
  return useMemo(() => {
    const { items, sourceLang } = quickLinks;
    const assistanceSlug = getSlug("assistance", sourceLang);
    const basePath = `/${resolvedLang}/${assistanceSlug}`;

    return items.map((item) => {
      const articlePath = `${basePath}/${articleSlug(sourceLang, item.slug)}`;
      return {
        ...item,
        href: articlePath,
      } satisfies QuickLinkWithHref;
    });
  }, [quickLinks, resolvedLang]);
}
