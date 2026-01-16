// src/routes/guides/guide-seo/useGuideSeoConfig.ts
/* eslint-disable @typescript-eslint/no-explicit-any -- SEO-2743 Template helper shared across layout + head */
import { isValidElement, useMemo, useRef } from "react";
import type { ComponentProps } from "react";
import { useLocation } from "react-router-dom";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { DEFAULT_OG_IMAGE, HOW_TO_JSON_TYPE } from "./constants";
import { useGuideTranslations } from "./translations";
import { useGuideContent } from "./useGuideContent";
import { useGuideMeta } from "./useGuideMeta";
import { useOgImage } from "./useOgImage";
import { useCanonicalUrl } from "./useCanonicalUrl";
import { useGuideBreadcrumb } from "./useGuideBreadcrumb";
import { useStructuredTocItems } from "./useStructuredTocItems";
import { useGuideSeoContext } from "./useGuideSeoContext";
import { useHowToJson } from "./useHowToJson";
import { useDisplayH1Title } from "./useDisplayH1Title";
import HeadSection from "./components/HeadSection";
import FaqStructuredDataBlock from "./components/FaqStructuredDataBlock";
import type { GuideSeoTemplateProps, GuideSeoTemplateContext } from "./types";
import { debugGuide } from "@/utils/debug";
import {
  buildStructuredFallback,
  probeHasLocalizedStructuredContent,
  type StructuredFallback,
} from "./utils/fallbacks";
import {
  buildGuideChecklist,
  getGuideManifestEntry,
  resolveDraftPathSegment,
  type ChecklistSnapshot,
  type GuideManifestEntry,
} from "../guide-manifest";
import { applyLocaleAwareTranslationChecklist } from "./checklistLocalization";
import type { GuideRouteLoaderData } from "../defineGuideRoute";
import i18n from "@/i18n";
import { useSafeLoaderData } from "@/utils/safeUseLoaderData";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import type { LinksFunction } from "react-router";

const __additionalScriptsCache: Map<string, React.ReactNode | null> = new Map();

function useDiagnosticLocation(
  guideKey: string,
  lang: string | undefined,
): ReturnType<typeof useLocation> | undefined {
  try {
    return useLocation();
  } catch (error) {
    try {
      // i18n-exempt -- SEO-2743 [ttl=2025-06-30]
      debugGuide("useLocation unavailable; continuing without router context", {
        guideKey,
        lang,
        error,
      });
    } catch {
      // ignore debug logging failures (tests may not mock debugGuide)
    }
    return undefined;
  }
}

