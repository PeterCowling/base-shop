// src/routes/guides/ensureCanonicalLinkCluster.ts
import type { LinksFunction } from "react-router";

import { BASE_URL } from "@/config/site";
import { guideSlug } from "@/routes.guides-helpers";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteLinks } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { guideAreaToSlugKey, type GuideManifestEntry } from "./guide-manifest";

export type GuideLinkDescriptor = ReturnType<LinksFunction>[number];

const isXDefaultAlternate = (descriptor: GuideLinkDescriptor): boolean =>
  descriptor?.rel === "alternate" && "hrefLang" in descriptor && descriptor.hrefLang === "x-default";

type GuideLinksArg = Parameters<LinksFunction>[0] | undefined;

const resolveLangFromLinksArg = (arg: GuideLinksArg): ReturnType<typeof toAppLanguage> => {
  const dataLang = typeof (arg?.data as { lang?: unknown } | null)?.lang === "string"
    ? ((arg?.data as { lang?: string }).lang as string)
    : undefined;
  const paramsLang = typeof (arg?.params as { lang?: unknown } | null)?.lang === "string"
    ? ((arg?.params as { lang?: string }).lang as string)
    : undefined;
  return toAppLanguage(dataLang ?? paramsLang ?? undefined);
};

const resolveOriginFromLinksArg = (arg: GuideLinksArg): string => {
  const request =
    arg && typeof arg === "object" && "request" in arg ? (arg as { request?: Request }).request : undefined;
  if (!(request instanceof Request)) return BASE_URL;
  try {
    return new URL(request.url).origin;
  } catch {
    return BASE_URL;
  }
};

export function buildGuideLinkFallback(
  entry: GuideManifestEntry,
  arg: GuideLinksArg,
): ReturnType<LinksFunction> {
  const lang = resolveLangFromLinksArg(arg);
  const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
  const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
  const origin = resolveOriginFromLinksArg(arg);
  return buildRouteLinks({
    lang,
    path,
    origin,
  });
}

/**
 * Ensure the returned link descriptors include both a canonical link and an x-default alternate.
 * When the base descriptors already provide both entries, the base list is returned unchanged.
 * Otherwise, the fallback factory is invoked lazily and the missing descriptors are appended.
 */
export function ensureCanonicalLinkCluster(
  base: ReturnType<LinksFunction>,
  fallbackFactory: () => ReturnType<LinksFunction>,
): GuideLinkDescriptor[] {
  const list: GuideLinkDescriptor[] = Array.isArray(base) ? [...base] : [];
  let hasCanonical = list.some((descriptor) => descriptor?.rel === "canonical");
  let hasXDefault = list.some(isXDefaultAlternate);

  if (hasCanonical && hasXDefault) {
    return list;
  }

  const fallback = fallbackFactory();
  const candidates: GuideLinkDescriptor[] = Array.isArray(fallback) ? fallback : [];
  for (const descriptor of candidates) {
    if (!hasCanonical && descriptor?.rel === "canonical") {
      list.push(descriptor);
      hasCanonical = true;
      if (hasXDefault) break;
      continue;
    }
    if (!hasXDefault && isXDefaultAlternate(descriptor)) {
      list.push(descriptor);
      hasXDefault = true;
      if (hasCanonical) break;
    }
  }

  return list;
}

export function wrapGuideLinks(
  entry: GuideManifestEntry,
  linksFn: LinksFunction,
): LinksFunction {
  return (...args: Parameters<LinksFunction>) => {
    const [firstArg] = args;
    const descriptors = linksFn(...args);
    return ensureCanonicalLinkCluster(descriptors, () => buildGuideLinkFallback(entry, firstArg));
  };
}
