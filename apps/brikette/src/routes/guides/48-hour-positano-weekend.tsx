// src/routes/guides/48-hour-positano-weekend.tsx
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import { toAppLanguage } from "@/utils/lang";
import type { LinksFunction } from "react-router";

import { ensureCanonicalLinkCluster } from "./ensureCanonicalLinkCluster";

export const handle = { tags: ["itinerary", "positano", "weekend"] };

export const GUIDE_KEY: GuideKey = "weekend48Positano";
export const GUIDE_SLUG = "48-hour-positano-weekend" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for weekend48Positano"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only invariant surfaced in build logs
}

const fallbackLangFromConfig = (() => {
  const value = i18nConfig.fallbackLng as unknown;
  if (typeof value === "string" && value) return value;
  if (Array.isArray(value)) {
    const candidate = (value as unknown[]).find((entry): entry is string => typeof entry === "string" && entry.length > 0);
    if (candidate) return candidate;
  }
  if (value && typeof value === "object") {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      if (typeof entry === "string" && entry.length > 0) return entry;
      if (Array.isArray(entry)) {
        const candidate = entry.find((item): item is string => typeof item === "string" && item.length > 0);
        if (candidate) return candidate;
      }
    }
  }
  return "en";
})();

const OG_IMAGE_PATH = "/img/hostel-communal-terrace-lush-view.webp";

const LABEL_FALLBACKS: Record<string, string> = {
  "labels.tipsHeading": "Tips",
  "labels.faqsHeading": "FAQs",
};

const resolveLabelFallback = (key: string): string => LABEL_FALLBACKS[key] ?? key;

function buildArticleLead(ctx: GuideSeoTemplateContext) {
  const hasIntro = Array.isArray(ctx.intro) && ctx.intro.length > 0;
  const sectionsWithBody = (ctx.sections ?? []).filter(
    (section) => Array.isArray(section.body) && section.body.length > 0,
  );
  if (!ctx.hasLocalizedContent || (!hasIntro && sectionsWithBody.length === 0)) {
    return null;
  }

  const translator = ctx.translateGuides ?? ctx.translator;
  const translatorEn = ctx.translateGuidesEn ?? ctx.translator;
  const resolveGuideLabel = (key: string, fallback: string): string => {
    try {
      const raw = translator?.(key) as unknown;
      const value = typeof raw === "string" ? raw.trim() : "";
      if (value && value !== key && value !== GUIDE_KEY) return value;
    } catch {
      // ignore
    }
    try {
      const rawEn = translatorEn?.(key) as unknown;
      const valueEn = typeof rawEn === "string" ? rawEn.trim() : "";
      if (valueEn && valueEn !== key && valueEn !== GUIDE_KEY) return valueEn;
    } catch {
      // ignore
    }
    return fallback;
  };
  const fallbackFaqHeading = resolveGuideLabel("labels.faqsHeading", resolveLabelFallback("labels.faqsHeading"));
  const fallbackTipsHeading = resolveGuideLabel("labels.tipsHeading", resolveLabelFallback("labels.tipsHeading"));

  const safeFaqs = (() => {
    try {
      const raw = translator?.(`content.${GUIDE_KEY}.faqs`, { returnObjects: true }) as unknown;
      const arr = Array.isArray(raw) ? (raw as Array<{ q?: unknown; a?: unknown }>) : [];
      return arr
        .map((faq) => {
          const q = typeof faq?.q === "string" ? faq.q.trim() : "";
          const a = Array.isArray(faq?.a)
            ? (faq!.a as unknown[])
                .filter((answer): answer is string => typeof answer === "string" && answer.trim().length > 0)
                .map((answer) => answer.trim())
            : [];
          return q && a.length > 0 ? { q, a } : null;
        })
        .filter((faq): faq is { q: string; a: string[] } => faq != null);
    } catch {
      return [];
    }
  })();

  const safeTips = (() => {
    try {
      const raw = translator?.(`content.${GUIDE_KEY}.tips`, { returnObjects: true }) as unknown;
      return Array.isArray(raw)
        ? (raw as unknown[]).filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        : [];
    } catch {
      return [];
    }
  })();

  const resolveHeading = (key: string, fallback: string) => {
    try {
      const raw = translator?.(key) as unknown;
      const value = typeof raw === "string" ? raw.trim() : "";
      if (value && value !== key && value !== GUIDE_KEY) return value;
    } catch {
      // ignore
    }
    return fallback;
  };

  return (
    <div className="space-y-8">
      {hasIntro ? (
        <div className="space-y-4">
          {ctx.intro.map((paragraph, index) => (
            <p key={`intro-${index}`}>{paragraph}</p>
          ))}
        </div>
      ) : null}

      {sectionsWithBody.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-28 space-y-4">
          {section.title ? (
            <h2 className="text-pretty text-2xl font-semibold tracking-tight text-brand-heading">{section.title}</h2>
          ) : null}
          {section.body.map((paragraph, paragraphIndex) => (
            <p key={`sec-${section.id}-${paragraphIndex}`}>{paragraph}</p>
          ))}
        </section>
      ))}

      {safeFaqs.length > 0 ? (
        <section id="faqs" className="space-y-3">
          <h2 className="text-pretty text-2xl font-semibold tracking-tight text-brand-heading">
            {resolveHeading(`content.${GUIDE_KEY}.faqsTitle`, fallbackFaqHeading)}
          </h2>
          {safeFaqs.map((faq, faqIndex) => (
            <details key={`faq-${faqIndex}`}>
              <summary className="font-medium">{faq.q}</summary>
              {faq.a.map((answer, answerIndex) => (
                <p key={`ans-${faqIndex}-${answerIndex}`}>{answer}</p>
              ))}
            </details>
          ))}
        </section>
      ) : null}

      {safeTips.length > 0 ? (
        <section id="tips" className="space-y-3">
          <h2 className="text-pretty text-2xl font-semibold tracking-tight text-brand-heading">
            {resolveHeading(`content.${GUIDE_KEY}.tipsTitle`, fallbackTipsHeading)}
          </h2>
          {safeTips.map((tip, tipIndex) => (
            <p key={`tip-${tipIndex}`}>{tip}</p>
          ))}
        </section>
      ) : null}
    </div>
  );
}

