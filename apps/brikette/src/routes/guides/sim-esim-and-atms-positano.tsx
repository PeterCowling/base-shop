// src/routes/guides/sim-esim-and-atms-positano.tsx
import RelatedGuides from "@/components/guides/RelatedGuides";
import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { type GuideKey,guideSlug } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";
import { OG_IMAGE as OG_DIMENSIONS } from "@/utils/headConstants";
import { ensureStringArray } from "@/utils/i18nContent";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { getWebpackContext, supportsWebpackGlob, webpackContextToRecord } from "@/utils/webpackGlob";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

export const GUIDE_KEY = "simsAtms" as const satisfies GuideKey;
export const GUIDE_SLUG = "sim-esim-and-atms-positano" as const;

const GUIDE_FALLBACK_CONTEXT = supportsWebpackGlob
  ? getWebpackContext("../../locales", true, /guidesFallback\\.json$/)
  : undefined;
const GUIDE_FALLBACK_BUNDLES: Record<string, unknown> =
  webpackContextToRecord<{
    default?: Record<string, unknown>;
  }>(GUIDE_FALLBACK_CONTEXT, { prefix: "../../locales" }); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Static import glob path for guide fallback bundles

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for simsAtms"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-facing safeguard surfaced during misconfiguration
}

const relatedGuideItems = ((manifestEntry.relatedGuides ?? []).map((key) => ({ key })) as readonly {
  key: GuideKey;
}[]);

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    suppressUnlocalizedFallback: true,
    preferManualWhenUnlocalized: true,
    renderGenericContent: false,
    ...(relatedGuideItems.length > 0
      ? {
          relatedGuides: {
            items: relatedGuideItems,
          },
        }
      : {}),
    articleLead: (context) => renderFallbackIntro(context),
    guideFaqFallback: (lang) => buildFaqFallback(lang),
    articleExtras: (context) => renderFallbackFaqSection(context),
    afterArticle: (context) => renderFallbackRelatedGuides(context),
  }),
  meta: ({ data }, entry) => {
    const lang = toAppLanguage((data as { lang?: string } | undefined)?.lang);
    const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: OG_DIMENSIONS.width,
      height: OG_DIMENSIONS.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
      description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
      url,
      path,
      image: { src: image, width: OG_DIMENSIONS.width, height: OG_DIMENSIONS.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: entry.status === "live",
    });
  },
  links: (_args, _entry, base) => {
    const shared = buildRouteLinks();
    return shared.length > 0 ? shared : base;
  },
});

export default Component;
export { clientLoader, links,meta };

function renderFallbackIntro(context: GuideSeoTemplateContext): JSX.Element | null {
  if (hasStructuredIntro(context)) {
    return null;
  }

  const paragraphs = resolveFallbackIntro(context.lang);
  if (paragraphs.length === 0) return null;

  return (
    <div>
      {paragraphs.map((paragraph, index) => (
        <p key={`fallback-intro-${index}`}>{paragraph}</p>
      ))}
    </div>
  );
}

