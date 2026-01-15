// src/routes/guides/compare-bases-positano-sorrento-amalfi.tsx
import { defineGuideRoute, createStructuredLeadWithBuilder } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

import TableOfContents from "@/components/guides/TableOfContents";
import i18n from "@/i18n";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { langFromRequest, toAppLanguage } from "@/utils/lang";
import { BASE_URL } from "@/config/site";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import type { LoaderFunctionArgs } from "react-router-dom";
import type { LinksFunction, MetaFunction } from "react-router";
import { guideAbsoluteUrl, guideHref, type GuideKey } from "@/routes.guides-helpers";

export const handle = { tags: ["comparison", "positano", "sorrento", "amalfi", "transport", "budgeting"] };

export const GUIDE_KEY: GuideKey = "compareBasesPositanoSorrentoAmalfi";
export const GUIDE_SLUG = "compare-bases-positano-sorrento-amalfi" as const;

export type FallbackContent = {
  intro: string[];
  toc: Array<{ href: string; label: string }>;
  sections: Array<{ id: string; title: string; body: string[] }>;
  faqs: Array<{ q: string; a: string[] }>;
  faqsTitle: string;
};

export function hasGuideStructuredContent(input: {
  intro?: unknown;
  sections?: unknown;
  faqs?: unknown;
  legacyFaqs?: unknown;
  tips?: unknown;
  warnings?: unknown;
}): boolean {
  const hasArrayWithContent = (value: unknown): boolean =>
    Array.isArray(value) && value.some((item) => typeof item === "string" && item.trim().length > 0);

  if (hasArrayWithContent(input.intro)) return true;

  if (Array.isArray(input.sections)) {
    for (const entry of input.sections) {
      const record = typeof entry === "object" && entry !== null ? (entry as Record<string, unknown>) : undefined;
      if (!record) continue;
      const title = typeof record.title === "string" ? record.title.trim() : "";
      const body = Array.isArray(record.body) ? record.body : [];
      const itemsCandidate = (record.items ?? record.list) as unknown;
      const items = Array.isArray(itemsCandidate) ? itemsCandidate : [];
      const hasTitle = title.length > 0;
      const hasBody = body.some((value) => typeof value === "string" && value.trim().length > 0);
      const hasItems = items.some((value) => typeof value === "string" && value.trim().length > 0);
      if ((hasTitle && hasBody) || (hasTitle && hasItems)) return true;
    }
  }

  if (Array.isArray(input.faqs)) {
    for (const entry of input.faqs) {
      const record = typeof entry === "object" && entry !== null ? (entry as Record<string, unknown>) : undefined;
      if (!record) continue;
      const qCandidate =
        typeof record.q === "string"
          ? record.q
          : typeof record.question === "string"
            ? record.question
            : undefined;
      const answersCandidate = record.a ?? record.answer;
      const answers = Array.isArray(answersCandidate) ? answersCandidate : [];
      const hasQ = typeof qCandidate === "string" && qCandidate.trim().length > 0;
      const hasA = answers.some((value) => typeof value === "string" && value.trim().length > 0);
      if (hasQ && hasA) return true;
    }
  }

  return false;
}