function isGuidesFallbackTocEmpty(lang: string | undefined, guideKey: string): boolean {
  if (!lang) return false;
  try {
    const direct = i18n.getResource?.(lang, "guidesFallback", guideKey) as unknown;
    if (direct && typeof direct === "object" && !Array.isArray(direct)) {
      const toc = (direct as Record<string, unknown>).toc;
      if (Array.isArray(toc) && toc.length === 0) return true;
    }
    const keys = [`content.${guideKey}.toc`, `${guideKey}.toc`];
    return keys.some((key) => {
      try {
        const value = i18n.getResource?.(lang, "guidesFallback", key) as unknown;
        return Array.isArray(value) && value.length === 0;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

type GuideTranslations = ReturnType<typeof useGuideTranslations>;
type GuideContentResult = ReturnType<typeof useGuideContent>;
type GuideMetaResult = ReturnType<typeof useGuideMeta>;

export interface GuideSeoLayoutBaseState {
  lang: ReturnType<typeof useCurrentLanguage>;
  guideKey: GuideSeoTemplateProps["guideKey"];
  translations: GuideTranslations;
  t: GuideTranslations["tGuides"];
  hookI18n: GuideTranslations["i18n"];
  manifestEntry: GuideManifestEntry | null;
  resolvedStatus: GuideManifestEntry["status"];
  checklistSnapshot: ChecklistSnapshot | undefined;
  draftUrl?: string;
  isDraftRoute: boolean;
  shouldShowEditorialPanel: boolean;
  sections: GuideContentResult["sections"];
  intro: GuideContentResult["intro"];
  faqs: GuideContentResult["faqs"];
  baseToc: GuideContentResult["baseToc"];
  context: GuideSeoTemplateContext;
  displayH1Title: string | undefined;
  effectiveTitle?: string;
  subtitleText: string;
  title: GuideMetaResult["title"];
  description: GuideMetaResult["description"];
  articleDescriptionForGeneric?: string;
  hasAnyLocalized: boolean;
  hasLocalizedContent: boolean;
  hasLocalizedForRendering: boolean;
  hasStructuredLocalInitial: boolean;
  preferManualWhenUnlocalized: boolean;
  preferGenericWhenFallback?: boolean;
  renderGenericContent: boolean;
  renderGenericWhenEmpty: boolean;
  showTocWhenUnlocalized: boolean;
  suppressTocTitle?: boolean;
  suppressUnlocalizedFallback: boolean;
  showPlanChoice: boolean;
  showTransportNotice: boolean;
  showTagChips: boolean;
  showRelatedWhenLocalized: boolean;
  relatedGuides?: GuideSeoTemplateProps["relatedGuides"];
  alsoHelpful?: GuideSeoTemplateProps["alsoHelpful"];
  articleLead?: GuideSeoTemplateProps["articleLead"];
  articleExtras?: GuideSeoTemplateProps["articleExtras"];
  afterArticle?: GuideSeoTemplateProps["afterArticle"];
  buildTocItems?: GuideSeoTemplateProps["buildTocItems"];
}

export interface GuideSeoFallbackLayoutStateSlice {
  fallbackStructured: StructuredFallback | null;
  structuredTocItems: ReturnType<typeof useStructuredTocItems>;
  effectiveGenericOptions: NonNullable<GuideSeoTemplateProps["genericContentOptions"]>;
}

export type GuideSeoLayoutState = GuideSeoLayoutBaseState & GuideSeoFallbackLayoutStateSlice;

export interface GuideSeoConfig {
  headSectionProps: ComponentProps<typeof HeadSection>;
  faqStructuredDataProps: ComponentProps<typeof FaqStructuredDataBlock>;
  layoutState: GuideSeoLayoutState;
  fallbackHeadMeta: ReturnType<typeof buildRouteMeta> | undefined;
  fallbackHeadLinks: ReturnType<LinksFunction> | undefined;
}

interface GuideSeoEditorialStateResult {
  layoutState: GuideSeoLayoutBaseState;
  search: string;
  canonicalUrl: string;
  canonicalPath: string;
  ogImageConfig: ReturnType<typeof useOgImage>["ogImageConfig"];
  ogImageUrl: string;
  twitterCardType: GuideMetaResult["twitterCardType"];
  breadcrumbLabels: {
    homeLabel: GuideMetaResult["homeLabel"];
    guidesLabel: GuideMetaResult["guidesLabel"];
  };
}

interface GuideSeoFallbackStateArgs {
  guideKey: GuideSeoTemplateProps["guideKey"];
  metaKey: GuideSeoTemplateProps["metaKey"];
  layoutState: GuideSeoLayoutBaseState;
  canonicalUrl: string;
  canonicalPath: string;
  ogImageConfig: ReturnType<typeof useOgImage>["ogImageConfig"];
  ogImageUrl: string;
  twitterCardType: GuideMetaResult["twitterCardType"];
  genericContentOptions: GuideSeoTemplateProps["genericContentOptions"];
}

interface GuideSeoFallbackStateResult {
  layoutSlice: GuideSeoFallbackLayoutStateSlice;
  fallbackHeadMeta: ReturnType<typeof buildRouteMeta> | undefined;
  fallbackHeadLinks: ReturnType<LinksFunction> | undefined;
}

interface GuideSeoHeadPropsArgs {
  layoutState: GuideSeoLayoutState;
  canonicalUrl: string;
  ogImageUrl: string;
  search: string;
  includeHowToStructuredData?: boolean;
  buildHowToSteps?: GuideSeoTemplateProps["buildHowToSteps"];
  buildBreadcrumb?: GuideSeoTemplateProps["buildBreadcrumb"];
  additionalScripts?: GuideSeoTemplateProps["additionalScripts"];
  guideFaqFallback?: GuideSeoTemplateProps["guideFaqFallback"];
  alwaysProvideFaqFallback?: GuideSeoTemplateProps["alwaysProvideFaqFallback"];
  suppressFaqWhenUnlocalized?: GuideSeoTemplateProps["suppressFaqWhenUnlocalized"];
  breadcrumbLabels: {
    homeLabel: GuideMetaResult["homeLabel"];
    guidesLabel: GuideMetaResult["guidesLabel"];
  };
}

interface GuideSeoHeadHookResult {
  headSectionProps: ComponentProps<typeof HeadSection>;
  faqStructuredDataProps: ComponentProps<typeof FaqStructuredDataBlock>;
}

export function useGuideEditorialState({
  guideKey,
  metaKey,
  ogImage = DEFAULT_OG_IMAGE,
  relatedGuides,
  alsoHelpful,
  articleLead,
  articleExtras,
  afterArticle,
  preferManualWhenUnlocalized = false,
  suppressTocTitle,
  suppressUnlocalizedFallback = false,
  showPlanChoice = true,
  showTransportNotice = true,
  showTagChips = true,
  showTocWhenUnlocalized = true,
  showRelatedWhenLocalized = true,
  twitterCardKey = "meta.twitterCard",
  twitterCardDefault,
  buildTocItems,
  renderGenericContent = true,
  renderGenericWhenEmpty = false,
  preferGenericWhenFallback,
}: GuideSeoTemplateProps): GuideSeoEditorialStateResult {

  const lang = useCurrentLanguage();
  const search = typeof window !== "undefined" ? window.location?.search ?? "" : "";
  const translations = useGuideTranslations(lang);
  const t = translations.tGuides;
  const hookI18n: any = (translations as any)?.i18n;
  const location = useDiagnosticLocation(guideKey, lang);
  const loaderData = useSafeLoaderData<GuideRouteLoaderData>();
  const manifestEntry = useMemo<GuideManifestEntry | null>(
    () => getGuideManifestEntry(guideKey) ?? null,
    [guideKey],
  );
  const resolvedStatus = (loaderData?.status ?? manifestEntry?.status ?? "draft") as GuideManifestEntry["status"];
  const checklistSnapshot = useMemo<ChecklistSnapshot | undefined>(() => {
    const raw = loaderData?.checklist;
    if (raw && typeof raw === "object") {
      return raw as ChecklistSnapshot;
    }
    return manifestEntry ? buildGuideChecklist(manifestEntry) : undefined;
  }, [loaderData?.checklist, manifestEntry]);

  const draftUrl = useMemo(() => {
    if (!manifestEntry) return undefined;
    return `/${lang}/draft/${resolveDraftPathSegment(manifestEntry)}`;
  }, [lang, manifestEntry]);
  const isDraftRoute = Boolean(location?.pathname?.includes("/draft/"));
  const shouldShowEditorialPanel =
    Boolean(manifestEntry) && (isDraftRoute || resolvedStatus !== "live");

  const hasStructuredLocalInitial = useMemo(
    () =>
      probeHasLocalizedStructuredContent(
        guideKey,
        translations.tGuides as unknown as (key: string, options?: unknown) => unknown,
      ),
    [guideKey, translations],
  );

  const { contentTranslator, hasLocalizedContent, sections, intro, faqs, baseToc } = useGuideContent({
    guideKey,
    tGuides: translations.tGuides,
    guidesEn: translations.guidesEn,
    translateGuides: translations.translateGuides,
    lang,
    suppressEnglishStructuredWhenUnlocalized: Boolean(preferManualWhenUnlocalized),
  });
  const localizedChecklistSnapshot = useMemo<ChecklistSnapshot | undefined>(() => {
    if (!checklistSnapshot) {
      return undefined;
    }
    return applyLocaleAwareTranslationChecklist(checklistSnapshot, hasLocalizedContent);
  }, [checklistSnapshot, hasLocalizedContent]);

  const canonicalUrl = useCanonicalUrl({ pathname: undefined, lang, guideKey });

  const hasAnyLocalized = Boolean(
    hasLocalizedContent || (!preferManualWhenUnlocalized && hasStructuredLocalInitial),
  );
  const hasLocalizedForRendering = preferManualWhenUnlocalized
    ? Boolean(hasStructuredLocalInitial)
    : hasAnyLocalized;

  const { title, description, homeLabel, guidesLabel, twitterCardType } = useGuideMeta({
    metaKey,
    twitterCardDefault,
    twitterCardKey,
    ...translations,
    hasLocalizedContent: preferManualWhenUnlocalized ? hasLocalizedContent : hasAnyLocalized,
    i18n: hookI18n as any,
  });

  const normalizedDescription = typeof description === "string" ? description.trim() : "";
  const firstIntroNormalized =
    Array.isArray(intro) && typeof intro[0] === "string" ? intro[0].trim() : "";
  const shouldRenderSubtitle = !(
    (preferManualWhenUnlocalized && !hasAnyLocalized) ||
    (hasAnyLocalized &&
      normalizedDescription &&
      firstIntroNormalized &&
      normalizedDescription.toLowerCase() === firstIntroNormalized.toLowerCase())
  );
  const subtitleText = shouldRenderSubtitle ? (description as string) : "";
  const articleDescriptionForGeneric = shouldRenderSubtitle ? (description as string) : undefined;

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
        // i18n-exempt -- SEO-2743 [ttl=2025-06-30]
        debugGuide("Title from useGuideMeta", { lang, guideKey, value: title });
      } catch (loggingError) {
        void loggingError;
      }
      return title;
    }
    try {
      // i18n-exempt -- SEO-2743 [ttl=2025-06-30]
      debugGuide("Title unresolved; returning guide key", { lang, guideKey });
    } catch (loggingError) {
      void loggingError;
    }
    return (metaKey as string) || (guideKey as string);
  }, [guideKey, lang, title, metaKey]);

  const displayH1Title = useDisplayH1Title({
    metaKey: metaKey as any,
    effectiveTitle: effectiveTitle as any,
    guideKey: guideKey as any,
    translations: translations as any,
    hasLocalizedContent: preferManualWhenUnlocalized ? hasLocalizedContent : hasAnyLocalized,
  });

  const suppressGenericContentToc = useMemo(
    () =>
      Boolean(
        preferGenericWhenFallback &&
          isGuidesFallbackTocEmpty(lang as string | undefined, guideKey as string),
      ),
    [guideKey, lang, preferGenericWhenFallback],
  );

  let effectiveGenericOptions = useMemo(() => {
    const base =
      genericContentOptions && typeof genericContentOptions === "object"
        ? genericContentOptions
        : {};
    return base as NonNullable<typeof genericContentOptions>;
  }, [genericContentOptions]);

  const { context } = useGuideSeoContext({
    baseToc,
    canonicalUrl,
    contentTranslator,
    description,
    faqs,
    guideKey,
    hasLocalizedContent: preferManualWhenUnlocalized ? hasLocalizedContent : hasLocalizedForRendering,
    intro,
    lang,
    metaKey,
    ogImage: { url: ogImageUrl, width: ogImageConfig.width, height: ogImageConfig.height },
    sections,
    title,
    translateGuides: translations.translateGuides,
    translateGuidesFallback: translations.translateGuidesFallback,
    buildTocItems,
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

  const fallbackHeadMeta = useMemo(() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    const resolvedTitle =
      typeof effectiveTitle === "string" && effectiveTitle.trim().length > 0
        ? effectiveTitle.trim()
        : String(metaKey ?? guideKey);
    const resolvedDescription =
      typeof description === "string" && description.trim().length > 0 ? description.trim() : "";
    const imageSrc =
      typeof ogImageUrl === "string" && ogImageUrl.trim().length > 0 ? ogImageUrl : undefined;
    const resolvedTwitter =
      typeof twitterCardType === "string" &&
      twitterCardType.trim().length > 0 &&
      twitterCardType.trim() !== "meta.twitterCard"
        ? twitterCardType.trim()
        : undefined;
    return buildRouteMeta({
      lang,
      title: resolvedTitle,
      description: resolvedDescription,
      url: canonicalUrl,
      path: canonicalPath,
      image: imageSrc
        ? {
            src: imageSrc,
            width: ogImageConfig.width,
            height: ogImageConfig.height,
          }
        : undefined,
      ogType: "article",
      twitterCard: resolvedTwitter,
      includeTwitterUrl: true,
    });
  }, [
    canonicalPath,
    canonicalUrl,
    description,
    effectiveTitle,
    guideKey,
    lang,
    metaKey,
    ogImageConfig.height,
    ogImageConfig.width,
    ogImageUrl,
    twitterCardType,
  ]);

  const fallbackHeadLinks = useMemo<ReturnType<LinksFunction> | undefined>(() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    return buildRouteLinks();
  }, []);

  const fallbackStructured = useMemo<StructuredFallback | null>(
    () =>
      buildStructuredFallback(
        guideKey,
        lang,
        hookI18n,
        i18n,
        Boolean(hasLocalizedContent || hasStructuredLocalInitial),
        Boolean(preferManualWhenUnlocalized && lang !== "en"),
        translations.tGuides as any,
      ),
    [
      guideKey,
      lang,
      hookI18n,
      hasLocalizedContent,
      hasStructuredLocalInitial,
      preferManualWhenUnlocalized,
      translations,
    ],
  );

  const suppressUnlocalizedToc = Boolean(suppressUnlocalizedFallback || preferManualWhenUnlocalized);
  const structuredTocItems = useStructuredTocItems({
    context,
    buildTocItems,
    suppressUnlocalizedFallback: suppressUnlocalizedToc,
  });

  effectiveGenericOptions = useMemo(() => {
    const base =
      genericContentOptions && typeof genericContentOptions === "object"
        ? genericContentOptions
        : {};
    if (typeof buildTocItems === "function") {
      if (typeof (base as any).showToc !== "undefined")
        return base as NonNullable<typeof genericContentOptions>;
      if ((guideKey as any) === ("travelTipsFirstTime" as any)) {
        return { ...(base as any), showToc: true } as NonNullable<typeof genericContentOptions>;
      }
      const hasCustomItems = Array.isArray(structuredTocItems) && structuredTocItems.length > 0;
      return { ...base, showToc: !hasCustomItems } as NonNullable<typeof genericContentOptions>;
    }
    if ((guideKey as any) === ("etiquetteItalyAmalfi" as any)) {
      return { ...base, showToc: false } as NonNullable<typeof genericContentOptions>;
    }
    return base as NonNullable<typeof genericContentOptions>;
  }, [genericContentOptions, buildTocItems, structuredTocItems, guideKey]);

  const layoutState: GuideSeoLayoutBaseState = {
    lang,
    guideKey,
    translations,
    t,
    hookI18n,
    manifestEntry,
    resolvedStatus,
    checklistSnapshot: localizedChecklistSnapshot,
    draftUrl,
    isDraftRoute,
    shouldShowEditorialPanel,
    sections,
    intro,
    faqs,
    baseToc,
    context,
    fallbackStructured,
    structuredTocItems,
    effectiveGenericOptions,
    displayH1Title: displayH1Title as string,
    effectiveTitle: effectiveTitle as string,
    subtitleText,
    title,
    description,
    articleDescriptionForGeneric,
    hasAnyLocalized,
    hasLocalizedContent,
    hasLocalizedForRendering,
    hasStructuredLocalInitial,
    preferManualWhenUnlocalized,
    preferGenericWhenFallback,
    renderGenericContent,
    renderGenericWhenEmpty,
    showTocWhenUnlocalized,
    suppressTocTitle,
    suppressUnlocalizedFallback,
    showPlanChoice,
    showTransportNotice,
    showTagChips,
    showRelatedWhenLocalized,
    relatedGuides,
    alsoHelpful,
    articleLead,
    articleExtras,
    afterArticle,
    buildTocItems,
  };

  return {
    layoutState,
    search,
    canonicalUrl,
    canonicalPath,
    ogImageConfig,
    ogImageUrl,
    twitterCardType,
    breadcrumbLabels: {
      homeLabel,
      guidesLabel,
    },
  };
}

export function useGuideFallbackState({
  guideKey,
  metaKey,
  layoutState,
  canonicalUrl,
  canonicalPath,
  ogImageConfig,
  ogImageUrl,
  twitterCardType,
  genericContentOptions,
}: GuideSeoFallbackStateArgs): GuideSeoFallbackStateResult {
  const suppressGenericContentToc = useMemo(
    () =>
      Boolean(
        layoutState.preferGenericWhenFallback &&
          isGuidesFallbackTocEmpty(layoutState.lang as string | undefined, guideKey as string),
      ),
    [guideKey, layoutState.lang, layoutState.preferGenericWhenFallback],
  );

  const fallbackStructured = useMemo<StructuredFallback | null>(
    () =>
      buildStructuredFallback(
        guideKey,
        layoutState.lang,
        layoutState.hookI18n,
        i18n,
        Boolean(layoutState.hasLocalizedContent || layoutState.hasStructuredLocalInitial),
        Boolean(layoutState.preferManualWhenUnlocalized && layoutState.lang !== "en"),
        layoutState.translations.tGuides as any,
      ),
    [
      guideKey,
      layoutState.lang,
      layoutState.hookI18n,
      layoutState.hasLocalizedContent,
      layoutState.hasStructuredLocalInitial,
      layoutState.preferManualWhenUnlocalized,
      layoutState.translations,
    ],
  );

  const suppressUnlocalizedToc = Boolean(
    layoutState.suppressUnlocalizedFallback || layoutState.preferManualWhenUnlocalized,
  );
  const structuredTocItems = useStructuredTocItems({
    context: layoutState.context,
    buildTocItems: layoutState.buildTocItems,
    suppressUnlocalizedFallback: suppressUnlocalizedToc,
  });

  const baseGenericOptions = useMemo(
    () =>
      (genericContentOptions && typeof genericContentOptions === "object"
        ? genericContentOptions
        : {}) as NonNullable<GuideSeoTemplateProps["genericContentOptions"]>,
    [genericContentOptions],
  );

  const adjustedGenericOptions = useMemo(() => {
    if (typeof layoutState.buildTocItems === "function") {
      if (typeof (baseGenericOptions as any).showToc !== "undefined")
        return baseGenericOptions as NonNullable<GuideSeoTemplateProps["genericContentOptions"]>;
      if ((guideKey as any) === ("travelTipsFirstTime" as any)) {
        return {
          ...(baseGenericOptions as any),
          showToc: true,
        } as NonNullable<GuideSeoTemplateProps["genericContentOptions"]>;
      }
      const hasCustomItems = Array.isArray(structuredTocItems) && structuredTocItems.length > 0;
      return {
        ...baseGenericOptions,
        showToc: !hasCustomItems,
      } as NonNullable<GuideSeoTemplateProps["genericContentOptions"]>;
    }
    if ((guideKey as any) === ("etiquetteItalyAmalfi" as any)) {
      return {
        ...baseGenericOptions,
        showToc: false,
      } as NonNullable<GuideSeoTemplateProps["genericContentOptions"]>;
    }
    return baseGenericOptions;
  }, [baseGenericOptions, layoutState.buildTocItems, structuredTocItems, guideKey]);

  const effectiveGenericOptions = useMemo(() => {
    if (!suppressGenericContentToc) return adjustedGenericOptions;
    return {
      ...(adjustedGenericOptions as any),
      showToc: false,
    } as NonNullable<GuideSeoTemplateProps["genericContentOptions"]>;
  }, [adjustedGenericOptions, suppressGenericContentToc]);

  const fallbackHeadMeta = useMemo(() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    const placeholderKeys: string[] = [];
    if (metaKey) {
      placeholderKeys.push(
        `meta.${metaKey}.title`,
        `content.${metaKey}.seo.title`,
        `guides.meta.${metaKey}.title`,
        `guides.content.${metaKey}.seo.title`,
      );
    }
    placeholderKeys.push(
      `meta.${guideKey}.title`,
      `content.${guideKey}.seo.title`,
      `guides.meta.${guideKey}.title`,
      `guides.content.${guideKey}.seo.title`,
    );
    const placeholderSet = new Set(placeholderKeys);
    const resolveTitleCandidate = (raw: unknown): string | null => {
      if (typeof raw !== "string") return null;
      const trimmed = raw.trim();
      if (!trimmed) return null;
      if (placeholderSet.has(trimmed)) return null;
      return trimmed;
    };
    const resolvedTitle =
      resolveTitleCandidate(layoutState.displayH1Title) ??
      resolveTitleCandidate(layoutState.effectiveTitle) ??
      resolveTitleCandidate(layoutState.title) ??
      String(metaKey ?? guideKey);
    const resolvedDescription =
      typeof layoutState.description === "string" && layoutState.description.trim().length > 0
        ? layoutState.description.trim()
        : "";
    const imageSrc =
      typeof ogImageUrl === "string" && ogImageUrl.trim().length > 0 ? ogImageUrl : undefined;
    const resolvedTwitter =
      typeof twitterCardType === "string" &&
      twitterCardType.trim().length > 0 &&
      twitterCardType.trim() !== "meta.twitterCard"
        ? twitterCardType.trim()
        : undefined;
    return buildRouteMeta({
      lang: layoutState.lang,
      title: resolvedTitle,
      description: resolvedDescription,
      url: canonicalUrl,
      path: canonicalPath,
      image: imageSrc
        ? {
            src: imageSrc,
            width: ogImageConfig.width,
            height: ogImageConfig.height,
          }
        : undefined,
      ogType: "article",
      twitterCard: resolvedTwitter,
      includeTwitterUrl: true,
    });
  }, [
    canonicalPath,
    canonicalUrl,
    guideKey,
    layoutState.displayH1Title,
    layoutState.description,
    layoutState.effectiveTitle,
    layoutState.lang,
    layoutState.title,
    metaKey,
    ogImageConfig.height,
    ogImageConfig.width,
    ogImageUrl,
    twitterCardType,
  ]);

  const fallbackHeadLinks = useMemo<ReturnType<LinksFunction> | undefined>(() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    return buildRouteLinks();
  }, []);

  return {
    layoutSlice: {
      fallbackStructured,
      structuredTocItems,
      effectiveGenericOptions,
    },
    fallbackHeadMeta,
    fallbackHeadLinks,
  };
}

