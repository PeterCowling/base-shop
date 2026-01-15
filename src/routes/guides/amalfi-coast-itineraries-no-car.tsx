// src/routes/guides/amalfi-coast-itineraries-no-car.tsx
import { Link } from "react-router-dom";
import { Trans } from "react-i18next";
import type { TFunction } from "i18next";

import { defineGuideRoute, createStructuredLeadWithBuilder, type GuideLinksArgs } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import type { GuideSeoTemplateContext, HowToStep } from "./guide-seo/types";

import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { langFromRequest } from "@/utils/lang";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import TableOfContents from "@/components/guides/TableOfContents";
import type { LoaderFunctionArgs } from "react-router-dom";
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";
import i18n from "@/i18n";
import { i18nConfig, type AppLanguage } from "@/i18n.config";

export const handle = { tags: ["itinerary", "amalfi", "pillar"] };

export const GUIDE_KEY: GuideKey = "itinerariesPillar";
export const GUIDE_SLUG = "amalfi-coast-itineraries-no-car" as const;

type NormalisedDay = { name: string; body: string[] };
type NormalisedFaq = { q: string; a: string[] };
type FallbackFaq = { question: string; answer: string[] };

type TranslatorLike = (key: string, options?: Record<string, unknown>) => unknown;

export function normaliseStructuredDays(input: unknown): NormalisedDay[] {
  return ensureArray<{ name?: string; body?: unknown }>(input)
    .map((item) => ({
      name: typeof item?.name === "string" ? item.name.trim() : "",
      body: ensureStringArray(item?.body),
    }))
    .filter((d) => d.name.length > 0 && d.body.length > 0);
}

export function normaliseStructuredFaqs(input: unknown): NormalisedFaq[] {
  return ensureArray<{ q?: string; a?: unknown; question?: string; answer?: unknown }>(input)
    .map((item) => ({
      q:
        typeof (item?.q ?? item?.question) === "string"
          ? String(item.q ?? item.question).trim()
          : "",
      a: ensureStringArray(item?.a ?? item?.answer),
    }))
    .filter((i) => i.q.length > 0 && i.a.length > 0);
}

export function ensureFallbackFaqs(input: unknown): FallbackFaq[] {
  return ensureArray<{ q?: string; a?: unknown; question?: string; answer?: unknown }>(input)
    .map((item) => ({
      question:
        typeof (item?.question ?? item?.q) === "string"
          ? String(item.question ?? item.q).trim()
          : "",
      answer: ensureStringArray(item?.answer ?? item?.a),
    }))
    .filter((f) => f.question.length > 0 && f.answer.length > 0);
}

function normaliseHowToSteps(input: unknown): HowToStep[] {
  return ensureArray<{ name?: unknown; text?: unknown }>(input)
    .map((step) => {
      const name = typeof step?.name === "string" ? step.name.trim() : "";
      if (!name) return null;
      const text = typeof step?.text === "string" ? step.text.trim() : undefined;
      if (text && text.length > 0) {
        return { name, text };
      }
      return { name };
    })
    .filter((step): step is HowToStep => step != null);
}

function callTranslator<T = unknown>(
  translator: unknown,
  key: string,
  options: Record<string, unknown> = {},
  fallbackValue?: T,
): T {
  if (typeof translator !== "function") {
    if (Object.prototype.hasOwnProperty.call(options, "defaultValue")) {
      return options.defaultValue as T;
    }
    if (options.returnObjects) {
      return (Array.isArray(fallbackValue) ? fallbackValue : []) as T;
    }
    return (fallbackValue ?? (key as unknown as T)) as T;
  }

  const result = (translator as TranslatorLike)(key, options);
  if (typeof result === "function") {
    try {
      return (result as TranslatorLike)(key, options) as T;
    } catch {
      return result as T;
    }
  }

  if (
    result != null &&
    typeof result === "object" &&
    !Array.isArray(result) &&
    !(options.returnObjects ?? false)
  ) {
    if (Object.prototype.hasOwnProperty.call(options, "defaultValue")) {
      return options.defaultValue as T;
    }
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    return key as unknown as T;
  }

  if (result === undefined) {
    if (Object.prototype.hasOwnProperty.call(options, "defaultValue")) {
      return options.defaultValue as T;
    }
    if (options.returnObjects) {
      return (Array.isArray(fallbackValue) ? fallbackValue : []) as T;
    }
    return (fallbackValue ?? (key as unknown as T)) as T;
  }

  return result as T;
}