export function buildFallbackContent(
  translate: (segment: string, options?: { returnObjects?: boolean }) => unknown,
): FallbackContent {
  const asStringArray = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      : [];

  const asObjectArray = (value: unknown): Record<string, unknown>[] =>
    Array.isArray(value)
      ? value.filter((entry): entry is Record<string, unknown> => entry != null && typeof entry === "object")
      : [];

  const intro = asStringArray(translate("intro", { returnObjects: true }));

  const rawToc = asObjectArray(translate("toc", { returnObjects: true }));
  const toc: Array<{ href: string; label: string }> = [];
  for (let index = 0; index < rawToc.length; index++) {
    const entry = rawToc[index] ?? {};
    const label = typeof entry.label === "string" ? entry.label.trim() : "";
    if (!label) continue;
    const hrefRaw = typeof entry.href === "string" ? entry.href.trim() : "";
    const href = hrefRaw || `#s-${index}`;
    toc.push({ href, label });
  }

  const rawSections = asObjectArray(translate("sections", { returnObjects: true }));
  const sections: Array<{ id: string; title: string; body: string[] }> = [];
  let autoIndex = 0;
  for (const entry of rawSections) {
    const idRaw = typeof entry.id === "string" ? entry.id.trim() : "";
    const titleRaw = typeof entry.title === "string" ? entry.title.trim() : "";
    const body = asStringArray(entry.body);
    const itemsFallback =
      Array.isArray(entry.items) && entry.items.length > 0
        ? asStringArray(entry.items)
        : Array.isArray(entry.list)
          ? asStringArray(entry.list)
          : [];
    const content = body.length > 0 ? body : itemsFallback;
    if (!titleRaw || content.length === 0) continue;
    const id = idRaw || `s-${autoIndex++}`;
    sections.push({ id, title: titleRaw, body: content });
  }

  const rawFaqs = asObjectArray(translate("faqs", { returnObjects: true }));
  const faqs: Array<{ q: string; a: string[] }> = [];
  for (const entry of rawFaqs) {
    const qCandidate =
      typeof entry.q === "string" ? entry.q : typeof entry.question === "string" ? entry.question : "";
    const answersCandidate = entry.a ?? entry.answer;
    const answers = asStringArray(answersCandidate);
    const q = qCandidate.trim();
    if (!q || answers.length === 0) continue;
    faqs.push({ q, a: answers });
  }

  const faqsTitleRaw = translate("faqsTitle") as unknown;
  const faqsTitle =
    typeof faqsTitleRaw === "string" && faqsTitleRaw.trim().length > 0 ? faqsTitleRaw.trim() : "";

  return {
    intro,
    toc,
    sections,
    faqs,
    faqsTitle,
  };
}

