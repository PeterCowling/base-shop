// src/routes/guides/cooking-classes-amalfi-coast.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { BASE_URL } from "@/config/site";
import { toAppLanguage } from "@/utils/lang";
import type { LinksFunction, MetaFunction } from "react-router";


export const GUIDE_KEY: GuideKey = "cookingClassesAmalfi" as const;
export const GUIDE_SLUG = "cooking-classes-amalfi-coast" as const;

export const handle = { tags: ["culture", "cuisine", "amalfi", "positano"] };

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for cookingClassesAmalfi");
}

const meta: MetaFunction = ({ data }) => {
  const payload = (data ?? {}) as { lang?: string };
  const lang = toAppLanguage(payload.lang);
  const areaSlug = getSlug(guideAreaToSlugKey(manifestEntry.primaryArea), lang);
  const path = `/${lang}/${areaSlug}/${guideSlug(lang, manifestEntry.key)}`;
  const url = `${BASE_URL}${path}`;
  return buildRouteMeta({
    lang,
    title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
    description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
    url,
    path,
    ogType: "article",
    includeTwitterUrl: true,
    isPublished: manifestEntry.status === "live",
  });
};

const links: LinksFunction = (args) => {
  const payload = (args?.data ?? {}) as { lang?: string } | undefined;
  const lang = toAppLanguage(payload?.lang);
  const areaSlug = getSlug(guideAreaToSlugKey(manifestEntry.primaryArea), lang);
  const path = `/${lang}/${areaSlug}/${guideSlug(lang, manifestEntry.key)}`;
  return buildRouteLinks({ lang, path, origin: BASE_URL });
};

const { Component, clientLoader } = defineGuideRoute(manifestEntry, {
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
  meta: (args) => meta(args),
  links: (args) => links(args),
});

export default Component;
export { clientLoader, meta, links };

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);
  await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
  await ensureGuideContent(lang, "cookingClassesAmalfi", {
    en: () => import("../../locales/en/guides/content/cookingClassesAmalfi.json"),
    local:
      lang === "en"
        ? undefined
        : () => import(`../../locales/${lang}/guides/content/cookingClassesAmalfi.json`).catch(() => undefined),
  });
  return { lang } as const;
}

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

  const intro = toStringArray(obj.intro);

  const rawToc = Array.isArray(obj.toc) ? (obj.toc as Array<Record<string, unknown>>) : [];
  const toc = rawToc
    .map((it) => {
      const hrefRaw = typeof it.href === "string" ? it.href.trim() : "";
      const href = hrefRaw ? (hrefRaw.startsWith("#") ? hrefRaw : `#${hrefRaw}`) : "";
      const labelRaw = typeof it.label === "string" ? it.label.trim() : "";
      if (!href || !labelRaw) return null;
      return { href, label: labelRaw };
    })
    .filter((x): x is { href: string; label: string } => x != null);

  const rawSections = Array.isArray(obj.sections)
    ? (obj.sections as Array<Record<string, unknown>>)
    : [];
  const sections = rawSections
    .map((s, i) => {
      const idRaw = typeof s.id === "string" ? s.id.trim() : "";
      const id = idRaw || `section-${i + 1}`;
      const titleRaw = typeof s.title === "string" ? s.title.trim() : "";
      const body = toStringArray(s.body);
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

export const meta: MetaFunction = ({ data }: { data?: unknown } = {}) => {
  const lng = toAppLanguage((data as { lang?: string } | undefined)?.lang);
  const path = `/${lng}/${getSlug("experiences", lng)}/${guideSlug(lng, GUIDE_KEY)}`;
  const url = `${BASE_URL}${path}`;
  return buildRouteMeta({
    lang: lng,
    title: `guides.meta.${GUIDE_KEY}.title`,
    description: `guides.meta.${GUIDE_KEY}.description`,
    url,
    path,
    ogType: "article",
    includeTwitterUrl: true,
  });
};

export const links: LinksFunction = () => buildRouteLinks();