function wrapTranslator(translator: unknown): TranslatorLike {
  return (key: string, options?: Record<string, unknown>) =>
    callTranslator(translator, key, options ?? {});
}

function resolveGuidesFallbackTranslator(lang: string): TranslatorLike {
  const hookTranslator = (i18n as unknown as { __tGuidesFallback?: unknown }).__tGuidesFallback;
  if (typeof hookTranslator === "function") return hookTranslator as TranslatorLike;
  const getFixedT = (i18n as unknown as { getFixedT?: (lng: string, ns: string) => unknown }).getFixedT;
  if (typeof getFixedT === "function") {
    const t = getFixedT(lang, "guidesFallback");
    if (typeof t === "function") return t as TranslatorLike;
  }
  return (() => undefined) as unknown as TranslatorLike;
}

function buildFallbackTocItems(fallback: TranslatorLike): Array<{ href: string; label: string }> {
  const baseHeadings = [
    { href: "#two-days", label: callTranslator<string>(fallback, `${GUIDE_KEY}.twoDaysHeading`, {}, "") },
    { href: "#three-days", label: callTranslator<string>(fallback, `${GUIDE_KEY}.threeDaysHeading`, {}, "") },
    { href: "#seven-days", label: callTranslator<string>(fallback, `${GUIDE_KEY}.sevenDaysHeading`, {}, "") },
  ].filter((item) => item.label.trim().length > 0);

  const compact = [
    { href: "#two-days", label: callTranslator<string>(fallback, `${GUIDE_KEY}.toc.twoDays`, {}, "") },
    { href: "#three-days", label: callTranslator<string>(fallback, `${GUIDE_KEY}.toc.threeDays`, {}, "") },
    { href: "#seven-days", label: callTranslator<string>(fallback, `${GUIDE_KEY}.toc.sevenDays`, {}, "") },
  ].filter((item) => item.label.trim().length > 0);

  const toc = compact.length > 0 ? compact : baseHeadings;

  const tipsLabel = callTranslator<string>(fallback, `${GUIDE_KEY}.toc.tips`, {}, "");
  if (tipsLabel.trim().length > 0) toc.push({ href: "#tips", label: tipsLabel });
  const faqsLabel = callTranslator<string>(fallback, `${GUIDE_KEY}.toc.faqs`, {}, "");
  if (faqsLabel.trim().length > 0) toc.push({ href: "#faqs", label: faqsLabel });

  return toc;
}

