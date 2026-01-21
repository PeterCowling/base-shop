// src/routes/guides/amalfi-coast-travel-faqs.tsx
import type { LinksFunction, MetaFunction } from "react-router";
import type { TFunction } from "i18next";

import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { type GuideKey,guideSlug } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

export const handle = { tags: ["faq", "amalfi", "positano", "general-tourists"] };

export const GUIDE_KEY: GuideKey = "travelFaqsAmalfi";
export const GUIDE_SLUG = "amalfi-coast-travel-faqs" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for travelFaqsAmalfi"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only invariant surfaced in build logs
}

function resolveFaqHeading(ctx: GuideSeoTemplateContext): string {
  const tryTranslate = (translator: TFunction | ((key: string, opts?: unknown) => unknown) | undefined) => {
    if (!translator) return undefined;
    try {
      const raw = translator("labels.faqsHeading", { defaultValue: "" } as never);
      const value = typeof raw === "string" ? raw.trim() : "";
      return value.length > 0 ? value : undefined;
    } catch {
      return undefined;
    }
  };

  const direct = tryTranslate(ctx.translateGuides as unknown as TFunction | undefined);
  if (direct) return direct;

  const fallback = tryTranslate(i18n.getFixedT?.("en", "guides") as TFunction | undefined);
  if (fallback) return fallback;

  return "";
}

function resolveFaqs(lang: string | undefined): Array<{ q: string; a: string[] }> {
  try {
    const translator = typeof i18n.getFixedT === "function" ? (i18n.getFixedT(lang ?? "en", "guides") as TFunction | undefined) : undefined;
    if (typeof translator !== "function") return [];
    const structured = ensureArray<{ q?: string; a?: unknown }>(translator(`content.${GUIDE_KEY}.faqs`, { returnObjects: true }) as unknown)
      .map((faq) => ({ q: String(faq?.q ?? ""), a: ensureStringArray(faq?.a) }))
      .filter((faq) => faq.q.length > 0 && faq.a.length > 0);
    if (structured.length > 0) return structured;
    const legacy = ensureArray<{ q?: string; a?: unknown }>(translator(`content.${GUIDE_KEY}.faq`, { returnObjects: true }) as unknown)
      .map((faq) => ({ q: String(faq?.q ?? ""), a: ensureStringArray(faq?.a) }))
      .filter((faq) => faq.q.length > 0 && faq.a.length > 0);
    if (legacy.length > 0) return legacy;
    if (lang !== "en") return resolveFaqs("en");
    return [];
  } catch {
    if (lang !== "en") return resolveFaqs("en");
    return [];
  }
}

const { Component, clientLoader } = defineGuideRoute(manifestEntry, {
  template: () => ({
    showPlanChoice: false,
    showTransportNotice: false,
    guideFaqFallback: (lang) =>
      resolveFaqs(lang).map((faq) => ({ question: faq.q, answer: faq.a })),
    afterArticle: (context: GuideSeoTemplateContext) => {
      if (context.hasLocalizedContent) return null;
      const faqs = resolveFaqs(context.lang);
      if (faqs.length === 0) return null;
      const faqHeading = resolveFaqHeading(context);
      return (
        <section id="faqs" className="scroll-mt-28 space-y-4">
          {faqHeading ? <h2 className="text-xl font-semibold">{faqHeading}</h2> : null}
          <div className="space-y-4">
            {faqs.map((item, index) => (
              <details
                key={index}
                className="overflow-hidden rounded-2xl border border-brand-outline/20 bg-brand-surface/40 shadow-sm transition-shadow hover:shadow-md dark:border-brand-outline/40 dark:bg-brand-bg/60"
              >
                <summary className="px-4 py-3 text-lg font-semibold text-brand-heading">
                  {item.q}
                </summary>
                <div className="space-y-3 px-4 pb-4 pt-1 text-base text-brand-text/90">
                  {item.a.map((answer, answerIdx) => (
                    <p key={answerIdx}>{answer}</p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      );
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
