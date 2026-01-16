// src/routes/guides/off-season-long-stay-tips.tsx
import { defineGuideRoute, createStructuredLeadWithBuilder } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

import TableOfContents from "@/components/guides/TableOfContents";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideAbsoluteUrl, guideHref } from "@/routes.guides-helpers";
import getGuideResource from "@/routes/guides/utils/getGuideResource";
import { OG_IMAGE } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { BASE_URL } from "@/config/site";

export const handle = { tags: ["digital-nomads", "off-season", "positano"] };

export const GUIDE_KEY = "offSeasonLongStay" as const satisfies GuideKey;
export const GUIDE_SLUG = "off-season-long-stay-tips-positano" as const;

type OffSeasonLeadExtras = ReturnType<typeof normaliseFallbackContent> & {
  shouldRenderFallback: boolean;
};

let lastFaqEntries: Array<{ q: string; a: string }> = [];

function updateLastFaqEntries(context: GuideSeoTemplateContext): void {
  if (!Array.isArray(context.faqs)) return;
  lastFaqEntries = context.faqs
    .map((faq) => {
      const question = typeof faq?.q === "string" ? faq.q.trim() : "";
      const answer = Array.isArray(faq?.a) && typeof faq.a[0] === "string" ? faq.a[0].trim() : "";
      return question && answer ? { q: question, a: answer } : null;
    })
    .filter((entry): entry is { q: string; a: string } => entry != null);
}

function collectOffSeasonLeadExtras(context: GuideSeoTemplateContext): OffSeasonLeadExtras {
  try {
    const introLocal = context.translator(`content.${GUIDE_KEY}.intro`, { returnObjects: true }) as unknown;
    const sectionsLocal = context.translator(`content.${GUIDE_KEY}.sections`, { returnObjects: true }) as unknown;
    const hasLocalizedIntro = Array.isArray(introLocal) && introLocal.length > 0;
    const hasLocalizedSections = Array.isArray(sectionsLocal) && sectionsLocal.length > 0;

    const fallbackRaw = context.translator(`content.${GUIDE_KEY}.fallback`, { returnObjects: true }) as unknown;
    const fallback = normaliseFallbackContent(fallbackRaw);
    const hasAny =
      fallback.intro.length > 0 ||
      fallback.toc.length > 0 ||
      fallback.sections.length > 0 ||
      fallback.faqs.length > 0;
    const shouldRenderFallback = !hasLocalizedIntro && !hasLocalizedSections && hasAny;

    return { ...fallback, shouldRenderFallback };
  } catch {
    return {
      intro: [],
      toc: [],
      tocTitle: undefined,
      sections: [],
      faqsTitle: undefined,
      faqs: [],
      shouldRenderFallback: false,
    };
  }
}

function renderManualFallback(
  context: GuideSeoTemplateContext,
  buildExtras: (context: GuideSeoTemplateContext) => OffSeasonLeadExtras,
): JSX.Element | null {
  const fallback = buildExtras(context);
  if (!fallback.shouldRenderFallback) return null;

  updateLastFaqEntries(context);

  return (
    <>
      {fallback.intro.length > 0 ? (
        <div className="space-y-4">
          {fallback.intro.map((paragraph, index) => (
            <p key={`fallback-intro-${index}`}>{paragraph}</p>
          ))}
        </div>
      ) : null}
      {fallback.toc.length > 0 ? <TableOfContents items={fallback.toc} title={fallback.tocTitle} /> : null}
      {fallback.sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-28 space-y-4">
          {section.title ? <h2 className="text-xl font-semibold">{section.title}</h2> : null}
          {section.body.map((paragraph, index) => (
            <p key={`${section.id}-body-${index}`}>{paragraph}</p>
          ))}
        </section>
      ))}
      {context.hasLocalizedContent
        ? null
        : fallback.faqs.length > 0
          ? (
              <section id="faqs" className="space-y-4">
                <h2 className="text-xl font-semibold">{fallback.faqsTitle ?? "FAQs"}</h2>
                <div className="space-y-3">
                  {fallback.faqs.map((faq, index) => (
                    <details key={`fallback-faq-${index}`}>
                      <summary className="font-medium">{faq.q}</summary>
                      {faq.a.map((answer, answerIndex) => (
                        <p key={`fallback-faq-${index}-answer-${answerIndex}`}>{answer}</p>
                      ))}
                    </details>
                  ))}
                </div>
              </section>
            )
          : null}
    </>
  );
}

function createGuideFaqFallback(): (lang: string) => Array<{ q: string; a: string }> | undefined {
  return (langParam: string) => {
    if (lastFaqEntries.length > 0) return lastFaqEntries;

    const localizedRaw = getGuideResource<Array<{ q?: unknown; a?: unknown }>>(
      langParam,
      `content.${GUIDE_KEY}.faq`,
      { includeFallback: false },
    );
    const localized = filterFaqEntries(Array.isArray(localizedRaw) ? localizedRaw : []);
    if (localized.length > 0) return localized;

    const fallbackRaw = getGuideResource<Array<{ q?: unknown; a?: unknown }>>(
      langParam,
      `content.${GUIDE_KEY}.faq`,
      { includeFallback: true },
    );
    const fallback = filterFaqEntries(Array.isArray(fallbackRaw) ? fallbackRaw : []);
    return fallback.length > 0 ? fallback : undefined;
  };
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for offSeasonLongStay");
}

