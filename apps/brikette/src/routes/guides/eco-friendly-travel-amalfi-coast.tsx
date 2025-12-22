// src/routes/guides/eco-friendly-travel-amalfi-coast.tsx
import type {} from "@/routes/guides/_GuideSeoTemplate";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import TableOfContents from "@/components/guides/TableOfContents";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { toAppLanguage } from "@/utils/lang";
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";
import type { GuideKey } from "@/routes.guides-helpers";
import type { GuideSeoTemplateContext } from "./guide-seo/types";
import { guideAbsoluteUrl, guideHref } from "@/routes.guides-helpers";
import type { LinksFunction, MetaFunction } from "react-router";
import getFallbackLanguage from "./utils/getFallbackLanguage";

type GuideLinksArgs = Parameters<LinksFunction>[0];
type GuideMetaArgs = Parameters<MetaFunction>[0];

type GuideLinksContext = {
  data?: { lang?: unknown } | null;
  params?: { lang?: unknown } | null;
  request?: { url?: unknown } | null;
};

export const GUIDE_KEY: GuideKey = "ecoFriendlyAmalfi";
export const GUIDE_SLUG = "eco-friendly-travel-amalfi-coast" as const;

export const handle = { tags: ["sustainability", "amalfi", "positano", "hiking", "travel-tips"] };

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for ecoFriendlyAmalfi"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only invariant surfaced in build logs
}

const resolveMeta = (args: GuideMetaArgs): ReturnType<MetaFunction> => {
  const lang = toAppLanguage((args?.data as { lang?: string } | undefined)?.lang ?? getFallbackLanguage());
  const path = guideHref(lang, GUIDE_KEY);
  const url = guideAbsoluteUrl(lang, GUIDE_KEY);
  const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
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
    isPublished: manifestEntry.status === "live",
  });
};

const resolveLinks = (args?: GuideLinksArgs): ReturnType<LinksFunction> => {
  const safeArgs = (args ?? {}) as GuideLinksContext;
  const dataLang = typeof safeArgs?.data?.lang === "string" ? safeArgs.data.lang : undefined;
  const paramLang = typeof safeArgs?.params?.["lang"] === "string" ? safeArgs.params["lang"] : undefined;
  const lang = toAppLanguage(dataLang ?? paramLang ?? getFallbackLanguage());
  const path = guideHref(lang, GUIDE_KEY);
  const url = guideAbsoluteUrl(lang, GUIDE_KEY);
  const requestUrl = typeof safeArgs?.request?.url === "string" ? safeArgs.request.url : undefined;
  const origin = (() => {
    if (!requestUrl) return undefined;
    try {
      return new URL(requestUrl).origin;
    } catch {
      return undefined;
    }
  })();
  return buildRouteLinks({ lang, path, url, ...(origin ? { origin } : {}) });
};

const { Component, clientLoader } = defineGuideRoute(manifestEntry, {
  template: () => ({
    genericContentOptions: { showToc: true },
    buildTocItems: () => [],
    alwaysProvideFaqFallback: true,
    suppressUnlocalizedFallback: true,
    preferManualWhenUnlocalized: true,
    articleExtras: (context) => renderManualFallback(context),
  }),
  meta: resolveMeta,
  links: resolveLinks,
});

export default Component;
export { clientLoader };
export const meta: MetaFunction = (args) => resolveMeta(args);
export const links: LinksFunction = (
  ...linkArgs: Parameters<LinksFunction>
) => {
  const [firstArg] = linkArgs;
  return resolveLinks(firstArg);
};

type ManualFallbackContent = {
  intro: string[];
  sections: Array<{ id: string; title: string; body: string[] }>;
  toc: Array<{ href: string; label: string }>;
  faqs: Array<{ q: string; a: string[] }>;
  faqsTitle?: string;
};

