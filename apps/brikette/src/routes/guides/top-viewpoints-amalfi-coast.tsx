// src/routes/guides/top-viewpoints-amalfi-coast.tsx
import { useEffect } from "react";
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import { BASE_URL } from "@/config/site";
import type { LinksFunction } from "react-router";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { toAppLanguage } from "@/utils/lang";

export const handle = { tags: ["viewpoints", "amalfi", "positano", "ravello", "capri", "photography"] };

export const GUIDE_KEY = "topViewpointsAmalfi" as const satisfies GuideKey;
export const GUIDE_SLUG = "top-viewpoints-amalfi-coast" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for topViewpointsAmalfi"); // i18n-exempt -- TECH-000 [ttl=2026-12-31]
}

const OG_IMAGE_PATH = "/img/hostel-communal-terrace-lush-view.webp";

const { Component, clientLoader, meta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    relatedGuides: { items: manifestEntry.relatedGuides.map((key) => ({ key })) },
    alwaysProvideFaqFallback: true,
    articleExtras: (context: GuideSeoTemplateContext) => {
      const noStructuredSections = !Array.isArray(context.sections) || context.sections.length === 0;
      if (!noStructuredSections) return null;
      const description =
        typeof context.article?.description === "string" ? context.article.description : "";
      if (!description) return null;
      return <StripFallbackDescription description={description} />;
    },
  }),
  meta: ({ data }) => {
    const lang = toAppLanguage((data as { lang?: string } | undefined)?.lang);
    const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, GUIDE_KEY)}`;
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl(OG_IMAGE_PATH, {
      width: DEFAULT_OG_IMAGE.width,
      height: DEFAULT_OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${GUIDE_KEY}.title`,
      description: `guides.meta.${GUIDE_KEY}.description`,
      url,
      path,
      image: { src: image, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
    });
  },
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = () => buildRouteLinks();

function StripFallbackDescription({ description }: { description?: string }): null {
  useEffect(() => {
    try {
      const article = document.querySelector("article");
      if (!article) return;
      const target = (description ?? "").trim();
      const paragraphs = Array.from(article.querySelectorAll("p"));
      for (const paragraph of paragraphs) {
        const text = paragraph.textContent?.trim() ?? "";
        if (!text) continue;
        if (target && text !== target) continue;
        paragraph.remove();
      }
    } catch {
      // ignore non-browser environments
    }
  }, [description]);

  return null;
}
