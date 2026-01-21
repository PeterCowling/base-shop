// src/routes/guides/positano-on-a-budget.tsx
import { memo, useCallback } from "react";
import type { LinksFunction,MetaFunction } from "react-router";
import type { TFunction } from "i18next";

import CostBreakdown from "@/components/guides/CostBreakdown";
import GenericContent from "@/components/guides/GenericContent";
import ImageGallery from "@/components/guides/ImageGallery";
import TableOfContents from "@/components/guides/TableOfContents";
import { CfImage } from "@/components/images/CfImage";
import { BASE_URL } from "@/config/site";
import appI18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";
import { OG_IMAGE } from "@/utils/headConstants";
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import GuideSeoTemplate, { type GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import { renderGuideLinkTokens, stripGuideLinkTokens } from "./utils/linkTokens";

export const handle = { tags: ["budgeting", "positano", "travel-tips"] };

export const GUIDE_KEY: GuideKey = "positanoBudget";
export const GUIDE_SLUG = "positano-on-a-budget" as const;
const HERO_IMAGE_PATH = "/img/positano-budget-views.avif" as const;
const HERO_IMAGE_TRANSFORM = { width: 1200, height: 630, quality: 85, format: "auto" } as const;
const GALLERY_SOURCES = [
  { path: "/img/positano-free-view.avif", width: 1200, height: 800 },
  { path: "/img/positano-picnic.avif", width: 1200, height: 800 },
] as const;
const COST_BREAKDOWN_SECTION_ID = "cost-breakdown" as const; // i18n-exempt -- CONTENT-712 [ttl=2026-12-31] Stable anchor

interface GuideSection {
  id: string;
  title: string;
  body: string[];
}

interface GuideFaq {
  q: string;
  a: string[];
}

interface CostBreakdownSlice {
  label: string;
  value: number;
}

interface GalleryItem {
  src: string;
  alt: string;
  caption?: string;
}

interface GuideExtras {
  hasStructured: boolean;
  intro: string[];
  sections: GuideSection[];
  faqs: GuideFaq[];
  faqsTitle?: string;
  faqsFallbackTitle: string;
  tocTitle?: string;
  tocItems: { href: string; label: string }[];
  hero: { alt: string; url: string };
  galleryItems: GalleryItem[];
  costBreakdownTitle?: string;
  costBreakdownSlices: CostBreakdownSlice[];
  costBreakdownFallbackTitle: string;
}

function getGuidesTranslator(locale: string): TFunction<"guides"> {
  return appI18n.getFixedT(locale, "guides") as TFunction<"guides">;
}

const I18N_SEGMENT = /^[A-Za-z0-9_]+$/;

function isLikelyI18nKey(s: string): boolean {
  const v = s.trim();
  if (!v) return false;
  // Treat dotted, space-free tokens as keys (e.g., labels.x, content.slug.title)
  const dottedSegments = v.split(".");
  if (dottedSegments.length > 1 && dottedSegments.every((segment) => I18N_SEGMENT.test(segment))) {
    return true;
  }
  // Common namespace prefixes
  if (v.startsWith("content.") || v.startsWith("labels.") || v.startsWith("meta.")) return true;
  return false;
}

function safeString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed === fallback) return fallback;
  if (isLikelyI18nKey(trimmed)) return fallback;
  return trimmed;
}

function normaliseSections(value: unknown): GuideSection[] {
  return ensureArray<Record<string, unknown>>(value)
    .map((entry, index) => {
      const title = safeString(entry["title"], `Section ${index + 1}`);
      const id = safeString(entry["id"], title.replace(/\s+/g, "-").toLowerCase());
      const body = ensureStringArray(entry["body"]).map((paragraph) => paragraph.trim()).filter(Boolean);
      if (title.length === 0 && body.length === 0) {
        return null;
      }
      return { id, title, body } satisfies GuideSection;
    })
    .filter((section): section is GuideSection => section != null);
}

function normaliseFaqs(value: unknown): GuideFaq[] {
  return ensureArray<Record<string, unknown>>(value)
    .map((entry) => {
      const q = safeString(entry["q"]);
      const a = ensureStringArray(entry["a"])
        .map((answer) => answer.trim())
        .filter((answer) => answer.length > 0);
      if (!q || a.length === 0) {
        return null;
      }
      return { q, a } satisfies GuideFaq;
    })
    .filter((faq): faq is GuideFaq => faq != null);
}

function normaliseCostSlices(value: unknown): CostBreakdownSlice[] {
  const record = value as { slices?: Array<{ label?: unknown; value?: unknown }> } | undefined;
  const slices = Array.isArray(record?.slices) ? record?.slices : [];
  return slices
    .map((slice) => {
      const label = safeString(slice?.label, "");
      const value = Number(slice?.value ?? NaN);
      if (label.length === 0 || !Number.isFinite(value)) {
        return null;
      }
      return { label, value } satisfies CostBreakdownSlice;
    })
    .filter((slice): slice is CostBreakdownSlice => slice != null);
}

