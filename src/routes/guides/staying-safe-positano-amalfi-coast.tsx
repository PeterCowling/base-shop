// src/routes/guides/staying-safe-positano-amalfi-coast.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import type { GuideLinksArgs } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";

import GenericContent from "@/components/guides/GenericContent";
import type { GuideSeoTemplateContext, NormalisedSection } from "./guide-seo/types";
import getGuideResource from "@/routes/guides/utils/getGuideResource";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { langFromRequest, toAppLanguage } from "@/utils/lang";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import i18n from "@/i18n";
import type { LoaderFunctionArgs } from "react-router-dom";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { BASE_URL } from "@/config/site";
import { getSlug } from "@/utils/slug";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import type { AppLanguage } from "@/i18n.config";

export const handle = { tags: ["safety", "positano", "amalfi", "general-tourists", "solo-travel"] };

export const GUIDE_KEY: GuideKey = "safetyAmalfi";
export const GUIDE_SLUG = "staying-safe-positano-amalfi-coast" as const;

type SectionResource = Partial<Pick<NormalisedSection, "id" | "title" | "body">>;

const ensureStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const toSectionResources = (value: unknown): SectionResource[] => {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    if (!entry || typeof entry !== "object") return {};
    const record = entry as Record<string, unknown>;
    const body = ensureStringArray(record.body);
    return {
      id: typeof record.id === "string" ? record.id : undefined,
      title: typeof record.title === "string" ? record.title : undefined,
      body: body.length > 0 ? body : undefined,
    };
  });
};

const resolveLocalizedSections = (context: GuideSeoTemplateContext): SectionResource[] => {
  const seen = new Set<string | undefined>();
  const order: Array<string | undefined> = [];
  const enqueue = (value: string | undefined) => {
    const normalized =
      typeof value === "string" && value.trim().length > 0 ? value.trim() : typeof value === "string" ? undefined : value;
    if (!seen.has(normalized)) {
      seen.add(normalized);
      order.push(normalized);
    }
  };

  const active = typeof (i18n as { language?: string }).language === "string" ? i18n.language : undefined;
  enqueue(active);
  enqueue(context.lang);
  enqueue(undefined);
  enqueue("en");

  for (const candidate of order) {
    try {
      const raw = getGuideResource<unknown[]>(candidate, `content.${GUIDE_KEY}.sections`, { includeFallback: false });
      const normalized = toSectionResources(raw);
      if (normalized.length > 0) {
        return normalized;
      }
    } catch {
      // continue
    }
  }
  return [];
};

const resolveLocalizedSections = (context: GuideSeoTemplateContext): SectionResource[] => {
  const pushCandidate = (order: Array<string | undefined>, seen: Set<string | undefined>, value: string | undefined) => {
    const normalized =
      typeof value === "string" && value.trim().length > 0 ? value.trim() : typeof value === "string" ? undefined : value;
    if (!seen.has(normalized)) {
      seen.add(normalized);
      order.push(normalized);
    }
  };

  const order: Array<string | undefined> = [];
  const seen = new Set<string | undefined>();
  const activeLang = typeof (i18n as { language?: string }).language === "string" ? i18n.language : undefined;
  pushCandidate(order, seen, activeLang);
  pushCandidate(order, seen, context.lang);
  pushCandidate(order, seen, undefined);
  pushCandidate(order, seen, "en");

  for (const candidate of order) {
    try {
      const raw = getGuideResource<unknown[]>(candidate, `content.${GUIDE_KEY}.sections`, { includeFallback: false });
      const normalized = toSectionResources(raw);
      if (normalized.length > 0) {
        return normalized;
      }
    } catch {
      // ignore and continue
    }
  }
  return [];
};

type SafetyExtras = {
  hasStructured: boolean;
  intro: string[];
  sections: SectionResource[];
  faqs: Array<{ q: string; a: string[] }>;
  rawSections: SectionResource[];
};

function collectSafetyExtras(context: GuideSeoTemplateContext): SafetyExtras {
  const intro = Array.isArray(context.intro) ? context.intro : [];
  const sections =
    Array.isArray(context.sections) && context.sections.length > 0
      ? context.sections.map<SectionResource>(({ id, title, body }) => ({
          id,
          title,
          body,
        }))
      : [];
  const faqs =
    Array.isArray(context.faqs) && context.faqs.length > 0
      ? context.faqs.map((faq) => ({
          q: typeof faq?.q === "string" ? faq.q.trim() : "",
          a: ensureStringArray(faq?.a),
        }))
      : [];
  const hasStructured = Boolean(
    context.hasLocalizedContent && (intro.length > 0 || sections.length > 0 || faqs.some((faq) => faq.q)),
  );
  const rawSections = hasStructured ? resolveLocalizedSections(context) : [];
  return {
    hasStructured,
    intro,
    sections,
    faqs,
    rawSections,
  };
}

