// src/routes/guides/sim-esim-and-atms-positano.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

import RelatedGuides from "@/components/guides/RelatedGuides";
import { ensureStringArray } from "@/utils/i18nContent";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { toAppLanguage } from "@/utils/lang";
import { getSlug } from "@/utils/slug";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { OG_IMAGE as OG_DIMENSIONS } from "@/utils/headConstants";
import i18n from "@/i18n";
import type { GuideSeoTemplateContext } from "./guide-seo/types";
export const GUIDE_KEY = "simsAtms" as const satisfies GuideKey;
export const GUIDE_SLUG = "sim-esim-and-atms-positano" as const;
export const handle = { tags: ["connectivity", "logistics", "positano"] } as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for simsAtms");
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    suppressUnlocalizedFallback: true,
    preferManualWhenUnlocalized: true,
    renderGenericContent: false,
    articleLead: (context) => renderFallbackIntro(context),
    guideFaqFallback: (lang) => buildFaqFallback(lang),
    articleExtras: (context) => renderFallbackFaqSection(context),
    afterArticle: (context) => renderFallbackRelatedGuides(context),
  }),
  meta: ({ data }, entry) => {
    const lang = toAppLanguage((data as { lang?: string } | undefined)?.lang);
    const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: OG_DIMENSIONS.width,
      height: OG_DIMENSIONS.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
      description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
      url,
      path,
      image: { src: image, width: OG_DIMENSIONS.width, height: OG_DIMENSIONS.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: entry.status === "live",
    });
  },
  links: ({ data }, entry) => {
    const lang = toAppLanguage((data as { lang?: string } | undefined)?.lang);
    const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
    return buildRouteLinks({ lang, path, origin: BASE_URL });
  },
});

export default Component;
export { clientLoader, meta, links };

function renderFallbackIntro(context: GuideSeoTemplateContext): JSX.Element | null {
  if (hasStructuredIntro(context)) {
    return null;
  }

  const paragraphs = resolveFallbackIntro(context.lang);
  if (paragraphs.length === 0) return null;

  return (
    <div>
      {paragraphs.map((paragraph, index) => (
        <p key={`fallback-intro-${index}`}>{paragraph}</p>
      ))}
    </div>
  );
}

function renderFallbackFaqSection(context: GuideSeoTemplateContext): JSX.Element | null {
  if (context.hasLocalizedContent) return null;
  const entries = resolveFallbackFaqs(context.lang);
  if (entries.length === 0) return null;

  const heading = (context.translateGuides("labels.faqsHeading") as string) || "FAQs";

  return (
    <section id="faqs" className="scroll-mt-28 space-y-4">
      <h2>{heading}</h2>
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <details
            key={index}
            className="overflow-hidden rounded-2xl border border-brand-outline/20 bg-brand-surface/40 shadow-sm transition-shadow hover:shadow-md dark:border-brand-outline/40 dark:bg-brand-bg/60"
          >
            <summary className="px-4 py-3 text-lg font-semibold text-brand-heading">{entry.q}</summary>
            <div className="space-y-3 px-4 pb-4 pt-1 text-base text-brand-text/90">
              {entry.a.map((answer, answerIndex) => (
                <p key={answerIndex}>{answer}</p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function renderFallbackRelatedGuides(context: GuideSeoTemplateContext): JSX.Element | null {
  if (context.hasLocalizedContent) return null;
  const items = [
    { key: "groceriesPharmacies" },
    { key: "whatToPack" },
    { key: "naplesPositano" },
  ] as const;
  return <RelatedGuides lang={context.lang} items={items} />;
}

function hasStructuredIntro(context: GuideSeoTemplateContext): boolean {
  const intro = context.translateGuides(`content.${GUIDE_KEY}.intro`, { returnObjects: true }) as unknown;
  return Array.isArray(intro) && intro.some((value) => typeof value === "string" && value.trim().length > 0);
}

function resolveFallbackIntro(lang: string): string[] {
  const local = readFallbackStrings(lang, `${GUIDE_KEY}.intro`);
  if (local.length > 0) return local;
  return readFallbackStrings("en", `${GUIDE_KEY}.intro`);
}

function resolveFallbackFaqs(lang: string): Array<{ q: string; a: string[] }> {
  const local = readFallbackFaqRecords(lang);
  if (local.length > 0) return local;
  return readFallbackFaqRecords("en");
}

function readFallbackStrings(lang: string, key: string): string[] {
  try {
    const translator = i18n.getFixedT(lang, "guidesFallback");
    const raw = translator?.(key, { returnObjects: true });
    if (Array.isArray(raw)) {
      return raw
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0);
    }
  } catch {
    // ignore fallback errors
  }
  return [];
}

function readFallbackFaqRecords(lang: string): Array<{ q: string; a: string[] }> {
  try {
    const translator = i18n.getFixedT(lang, "guidesFallback");
    const raw = translator?.(`${GUIDE_KEY}.faqs`, { returnObjects: true });
    if (!Array.isArray(raw)) return [];
    return raw
      .map((entry) => {
        const q = typeof entry?.q === "string" ? entry.q.trim() : "";
        const a = ensureStringArray(entry?.a).map((answer) => answer.trim()).filter(Boolean);
        if (!q || a.length === 0) return null;
        return { q, a };
      })
      .filter((entry): entry is { q: string; a: string[] } => entry != null);
  } catch {
    return [];
  }
}

function buildFaqFallback(lang: string): Array<{ q: string; a: string[] }> | undefined {
  try {
    const translator = i18n.getFixedT(lang, "guides");
    const local = translator?.(`content.${GUIDE_KEY}.faqs`, { returnObjects: true });
    if (Array.isArray(local) && local.length > 0) {
      return local as Array<{ q: string; a: string[] }>;
    }
  } catch {
    // ignore missing localized structured data
  }
  const fallback = resolveFallbackFaqs(lang);
  return fallback.length > 0 ? fallback : undefined;
}