function normaliseGalleryItems(value: unknown, heroAlt: string): GalleryItem[] {
  const entries = ensureArray<Record<string, unknown>>(value);
  return GALLERY_SOURCES.map((image, index) => {
    const copy = entries[index] ?? {};
    const alt = safeString(copy["alt"], heroAlt);
    const caption = safeString(copy["caption"]);
    return {
      src: buildCfImageUrl(image.path, { width: image.width, height: image.height, quality: 85, format: "auto" }),
      alt,
      ...(caption ? { caption } : {}),
    } satisfies GalleryItem;
  });
}

function buildGuideExtras(context: GuideSeoTemplateContext): GuideExtras {
  const translate = context.translateGuides;
  const translateEn = getGuidesTranslator("en");

  const intro = ensureStringArray(translate(`content.${GUIDE_KEY}.intro`, { returnObjects: true }));
  const sections = normaliseSections(translate(`content.${GUIDE_KEY}.sections`, { returnObjects: true }));
  const faqs = normaliseFaqs(translate(`content.${GUIDE_KEY}.faqs`, { returnObjects: true }));
  // Prefer localized cost slices; fall back to English when missing/invalid so
  // the section renders with a meaningful heading and legend in tests/runtime.
  let costSlices = normaliseCostSlices(
    translate(`content.${GUIDE_KEY}.costBreakdown`, { returnObjects: true }),
  );
  if (costSlices.length === 0) {
    try {
      costSlices = normaliseCostSlices(
        translateEn(`content.${GUIDE_KEY}.costBreakdown`, { returnObjects: true }) as unknown,
      );
    } catch {
      // ignore; keep empty slices
    }
  }

  const defaultHeroAlt = safeString(translateEn(`content.${GUIDE_KEY}.heroAlt`));
  const heroAlt = safeString(translate(`content.${GUIDE_KEY}.heroAlt`), defaultHeroAlt);
  const galleryItems = normaliseGalleryItems(translate(`content.${GUIDE_KEY}.gallery`, { returnObjects: true }), heroAlt);

  const hasStructured =
    intro.length > 0 || sections.length > 0 || faqs.length > 0 || costSlices.length > 0;

  const tocTitle = safeString(translate(`content.${GUIDE_KEY}.tocTitle`));
  const defaultFaqsTitle = safeString(translateEn(`content.${GUIDE_KEY}.faqsTitle`), "FAQs");
  const faqsTitle = safeString(
    translate(`content.${GUIDE_KEY}.faqsTitle`),
    defaultFaqsTitle || "FAQs",
  );
  const costBreakdownTitle = safeString(translate(`content.${GUIDE_KEY}.costBreakdown.title`));
  const defaultCostBreakdownTitle = safeString(translateEn("labels.costBreakdownTitle"));
  const costBreakdownFallbackTitle = safeString(
    translate("labels.costBreakdownTitle"),
    defaultCostBreakdownTitle,
  );
  const resolvedCostBreakdownLabel = costBreakdownTitle || costBreakdownFallbackTitle;

  const tocItems: GuideExtras["tocItems"] = [];
  sections.forEach((section) => {
    tocItems.push({ href: `#${section.id}`, label: section.title });
  });
  if (costSlices.length > 0 && resolvedCostBreakdownLabel) {
    tocItems.push({ href: `#${COST_BREAKDOWN_SECTION_ID}`, label: resolvedCostBreakdownLabel });
  }
  if (faqs.length > 0 && faqsTitle) {
    tocItems.push({ href: "#faqs", label: faqsTitle });
  }

  return {
    hasStructured,
    intro,
    sections,
    faqs,
    ...(faqsTitle ? { faqsTitle } : {}),
    faqsFallbackTitle: defaultFaqsTitle || "FAQs",
    ...(tocTitle ? { tocTitle } : {}),
    tocItems,
    hero: {
      alt: heroAlt,
      url: buildCfImageUrl(HERO_IMAGE_PATH, HERO_IMAGE_TRANSFORM),
    },
    galleryItems,
    ...(costBreakdownTitle ? { costBreakdownTitle } : {}),
    costBreakdownSlices: costSlices,
    costBreakdownFallbackTitle,
  } satisfies GuideExtras;
}

