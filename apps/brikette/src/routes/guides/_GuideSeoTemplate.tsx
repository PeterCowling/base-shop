// src/routes/guides/_GuideSeoTemplate.tsx
/* eslint-disable @typescript-eslint/no-explicit-any, ds/no-hardcoded-copy -- DEV-000 [ttl=2099-12-31] Template helper (_-prefixed) not shipped as a route. It intentionally contains placeholders, broad typing, and debug strings. Suppress to reduce IDE noise per src/routes/AGENTS.md; real routes must not rely on these disables. */
import { memo, useMemo, useRef } from "react";

import { IS_DEV } from "@/config/env";
import { GUIDE_SECTION_BY_KEY } from "@/data/guides.index";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { debugGuide } from "@/utils/debug";
import { isGuideContentFallback } from "@/utils/guideContentFallbackRegistry";

import { DEFAULT_OG_IMAGE } from "./guide-seo/constants";
import { GuideSeoTemplateBody } from "./guide-seo/template/GuideSeoTemplateBody";
import { resolveShouldRenderGenericContent } from "./guide-seo/template/resolveShouldRenderGenericContent";
import { useAdditionalScripts, resetAdditionalScriptsCache } from "./guide-seo/template/useAdditionalScripts";
import { useFallbackHead } from "./guide-seo/template/useFallbackHead";
import { useGuideManifestState } from "./guide-seo/template/useGuideManifestState";
import { useGuideSlotNodes } from "./guide-seo/template/useGuideSlotNodes";
import { useGuideTocOptions } from "./guide-seo/template/useGuideTocOptions";
import { useStructuredFallbackState } from "./guide-seo/template/useStructuredFallbackState";
import { useGuideTranslations } from "./guide-seo/translations";
import type { GuideSeoTemplateProps } from "./guide-seo/types";
import { useCanonicalUrl } from "./guide-seo/useCanonicalUrl";
import { useDisplayH1Title } from "./guide-seo/useDisplayH1Title";
import { useGuideBreadcrumb } from "./guide-seo/useGuideBreadcrumb";
import { useGuideContent } from "./guide-seo/useGuideContent";
import { useGuideMeta } from "./guide-seo/useGuideMeta";
import { useGuideSeoContext } from "./guide-seo/useGuideSeoContext";
import { useHowToJson } from "./guide-seo/useHowToJson";
import { useOgImage } from "./guide-seo/useOgImage";
import { probeHasLocalizedStructuredContent } from "./guide-seo/utils/fallbacks";
import {
  shouldSuppressGenericWhenUnlocalized,
  shouldSkipGenericForRequestedLocale,
} from "./guide-seo/utils/templatePolicies";
import { useHasLocalizedResources } from "./guide-seo/useHasLocalizedResources";

function isUnresolvedGuideDescription(
  value: string,
  guideKey: GuideSeoTemplateProps["guideKey"],
  metaKey: GuideSeoTemplateProps["metaKey"],
): boolean {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) return false;
  const candidates = new Set<string>();
  const asString = (candidate: unknown) =>
    typeof candidate === "string" && candidate.trim().length > 0 ? candidate.trim() : undefined;
  const guideKeyCandidate = asString(guideKey);
  const metaKeyCandidate = asString(metaKey);
  if (guideKeyCandidate) {
    candidates.add(`guides.meta.${guideKeyCandidate}.description`);
    candidates.add(`content.${guideKeyCandidate}.seo.description`);
  }
  if (metaKeyCandidate) {
    candidates.add(`guides.meta.${metaKeyCandidate}.description`);
  }
  return candidates.has(normalized);
}

