import { useMemo } from "react";

import type { AppLanguage } from "@/i18n.config";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { useApplyFallbackHead } from "@/utils/testHeadFallback";

import type { GuideManifestEntry } from "../../guide-manifest";
import { resolveGuideOgType } from "../utils/resolveOgType";

export function useFallbackHead(params: {
  lang: AppLanguage;
  canonicalUrl: string;
  canonicalPath: string;
  effectiveTitle: string;
  description: string;
  ogImageUrl?: string;
  ogImageConfig: { width: number; height: number };
  ogType: string;
  twitterCardType?: string;
  guideKey: string;
  metaKey?: string;
  manifestEntry: GuideManifestEntry | null;
}): void {
  const {
    lang,
    canonicalUrl,
    canonicalPath,
    effectiveTitle,
    description,
    ogImageUrl,
    ogImageConfig,
    ogType,
    twitterCardType,
    guideKey,
    metaKey,
    manifestEntry,
  } = params;

  const fallbackHeadMeta = useMemo(() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    const resolvedTitle =
      typeof effectiveTitle === "string" && effectiveTitle.trim().length > 0
        ? effectiveTitle.trim()
        : String(metaKey ?? guideKey);
    const resolvedDescription =
      typeof description === "string" && description.trim().length > 0 ? description.trim() : "";
    const imageSrc = typeof ogImageUrl === "string" && ogImageUrl.trim().length > 0 ? ogImageUrl : undefined;
    const resolvedTwitter =
      typeof twitterCardType === "string" && twitterCardType.trim().length > 0 && twitterCardType.trim() !== "meta.twitterCard"
        ? twitterCardType.trim()
        : undefined;
    const fallbackOgType = resolveGuideOgType(manifestEntry, ogType);
    const fallbackImage = imageSrc
      ? {
          src: imageSrc,
          width: ogImageConfig.width,
          height: ogImageConfig.height,
        }
      : undefined;
    return buildRouteMeta({
      lang,
      title: resolvedTitle,
      description: resolvedDescription,
      url: canonicalUrl,
      path: canonicalPath,
      ...(fallbackImage ? { image: fallbackImage } : {}),
      ogType: fallbackOgType,
      ...(resolvedTwitter ? { twitterCard: resolvedTwitter } : {}),
      includeTwitterUrl: true,
    });
  }, [
    canonicalPath,
    canonicalUrl,
    description,
    effectiveTitle,
    guideKey,
    lang,
    manifestEntry,
    metaKey,
    ogImageConfig.height,
    ogImageConfig.width,
    ogImageUrl,
    ogType,
    twitterCardType,
  ]);

  const fallbackHeadLinks = useMemo(() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    return buildRouteLinks();
  }, []);

  useApplyFallbackHead(fallbackHeadMeta as unknown as ReturnType<typeof buildRouteMeta>, fallbackHeadLinks);
}