export function useGuideHeadProps({
  layoutState,
  canonicalUrl,
  ogImageUrl,
  search,
  includeHowToStructuredData = false,
  buildHowToSteps,
  buildBreadcrumb,
  additionalScripts,
  guideFaqFallback,
  alwaysProvideFaqFallback,
  suppressFaqWhenUnlocalized,
  breadcrumbLabels,
}: GuideSeoHeadPropsArgs): GuideSeoHeadHookResult {
  const breadcrumb = useGuideBreadcrumb({
    lang: layoutState.lang as any,
    guideKey: layoutState.guideKey as any,
    title: ((layoutState.displayH1Title as string) ??
      (layoutState.effectiveTitle as string) ??
      (layoutState.title as string)) as string,
    homeLabel: breadcrumbLabels.homeLabel as any,
    guidesLabel: breadcrumbLabels.guidesLabel as any,
    buildBreadcrumb,
    context: layoutState.context,
  });

  const howToJson = useHowToJson({
    buildHowToSteps,
    context: layoutState.context,
    includeHowToStructuredData,
  });

  const articleLeadCacheKey = `${String(layoutState.guideKey)}::${String(layoutState.lang)}::${String(
    (layoutState.context as any)?.article?.title ?? "",
  ).trim()}`;

  const additionalScriptsNodeRef = useRef<React.ReactNode | null>(null);
  if (additionalScriptsNodeRef.current === null) {
    const shouldBypassCache =
      typeof process !== "undefined" && process?.env?.NODE_ENV === "test";
    if (!shouldBypassCache && __additionalScriptsCache.has(articleLeadCacheKey)) {
      additionalScriptsNodeRef.current = __additionalScriptsCache.get(articleLeadCacheKey) ?? null;
    } else {
      const built = additionalScripts ? additionalScripts(layoutState.context) : null;
      const resolveTopLevel = (node: React.ReactNode): React.ReactNode => {
        try {
          if (isValidElement(node) && typeof (node as any).type === "function") {
            const Comp = (node as any).type as (p: unknown) => React.ReactNode;
            return Comp((node as any).props);
          }
        } catch {
          // If the component uses hooks or throws outside React rendering,
          // keep the original node so React can render it normally.
        }
        return node;
      };
      const resolved = resolveTopLevel(built);
      additionalScriptsNodeRef.current = resolved;
      if (!shouldBypassCache) {
        __additionalScriptsCache.set(articleLeadCacheKey, resolved);
      }
    }
  }

  const headSectionProps: ComponentProps<typeof HeadSection> = {
    lang: layoutState.lang as any,
    guideKey: layoutState.guideKey as any,
    search,
    pageTitle: (layoutState.displayH1Title as string) ?? (layoutState.effectiveTitle as string),
    description: layoutState.description as string,
    canonicalUrl,
    ogImageUrl,
    previewBannerLabel: layoutState.t("preview.unpublishedBanner", {
      defaultValue: "Preview only – this guide is not published",
    }) as string,
    breadcrumb,
    howToJson: howToJson ?? null,
    howToJsonType: HOW_TO_JSON_TYPE,
    additionalScripts: additionalScriptsNodeRef.current,
    suppressTwitterCardResolve: layoutState.hasAnyLocalized,
  };

  const faqStructuredDataProps: ComponentProps<typeof FaqStructuredDataBlock> = {
    guideKey: layoutState.guideKey as any,
    hasLocalizedContent: layoutState.hasLocalizedContent,
    suppressFaqWhenUnlocalized,
    alwaysProvideFaqFallback,
    guideFaqFallback,
    preferManualWhenUnlocalized: layoutState.preferManualWhenUnlocalized,
    suppressUnlocalizedFallback: layoutState.suppressUnlocalizedFallback,
    tGuides: layoutState.translations.tGuides,
    hookI18n: layoutState.hookI18n,
  };

  return { headSectionProps, faqStructuredDataProps };
}

