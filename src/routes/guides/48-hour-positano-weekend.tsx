// src/routes/guides/48-hour-positano-weekend.tsx
import { defineGuideRoute, createStructuredLeadWithBuilder } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import type { LinksFunction, MetaFunction } from "react-router";

export const handle = { tags: ["itinerary", "positano", "weekend"] };

export const GUIDE_KEY: GuideKey = "weekend48Positano";
export const GUIDE_SLUG = "48-hour-positano-weekend" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for weekend48Positano");
}

const OG_IMAGE_PATH = "/img/hostel-communal-terrace-lush-view.webp";

type WeekendExtras = {
  hasStructured: boolean;
  intro: string[];
  sections: GuideSeoTemplateContext["sections"];
  faqs: Array<{ q: string; a: string[] }>;
  faqsTitle: string;
  tips: string[];
  tipsTitle: string;
  tocItems: Array<{ href: string; label: string }>;
};

function collectWeekendExtras(ctx: GuideSeoTemplateContext): WeekendExtras {
  const translator = ctx.translateGuides ?? ctx.translator;
  const intro = Array.isArray(ctx.intro)
    ? ctx.intro.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];
  const sectionsWithBody = (ctx.sections ?? []).filter(
    (section) => Array.isArray(section.body) && section.body.length > 0,
  );

  const readArray = <T,>(key: string, normalise: (value: unknown) => T[]): T[] => {
    try {
      const raw = translator?.(key, { returnObjects: true }) as unknown;
      return normalise(raw);
    } catch {
      return [];
    }
  };

  const faqs = readArray(`content.${GUIDE_KEY}.faqs`, (raw) => {
    if (!Array.isArray(raw)) return [];
    return (raw as Array<{ q?: unknown; a?: unknown }>)
      .map((faq) => {
        const q = typeof faq?.q === "string" ? faq.q.trim() : "";
        const a = Array.isArray(faq?.a)
          ? (faq!.a as unknown[]).filter((answer): answer is string => typeof answer === "string" && answer.trim().length > 0)
          : [];
        return q && a.length > 0 ? { q, a: a.map((answer) => answer.trim()) } : null;
      })
      .filter((faq): faq is { q: string; a: string[] } => faq != null);
  });

  const tips = readArray(`content.${GUIDE_KEY}.tips`, (raw) =>
    Array.isArray(raw)
      ? (raw as unknown[]).filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : [],
  );

  const resolveHeading = (key: string, fallback: string) => {
    try {
      const raw = translator?.(key) as unknown;
      const value = typeof raw === "string" ? raw.trim() : "";
      if (value && value !== key && value !== GUIDE_KEY) return value;
    } catch {
      // ignore translator failures
    }
    return fallback;
  };

  const tipsTitle = resolveHeading(`content.${GUIDE_KEY}.tipsTitle`, "Tips");
  const faqsTitle = (() => {
    try {
      const specific = translator?.(`content.${GUIDE_KEY}.faqsTitle`) as unknown;
      const specificText = typeof specific === "string" ? specific.trim() : "";
      if (specificText && specificText !== `content.${GUIDE_KEY}.faqsTitle` && specificText !== GUIDE_KEY) {
        return specificText;
      }
      const generic = translator?.("labels.faqsHeading") as unknown;
      const genericText = typeof generic === "string" ? generic.trim() : "";
      if (genericText && genericText !== "labels.faqsHeading") return genericText;
    } catch {
      // ignore
    }
    return "FAQs";
  })();

  const tocItems: Array<{ href: string; label: string }> = [];
  try {
    const raw = translator?.(`content.${GUIDE_KEY}.toc`, { returnObjects: true }) as unknown;
    const entries = Array.isArray(raw) ? (raw as Array<{ href?: unknown; label?: unknown }>) : [];
    const idByTitle = new Map(
      (ctx.sections ?? [])
        .filter((section) => section.title && section.title.trim())
        .map((section) => [section.title.trim().toLowerCase(), section.id] as const),
    );
    for (let index = 0; index < entries.length; index++) {
      const entry = entries[index];
      const label = typeof entry?.label === "string" ? entry.label.trim() : "";
      if (!label) continue;
      const hrefRaw = typeof entry?.href === "string" ? entry.href.trim() : "";
      const href =
        hrefRaw && hrefRaw.startsWith("#")
          ? hrefRaw
          : hrefRaw
            ? `#${hrefRaw}`
            : (() => {
                const match = idByTitle.get(label.toLowerCase());
                return match ? `#${match}` : `#section-${index + 1}`;
              })();
      tocItems.push({ href, label });
    }
  } catch {
    // ignore
  }

  if (tocItems.length === 0) {
    const fallbackSections = (ctx.sections ?? [])
      .filter((section) => section.id && Array.isArray(section.body) && section.body.length > 0)
      .map((section, index) => ({
        href: `#${section.id}`,
        label: section.title || `Section ${index + 1}`,
      }));
    tocItems.push(...fallbackSections);
  }

  if (tips.length > 0) {
    tocItems.push({ href: "#tips", label: tipsTitle });
  }

  if ((ctx.faqs ?? []).length > 0) {
    tocItems.push({ href: "#faqs", label: faqsTitle });
  }

  return {
    hasStructured: intro.length > 0 || sectionsWithBody.length > 0,
    intro,
    sections: sectionsWithBody,
    faqs,
    faqsTitle,
    tips,
    tipsTitle,
    tocItems,
  };
}