function buildArticleExtras(ctx: GuideSeoTemplateContext): JSX.Element {
  const guidesTranslator =
    typeof ctx.translateGuides === "function"
      ? (ctx.translateGuides as TranslatorLike)
      : (key: string, options?: Record<string, unknown>) => ctx.translator?.(key, options);
  const fallbackTranslator = resolveGuidesFallbackTranslator(ctx.lang);

  const guidesT = (key: string, options?: Record<string, unknown>) =>
    callTranslator(guidesTranslator, key, options ?? {});

  const structuredIntro = guidesT(`content.${GUIDE_KEY}.intro`, { defaultValue: "" }) as string;
  const structuredDays = normaliseStructuredDays(guidesT(`content.${GUIDE_KEY}.days`, { returnObjects: true }));
  const structuredTips = ensureStringArray(guidesT(`content.${GUIDE_KEY}.tips`, { returnObjects: true }));
  const structuredFaqs = normaliseStructuredFaqs(guidesT(`content.${GUIDE_KEY}.faq`, { returnObjects: true }));
  const hasStructuredContent =
    (typeof structuredIntro === "string" && structuredIntro.length > 0) || structuredDays.length > 0;

  if (ctx.hasLocalizedContent && hasStructuredContent) {
    const fallbackTipsHeading = callTranslator<string>(guidesTranslator, `${GUIDE_KEY}.tipsHeading`, {}, "");
    const fallbackFaqHeading = callTranslator<string>(guidesTranslator, `${GUIDE_KEY}.faqHeading`, {}, "");
    const tipsTitle = guidesT(`content.${GUIDE_KEY}.tipsTitle`, { defaultValue: fallbackTipsHeading }) as string;
    const faqTitle = guidesT(`content.${GUIDE_KEY}.faqTitle`, { defaultValue: fallbackFaqHeading }) as string;

    return (
      <>
        {structuredIntro && <p>{structuredIntro}</p>}
        {structuredDays.length > 0 && (
          <TableOfContents items={structuredDays.map((d, i) => ({ href: `#day-${i + 1}`, label: d.name }))} />
        )}
        {structuredDays.map((day, index) => (
          <section id={`day-${index + 1}`} key={day.name}>
            <h2>{day.name}</h2>
            {day.body.map((paragraph, idx) => (
              <p key={`day-${index + 1}-p-${idx}`}>{paragraph}</p>
            ))}
          </section>
        ))}
        {structuredTips.length > 0 && (
          <>
            <h2>{tipsTitle}</h2>
            <ul>
              {structuredTips.map((tip, i) => (
                <li key={`tip-${i}`}>{tip}</li>
              ))}
            </ul>
          </>
        )}
        {structuredFaqs.length > 0 ? (
          <section id="faqs">
            <h2>{faqTitle}</h2>
            {structuredFaqs.map((item, index) => (
              <details key={`faq-${index}`}>
                <summary>{item.q}</summary>
                {item.a.map((ans, j) => (
                  <p key={`faq-${index}-a-${j}`}>{ans}</p>
                ))}
              </details>
            ))}
          </section>
        ) : null}
      </>
    );
  }

  const fallbackIntro = callTranslator<string>(fallbackTranslator, `${GUIDE_KEY}.intro`, {}, "");
  const fallbackToc = buildFallbackTocItems(fallbackTranslator);
  const twoDaysItems = ensureStringArray(
    callTranslator(fallbackTranslator, `${GUIDE_KEY}.twoDaysItems`, { returnObjects: true }),
  );
  const threeDaysIntro = callTranslator<string>(fallbackTranslator, `${GUIDE_KEY}.threeDaysIntro`, {}, "");
  const threeDaysOptions = ensureStringArray(
    callTranslator(fallbackTranslator, `${GUIDE_KEY}.threeDaysOptions`, { returnObjects: true }),
  );
  const sevenDaysItems = ensureStringArray(
    callTranslator(fallbackTranslator, `${GUIDE_KEY}.sevenDaysItems`, { returnObjects: true }),
  );
  const tipsHeading = callTranslator<string>(fallbackTranslator, `${GUIDE_KEY}.tipsHeading`, {}, "Tips");
  const tips = ensureStringArray(
    callTranslator(fallbackTranslator, `${GUIDE_KEY}.tips`, { returnObjects: true }),
  );
  const faqHeading = callTranslator<string>(fallbackTranslator, `${GUIDE_KEY}.faqHeading`, {}, "FAQs");
  const fallbackFaqs = ensureFallbackFaqs(
    callTranslator(fallbackTranslator, `${GUIDE_KEY}.faqs`, { returnObjects: true }),
  );

  const tocLabelCandidate = guidesT("labels.onThisPage", { defaultValue: "On this page" });
  const tocLabel = typeof tocLabelCandidate === "string" && tocLabelCandidate.trim().length > 0 ? tocLabelCandidate : "On this page";

  return (
    <>
      <p>{fallbackIntro}</p>
      <TableOfContents items={fallbackToc} />
      <nav aria-label={tocLabel} data-testid="toc">
        <ul>
          {fallbackToc.map((item) => (
            <li key={item.href}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <h2 id="two-days">
        {callTranslator<string>(fallbackTranslator, `${GUIDE_KEY}.twoDaysHeading`, {}, "")}
      </h2>
      <ul>
        {twoDaysItems.map((option, index) => (
          <li key={`two-days-${index}`}>
            <Trans
              t={guidesTranslator as unknown as TFunction}
              i18nKey={`${GUIDE_KEY}.twoDaysItems.${index}`}
              defaultValue={option}
              components={{
                pathOfTheGodsLink: (
                  <Link to={`/${ctx.lang}/${getSlug("guides", ctx.lang)}/${guideSlug(ctx.lang, "pathOfTheGods")}`} />
                ),
              }}
            >
              {option}
            </Trans>
          </li>
        ))}
      </ul>

      <h2 id="three-days">
        {callTranslator<string>(fallbackTranslator, `${GUIDE_KEY}.threeDaysHeading`, {}, "")}
      </h2>
      <p>{threeDaysIntro}</p>
      <ul>
        {threeDaysOptions.map((option, index) => (
          <li key={`three-days-option-${index}`}>{option}</li>
        ))}
      </ul>

      <h2 id="seven-days">
        {callTranslator<string>(fallbackTranslator, `${GUIDE_KEY}.sevenDaysHeading`, {}, "")}
      </h2>
      <ol>
        {sevenDaysItems.map((item, index) => (
          <li key={`seven-days-item-${index}`}>{item}</li>
        ))}
      </ol>

      <h2 id="tips">{tipsHeading}</h2>
      <ul>
        {tips.map((tip, index) => (
          <li key={`tip-${index}`}>{tip}</li>
        ))}
      </ul>

      {fallbackFaqs.length > 0 && (
        <section id="faqs">
          <h2>{faqHeading}</h2>
          {fallbackFaqs.map((faq, index) => (
            <details key={`faq-${index}`}>
              <summary>{faq.question}</summary>
              {faq.answer.map((ans, answerIndex) => (
                <p key={`faq-${index}-answer-${answerIndex}`}>{ans}</p>
              ))}
            </details>
          ))}
        </section>
      )}
    </>
  );
}


  const translator = wrapTranslator(i18n.getFixedT(lang, "guidesFallback") as TFunction<"guidesFallback">);
  const entries = ensureArray<{ question?: string; q?: string; answer?: unknown; a?: unknown }>(
    callTranslator(translator, `${GUIDE_KEY}.faqs`, { returnObjects: true }),
  )
    .map((f) => ({
      q:
        typeof (f?.question ?? f?.q) === "string"
          ? String(f.question ?? f.q).trim()
          : "",
      a: ensureStringArray(f?.answer ?? f?.a),
    }))
    .filter((f) => f.q.length > 0 && f.a.length > 0);
  return entries;
}


function buildHowToSteps(ctx: GuideSeoTemplateContext) {
  const guidesTranslator =
    typeof ctx.translateGuides === "function"
      ? (ctx.translateGuides as TranslatorLike)
      : (key: string, options?: Record<string, unknown>) => ctx.translator?.(key, options);
  const localized = ensureArray(
    callTranslator(guidesTranslator, `content.${GUIDE_KEY}.howTo.steps`, { returnObjects: true }),
  );
  const fallback = ensureArray(
    callTranslator(resolveGuidesFallbackTranslator(ctx.lang), `${GUIDE_KEY}.howTo.steps`, { returnObjects: true }),
  );
  const steps = localized.length > 0 ? localized : fallback;
  return steps.length > 0 ? steps : null;
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for itinerariesPillar");
}

const structuredLead = createStructuredLeadWithBuilder({
  guideKey: GUIDE_KEY,
  buildExtras: collectItineraryExtras,
  render: (context, buildExtras) => {
    const extras = buildExtras(context);
    if (extras.hasStructured) {
      return renderStructuredItineraryArticle(extras);
    }
    return renderFallbackItineraryArticle(context, extras);
  },
  selectTocItems: (extras) => selectItineraryTocItems(extras),
  isStructured: (extras) => extras.hasStructured,
});

const { Component, clientLoader, links, meta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    renderGenericContent: false,
    preferManualWhenUnlocalized: true,
    suppressUnlocalizedFallback: true,
    articleLead: structuredLead.articleLead,
    buildHowToSteps,
    guideFaqFallback: (lang) => buildGuideFaqFallback(lang),
  }),
  structuredArticle: structuredLead.structuredArticle,
  clientLoader: async ({ request }: LoaderFunctionArgs) => {
    const lang = langFromRequest(request);
    await preloadNamespacesWithFallback(lang, ["guides", "guidesFallback", "header"], {
      fallbackOptional: false,
    });
    await i18n.changeLanguage(lang);
    await ensureGuideContent(lang, manifestEntry.contentKey, {
      en: () => import(`../../locales/en/guides/content/${manifestEntry.contentKey}.json`),
      local:
        lang === "en"
          ? undefined
          : () =>
              import(`../../locales/${lang}/guides/content/${manifestEntry.contentKey}.json`).catch(
                () => undefined,
              ),
    });
    return { lang };
  },
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
    const path = `/${lang}/${getSlug(baseKey, lang)}/${guideSlug(lang, manifestEntry.key)}`;
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: DEFAULT_OG_IMAGE.width,
      height: DEFAULT_OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
  links: (args: GuideLinksArgs | undefined) => {
    const payload = ((args ?? {}) as { data?: unknown }).data as { lang?: AppLanguage } | undefined;
    const lang = payload?.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
    const path = `/${lang}/${getSlug(baseKey, lang)}/${guideSlug(lang, manifestEntry.key)}`;
    return buildRouteLinks({ lang, path, origin: BASE_URL });
  },
});

export default Component;
export { clientLoader, meta, links };

export const __testables = {
  normaliseStructuredDays,
  normaliseStructuredFaqs,
  ensureFallbackFaqs,
};