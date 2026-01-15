// src/routes/guides/work-exchange-in-italian-hostels.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import type { GuideLinksArgs } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

import "@/routes/guides/_GuideSeoTemplate";

import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { OG_IMAGE } from "@/utils/headConstants";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { getSlug } from "@/utils/slug";
import getGuideResource from "@/routes/guides/utils/getGuideResource";
import { renderGuideLinkTokens } from "./utils/linkTokens";
import type { GuideSeoTemplateContext, NormalisedFaq, NormalisedSection, TocItem } from "./guide-seo/types";
import TableOfContents from "@/components/guides/TableOfContents";

export const handle = { tags: ["work-exchange", "hostel-life", "italy"] };

export const GUIDE_KEY: GuideKey = "workExchangeItaly";
export const GUIDE_SLUG = "work-exchange-in-italian-hostels" as const;

const OG_IMAGE_PATH = "/img/hostel-communal-terrace-lush-view.webp";

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error(`missing-guide-manifest-entry:${GUIDE_KEY}`);
}

function collectAnswers(source: unknown): string[] {
  const answers: string[] = [];
  const visit = (value: unknown) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) answers.push(trimmed);
      return;
    }
    if (Array.isArray(value)) {
      for (const entry of value) visit(entry);
    }
  };
  visit(source);
  return answers;
}

function normalizeFaqEntries(raw: unknown): NormalisedFaq[] {
  const entries: NormalisedFaq[] = [];
  const visit = (item: unknown) => {
    if (Array.isArray(item)) {
      for (const entry of item) visit(entry);
      return;
    }
    if (!item || typeof item !== "object") return;
    const record = item as Record<string, unknown>;
    const qSource =
      typeof record.q === "string"
        ? record.q
        : typeof record.question === "string"
          ? record.question
          : "";
    const question = qSource.trim();
    if (!question) return;
    const answerSource = ("a" in record ? record.a : undefined) ?? ("answer" in record ? record.answer : undefined);
    const answers = collectAnswers(answerSource);
    if (answers.length === 0) return;
    entries.push({ q: question, a: answers });
  };
  visit(raw);
  return entries;
}