const offSeasonStructuredLead = createStructuredLeadWithBuilder({
  guideKey: GUIDE_KEY,
  buildExtras: (context) => collectOffSeasonLeadExtras(context),
  render: (context, extras) => renderManualFallback(context, extras),
  selectTocItems: (extras) => (extras.shouldRenderFallback ? extras.toc : []),
  isStructured: (extras) => extras.shouldRenderFallback,
});

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    renderGenericContent: true,
    articleLead: offSeasonStructuredLead.articleLead,
    guideFaqFallback: createGuideFaqFallback(),
    relatedGuides: { items: manifestEntry.relatedGuides.map((key) => ({ key })) },
  }),
  structuredArticle: offSeasonStructuredLead.structuredArticle,
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const path = guideHref(lang, manifestEntry.key);
    const url = guideAbsoluteUrl(lang, manifestEntry.key);
    const imageSrc = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url,
      path,
      image: { src: imageSrc, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
  links: (args) => {
    const payload = ((args ?? {}) as { data?: unknown }).data as { lang?: string } | undefined;
    const lang = toAppLanguage(payload?.lang);
    const path = guideHref(lang, manifestEntry.key);
    return buildRouteLinks({ lang, path, origin: BASE_URL });
  },
});

export default Component;
export { clientLoader, meta, links };

export function filterFaqEntries(entries: Array<{ q?: unknown; a?: unknown }>): Array<{ q: string; a: string }> {
  const filtered: Array<{ q: string; a: string }> = [];
  for (const entry of entries) {
    const q = typeof entry?.q === "string" ? entry.q.trim() : "";
    const a = typeof entry?.a === "string" ? entry.a.trim() : "";
    if (!q || !a) continue;
    filtered.push({ q, a });
  }
  return filtered;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function toStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    const v = value.trim();
    return v ? [v] : [];
  }
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const v of value) {
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (trimmed) out.push(trimmed);
  }
  return out;
}

type TocEntry = { href: string; label: string };
type Section = { id: string; title: string; body: string[] };
type Faq = { q: string; a: string[] };

export function normaliseToc(value: unknown): TocEntry[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: TocEntry[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const hrefRaw = item["href"];
    const labelRaw = item["label"];
    const href = typeof hrefRaw === "string" ? hrefRaw.trim() : "";
    const label = typeof labelRaw === "string" ? labelRaw.trim() : "";
    if (!href || !label) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    result.push({ href, label });
  }
  return result;
}

export function normaliseSections(value: unknown): Section[] {
  if (!Array.isArray(value)) return [];
  const result: Section[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const idRaw = item["id"];
    const titleRaw = item["title"];
    const bodyRaw = item["body"];
    const id = typeof idRaw === "string" ? idRaw.trim() : "";
    const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
    if (!id || !title) continue;
    let body: string[] = [];
    if (Array.isArray(bodyRaw)) {
      body = bodyRaw
        .map((v) => (typeof v === "string" ? v.trim() : null))
        .filter((v): v is string => !!v);
    } else if (typeof bodyRaw === "string") {
      const trimmed = bodyRaw.trim();
      if (trimmed) {
        body = [trimmed];
      }
    }
    result.push({ id, title, body });
  }
  return result;
}

export function normaliseFaqs(value: unknown): Faq[] {
  if (!Array.isArray(value)) return [];
  const result: Faq[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const qRaw = item["q"];
    const aRaw = item["a"];
    const q = typeof qRaw === "string" ? qRaw.trim() : "";
    let a: string[] = [];
    if (Array.isArray(aRaw)) {
      a = aRaw
        .map((v) => (typeof v === "string" ? v.trim() : null))
        .filter((v): v is string => !!v);
    } else if (typeof aRaw === "string") {
      const trimmed = aRaw.trim();
      if (trimmed) {
        a = [trimmed];
      }
    }
    if (!q || a.length === 0) continue;
    result.push({ q, a });
  }
  return result;
}

export function normaliseFallbackContent(value: unknown): {
  intro: string[];
  toc: TocEntry[];
  tocTitle: string | undefined;
  sections: Section[];
  faqsTitle: string | undefined;
  faqs: Faq[];
} {
  if (!isRecord(value)) {
    return { intro: [], toc: [], tocTitle: undefined, sections: [], faqsTitle: undefined, faqs: [] };
  }
  const intro = toStringArray(value["intro"]);
  const toc = normaliseToc(value["toc"]);
  const tocTitleRaw = value["tocTitle"];
  const tocTitle = typeof tocTitleRaw === "string" ? tocTitleRaw.trim() || undefined : undefined;
  const sections = normaliseSections(value["sections"]);
  const faqsTitleRaw = value["faqsTitle"];
  const faqsTitle = typeof faqsTitleRaw === "string" ? faqsTitleRaw.trim() || undefined : undefined;
  const faqs = normaliseFaqs(value["faqs"]);

  return { intro, toc, tocTitle, sections, faqsTitle, faqs };
}