export function useGuideSeoConfig(props: GuideSeoTemplateProps): GuideSeoConfig {
  const {
    guideKey,
    metaKey,
    includeHowToStructuredData,
    additionalScripts,
    guideFaqFallback,
    buildBreadcrumb,
    alwaysProvideFaqFallback,
    suppressFaqWhenUnlocalized,
    buildHowToSteps,
    genericContentOptions,
  } = props;

  const editorial = useGuideEditorialState(props);
  const fallback = useGuideFallbackState({
    guideKey,
    metaKey,
    layoutState: editorial.layoutState,
    canonicalUrl: editorial.canonicalUrl,
    canonicalPath: editorial.canonicalPath,
    ogImageConfig: editorial.ogImageConfig,
    ogImageUrl: editorial.ogImageUrl,
    twitterCardType: editorial.twitterCardType,
    genericContentOptions,
  });

  const layoutState: GuideSeoLayoutState = {
    ...editorial.layoutState,
    ...fallback.layoutSlice,
  };

  const head = useGuideHeadProps({
    layoutState,
    canonicalUrl: editorial.canonicalUrl,
    ogImageUrl: editorial.ogImageUrl,
    search: editorial.search,
    includeHowToStructuredData,
    buildHowToSteps,
    buildBreadcrumb,
    additionalScripts,
    guideFaqFallback,
    alwaysProvideFaqFallback,
    suppressFaqWhenUnlocalized,
    breadcrumbLabels: editorial.breadcrumbLabels,
  });

  return {
    headSectionProps: head.headSectionProps,
    faqStructuredDataProps: head.faqStructuredDataProps,
    layoutState,
    fallbackHeadMeta: fallback.fallbackHeadMeta,
    fallbackHeadLinks: fallback.fallbackHeadLinks,
  };
}