function dedupeFaqs(entries: NormalisedFaq[]): NormalisedFaq[] {
  const seen = new Set<string>();
  const unique: NormalisedFaq[] = [];
  for (const entry of entries) {
    const key = `${entry.q}::${entry.a.join("|")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(entry);
  }
  return unique;
}

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function extractStringList(value: unknown): string[] {
  const result: string[] = [];
  const visit = (candidate: unknown) => {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed.length > 0) result.push(trimmed);
      return;
    }
    if (Array.isArray(candidate)) {
      for (const entry of candidate) visit(entry);
      return;
    }
    if (candidate && typeof candidate === "object") {
      for (const entry of Object.values(candidate as Record<string, unknown>)) {
        visit(entry);
      }
    }
  };
  visit(value);
  return result;
}

function collectParagraphs(value: unknown): string[] {
  const result: string[] = [];
  const visit = (candidate: unknown) => {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed.length > 0) result.push(trimmed);
      return;
    }
    if (Array.isArray(candidate)) {
      for (const entry of candidate) visit(entry);
    }
  };
  visit(value);
  return result;
}

function collectParagraphs(value: unknown): string[] {
  const result: string[] = [];
  const visit = (candidate: unknown) => {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed.length > 0) result.push(trimmed);
      return;
    }
    if (Array.isArray(candidate)) {
      for (const entry of candidate) visit(entry);
    }
  };
  visit(value);
  return result;
}

function buildIntroParagraphs(context: GuideSeoTemplateContext): string[] {
  const localized = extractStringList(
    getGuideResource(context.lang, `content.${GUIDE_KEY}.intro`, { includeFallback: false }),
  );
  if (localized.length > 0) return localized;

  const fromContext = Array.isArray(context.intro)
    ? context.intro
        .map((paragraph) => (typeof paragraph === "string" ? paragraph.trim() : ""))
        .filter((paragraph) => paragraph.length > 0)
    : [];
  if (fromContext.length > 0) return fromContext;

  const fallbackLocalized = extractStringList(
    getGuideResource(context.lang, `content.${GUIDE_KEY}.intro`, { includeFallback: true }),
  );
  if (fallbackLocalized.length > 0) return fallbackLocalized;

  const english = extractStringList(getGuideResource("en", `content.${GUIDE_KEY}.intro`, { includeFallback: false }));
  return english;
}

function parseLocalizedSection(
  entry: unknown,
  index: number,
): (NormalisedSection & { body: string[] }) | null {
  if (!entry || typeof entry !== "object") return null;
  const record = entry as Record<string, unknown>;
  const idRaw = record.id;
  const titleRaw = record.title;
  let id = "";
  if (typeof idRaw === "string") {
    id = idRaw.trim();
  } else if (typeof idRaw === "number" && Number.isFinite(idRaw)) {
    id = `section-${idRaw}`;
  }
  const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
  const body = [
    ...collectParagraphs(record.body),
    ...collectParagraphs(record.paragraphs),
    ...collectParagraphs(record.list),
  ];
  const includeInToc = Boolean(id || title);
  if (!title && body.length === 0) return null;
  const key =
    typeof record.key === "string" && record.key.trim().length > 0
      ? record.key.trim()
      : id || (title ? title.replace(/\s+/g, "-").toLowerCase() : `section-${index + 1}`);
  const labelRaw =
    typeof record.label === "string" && record.label.trim().length > 0 ? record.label.trim() : undefined;
  const label = labelRaw ?? title ?? `Section ${index + 1}`;
  return {
    id: id.length > 0 ? id : key,
    key,
    title,
    label,
    body,
    includeInToc,
  };
}

function resolveFaqLabel(context: GuideSeoTemplateContext): string {
  const translator = context.translateGuides;
  const keys = [
    `content.${GUIDE_KEY}.faqsTitle`,
    `${GUIDE_KEY}.faqsTitle`,
    `content.${GUIDE_KEY}.toc.faqs`,
    "labels.faqsHeading",
  ] as const;
  for (const key of keys) {
    if (typeof translator === "function") {
      try {
        const result = translator(key) as string;
        if (typeof result === "string") {
          const trimmed = result.trim();
          if (trimmed.length > 0 && trimmed !== key) {
            return trimmed;
          }
        }
      } catch {
        /* ignore translator errors */
      }
    }
  }
  const english = getGuideResource("en", `content.${GUIDE_KEY}.faqsTitle`, { includeFallback: false });
  if (typeof english === "string") {
    const trimmed = english.trim();
    if (trimmed.length > 0 && trimmed !== `content.${GUIDE_KEY}.faqsTitle`) {
      return trimmed;
    }
  }
  return "FAQs";
}

function buildWorkExchangeFaqs(context: GuideSeoTemplateContext): NormalisedFaq[] {
  const localized = dedupeFaqs([
    ...normalizeFaqEntries(getGuideResource(context.lang, `content.${GUIDE_KEY}.faqs`, { includeFallback: false })),
    ...normalizeFaqEntries(getGuideResource(context.lang, `content.${GUIDE_KEY}.faq`, { includeFallback: false })),
  ]);

  const contextFaqs = Array.isArray(context.faqs)
    ? context.faqs
        .map((entry) => {
          const question = typeof entry?.q === "string" ? entry.q.trim() : "";
          const answers = Array.isArray(entry?.a)
            ? entry.a
                .map((answer) => (typeof answer === "string" ? answer.trim() : ""))
                .filter((answer) => answer.length > 0)
            : [];
          if (!question || answers.length === 0) return null;
          return { q: question, a: answers };
        })
        .filter((entry): entry is NormalisedFaq => entry != null)
    : [];

  let faqs = localized.length > 0 ? localized : dedupeFaqs(contextFaqs);

  if (faqs.length < 2 && localized.length > 0) {
    for (const entry of contextFaqs) {
      if (faqs.length >= 2) break;
      const duplicate = faqs.some((existing) => existing.q === entry.q && arraysEqual(existing.a, entry.a));
      if (!duplicate) {
        faqs = [...faqs, entry];
      }
    }
  }

  if (faqs.length < 2) {
    const englishFallback = dedupeFaqs([
      ...normalizeFaqEntries(getGuideResource("en", `content.${GUIDE_KEY}.faqs`, { includeFallback: false })),
      ...normalizeFaqEntries(getGuideResource("en", `content.${GUIDE_KEY}.faq`, { includeFallback: false })),
    ]);
    for (const entry of englishFallback) {
      if (faqs.length >= 2) break;
      const isDuplicate = faqs.some(
        (existing) => existing.q === entry.q && arraysEqual(existing.a, entry.a),
      );
      if (!isDuplicate) {
        faqs = [...faqs, entry];
      }
    }
  }

  return faqs;
}

function hasLocalizedStructuredData(context: GuideSeoTemplateContext): boolean {
  const lang = context.lang;

  const introRaw = getGuideResource(lang, `content.${GUIDE_KEY}.intro`, { includeFallback: false });
  const introMeaningful = (() => {
    if (typeof introRaw === "string") {
      return introRaw.trim().length > 0;
    }
    if (Array.isArray(introRaw)) {
      return introRaw.some((paragraph) => typeof paragraph === "string" && paragraph.trim().length > 0);
    }
    if (introRaw && typeof introRaw === "object") {
      return Object.values(introRaw as Record<string, unknown>).some((value) => {
        if (typeof value === "string") return value.trim().length > 0;
        if (Array.isArray(value)) {
          return value.some((entry) => typeof entry === "string" && entry.trim().length > 0);
        }
        return false;
      });
    }
    return false;
  })();
  if (introMeaningful) return true;

  const sectionsRaw = getGuideResource(lang, `content.${GUIDE_KEY}.sections`, { includeFallback: false });
  if (Array.isArray(sectionsRaw)) {
    for (const section of sectionsRaw) {
      if (!section || typeof section !== "object") continue;
      const record = section as Record<string, unknown>;
      const title = typeof record.title === "string" ? record.title.trim() : "";
      const body = collectAnswers(record.body ?? record.items);
      if (title.length > 0 || body.length > 0) return true;
    }
  }

  const faqsRaw = getGuideResource(lang, `content.${GUIDE_KEY}.faqs`, { includeFallback: false });
  if (normalizeFaqEntries(faqsRaw).length > 0) return true;

  const faqRaw = getGuideResource(lang, `content.${GUIDE_KEY}.faq`, { includeFallback: false });
  if (normalizeFaqEntries(faqRaw).length > 0) return true;

  return false;
}

function sanitizeSections(sections: NormalisedSection[] | undefined): Array<NormalisedSection & { body: string[] }> {
  if (!Array.isArray(sections)) return [];
  return sections
    .map((section, index) => {
      const idSource = typeof section.id === "string" ? section.id.trim() : "";
      const id = idSource.length > 0 ? idSource : `section-${index + 1}`;
      const title = typeof section.title === "string" ? section.title.trim() : "";
      const body = Array.isArray(section.body)
        ? section.body
            .map((paragraph) => (typeof paragraph === "string" ? paragraph.trim() : ""))
            .filter((paragraph) => paragraph.length > 0)
        : [];
      if (!title && body.length === 0) return null;
      return {
        ...section,
        id,
        title,
        body,
      };
    })
    .filter((section): section is NormalisedSection & { body: string[] } => section != null);
}

function buildSections(context: GuideSeoTemplateContext): Array<NormalisedSection & { body: string[] }> {
  const localizedRaw = getGuideResource(context.lang, `content.${GUIDE_KEY}.sections`, { includeFallback: false });
  const localized = Array.isArray(localizedRaw)
    ? localizedRaw
        .map((section, index) => parseLocalizedSection(section, index))
        .filter((section): section is NormalisedSection & { body: string[] } => section != null)
    : [];
  if (localized.length > 0) {
    return localized;
  }
  return sanitizeSections(context.sections);
}

function buildWorkExchangeToc(
  context: GuideSeoTemplateContext,
  content: GuideContent,
  sections: Array<NormalisedSection & { body: string[] }>,
  faqs: NormalisedFaq[],
): TocItem[] {
  const baseItems = Array.isArray(context.toc) ? context.toc : [];
  const items: TocItem[] = [];
  const seen = new Set<string>();

  const sectionLabels = new Map<string, string>();
  sections.forEach((section, index) => {
    const labelCandidate =
      (typeof section.label === "string" && section.label.trim().length > 0 ? section.label.trim() : "") ||
      (section.title.length > 0 ? section.title : "") ||
      `Section ${index + 1}`;
    sectionLabels.set(section.id, labelCandidate);
  });

  const pushItem = (hrefRaw: string, labelRaw: string) => {
    const hrefNormalized = hrefRaw.startsWith("#") ? hrefRaw : `#${hrefRaw}`;
    if (!hrefNormalized.match(/^#[\w-]+$/u)) return;
    if (seen.has(hrefNormalized)) return;
    const label = labelRaw.trim().length > 0 ? labelRaw.trim() : `Section ${items.length + 1}`;
    items.push({ href: hrefNormalized, label });
    seen.add(hrefNormalized);
  };

  if (!ignoreBase) {
    for (const entry of baseItems) {
      if (!entry || typeof entry !== "object") continue;
      const hrefRaw = typeof entry.href === "string" ? entry.href.trim() : "";
      if (!hrefRaw) continue;
      const normalizedHref = hrefRaw.startsWith("#") ? hrefRaw : `#${hrefRaw}`;
      if (seen.has(normalizedHref)) continue;

      let label = typeof entry.label === "string" ? entry.label.trim() : "";
      if (normalizedHref === "#faqs") {
        label = resolveFaqLabel(context);
      } else if (normalizedHref.startsWith("#")) {
        const sectionId = normalizedHref.slice(1);
        const sectionLabel = sectionLabels.get(sectionId);
        if (sectionLabel) {
          label = sectionLabel;
          sectionLabels.delete(sectionId);
        }
      }
      pushItem(normalizedHref, label);
    }
  }

  for (const section of sections) {
    if (section.includeInToc === false) continue;
    const href = `#${section.id}`;
    if (seen.has(href)) continue;
    const label =
      sectionLabels.get(section.id) ??
      section.title ??
      (typeof section.label === "string" && section.label.trim().length > 0
        ? section.label.trim()
        : `Section ${items.length + 1}`);
    sectionLabels.delete(section.id);
    pushItem(href, label);
  }

  const faqHref = "#faqs";
  if (faqs.length > 0) {
    const faqLabel = resolveFaqLabel(context);
    if (seen.has(faqHref)) {
      for (let index = 0; index < items.length; index += 1) {
        if (items[index]?.href === faqHref) {
          items[index] = { href: faqHref, label: faqLabel };
          break;
        }
      }
    } else {
      pushItem(faqHref, faqLabel);
    }
  } else {
    for (let index = items.length - 1; index >= 0; index -= 1) {
      if (items[index]?.href === faqHref) {
        items.splice(index, 1);
        seen.delete(faqHref);
      }
    }
  }

  return items;
}

function renderWorkExchangeArticle(context: GuideSeoTemplateContext): JSX.Element | null {
  if (!hasLocalizedStructuredData(context)) {
    return null;
  }

  const intro = buildIntroParagraphs(context);
  const { sections, usedLocalized } = buildSections(context);
  const faqs = buildWorkExchangeFaqs(context);

  const hasContent = intro.length > 0 || sections.length > 0 || faqs.length > 0;
  if (!hasContent) return null;

  const tocItems = buildWorkExchangeToc(context, sections, faqs, { preferSections: usedLocalized });
  const faqHeading = faqs.length > 0 ? resolveFaqLabel(context) : "";

  return (
    <>
      {tocItems.length > 0 ? <TableOfContents items={tocItems} /> : null}
      {intro.map((paragraph, index) => (
        <p key={`intro-${index}`}>{renderGuideLinkTokens(paragraph, context.lang, `intro-${index}`)}</p>
      ))}
      {sections.map((section, sectionIndex) => (
        <section key={`${section.id}-${sectionIndex}`} id={section.id} className="scroll-mt-28 space-y-4">
          {section.title ? <h2 className="text-xl font-semibold">{section.title}</h2> : null}
          {section.body.map((paragraph, index) => (
            <p key={`section-${section.id}-${index}`}>
              {renderGuideLinkTokens(paragraph, context.lang, `section-${section.id}-${index}`)}
            </p>
          ))}
        </section>
      ))}
      {faqs.length > 0 ? (
        <section id="faqs" className="space-y-3">
          {faqHeading ? <h2 className="text-xl font-semibold">{faqHeading}</h2> : null}
          {faqs.map((faq, index) => (
            <details key={`${faq.q}-${index}`}>
              <summary>{faq.q}</summary>
              {faq.a.map((answer, answerIndex) => (
                <p key={`faq-${index}-${answerIndex}`}>
                  {renderGuideLinkTokens(answer, context.lang, `faq-${index}-${answerIndex}`)}
                </p>
              ))}
            </details>
          ))}
        </section>
      ) : null}
    </>
  );
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: {
      path: OG_IMAGE_PATH,
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
    },
    renderGenericContent: false,
    articleLead: workExchangeStructuredLead.articleLead,
  }),
  structuredArticle: workExchangeStructuredLead.structuredArticle,
  meta: ({ data }, entry) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
    const imageSrc = buildCfImageUrl(OG_IMAGE_PATH, {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });

    return buildRouteMeta({
      lang,
      title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
      description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
      url: `${BASE_URL}${path}`,
      path,
      image: {
        src: imageSrc,
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
      },
      ogType: "article",
      includeTwitterUrl: true,
    });
  },
  links: () => buildRouteLinks(),
});

export default Component;
export { clientLoader, meta, links };