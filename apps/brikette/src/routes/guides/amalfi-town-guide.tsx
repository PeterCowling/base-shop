// src/routes/guides/amalfi-town-guide.tsx
import type { LinksFunction, MetaFunction } from "react-router";

import TableOfContents from "@/components/guides/TableOfContents";
import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { type GuideKey,guideSlug } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";
import { ensureStringArray } from "@/utils/i18nContent";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

export const GUIDE_KEY = "amalfiTownGuide" as const satisfies GuideKey;
export const GUIDE_SLUG = "amalfi-town-guide" as const;

export const handle = { tags: ["amalfi", "day-trip", "culture", "positano", "ferry", "bus"] };

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for amalfiTownGuide"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only invariant surfaced in build logs
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

function mergeFallbackCopy<T extends Record<string, unknown>>(localized: DeepPartial<T>, base: T): T {
  const out: Record<string, unknown> = Array.isArray(base)
    ? ([] as unknown as Record<string, unknown>)
    : ({ ...(base as unknown as Record<string, unknown>) } as Record<string, unknown>);

  for (const key of Object.keys(base) as (keyof T)[]) {
    const localVal = (localized as unknown as Record<string, unknown>)[key as string];
    const baseVal = (base as unknown as Record<string, unknown>)[key as string];

    if (Array.isArray(baseVal)) {
      out[key as string] = Array.isArray(localVal) && localVal.length > 0 ? localVal : baseVal;
      continue;
    }

    if (typeof baseVal === "object" && baseVal !== null && !Array.isArray(baseVal)) {
      out[key as string] = mergeFallbackCopy(
        (localVal as Record<string, unknown> | undefined) ?? ({} as Record<string, unknown>),
        baseVal as Record<string, unknown>,
      );
      continue;
    }

    if (typeof localVal === "string") {
      const trimmed = localVal.trim();
      out[key as string] = trimmed.length > 0 ? trimmed : baseVal;
      continue;
    }

    out[key as string] = localVal ?? baseVal;
  }

  return out as unknown as T;
}

const { Component, clientLoader } = defineGuideRoute(manifestEntry, {
  template: () => ({
    relatedGuides: { items: manifestEntry.relatedGuides.map((key) => ({ key })) },
    // Article extras below merge localized fallback copy with the English baseline.
    // Suppress template-level fallback renderers so the merged content only appears once
    // while still allowing GenericContent to handle localized structured sections.
    suppressUnlocalizedFallback: true,
    renderGenericContent: true,
    articleExtras: (context) => {
      const hasStructuredSections =
        Array.isArray((context as { sections?: unknown[] }).sections) &&
        (context as { sections?: unknown[] }).sections!.length > 0;
      if (context.hasLocalizedContent && hasStructuredSections) return null;
      try {
        const getEnglishFallback = i18n?.getFixedT?.("en", "guidesFallback");
        const getLocalizedFallback = i18n?.getFixedT?.(context.lang ?? "en", "guidesFallback");
        if (typeof getEnglishFallback !== "function") return null;
        const baseRaw = getEnglishFallback(GUIDE_KEY, { returnObjects: true }) as unknown;
        if (!baseRaw || typeof baseRaw !== "object" || Array.isArray(baseRaw)) return null;

        let localized = baseRaw as Record<string, unknown>;
        if (typeof getLocalizedFallback === "function") {
          const localizedRaw = getLocalizedFallback(GUIDE_KEY, { returnObjects: true }) as unknown;
          if (localizedRaw && typeof localizedRaw === "object" && !Array.isArray(localizedRaw)) {
            localized = mergeFallbackCopy(localizedRaw as Record<string, unknown>, baseRaw as Record<string, unknown>);
          }
        }

        const headings = ((localized as Record<string, unknown>)["headings"] ?? {}) as Record<string, unknown>;
        const sections = (["highlights", "gettingThere", "tips"] as const).flatMap((id, idx) => {
          const body = ensureStringArray((localized as Record<string, unknown>)[id]);
          const titleRaw = headings[id];
          const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
          if (title.length === 0 && body.length === 0) return [];
          return [{ id: id || `s-${idx}`, title, body }];
        });
        if (sections.length === 0) return null;
        const tocItems = sections
          .map((section) => ({ href: `#${section.id}`, label: section.title || section.id }))
          .filter((item) => item.label.length > 0);
        return (
          <>
            {tocItems.length > 0 ? <TableOfContents items={tocItems} /> : null}
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28 space-y-4">
                {section.title ? <h2 className="text-xl font-semibold">{section.title}</h2> : null}
                {section.body.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </section>
            ))}
          </>
        );
      } catch {
        return null;
      }
    },
  }),
});

const OG_IMAGE_PATH = DEFAULT_OG_IMAGE.path;

export default Component;
export { clientLoader };
export const meta: MetaFunction = ({ data }) => {
  const payload = (data ?? {}) as { lang?: AppLanguage };
  const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
  const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
  const path = `/${lang}/${getSlug(baseKey, lang)}/${guideSlug(lang, manifestEntry.key)}`;
  const image = buildCfImageUrl(OG_IMAGE_PATH, {
    width: DEFAULT_OG_IMAGE.width,
    height: DEFAULT_OG_IMAGE.height,
  });
  return buildRouteMeta({
    lang,
    title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
    description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
    url: `${BASE_URL}${path}`,
    path,
    image: { src: image, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
    ogType: "article",
    includeTwitterUrl: true,
    isPublished: manifestEntry.status === "live",
  });
};
export const links: LinksFunction = () => buildRouteLinks();
export const __testables = { mergeFallbackCopy } as const;