function renderStructuredSafetyArticle(extras: SafetyExtras, context: GuideSeoTemplateContext): JSX.Element {
  const { intro, sections, faqs, rawSections } = extras;
  return (
    <>
      {intro.length > 0 ? (
        <div className="space-y-4">
          {intro.map((paragraph, index) => (
            <p key={`intro-${index}`}>{paragraph}</p>
          ))}
        </div>
      ) : null}
      {sections.length > 0
        ? sections
            .map((section, index) => {
              const title = typeof section?.title === "string" ? section.title.trim() : "";
              const body = ensureStringArray(section?.body);
              if (!title && body.length === 0) return null;
              const rawId = (() => {
                const candidate = rawSections[index]?.id;
                if (typeof candidate === "string") return candidate.trim();
                return "";
              })();
              const id = rawId.length > 0 ? rawId : `section-${index + 1}`;
              return (
                <section key={id} id={id} className="space-y-4">
                  <h2>{title || context.translator?.(`content.${GUIDE_KEY}.toc.section`) || `Section ${index + 1}`}</h2>
                  {body.map((paragraph, idx) => (
                    <p key={`section-${id}-${idx}`}>{paragraph}</p>
                  ))}
                </section>
              );
            })
            .filter(Boolean)
        : null}
      {faqs.length > 0 ? (
        <section id="faqs" className="space-y-3">
          <h2>{context.translateGuides(`content.${GUIDE_KEY}.toc.faqs`) as string}</h2>
          {faqs
            .map((faq, index) => {
              const q = faq.q;
              const a = ensureStringArray(faq.a);
              if (!q) return null;
              return (
                <details key={`faq-${index}`}>
                  <summary>{q}</summary>
                  {a.map((ans, idx) => (
                    <p key={`faq-${index}-${idx}`}>{ans}</p>
                  ))}
                </details>
              );
            })
            .filter(Boolean)}
        </section>
      ) : null}
    </>
  );
}

function selectSafetyTocItems(extras: SafetyExtras, context: GuideSeoTemplateContext) {
  if (!extras.hasStructured) return null;
  const source = extras.rawSections.length > 0 ? extras.rawSections : extras.sections;
  if (source.length === 0) return null;

  const items = source
    .map((section, index) => {
      const idRaw = typeof section?.id === "string" ? section.id.trim() : "";
      const normalizedId = idRaw.length > 0 ? idRaw : `section-${index + 1}`;
      const href = /^section-\d+$/.test(normalizedId) ? `#section-${index + 1}` : `#${normalizedId}`;
      const titleRaw = typeof section?.title === "string" ? section.title.trim() : "";
      let fallbackBase = "Section";
      const localized = (() => {
        try {
          return context.translator?.(`content.${GUIDE_KEY}.toc.section`);
        } catch {
          return undefined;
        }
      })();
      if (
        typeof localized === "string" &&
        localized.trim().length > 0 &&
        localized !== `content.${GUIDE_KEY}.toc.section` &&
        localized.trim() !== String(GUIDE_KEY) &&
        !localized.trim().startsWith("content.")
      ) {
        fallbackBase = localized.trim();
      }
      const label = titleRaw.length > 0 ? titleRaw : `${fallbackBase} ${index + 1}`;
      return { href, label };
    })
    .filter(Boolean);

  const faqs = extras.faqs;
  const hasFaqAnchor = items.some((item) => item.href === "#faqs");
  if (faqs.length > 0 && !hasFaqAnchor) {
    const label = (context.translateGuides(`content.${GUIDE_KEY}.toc.faqs`) as string) ?? "FAQs";
    items.push({ href: "#faqs", label });
  }

  return items.length > 0 ? items : null;
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for safetyAmalfi");
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    renderGenericContent: false,
    showTocWhenUnlocalized: false,
    articleExtras: (context: GuideSeoTemplateContext) => {
      const extras = collectSafetyExtras(context);
      if (extras.hasStructured) {
        return renderStructuredSafetyArticle(extras, context);
      }
      return <GenericContent guideKey={GUIDE_KEY} t={context.translateGuides} showToc={false} />;
    },
    buildTocItems: (context: GuideSeoTemplateContext) => {
      const extras = collectSafetyExtras(context);
      const items = selectSafetyTocItems(extras, context);
      return Array.isArray(items) ? items : [];
    },
  }),
  clientLoader: async ({ request }: LoaderFunctionArgs) => {
    const lang = langFromRequest(request);
    await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
    await i18n.changeLanguage(lang);
    await ensureGuideContent(lang, "safetyAmalfi", {
      en: async () => {
        try {
          return await import("../../locales/en/guides/content/safetyAmalfi.json");
        } catch {
          try {
            return await import("../../locales/en/guides/content/stayingSafePositano.json");
          } catch {
            return {} as unknown;
          }
        }
      },
      local:
        lang === "en"
          ? undefined
          : async () => {
              try {
                return await import(`../../locales/${lang}/guides/content/safetyAmalfi.json`);
              } catch {
                try {
                  return await import(`../../locales/${lang}/guides/content/stayingSafePositano.json`);
                } catch {
                  return {} as unknown;
                }
              }
            },
    });
    return { lang };
  },
  meta: ({ data }, entry) => {
    const lang = ((data as { lang?: string } | undefined)?.lang ?? "en") as AppLanguage;
    const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, GUIDE_KEY)}`;
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });

    const pick = (val: unknown, key: string): string | undefined => {
      if (typeof val !== "string") return undefined;
      const v = val.trim();
      if (!v || v === key) return undefined;
      return v;
    };

    const t = i18n.getFixedT?.(lang, "guides");
    const tEn = i18n.getFixedT?.("en", "guides");
    const metaTitleKey = `meta.${entry.metaKey ?? entry.key}.title`;
    const metaDescKey = `meta.${entry.metaKey ?? entry.key}.description`;
    const seoTitleKey = `content.${entry.contentKey}.seo.title`;
    const seoDescKey = `content.${entry.contentKey}.seo.description`;

    const title =
      pick(t?.(metaTitleKey), metaTitleKey) ||
      pick(t?.(seoTitleKey), seoTitleKey) ||
      pick(tEn?.(seoTitleKey), seoTitleKey) ||
      entry.key;
    const description =
      pick(t?.(metaDescKey), metaDescKey) ||
      pick(t?.(seoDescKey), seoDescKey) ||
      pick(tEn?.(seoDescKey), seoDescKey) ||
      "";

    return buildRouteMeta({
      lang,
      title,
      description,
      url,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
    });
  },
  links: (args, _entry, base) => base,
});

export default Component;
export { clientLoader, meta, links };