function renderFallbackArticleLead(context: GuideSeoTemplateContext): JSX.Element | null {
  if (context.hasLocalizedContent) {
    return null;
  }

  const fallbackTranslator: Translator = ((segment: string, options?: { returnObjects?: boolean }) => {
    try {
      const fixed = i18n.getFixedT?.(context.lang, "guidesFallback");
      if (typeof fixed === "function") {
        return fixed(`${GUIDE_KEY}.${segment}`, options);
      }
    } catch {
      /* noop */
    }
    const base = i18n.getFixedT?.("en", "guidesFallback");
    if (typeof base === "function") {
      return base(`${GUIDE_KEY}.${segment}`, options);
    }
    return options?.returnObjects ? [] : undefined;
  }) as unknown as Translator;

  const fallback = buildFallbackContent((segment, options) => fallbackTranslator(segment, options));
  if (
    fallback.intro.length === 0 &&
    fallback.sections.length === 0 &&
    fallback.toc.length === 0 &&
    fallback.faqs.length === 0
  ) {
    return null;
  }
  const tocItems =
    fallback.toc.length > 0
      ? fallback.toc
      : fallback.sections.map((section) => ({
          href: `#${section.id}`,
          label: section.title || section.id,
        }));
  const tocTitle = i18n.t("guides:labels.onThisPage", { defaultValue: "On this page" }) as string;

  return (
    <>
      {fallback.intro.length > 0 ? (
        <div className="space-y-4">
          {fallback.intro.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      ) : null}
      {tocItems.length > 0 ? <TableOfContents items={tocItems} title={tocTitle} /> : null}
      {fallback.sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-28 space-y-4">
          {section.title ? <h2 className="text-xl font-semibold">{section.title}</h2> : null}
          {section.body.map((entry, index) => (
            <p key={index}>{entry}</p>
          ))}
        </section>
      ))}
      {fallback.faqs.length > 0 ? (
        <section id="faqs" className="scroll-mt-28 space-y-4">
          <h2 className="text-xl font-semibold">{resolveFaqsHeading()}</h2>
          <div className="space-y-3">
            {fallback.faqs.map((faq, index) => (
              <details key={index}>
                <summary className="font-medium">{faq.q}</summary>
                {faq.a.map((answer, answerIndex) => (
                  <p key={answerIndex}>{answer}</p>
                ))}
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for compareBasesPositanoSorrentoAmalfi");
}

function sanitizeGuidesFallbackBundle(lang: string) {
  try {
    const store = (i18n.services as any)?.resourceStore?.data as Record<string, unknown> | undefined;
    if (!store) return;
    process.stdout.write(
      `[sanitizeGuidesContentBundle] ${lang}: ${JSON.stringify(Object.keys(store[lang] ?? {}))}\n`,
    );
    process.stdout.write(
      `[sanitizeGuidesFallbackBundle] ${lang}: ${JSON.stringify(Object.keys(store[lang] ?? {}))}\n`,
    );
    const namespace = (store[lang] as Record<string, unknown> | undefined)?.guidesFallback;
    if (!namespace || typeof namespace !== "object") return;
    const entry = (namespace as Record<string, unknown>)[GUIDE_KEY];
    if (!entry || typeof entry !== "object") return;
    const target = entry as Record<string, unknown>;
    const sanitiseFaqs = (): Array<{ q: string; a: string[] }> | undefined => {
      if (!Array.isArray(target.faqs)) return undefined;
      const cleaned = target.faqs
        .filter((faq): faq is Record<string, unknown> => faq != null && typeof faq === "object")
        .map((faq) => {
          const question =
            typeof faq.q === "string"
              ? faq.q
              : typeof faq.question === "string"
                ? faq.question
                : "";
          const answersSource = Array.isArray(faq.a)
            ? faq.a
            : Array.isArray(faq.answer)
              ? faq.answer
              : [];
          const answers = answersSource
            .filter((value): value is string => typeof value === "string")
            .map((value) => value);
          return { q: question, a: answers };
        })
        .filter((faq) => faq.q.trim().length > 0 && faq.a.some((answer) => answer.trim().length > 0));
      return cleaned;
    };

    const sanitiseSections = (): Record<string, unknown>[] | undefined => {
      if (!Array.isArray(target.sections)) return undefined;
      return target.sections.filter(
        (section): section is Record<string, unknown> => section != null && typeof section === "object",
      );
    };

    const sanitizedFaqs = sanitiseFaqs();
    const sanitizedSections = sanitiseSections();
    if (sanitizedFaqs) {
      (target as Record<string, unknown>).faqs = sanitizedFaqs;
    }
    if (sanitizedSections) {
      (target as Record<string, unknown>).sections = sanitizedSections;
    }
  } catch {
    /* noop */
  }
}

function sanitizeGuidesContentBundle(lang: string) {
  try {
    const store = (i18n.services as any)?.resourceStore?.data as Record<string, unknown> | undefined;
    if (!store) return;
    const namespace = (store[lang] as Record<string, unknown> | undefined)?.guides;
    if (!namespace || typeof namespace !== "object") return;
    const content = (namespace as Record<string, unknown>).content;
    if (!content || typeof content !== "object") return;
    const entry = (content as Record<string, unknown>)[GUIDE_KEY];
    if (!entry || typeof entry !== "object") return;
    const target = entry as Record<string, unknown>;

    const sanitizeFaqArray = (value: unknown): Array<{ q: string; a: string[] }> | undefined => {
      if (!Array.isArray(value)) return undefined;
      return value
        .filter((faq): faq is Record<string, unknown> => faq != null && typeof faq === "object")
        .map((faq) => {
          const question = typeof faq.q === "string" ? faq.q : typeof faq.question === "string" ? faq.question : "";
          const answersSource = Array.isArray(faq.a)
            ? faq.a
            : Array.isArray(faq.answer)
              ? faq.answer
              : [];
          const answers = answersSource
            .filter((ans): ans is string => typeof ans === "string")
            .map((ans) => ans);
          return { q: question, a: answers };
        })
        .filter((faq) => faq.q.trim().length > 0 && faq.a.some((answer) => answer.trim().length > 0));
    };

    const sanitizedFaqs = sanitizeFaqArray(target.faqs);
    const sanitizedLegacyFaqs = sanitizeFaqArray(target.faq);
    if (sanitizedFaqs) {
      (target as Record<string, unknown>).faqs = sanitizedFaqs;
    }
    if (sanitizedLegacyFaqs) {
      (target as Record<string, unknown>).faq = sanitizedLegacyFaqs;
    }
  } catch {
    /* noop */
  }
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    articleLead: renderFallbackArticleLead,
    genericContentOptions: { showToc: false },
    buildTocItems: () => [],
    showTocWhenUnlocalized: false,
  }),
  clientLoader: async ({ request }: LoaderFunctionArgs) => {
    const lang = langFromRequest(request);
    await preloadNamespacesWithFallback(lang, ["guidesFallback"], { optional: false, fallbackOptional: true });
    sanitizeGuidesContentBundle(lang);
    sanitizeGuidesFallbackBundle(lang);
    if (lang !== "en") {
      sanitizeGuidesContentBundle("en");
      sanitizeGuidesFallbackBundle("en");
    }
    return null;
  },
});

export default Component;
export { clientLoader, meta, links };