const { Component, clientLoader, links: routeLinks, meta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    renderGenericWhenEmpty: true,
    relatedGuides: {
      items: [{ key: "itinerariesPillar" }, { key: "cheapEats" }, { key: "positanoBeaches" }],
    },
    articleLead: buildArticleLead,
    buildTocItems: (ctx) => {
      const translator = ctx.translateGuides ?? ctx.translator;
      const translatorEn = ctx.translateGuidesEn ?? ctx.translator;
      const resolveLabel = (key: string, fallback: string): string => {
        try {
          const raw = translator?.(key) as unknown;
          const text = typeof raw === "string" ? raw.trim() : "";
          if (text && text !== key && text !== GUIDE_KEY) return text;
        } catch {
          // ignore
        }
        try {
          const rawEn = translatorEn?.(key) as unknown;
          const textEn = typeof rawEn === "string" ? rawEn.trim() : "";
          if (textEn && textEn !== key && textEn !== GUIDE_KEY) return textEn;
        } catch {
          // ignore
        }
        return fallback;
      };
      const fallbackTipsLabel = resolveLabel("labels.tipsHeading", resolveLabelFallback("labels.tipsHeading"));
      const fallbackFaqLabel = resolveLabel("labels.faqsHeading", resolveLabelFallback("labels.faqsHeading"));
      const items: Array<{ href: string; label: string }> = [];

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
          items.push({ href, label });
        }
      } catch {
        // ignore
      }

      const fallbackSectionLabel = (position: number): string => {
        const fallback = `Section ${position}`; // i18n-exempt -- TECH-000 [ttl=2026-12-31] safety fallback when translations fail
        try {
          const raw = translator?.("labels.sectionFallback", { position }) as unknown;
          const text = typeof raw === "string" ? raw.trim() : "";
          if (text && text !== "labels.sectionFallback" && text !== GUIDE_KEY) return text;
        } catch {
          // ignore
        }
        try {
          const rawEn = translatorEn?.("labels.sectionFallback", { position }) as unknown;
          const textEn = typeof rawEn === "string" ? rawEn.trim() : "";
          if (textEn && textEn !== "labels.sectionFallback" && textEn !== GUIDE_KEY) return textEn;
        } catch {
          // ignore
        }
        return fallback;
      };

      if (items.length === 0) {
        const fallbackSections = (ctx.sections ?? [])
          .filter((section) => section.id && Array.isArray(section.body) && section.body.length > 0)
          .map((section, index) => ({
            href: `#${section.id}`,
            label: section.title || fallbackSectionLabel(index + 1),
          }));
        items.push(...fallbackSections);
      }

      const safeTips = (() => {
        try {
          const raw = translator?.(`content.${GUIDE_KEY}.tips`, { returnObjects: true }) as unknown;
          return Array.isArray(raw)
            ? (raw as unknown[]).filter((value): value is string => typeof value === "string" && value.trim().length > 0)
            : [];
        } catch {
          return [];
        }
      })();

      if (safeTips.length > 0) {
        const heading = (() => {
          try {
            const raw = translator?.(`content.${GUIDE_KEY}.tipsTitle`) as unknown;
            const text = typeof raw === "string" ? raw.trim() : "";
            if (text && text !== `content.${GUIDE_KEY}.tipsTitle`) return text;
          } catch {
            // ignore
          }
          return fallbackTipsLabel;
        })();
        items.push({ href: "#tips", label: heading });
      }

      if ((ctx.faqs ?? []).length > 0) {
        const faqLabel = (() => {
          try {
            const rawSpecific = translator?.(`content.${GUIDE_KEY}.faqsTitle`) as unknown;
            const specific = typeof rawSpecific === "string" ? rawSpecific.trim() : "";
            if (specific && specific !== `content.${GUIDE_KEY}.faqsTitle` && specific !== GUIDE_KEY) {
              return specific;
            }
            const generic = translator?.("labels.faqsHeading") as unknown;
            const genericText = typeof generic === "string" ? generic.trim() : "";
            if (genericText && genericText !== "labels.faqsHeading") return genericText;
          } catch {
            // ignore
          }
          return fallbackFaqLabel;
        })();
        items.push({ href: "#faqs", label: faqLabel });
      }

      return items;
    },
  }),
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
export { clientLoader, meta };