function PositanoOnABudget(): JSX.Element {
  const buildExtras = useCallback(buildGuideExtras, []);

  const articleLead = useCallback(
    (context: GuideSeoTemplateContext) => {
      const extras = buildExtras(context);
      const costBreakdownHeading = extras.costBreakdownTitle ?? extras.costBreakdownFallbackTitle;
      const faqsHeading = extras.faqsTitle ?? extras.faqsFallbackTitle;

      if (!extras.hasStructured) {
        return (
          <>
            <GenericContent t={context.translator} guideKey={GUIDE_KEY} />
            <CfImage src={HERO_IMAGE_PATH} preset="hero" width={1200} height={630} alt={extras.hero.alt} />
          </>
        );
      }

      return (
        <>
          {extras.intro.map((paragraph, index) => (
            <p key={index}>{renderGuideLinkTokens(paragraph, context.lang, `intro-${index}`)}</p>
          ))}

          {extras.tocItems.length > 0 ? (
            <TableOfContents
              items={extras.tocItems}
              {...(typeof extras.tocTitle === "string" ? { title: extras.tocTitle } : {})}
            />
          ) : null}

          <CfImage src={HERO_IMAGE_PATH} preset="hero" width={1200} height={630} alt={extras.hero.alt} />

          {extras.sections.map((section) => (
            <section key={section.id} id={section.id}>
              <h2>{section.title}</h2>
              {section.body.map((paragraph, index) => (
                <p key={index}>{renderGuideLinkTokens(paragraph, context.lang, `section-${section.id}-${index}`)}</p>
              ))}
            </section>
          ))}

          {extras.costBreakdownSlices.length > 0 ? (
            <section id={COST_BREAKDOWN_SECTION_ID}>
              {costBreakdownHeading ? <h2>{costBreakdownHeading}</h2> : null}
              <CostBreakdown
                slices={extras.costBreakdownSlices}
                title={extras.costBreakdownTitle ?? extras.costBreakdownFallbackTitle}
                lang={context.lang}
              />
            </section>
          ) : null}

          {extras.faqs.length > 0 ? (
            <section id="faqs">
              {faqsHeading ? <h2>{faqsHeading}</h2> : null}
              {extras.faqs.map((faq, index) => (
                <details key={index}>
                  <summary>{faq.q}</summary>
                  {faq.a.map((answer, answerIndex) => (
                    <p key={answerIndex}>{renderGuideLinkTokens(answer, context.lang, `faq-${index}-${answerIndex}`)}</p>
                  ))}
                </details>
              ))}
            </section>
          ) : null}
        </>
      );
    },
    [buildExtras],
  );

  const articleExtras = useCallback(
    (context: GuideSeoTemplateContext) => {
      const extras = buildExtras(context);
      if (extras.galleryItems.length === 0) {
        return null;
      }
      return <ImageGallery items={extras.galleryItems} />;
    },
    [buildExtras],
  );

  const buildTocItems = useCallback(
    (context: GuideSeoTemplateContext) => {
      const extras = buildExtras(context);
      return extras.hasStructured ? extras.tocItems : context.toc;
    },
    [buildExtras],
  );

  const guideFaqFallback = useCallback((targetLang: string): NormalizedFaqEntry[] => {
    const translator = getGuidesTranslator(targetLang);
    const fallback = getGuidesTranslator("en");
    const sanitize = (faqs: GuideFaq[]): NormalizedFaqEntry[] =>
      faqs
        .map(({ q, a }) => {
          const question = q.trim();
          const answer = a
            .map((answer) => stripGuideLinkTokens(answer).trim())
            .filter((value) => value.length > 0);
          if (!question || answer.length === 0) {
            return null;
          }
          return { question, answer } satisfies NormalizedFaqEntry;
        })
        .filter((entry): entry is NormalizedFaqEntry => entry != null);

    const localised = sanitize(normaliseFaqs(translator(`content.${GUIDE_KEY}.faqs`, { returnObjects: true })));
    if (localised.length > 0) return localised;

    return sanitize(normaliseFaqs(fallback(`content.${GUIDE_KEY}.faqs`, { returnObjects: true })));
  }, []);

  return (
    <GuideSeoTemplate
      guideKey={GUIDE_KEY}
      metaKey={GUIDE_KEY}
      ogImage={{ path: HERO_IMAGE_PATH, width: 1200, height: 630, transform: HERO_IMAGE_TRANSFORM }}
      articleLead={articleLead}
      articleExtras={articleExtras}
      buildTocItems={buildTocItems}
      guideFaqFallback={guideFaqFallback}
      renderGenericContent={false}
      relatedGuides={{ items: [{ key: "reachBudget" }, { key: "backpackerItineraries" }, { key: "beaches" }] }}
    />
  );
}

export default memo(PositanoOnABudget);

// Route head: use shared helpers to satisfy SEO lint rules
export const meta: MetaFunction = ({ data }: { data?: unknown } = {}) => {
  const d = (data || {}) as { lang?: string };
  const lang = (d.lang as AppLanguage) || (i18nConfig.fallbackLng as AppLanguage);
  const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, GUIDE_KEY)}`;
  const url = `${BASE_URL}${path}`;
  const image = buildCfImageUrl(HERO_IMAGE_PATH, HERO_IMAGE_TRANSFORM);
  return buildRouteMeta({
    lang,
    title: `guides.meta.${GUIDE_KEY}.title`,
    description: `guides.meta.${GUIDE_KEY}.description`,
    url,
    path,
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
    ogType: "article",
    includeTwitterUrl: true,
  });
};

export const links: LinksFunction = () => buildRouteLinks();
