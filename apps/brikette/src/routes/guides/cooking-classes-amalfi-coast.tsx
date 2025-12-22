// src/routes/guides/cooking-classes-amalfi-coast.tsx
import type {} from "@/routes/guides/_GuideSeoTemplate";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import { ensureCanonicalLinkCluster } from "./ensureCanonicalLinkCluster";

import { guideHref, guideAbsoluteUrl, type GuideKey } from "@/routes.guides-helpers";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { toAppLanguage } from "@/utils/lang";
import getFallbackLanguage from "./utils/getFallbackLanguage";
import { DEFAULT_OG_IMAGE } from "./guide-seo/constants";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { BASE_URL } from "@/config/site";

import type { LinksFunction } from "react-router";

export const GUIDE_KEY: GuideKey = "cookingClassesAmalfi" as const;
export const GUIDE_SLUG = "cooking-classes-amalfi-coast" as const;

export const handle = { tags: ["culture", "cuisine", "amalfi", "positano"] };

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for cookingClassesAmalfi"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard surfaced in build logs
}

const resolveLangFromLinksArgs = (
  args: Parameters<LinksFunction>[0] | undefined,
): ReturnType<typeof toAppLanguage> => {
  const dataLangCandidate = args?.data as { lang?: string } | null | undefined;
  const paramsLangCandidate = args?.params as { lang?: unknown } | null | undefined;
  const dataLang = typeof dataLangCandidate?.lang === "string" ? dataLangCandidate.lang : undefined;
  const paramLang = typeof paramsLangCandidate?.lang === "string" ? paramsLangCandidate.lang : undefined;
  return toAppLanguage(dataLang ?? paramLang ?? undefined);
};

const resolveOrigin = (request: Request | undefined): string => {
  if (!request) return BASE_URL;
  try {
    return new URL(request.url).origin;
  } catch {
    return BASE_URL;
  }
};

const { Component, clientLoader, meta: routeMeta, links: routeLinks } = defineGuideRoute(manifestEntry, {
  template: () => ({
    preferManualWhenUnlocalized: true,
    buildTocItems: () => [],
    relatedGuides: {
      items: [
        { key: "cuisineAmalfiGuide" },
        { key: "limoncelloCuisine" },
        { key: "foodieGuideNaplesAmalfi" },
      ],
    },
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang ?? getFallbackLanguage());
    const path = guideHref(lang, manifestEntry.key);
    const url = guideAbsoluteUrl(lang, manifestEntry.key);
    const image = buildCfImageUrl(DEFAULT_OG_IMAGE.path, {
      width: DEFAULT_OG_IMAGE.width,
      height: DEFAULT_OG_IMAGE.height,
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url,
      path,
      image: { src: image, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
  links: (args) => {
    const lang = resolveLangFromLinksArgs(args);
    const path = guideHref(lang, manifestEntry.key);
    const request = args?.request instanceof Request ? args.request : undefined;
    const origin = resolveOrigin(request);
    return buildRouteLinks({
      lang,
      path,
      origin,
    });
  },
});

export default Component;
export { clientLoader };
export const meta = routeMeta;
export const links: LinksFunction = (...args: Parameters<LinksFunction>) => {
  const [firstArg] = args;
  const descriptors = routeLinks(...args);
  return ensureCanonicalLinkCluster(descriptors, () => {
    const lang = resolveLangFromLinksArgs(firstArg);
    const path = guideHref(lang, manifestEntry.key);
    const request = firstArg?.request instanceof Request ? firstArg.request : undefined;
    const origin = resolveOrigin(request);
    return buildRouteLinks({
      lang,
      path,
      origin,
    });
  });
};

// Helper utilities exported for unit tests
export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return (value as unknown[])
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter((s) => s.length > 0);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }
  return [];
}

export function toFallbackCopy(input: unknown): {
  intro: string[];
  toc: { href: string; label: string }[];
  sections: { id: string; title: string; body: string[] }[];
} | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;

  const intro = toStringArray(obj["intro"]);

  const rawToc = Array.isArray(obj["toc"]) ? (obj["toc"] as Array<Record<string, unknown>>) : [];
  const toc = rawToc
    .map((it) => {
      const hrefRaw = typeof it["href"] === "string" ? it["href"].trim() : "";
      const href = hrefRaw ? (hrefRaw.startsWith("#") ? hrefRaw : `#${hrefRaw}`) : "";
      const labelRaw = typeof it["label"] === "string" ? it["label"].trim() : "";
      if (!href || !labelRaw) return null;
      return { href, label: labelRaw };
    })
    .filter((x): x is { href: string; label: string } => x != null);

  const rawSections = Array.isArray(obj["sections"])
    ? (obj["sections"] as Array<Record<string, unknown>>)
    : [];
  const sections = rawSections
    .map((s, i) => {
      const idRaw = typeof s["id"] === "string" ? s["id"].trim() : "";
      const id = idRaw || `section-${i + 1}`;
      const titleRaw = typeof s["title"] === "string" ? s["title"].trim() : "";
      const body = toStringArray(s["body"]);
      if (!titleRaw && body.length === 0) return null;
      return { id, title: titleRaw, body };
    })
    .filter((x): x is { id: string; title: string; body: string[] } => x != null);

  if (intro.length === 0 && toc.length === 0 && sections.length === 0) return null;
  return { intro, toc, sections };
}

export function hasStructuredEntries(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}