const structuredLead = createStructuredLeadWithBuilder({
  guideKey: GUIDE_KEY,
  buildExtras: collectWeekendExtras,
  render: (_context, extras) => {
    if (!extras.hasStructured) return null;
    return (
      <div className="space-y-8">
        {extras.intro.length > 0 ? (
          <div className="space-y-4">
            {extras.intro.map((paragraph, index) => (
              <p key={`intro-${index}`}>{paragraph}</p>
            ))}
          </div>
        ) : null}

        {extras.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-28 space-y-4">
            {section.title ? (
              <h2 className="text-pretty text-2xl font-semibold tracking-tight text-brand-heading">{section.title}</h2>
            ) : null}
            {section.body?.map((paragraph, paragraphIndex) => (
              <p key={`sec-${section.id}-${paragraphIndex}`}>{paragraph}</p>
            ))}
          </section>
        ))}

        {extras.faqs.length > 0 ? (
          <section id="faqs" className="space-y-3">
            <h2 className="text-pretty text-2xl font-semibold tracking-tight text-brand-heading">{extras.faqsTitle}</h2>
            {extras.faqs.map((faq, faqIndex) => (
              <details key={`faq-${faqIndex}`}>
                <summary className="font-medium">{faq.q}</summary>
                {faq.a.map((answer, answerIndex) => (
                  <p key={`ans-${faqIndex}-${answerIndex}`}>{answer}</p>
                ))}
              </details>
            ))}
          </section>
        ) : null}

        {extras.tips.length > 0 ? (
          <section id="tips" className="space-y-3">
            <h2 className="text-pretty text-2xl font-semibold tracking-tight text-brand-heading">{extras.tipsTitle}</h2>
            {extras.tips.map((tip, tipIndex) => (
              <p key={`tip-${tipIndex}`}>{tip}</p>
            ))}
          </section>
        ) : null}
      </div>
    );
  },
  selectTocItems: (extras) => extras.tocItems,
  isStructured: (extras) => extras.hasStructured,
});

const {
  Component,
  clientLoader: routeClientLoader,
  links: routeLinks,
  meta: routeMeta,
} = defineGuideRoute(manifestEntry, {
  template: () => ({
    renderGenericWhenEmpty: true,
    preferManualWhenUnlocalized: true,
    alwaysProvideFaqFallback: false,
    relatedGuides: {
      items: [{ key: "itinerariesPillar" }, { key: "cheapEats" }, { key: "positanoBeaches" }],
    },
    buildTocItems: (context) =>
      structuredLead.structuredArticle.selectTocItems(
        structuredLead.structuredArticle.getExtras(context),
        context,
      ),
    articleLead: structuredLead.articleLead,
  }),
  structuredArticle: structuredLead.structuredArticle,
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
    const path = `/${lang}/${getSlug(baseKey, lang)}/${guideSlug(lang, manifestEntry.key)}`;
    const ogImage = buildCfImageUrl(OG_IMAGE_PATH, {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: ogImage, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
});

export default Component;
export const clientLoader = routeClientLoader;
export const links: LinksFunction = (args) => {
  const resolved = routeLinks(args);
  if (Array.isArray(resolved) && resolved.length > 0) {
    return resolved;
  }
  const payload = ((args ?? {}) as { data?: unknown }).data as { lang?: AppLanguage } | undefined;
  const lang = payload?.lang ?? (i18nConfig.fallbackLng as AppLanguage);
  const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
  const areaSlug = getSlug(baseKey, lang);
  const path = `/${lang}/${areaSlug}/${guideSlug(lang, manifestEntry.key)}`;
  return buildRouteLinks({ lang, path, origin: BASE_URL });
};
export const meta: MetaFunction = (args) => routeMeta(args);