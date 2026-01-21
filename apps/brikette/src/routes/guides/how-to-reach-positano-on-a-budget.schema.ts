import type { BreadcrumbList } from "@/components/seo/BreadcrumbStructuredData";
import { BASE_URL } from "@/config/site";
import { guideNamespace } from "@/routes.guides-helpers";
import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";
import { getSlug } from "@/utils/slug";

import { GUIDE_KEY, GUIDE_SLUG } from "./how-to-reach-positano-on-a-budget.constants";
import { buildGuideExtras } from "./how-to-reach-positano-on-a-budget.extras";
import {
  normaliseFaqs,
  safeString,
} from "./how-to-reach-positano-on-a-budget.normalisers";
import {
  getGuidesTranslator,
  getHeaderTranslator,
  resolveTranslatorString,
} from "./how-to-reach-positano-on-a-budget.translators";
import type { GuideFaq, GuideSeoTemplateContext } from "./how-to-reach-positano-on-a-budget.types";
import { stripGuideLinkTokens } from "./utils/linkTokens";

function extractCanonicalSegments(canonicalUrl: string): string[] | null {
  const candidate = safeString(canonicalUrl);
  if (candidate.length === 0) {
    return null;
  }

  try {
    const parsed = candidate.startsWith("http") ? new URL(candidate) : new URL(candidate, BASE_URL);
    return parsed.pathname.split("/").filter(Boolean);
  } catch {
    const segments = candidate.split("/").filter(Boolean);
    return segments.length > 0 ? segments : null;
  }
}

export function buildTocItems(context: GuideSeoTemplateContext) {
  return buildGuideExtras(context).toc;
}

export function buildHowToSteps(context: GuideSeoTemplateContext) {
  const extras = buildGuideExtras(context);
  if (extras.steps.length === 0) {
    return null;
  }

  if (context.lang !== "en" && extras.stepsSource === "fallback") {
    return null;
  }

  const steps = extras.steps.map((step) => ({
    name: step.name,
    ...(step.text ? { text: step.text } : {}),
  }));

  const payload: Record<string, unknown> = {};
  if (extras.howTo.totalTime) {
    payload["totalTime"] = extras.howTo.totalTime;
  }
  if (extras.howTo.estimatedCostCurrency && extras.howTo.estimatedCostValue) {
    payload["estimatedCost"] = {
      "@type": "MonetaryAmount",
      currency: extras.howTo.estimatedCostCurrency,
      value: extras.howTo.estimatedCostValue,
    };
  }

  return {
    steps,
    extras: Object.keys(payload).length > 0 ? payload : undefined,
  };
}

export function guideFaqFallback(targetLang: string) {
  const translator = getGuidesTranslator(targetLang);
  const fallback = getGuidesTranslator("en");
  const sanitize = (faqs: GuideFaq[]): NormalizedFaqEntry[] =>
    faqs.map(({ q, a }) => ({
      question: q,
      answer: a.map((answer) => stripGuideLinkTokens(answer)),
    }));

  const faqs = sanitize(normaliseFaqs(translator(`content.${GUIDE_KEY}.faqs`, { returnObjects: true })));
  if (faqs.length > 0) return faqs;

  const legacy = sanitize(normaliseFaqs(translator(`content.${GUIDE_KEY}.faq`, { returnObjects: true })));
  if (legacy.length > 0) return legacy;

  const fallbackFaqs = sanitize(normaliseFaqs(fallback(`content.${GUIDE_KEY}.faqs`, { returnObjects: true })));
  if (fallbackFaqs.length > 0) return fallbackFaqs;

  return sanitize(normaliseFaqs(fallback(`content.${GUIDE_KEY}.faq`, { returnObjects: true })));
}

export function buildBreadcrumb(context: GuideSeoTemplateContext): BreadcrumbList {
  const header = getHeaderTranslator(context.lang);
  const headerFallback = getHeaderTranslator("en");
  const guides = getGuidesTranslator(context.lang);
  const guidesFallback = getGuidesTranslator("en");

  const homeLabel = resolveTranslatorString(header, headerFallback, "labels.homeBreadcrumb", "Home");
  const guidesLabel = resolveTranslatorString(
    guides,
    guidesFallback,
    "labels.guidesBreadcrumb",
    "Guides",
  );
  const pageLabel = resolveTranslatorString(
    guides,
    guidesFallback,
    `labels.${GUIDE_KEY}Breadcrumb`,
    context.article.title,
  );

  // Use namespace info to resolve whether this guide belongs under the
  // how‑to‑get‑here umbrella; otherwise default to the guides base.
  // This keeps breadcrumbs under `/guides` for non how‑to guides, even if the
  // internal route grouping places some guides under Assistance.
  const { baseKey } = guideNamespace(context.lang, context.guideKey);
  const fallbackBaseSlug = getSlug(baseKey === "howToGetHere" ? "howToGetHere" : "guides", context.lang);
  // Keep the fallback page slug aligned with the route's declared slug so
  // structured data stays in sync even if guideSlug() derives locale variants
  // from translated link labels.
  const englishPageSlug = GUIDE_SLUG;

  const canonicalSegments = extractCanonicalSegments(context.canonicalUrl);
  const canonicalSegmentsAreValid =
    Array.isArray(canonicalSegments) &&
    canonicalSegments.length >= 2 &&
    canonicalSegments[0] === context.lang;

  const fallbackListHref = `${BASE_URL}/${context.lang}/${fallbackBaseSlug}`;
  const canonicalListHref = canonicalSegmentsAreValid
    ? `${BASE_URL}/${canonicalSegments.slice(0, 2).join("/")}`
    : fallbackListHref;

  const fallbackPageHref = `${fallbackListHref}/${englishPageSlug}`;
  const canonicalPageHref =
    canonicalSegmentsAreValid && canonicalSegments.length >= 3
      ? `${BASE_URL}/${canonicalSegments.join("/")}`
      : fallbackPageHref;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: homeLabel, item: `${BASE_URL}/${context.lang}` },
      {
        "@type": "ListItem",
        position: 2,
        name: guidesLabel,
        item: canonicalListHref,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: pageLabel,
        item: canonicalPageHref,
      },
    ],
  };
}