function renderManualFallback(context: GuideSeoTemplateContext): JSX.Element | null {
  const hasStructuredContent =
    (Array.isArray(context.intro) && context.intro.some((paragraph) => typeof paragraph === "string" && paragraph.trim().length > 0)) ||
    (Array.isArray(context.sections) &&
      context.sections.some((section) => {
        const hasTitle = typeof section?.title === "string" && section.title.trim().length > 0;
        const hasBody =
          Array.isArray(section?.body) &&
          section.body.some((paragraph) => typeof paragraph === "string" && paragraph.trim().length > 0);
        return hasTitle || hasBody;
      })) ||
    (Array.isArray(context.faqs) &&
      context.faqs.some(
        (faq) =>
          typeof faq?.q === "string" && faq.q.trim().length > 0 && Array.isArray(faq?.a) && faq.a.some((answer) => typeof answer === "string" && answer.trim().length > 0),
      ));

  if (context.hasLocalizedContent && hasStructuredContent) {
    return null;
  }
  const fallback = buildManualFallbackContent(context);
  if (!fallback) return null;

  const { intro, sections, toc, faqs, faqsTitle } = fallback;

  const hasContent =
    intro.length > 0 || sections.length > 0 || faqs.length > 0 || (faqsTitle && faqsTitle.length > 0);
  if (!hasContent) return null;

  const resolvedFaqsTitle = faqs.length
    ? faqsTitle ??
      ((context.translateGuides?.("labels.faqsHeading", { defaultValue: "FAQs" }) as string) || "FAQs")
    : undefined;

  return (
    <>
      {intro.map((paragraph, index) => (
        <p key={`intro-${index}`}>{paragraph}</p>
      ))}
      {toc.length > 0 ? <TableOfContents items={toc} /> : null}
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-28 space-y-4">
          {section.title ? <h2 className="text-xl font-semibold">{section.title}</h2> : null}
          {section.body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </section>
      ))}
      {faqs.length > 0 ? (
        <section id="faqs" className="space-y-4">
          {resolvedFaqsTitle ? <h2 className="text-xl font-semibold">{resolvedFaqsTitle}</h2> : null}
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <details key={`${faq.q}-${index}`}>
                <summary role="button" className="font-medium">
                  {faq.q}
                </summary>
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

function buildManualFallbackContent(context: GuideSeoTemplateContext): ManualFallbackContent | null {
  const translate = context.translateGuides;

  const deriveFirstIntroSentence = (index: number, paragraphs: string[]): string | undefined => {
    if (!Array.isArray(paragraphs)) return undefined;
    const candidate = paragraphs[index];
    return typeof candidate === "string" && candidate.trim().length > 0 ? candidate.trim() : undefined;
  };

  const sanitizeString = (value: unknown): string => {
    if (typeof value !== "string") return "";
    return value.trim();
  };

  const resolveArrayValue = (key: string): unknown => {
    const primary = translate(`${GUIDE_KEY}.${key}`, { returnObjects: true, defaultValue: [] });
    if (Array.isArray(primary)) return primary;
    if (primary && typeof primary === "object" && Object.keys(primary as Record<string, unknown>).length > 0) {
      return primary;
    }
    const canonical = translate(`content.${GUIDE_KEY}.${key}`, { returnObjects: true, defaultValue: [] });
    if (Array.isArray(canonical)) return canonical;
    if (canonical && typeof canonical === "object" && Object.keys(canonical as Record<string, unknown>).length > 0) {
      return canonical;
    }
    return [];
  };

  const resolveStringValue = (key: string): string => {
    const primary = sanitizeString(translate(`${GUIDE_KEY}.${key}`, { defaultValue: "" }));
    if (primary) return primary;
    return sanitizeString(translate(`content.${GUIDE_KEY}.${key}`, { defaultValue: "" }));
  };

  const intro = ensureStringArray(resolveArrayValue("intro"))
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const sections = ensureArray<Record<string, unknown>>(resolveArrayValue("sections"))
    .map((section, index) => {
      const title = sanitizeString(section["title"]);
      const body = ensureStringArray(section["body"] ?? section["items"])
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
      if (title.length === 0 && body.length === 0) return null;
      const id = `s-${index}`;
      return { id, title, body };
    })
    .filter((section): section is { id: string; title: string; body: string[] } => section != null);

  const tocItemsRaw = ensureArray<Record<string, unknown>>(resolveArrayValue("toc"));
  const tocFromFallback = tocItemsRaw
    .map((item, index) => {
      const fallbackSection = sections[index];
      const labelCandidate = sanitizeString(item["label"]);
      const hrefCandidate = sanitizeString(item["href"]);
      const fallbackId = fallbackSection?.id ?? `s-${index}`;
      const href = hrefCandidate.length > 0 ? normalizeHref(hrefCandidate) : `#${fallbackId}`;
      const fallbackLabelFromIntro = deriveFirstIntroSentence(index, intro);
      const fallbackLabelFromSectionTitle =
        fallbackSection?.title && fallbackSection.title.length > 0 ? fallbackSection.title : undefined;
      const fallbackLabelFromSectionBody = fallbackSection?.body?.[0];
      const fallbackLabel = [
        labelCandidate,
        fallbackLabelFromIntro,
        fallbackLabelFromSectionTitle,
        fallbackLabelFromSectionBody,
        fallbackId,
      ].find((value) => typeof value === "string" && value.length > 0);
      const label = fallbackLabel ?? fallbackId;
      if (!label) return null;
      return { href, label };
    })
    .filter((item): item is { href: string; label: string } => item != null);

  const toc = tocFromFallback.length > 0
    ? tocFromFallback
    : sections.map((section) => ({ href: `#${section.id}`, label: section.title || section.id }));

  const faqs = ensureArray<Record<string, unknown>>(resolveArrayValue("faqs"))
    .map((entry) => {
      const question = sanitizeString(entry["q"] ?? entry["question"]);
      const answers = ensureStringArray(entry["a"] ?? entry["answer"])
        .map((answer) => answer.trim())
        .filter(Boolean);
      if (!question || answers.length === 0) return null;
      return { q: question, a: answers };
    })
    .filter((faq): faq is { q: string; a: string[] } => faq != null);

  const faqsTitle = resolveStringValue("faqsTitle");

  if (intro.length === 0 && sections.length === 0 && faqs.length === 0 && faqsTitle.length === 0) {
    return null;
  }

  return { intro, sections, toc, faqs, ...(faqsTitle ? { faqsTitle } : {}) };
}

function normalizeHref(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, "");
  if (!trimmed) return "";
  const withoutHashes = trimmed.replace(/^#+/, "");
  return `#${withoutHashes || trimmed}`;
}