function renderFallbackFaqSection(context: GuideSeoTemplateContext): JSX.Element | null {
  if (context.hasLocalizedContent) return null;
  const entries = resolveFallbackFaqs(context.lang);
  if (entries.length === 0) return null;

  const heading =
    (context.translateGuides("labels.faqsHeading") as string | undefined) ??
    (context.translateGuidesEn?.("labels.faqsHeading") as string | undefined);
  const resolvedHeading = typeof heading === "string" ? heading.trim() : "";
  if (!resolvedHeading) return null;

  return (
    <section id="faqs" className="scroll-mt-28 space-y-4">
      <h2>{resolvedHeading}</h2>
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <details
            key={index}
            className="overflow-hidden rounded-2xl border border-brand-outline/20 bg-brand-surface/40 shadow-sm transition-shadow hover:shadow-md dark:border-brand-outline/40 dark:bg-brand-bg/60"
          >
            <summary className="px-4 py-3 text-lg font-semibold text-brand-heading">{entry.question}</summary>
            <div className="space-y-3 px-4 pb-4 pt-1 text-base text-brand-text/90">
              {entry.answer.map((answer, answerIndex) => (
                <p key={answerIndex}>{answer}</p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function renderFallbackRelatedGuides(context: GuideSeoTemplateContext): JSX.Element | null {
  if (context.hasLocalizedContent) return null;
  if (relatedGuideItems.length === 0) return null;
  return <RelatedGuides lang={context.lang} items={relatedGuideItems} />;
}

function hasStructuredIntro(context: GuideSeoTemplateContext): boolean {
  const intro = context.translateGuides(`content.${GUIDE_KEY}.intro`, { returnObjects: true }) as unknown;
  return Array.isArray(intro) && intro.some((value) => typeof value === "string" && value.trim().length > 0);
}

function resolveFallbackIntro(lang: string): string[] {
  const local = readFallbackStrings(lang, `${GUIDE_KEY}.intro`);
  if (local.length > 0) return local;
  return readFallbackStrings("en", `${GUIDE_KEY}.intro`);
}

function resolveFallbackFaqs(lang: string): NormalizedFaqEntry[] {
  const local = readFallbackFaqRecords(lang);
  const entries = local.length > 0 ? local : readFallbackFaqRecords("en");
  return entries.map(({ q, a }) => ({ question: q, answer: a }));
}

function readFallbackBundle(lang: string): Record<string, unknown> | undefined {
  const key = `../../locales/${lang}/guidesFallback.json`;
  const mod = GUIDE_FALLBACK_BUNDLES[key];
  const bundle =
    mod && typeof mod === "object" && "default" in mod ? (mod as { default?: unknown }).default : mod;
  if (!bundle || typeof bundle !== "object") return undefined;
  return bundle as Record<string, unknown>;
}

function readFallbackBundleValue<T>(lang: string, path: string[]): T | undefined {
  const bundle = readFallbackBundle(lang);
  if (!bundle) return undefined;
  let cursor: unknown = bundle;
  for (const segment of path) {
    if (!cursor || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return cursor as T | undefined;
}

function hasGuidesFallbackBundle(lang: string): boolean {
  if (lang === "en") return true;
  try {
    return i18n.hasResourceBundle(lang, "guidesFallback");
  } catch {
    return false;
  }
}

function normalizeStringList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0);
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
}

function readFallbackStringsForLocale(lang: string, key: string): string[] {
  const translatorHasBundle = hasGuidesFallbackBundle(lang);

  if (translatorHasBundle) {
    try {
      const translator = i18n.getFixedT(lang, "guidesFallback");
      const raw = translator?.(key, { returnObjects: true });
      const normalised = normalizeStringList(raw);
      if (normalised.length > 0) {
        return normalised;
      }
    } catch {
      // ignore translator errors
    }

    if (lang !== "en") {
      return [];
    }
  } else if (lang !== "en") {
    return [];
  }

  const bundleValue = readFallbackBundleValue<unknown>(lang, key.split("."));
  return normalizeStringList(bundleValue);
}

function readFallbackStrings(lang: string, key: string): string[] {
  const local = readFallbackStringsForLocale(lang, key);
  if (local.length > 0) return local;
  if (lang !== "en") {
    return readFallbackStringsForLocale("en", key);
  }
  return [];
}

type FaqEntry = { q: string; a: string[] };

function normalizeFaqEntries(raw: unknown): FaqEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const qSource = (entry as { q?: unknown }).q;
      const qAlt = (entry as { question?: unknown }).question;
      const q =
        typeof qSource === "string"
          ? qSource.trim()
          : typeof qAlt === "string"
          ? qAlt.trim()
          : "";
      const a = ensureStringArray((entry as { a?: unknown }).a ?? (entry as { answer?: unknown }).answer)
        .map((answer) => answer.trim())
        .filter(Boolean);
      if (!q || a.length === 0) return null;
      return { q, a };
    })
    .filter((entry): entry is FaqEntry => entry != null);
}

function readFallbackFaqRecordsForLocale(lang: string): FaqEntry[] {
  const translatorHasBundle = hasGuidesFallbackBundle(lang);

  if (translatorHasBundle) {
    try {
      const translator = i18n.getFixedT(lang, "guidesFallback");
      const raw = translator?.(`${GUIDE_KEY}.faqs`, { returnObjects: true });
      const normalised = normalizeFaqEntries(raw);
      if (normalised.length > 0) return normalised;
    } catch {
      // ignore translator errors
    }

    if (lang !== "en") {
      return [];
    }
  } else if (lang !== "en") {
    return [];
  }

  const bundleValue = readFallbackBundleValue<unknown>(lang, [GUIDE_KEY, "faqs"]);
  return normalizeFaqEntries(bundleValue);
}

function readFallbackFaqRecords(lang: string): FaqEntry[] {
  const local = readFallbackFaqRecordsForLocale(lang);
  if (local.length > 0) return local;
  if (lang !== "en") {
    return readFallbackFaqRecordsForLocale("en");
  }
  return [];
}

function buildFaqFallback(lang: string): NormalizedFaqEntry[] | undefined {
  const fallback = resolveFallbackFaqs(lang)
    .map(({ question, answer }) => ({
      question: question.trim(),
      answer: answer.map((value) => value.trim()).filter((value) => value.length > 0),
    }))
    .filter((entry) => entry.question.length > 0 && entry.answer.length > 0);
  return fallback.length > 0 ? fallback : undefined;
}