function GuideSeoTemplate({
  guideKey,
  metaKey,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "article",
  includeHowToStructuredData = false,
  relatedGuides,
  alsoHelpful,
  articleLead,
  articleExtras,
  afterArticle,
  additionalScripts,
  guideFaqFallback,
  buildBreadcrumb,
  alwaysProvideFaqFallback = false,
  preferManualWhenUnlocalized = false,
  suppressTocTitle = false,
  suppressUnlocalizedFallback = false,
  suppressFaqWhenUnlocalized = false,
  showPlanChoice = true,
  showTransportNotice = true,
  showTagChips = true,
  showTocWhenUnlocalized = true,
  showRelatedWhenLocalized = true,
  twitterCardKey = "meta.twitterCard",
  twitterCardDefault,
  buildHowToSteps,
  buildTocItems,
  genericContentOptions,
  renderGenericContent = true,
  preferGenericWhenFallback = false,
  renderGenericWhenEmpty = false,
  fallbackToEnTocTitle = true,
  preferLocalizedSeoTitle = false,
}: GuideSeoTemplateProps): JSX.Element {
  const isExperiencesGuide = GUIDE_SECTION_BY_KEY[guideKey] === "experiences";
  const articleHeadingWeightClass = isExperiencesGuide
    ? "prose-headings:font-bold"
    : "prose-headings:font-semibold";
  const lang = useCurrentLanguage();
  const search = typeof window !== "undefined" ? window.location?.search ?? "" : "";
  const translations = useGuideTranslations(lang);
  const t = translations.tGuides;
  const hookI18n: any = (translations as any)?.i18n;
  const { guidesEn, translateGuides } = translations;
  // In App Router, use browser APIs for pathname (no React Router context)
  const canonicalPathname = typeof window !== "undefined" ? window.location?.pathname : undefined;
  const requestedLang = (() => {
    const path = canonicalPathname;
    if (typeof path === "string") {
      const match = path.match(/^\/([a-z]{2,3})(?:\b|\/)/i);
      if (match) {
        return match[1]?.toLowerCase();
      }
    }
    return undefined;
  })();
  const {
    manifestEntry,
    resolvedStatus,
    checklistSnapshot,
    draftUrl,
    isDraftRoute,
    shouldShowEditorialPanel,
  } = useGuideManifestState({
    guideKey,
    lang,
    canonicalPathname,
    preferManualWhenUnlocalized,
  });

  const hasStructuredLocalInitial = useMemo(
    () =>
      probeHasLocalizedStructuredContent(
        guideKey,
        translations.tGuides as unknown as (key: string, options?: unknown) => unknown,
      ),
    [guideKey, translations],
  );

  const {
    contentTranslator,
    hasLocalizedContent,
    translatorProvidedEmptyStructured,
    sections,
    intro,
    faqs,
    baseToc,
  } = useGuideContent({
    guideKey,
    tGuides: translations.tGuides,
    guidesEn: translations.guidesEn,
    translateGuides,
    lang,
    // When the route opts into manual handling for unlocalized locales,
    // avoid falling back to English structured arrays for the core content
    // translator. This prevents EN sections/FAQs from seeping into context
    // (and thus ToC derivation) when tests expect only curated fallbacks.
    suppressEnglishStructuredWhenUnlocalized: Boolean(preferManualWhenUnlocalized),
  });
  const targetLocale = (requestedLang ?? lang)?.trim().toLowerCase();
  const hasLocalizedResourcesForRequested = useHasLocalizedResources({
    targetLocale,
    guideKey,
    hasLocalizedContent,
  });
  const localizedContentKey = manifestEntry?.contentKey ?? guideKey;
  const fallbackInjectedForLocale = Boolean(
    targetLocale && localizedContentKey && isGuideContentFallback(targetLocale, localizedContentKey),
  );
  const faqHasLocalizedContent = preferManualWhenUnlocalized
    ? Boolean(hasLocalizedContent && !fallbackInjectedForLocale)
    : hasLocalizedContent;
  const shouldForceSkipFromTranslator = Boolean(
    preferManualWhenUnlocalized &&
      suppressUnlocalizedFallback &&
      (!hasLocalizedContent || fallbackInjectedForLocale),
  );
  const skipGenericRef = useRef(shouldForceSkipFromTranslator);
  const shouldSkipNow =
    !hasLocalizedResourcesForRequested && preferManualWhenUnlocalized && suppressUnlocalizedFallback;
  if ((shouldSkipNow || shouldForceSkipFromTranslator) && !skipGenericRef.current) {
    skipGenericRef.current = true;
  }
  const skipGenericForRequestedLocale =
    skipGenericRef.current || shouldSkipGenericForRequestedLocale(guideKey);

  const canonicalUrl = useCanonicalUrl({ pathname: canonicalPathname ?? null, lang, guideKey });

  // Consider translator-provided structured arrays as localized for downstream
  // gating to avoid EN fallback probes in unit tests where i18n store is empty.
  const hasAnyLocalized = Boolean(
    hasLocalizedContent || (!preferManualWhenUnlocalized && hasStructuredLocalInitial),
  );
  // When a route opts into manual handling for unlocalized locales, treat an
  // "initially empty" probe (hasStructuredLocalInitial=false) as unlocalized
  // for the purposes of content rendering. This allows tests to skip the early
  // GenericContent path and render manual structured arrays even if a later
  // translator call produces arrays (second-pass resolution in tests).
  const hasLocalizedForRendering = preferManualWhenUnlocalized
    ? Boolean(hasStructuredLocalInitial)
    : hasAnyLocalized;
  const shouldRenderGenericOrFallback =
    !(shouldSuppressGenericWhenUnlocalized(guideKey) && !hasAnyLocalized) &&
    !skipGenericForRequestedLocale;
  const allowEnglishFallbackWhenManual = Boolean(preferManualWhenUnlocalized && !hasLocalizedContent);

  const guideMetaArgs = {
    metaKey,
    twitterCardKey,
    ...translations,
    hasLocalizedContent: preferManualWhenUnlocalized ? hasLocalizedContent : hasAnyLocalized,
    // Provide the hook-level i18n so useGuideMeta can resolve getFixedT reliably in tests
    i18n: hookI18n as any,
    allowEnglishFallbackWhenManual,
    ...(typeof twitterCardDefault === "string" ? { twitterCardDefault } : {}),
    ...(typeof suppressUnlocalizedFallback === "boolean" ? { suppressUnlocalizedFallback } : {}),
  };
  const { title, description, homeLabel, guidesLabel, twitterCardType } = useGuideMeta(guideMetaArgs);

  const normalizedDescription = typeof description === "string" ? description.trim() : "";
  const hasRawDescriptionKey = normalizedDescription
    ? isUnresolvedGuideDescription(normalizedDescription, guideKey, metaKey)
    : false;
  const firstIntroNormalized = Array.isArray(intro) && typeof intro[0] === "string" ? intro[0].trim() : "";
  const hasMeaningfulDescription = normalizedDescription.length > 0 && !hasRawDescriptionKey;
  const subtitleShouldSuppressFallback = Boolean(
    preferManualWhenUnlocalized && fallbackInjectedForLocale,
  );
  const hasLocalizedSubtitleContent = subtitleShouldSuppressFallback ? false : hasMeaningfulDescription;
  const isManualUnlocalized = Boolean(preferManualWhenUnlocalized && !hasAnyLocalized);
  const isDuplicateOfIntro = Boolean(
    hasAnyLocalized &&
      hasLocalizedSubtitleContent &&
      firstIntroNormalized &&
      normalizedDescription.toLowerCase() === firstIntroNormalized.toLowerCase(),
  );
  const shouldRenderSubtitle = Boolean(
    hasLocalizedSubtitleContent &&
      (!isDuplicateOfIntro || isManualUnlocalized),
  );
  const subtitleText = shouldRenderSubtitle ? normalizedDescription : "";
  const articleDescriptionForGeneric = shouldRenderSubtitle ? normalizedDescription : undefined;

  const { ogImageConfig, ogImageUrl } = useOgImage(ogImage);

  const effectiveTitle = useMemo(() => {
    const expectedKey = `content.${guideKey}.seo.title`;
    const metaTitleKey = `meta.${metaKey}.title`;
    const isRawKey = (v: unknown) => {
      if (typeof v !== "string") return false;
      const s = v.trim();
      return s === expectedKey || s === metaTitleKey;
    };
    if (typeof title === "string" && title.trim().length > 0 && !isRawKey(title)) {
      try {
        debugGuide("Title from useGuideMeta", { lang, guideKey, value: title });
      } catch (err) { if (IS_DEV) console.debug("[GuideSeoTemplate] debug title", err); }
      return title;
    }
    try {
      debugGuide("Title unresolved; returning guide key", { lang, guideKey });
    } catch (err) { if (IS_DEV) console.debug("[GuideSeoTemplate] debug fallback", err); }
    return (metaKey as string) || (guideKey as string);
  }, [guideKey, lang, title, metaKey]);

  const displayH1Title = useDisplayH1Title({
    metaKey: metaKey as any,
    effectiveTitle: effectiveTitle as any,
    guideKey: guideKey as any,
    translations: translations as any,
    hasLocalizedContent: preferManualWhenUnlocalized ? hasLocalizedContent : hasAnyLocalized,
    preferLocalizedSeoTitle,
  });

  const resolvedDisplayTitle = useMemo(() => {
    const normalise = (value: unknown) => (typeof value === "string" ? value.trim() : "");
    const fromDisplay = normalise(displayH1Title);
    if (fromDisplay) return fromDisplay;
    const fromEffective = normalise(effectiveTitle);
    if (fromEffective) return fromEffective;
    const fromMeta = normalise(title);
    if (fromMeta) return fromMeta;
    const fromMetaKey = normalise(metaKey);
    if (fromMetaKey) return fromMetaKey;
    return String(guideKey);
  }, [displayH1Title, effectiveTitle, guideKey, metaKey, title]);

  const shouldRenderGenericContentForLocale = useMemo(() => {
    if (!renderGenericContent) return false;
    if (preferManualWhenUnlocalized && !hasLocalizedForRendering) {
      return false;
    }
    return true;
  }, [renderGenericContent, preferManualWhenUnlocalized, hasLocalizedForRendering]);

  const shouldRenderGenericContent = resolveShouldRenderGenericContent({
    shouldRenderGenericContentForLocale,
    guideKey,
    hasStructuredLocalInitial,
    hasAnyLocalized,
    lang,
  });

  const translateGuidesEn = useMemo(() => {
    const base = guidesEn;
    return ((key: string, options?: Record<string, unknown>) =>
      base(key, options as Record<string, unknown> | undefined)) as typeof translateGuides;
  }, [guidesEn]);

  const guideSeoContextArgs = {
    baseToc,
    canonicalUrl,
    contentTranslator,
    description,
    faqs,
    guideKey,
    // Treat translator-provided structured arrays as localized to avoid
    // probing EN fallbacks in tests and downstream helpers. When routes opt
    // into manual handling for unlocalized locales, prefer the initial probe
    // result (hasStructuredLocalInitial) so fallback/manual renderers can
    // activate in tests where the first pass is empty.
    hasLocalizedContent: preferManualWhenUnlocalized ? hasLocalizedContent : hasLocalizedForRendering,
    intro,
    lang,
    metaKey,
    ogImage: { url: ogImageUrl, width: ogImageConfig.width, height: ogImageConfig.height },
    sections,
    title,
    translateGuides,
    translateGuidesEn,
    ...(typeof buildTocItems === "function" ? { buildTocItems } : {}),
    renderGenericContent: shouldRenderGenericContentForLocale,
  };
  const { context } = useGuideSeoContext(guideSeoContextArgs);

  const { structuredTocItems, effectiveGenericOptions } = useGuideTocOptions({
    context,
    buildTocItems,
    genericContentOptions,
    guideKey,
    hasLocalizedContent,
    guidesEn,
    translateGuides,
    suppressUnlocalizedFallback,
    preferManualWhenUnlocalized,
  });

  const canonicalPath = useMemo(() => {
    try {
      const parsed = new URL(canonicalUrl);
      return parsed.pathname || `/${lang}`;
    } catch {
      if (canonicalUrl.startsWith("/")) return canonicalUrl;
      return `/${lang}`;
    }
  }, [canonicalUrl, lang]);

  useFallbackHead({
    lang,
    canonicalUrl,
    canonicalPath,
    effectiveTitle: effectiveTitle as string,
    description: description as string,
    ogImageUrl,
    ogImageConfig,
    ogType,
    twitterCardType,
    guideKey,
    metaKey,
    manifestEntry: manifestEntry ?? null,
  });

  const { fallbackStructured, manualStructuredFallback } = useStructuredFallbackState({
    guideKey,
    lang,
    hookI18n,
    translations,
    hasLocalizedContent,
    hasStructuredLocalInitial,
    preferManualWhenUnlocalized,
    suppressUnlocalizedFallback,
    translatorProvidedEmptyStructured,
  });

  const breadcrumbArgs = {
    lang: lang as any,
    guideKey: guideKey as any,
    title: ((displayH1Title as string) ?? (effectiveTitle as string) ?? (title as string)) as string,
    homeLabel: homeLabel as any,
    guidesLabel: guidesLabel as any,
    context,
    ...(typeof buildBreadcrumb === "function" ? { buildBreadcrumb } : {}),
  };
  const breadcrumb = useGuideBreadcrumb(breadcrumbArgs);

  const howToJsonArgs = {
    context,
    includeHowToStructuredData,
    ...(typeof buildHowToSteps === "function" ? { buildHowToSteps } : {}),
  };
  const howToJson = useHowToJson(howToJsonArgs);

  const { articleLeadNode, articleExtrasNode, afterArticleNode } = useGuideSlotNodes({
    context,
    articleLead,
    articleExtras,
    afterArticle,
  });

  const additionalScriptsNode = useAdditionalScripts({
    additionalScripts,
    context,
    guideKey,
    lang,
  });

  const previewBannerLabel = t("preview.unpublishedBanner", {
    defaultValue: "Preview only – this guide is not published",
  }) as string;

  const articleHeaderDebug = {
    lang: lang as any,
    guideKey: guideKey as any,
    effectiveTitle: (effectiveTitle as string) ?? "",
    hasLocalizedContent,
    article: { title: title as any, description: description as any },
    counts: { sections: sections.length, intro: intro.length, faqs: faqs.length, baseToc: baseToc.length },
  };

  return (
    <GuideSeoTemplateBody
      lang={lang}
      guideKey={guideKey}
      search={search}
      resolvedDisplayTitle={resolvedDisplayTitle}
      description={description as string}
      canonicalUrl={canonicalUrl}
      ogImageUrl={ogImageUrl}
      previewBannerLabel={previewBannerLabel}
      breadcrumb={breadcrumb}
      howToJson={howToJson ?? null}
      additionalScripts={additionalScriptsNode}
      hasAnyLocalized={hasAnyLocalized}
      faqHasLocalizedContent={faqHasLocalizedContent}
      shouldShowEditorialPanel={shouldShowEditorialPanel}
      manifestEntry={manifestEntry ?? null}
      resolvedStatus={resolvedStatus}
      isDraftRoute={isDraftRoute}
      checklistSnapshot={checklistSnapshot}
      draftUrl={draftUrl}
      articleHeadingWeightClass={articleHeadingWeightClass}
      subtitleText={subtitleText}
      articleHeaderDebug={articleHeaderDebug}
      manualStructuredFallbackNode={manualStructuredFallback.node}
      manualStructuredFallbackRendered={manualStructuredFallback.hasContent}
      structuredTocItems={structuredTocItems}
      context={context}
      translations={translations}
      tGuides={translations.tGuides}
      sections={sections}
      faqs={faqs}
      buildTocItems={buildTocItems}
      shouldRenderGenericContentForLocale={shouldRenderGenericContentForLocale}
      shouldRenderGenericContent={shouldRenderGenericContent}
      effectiveGenericOptions={effectiveGenericOptions}
      hasLocalizedForRendering={hasLocalizedForRendering}
      showTocWhenUnlocalized={showTocWhenUnlocalized}
      suppressTocTitle={suppressTocTitle}
      fallbackStructured={fallbackStructured}
      preferManualWhenUnlocalized={preferManualWhenUnlocalized}
      suppressUnlocalizedFallback={suppressUnlocalizedFallback}
      fallbackToEnTocTitle={fallbackToEnTocTitle}
      requestedLang={requestedLang}
      shouldRenderGenericOrFallback={shouldRenderGenericOrFallback}
      t={t}
      hookI18n={hookI18n}
      articleDescriptionForGeneric={articleDescriptionForGeneric}
      renderGenericWhenEmpty={Boolean(renderGenericWhenEmpty)}
      preferGenericWhenFallback={preferGenericWhenFallback}
      articleLeadNode={articleLeadNode}
      articleExtrasNode={articleExtrasNode}
      afterArticleNode={afterArticleNode}
      showTagChips={showTagChips}
      showPlanChoice={showPlanChoice}
      showTransportNotice={showTransportNotice}
      relatedGuides={relatedGuides}
      showRelatedWhenLocalized={showRelatedWhenLocalized}
      alsoHelpful={alsoHelpful}
      guideFaqFallback={guideFaqFallback}
      alwaysProvideFaqFallback={alwaysProvideFaqFallback}
      suppressFaqWhenUnlocalized={suppressFaqWhenUnlocalized}
    />
  );
}

export default memo(GuideSeoTemplate);
export type { GuideSeoTemplateContext } from "./guide-seo/types";

export function __test__resetAdditionalScriptsCache(): void {
  resetAdditionalScriptsCache();
}