const resolveLangFromLinksArgs = (
  args: Parameters<LinksFunction>[0] | undefined,
): AppLanguage => {
  const dataLang = (args && typeof args === "object" ? (args as { data?: { lang?: string } }).data?.lang : undefined) ??
    undefined;
  const paramsLang =
    (args && typeof args === "object" ? (args as { params?: { lang?: string } }).params?.["lang"] : undefined) ?? undefined;
  const langValue = typeof dataLang === "string" ? dataLang : typeof paramsLang === "string" ? paramsLang : undefined;
  return toAppLanguage(langValue ?? fallbackLangFromConfig);
};

const resolveOriginFromRequest = (request: Request | undefined): string => {
  if (!request) return BASE_URL;
  try {
    return new URL(request.url).origin;
  } catch {
    return BASE_URL;
  }
};

export const links = ((...args: Parameters<LinksFunction>) => {
  const [firstArg] = args;
  const descriptors = routeLinks(...args);
  return ensureCanonicalLinkCluster(descriptors, () => {
    const lang = resolveLangFromLinksArgs(firstArg);
    const areaSlug = getSlug(guideAreaToSlugKey(manifestEntry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, manifestEntry.key)}`;
    const request = firstArg?.request instanceof Request ? firstArg.request : undefined;
    const origin = resolveOriginFromRequest(request);
    return buildRouteLinks({ lang, path, origin });
  });
}) satisfies LinksFunction;
