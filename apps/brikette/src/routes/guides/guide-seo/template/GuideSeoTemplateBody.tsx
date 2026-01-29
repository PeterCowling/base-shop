import type { ReactNode } from "react";
import dynamic from "next/dynamic";

import { Section } from "@acme/design-system/atoms";

import type { BreadcrumbList } from "@/components/seo/BreadcrumbStructuredData";
import { PREVIEW_TOKEN } from "@/config/env";
import type { AppLanguage } from "@/i18n.config";
import { isGuideAuthoringEnabled } from "@/routes/guides/guide-authoring/gate";
import { buildGuideEditUrl } from "@/routes/guides/guide-authoring/urls";

import type { ChecklistSnapshot, GuideChecklistItem, GuideManifestEntry } from "../../guide-manifest";
import ArticleHeader from "../components/ArticleHeader";
import DevStatusPill from "../components/DevStatusPill";
import FaqStructuredDataBlock from "../components/FaqStructuredDataBlock";
import FooterWidgets from "../components/FooterWidgets";
import GenericOrFallbackContent from "../components/GenericOrFallbackContent";
import HeadSection from "../components/HeadSection";
import StructuredTocBlock from "../components/StructuredTocBlock";

// Dynamically import GuideEditorialPanel to avoid SSR hydration mismatches
const GuideEditorialPanel = dynamic(
  () => import("../components/GuideEditorialPanel"),
  { ssr: false }
);
import { HOW_TO_JSON_TYPE } from "../constants";
import type {
  GuideSeoTemplateContext,
  GuideSeoTemplateProps,
  NormalisedFaq,
  NormalisedSection,
  TocItem,
  Translator,
} from "../types";
import type { StructuredFallback } from "../utils/fallbacks";
import { isOffSeasonLongStayGuide } from "../utils/templatePolicies";

export type GuideSeoTemplateBodyProps = {
  lang: AppLanguage;
  guideKey: GuideSeoTemplateProps["guideKey"];
  search: string;
  resolvedDisplayTitle: string;
  description?: string;
  canonicalUrl: string;
  ogImageUrl?: string;
  previewBannerLabel: string;
  breadcrumb: BreadcrumbList;
  howToJson: string | null;
  additionalScripts: ReactNode | null;
  hasAnyLocalized: boolean;
  faqHasLocalizedContent: boolean;
  shouldShowEditorialPanel: boolean;
  manifestEntry: GuideManifestEntry | null;
  resolvedStatus: GuideManifestEntry["status"];
  isDraftRoute: boolean;
  checklistSnapshot?: ChecklistSnapshot | GuideChecklistItem[];
  draftUrl?: string;
  articleHeadingWeightClass: string;
  subtitleText: string;
  lastUpdated?: string;
  articleHeaderDebug: {
    lang: AppLanguage;
    guideKey: GuideSeoTemplateProps["guideKey"];
    effectiveTitle: string;
    hasLocalizedContent: boolean;
    article: { title: string; description: string };
    counts: { sections: number; intro: number; faqs: number; baseToc: number };
  };
  manualStructuredFallbackNode?: ReactNode | null;
  manualStructuredFallbackRendered: boolean;
  structuredTocItems: TocItem[] | null | undefined;
  context: GuideSeoTemplateContext;
  translations: any;
  tGuides: Translator;
  sections: NormalisedSection[];
  faqs: NormalisedFaq[];
  buildTocItems?: GuideSeoTemplateProps["buildTocItems"];
  shouldRenderGenericContentForLocale: boolean;
  shouldRenderGenericContent: boolean;
  effectiveGenericOptions: GuideSeoTemplateProps["genericContentOptions"] | undefined;
  hasLocalizedForRendering: boolean;
  showTocWhenUnlocalized: boolean;
  suppressTocTitle?: boolean;
  fallbackStructured: StructuredFallback | null;
  preferManualWhenUnlocalized?: boolean;
  suppressUnlocalizedFallback?: boolean;
  fallbackToEnTocTitle?: boolean;
  requestedLang?: string;
  shouldRenderGenericOrFallback: boolean;
  t: Translator;
  hookI18n: any;
  articleDescriptionForGeneric?: string;
  renderGenericWhenEmpty: boolean;
  preferGenericWhenFallback?: boolean;
  articleLeadNode: ReactNode | null;
  articleExtrasNode: ReactNode | null;
  afterArticleNode: ReactNode | null;
  showTagChips: boolean;
  showPlanChoice: boolean;
  showTransportNotice: boolean;
  relatedGuides?: GuideSeoTemplateProps["relatedGuides"];
  guideFaqFallback?: GuideSeoTemplateProps["guideFaqFallback"];
  alwaysProvideFaqFallback: boolean;
  suppressFaqWhenUnlocalized: boolean;
};

export function GuideSeoTemplateBody(props: GuideSeoTemplateBodyProps): JSX.Element {
  const {
    lang,
    guideKey,
    search,
    resolvedDisplayTitle,
    description,
    canonicalUrl,
    ogImageUrl,
    previewBannerLabel,
    breadcrumb,
    howToJson,
    additionalScripts,
    hasAnyLocalized,
    faqHasLocalizedContent,
    shouldShowEditorialPanel,
    manifestEntry,
    resolvedStatus,
    isDraftRoute,
    checklistSnapshot,
    draftUrl,
    articleHeadingWeightClass,
    subtitleText,
    lastUpdated,
    articleHeaderDebug,
    manualStructuredFallbackNode,
    manualStructuredFallbackRendered,
    structuredTocItems,
    context,
    translations,
    tGuides,
    sections,
    faqs,
    buildTocItems,
    shouldRenderGenericContentForLocale,
    shouldRenderGenericContent,
    effectiveGenericOptions,
    hasLocalizedForRendering,
    showTocWhenUnlocalized,
    suppressTocTitle,
    fallbackStructured,
    preferManualWhenUnlocalized,
    suppressUnlocalizedFallback,
    fallbackToEnTocTitle,
    requestedLang,
    shouldRenderGenericOrFallback,
    t,
    hookI18n,
    articleDescriptionForGeneric,
    renderGenericWhenEmpty,
    preferGenericWhenFallback,
    articleLeadNode,
    articleExtrasNode,
    afterArticleNode,
    showTagChips,
    showPlanChoice,
    showTransportNotice,
    relatedGuides,
    guideFaqFallback,
    alwaysProvideFaqFallback,
    suppressFaqWhenUnlocalized,
  } = props;
  const editUrl =
    isGuideAuthoringEnabled() && PREVIEW_TOKEN
      ? buildGuideEditUrl(lang, guideKey as any)
      : undefined;

  return (
    <>
      <HeadSection
        lang={lang as any}
        guideKey={guideKey as any}
        search={search}
        pageTitle={resolvedDisplayTitle}
        description={description as string}
        canonicalUrl={canonicalUrl}
        // Surface og:image to the head fallback helper in tests
        ogImageUrl={ogImageUrl}
        previewBannerLabel={previewBannerLabel}
        breadcrumb={breadcrumb}
        howToJson={howToJson ?? null}
        howToJsonType={HOW_TO_JSON_TYPE}
        additionalScripts={additionalScripts}
        // Avoid getFixedT translator lookups for twitter:card overrides when
        // localized structured content exists; tests assert zero fallback calls.
        suppressTwitterCardResolve={hasAnyLocalized}
      />
      <FaqStructuredDataBlock
        guideKey={guideKey as any}
        hasLocalizedContent={faqHasLocalizedContent}
        suppressFaqWhenUnlocalized={suppressFaqWhenUnlocalized}
        alwaysProvideFaqFallback={alwaysProvideFaqFallback}
        preferManualWhenUnlocalized={preferManualWhenUnlocalized}
        suppressUnlocalizedFallback={suppressUnlocalizedFallback}
        tGuides={tGuides}
        hookI18n={hookI18n}
        {...(typeof guideFaqFallback === "function" ? { guideFaqFallback } : {})}
      />

      <Section as="div" padding="none" className={`mx-auto max-w-3xl px-4 ${shouldShowEditorialPanel ? 'pt-10' : 'pt-35'} md:px-8 lg:px-10`}>
        <DevStatusPill guideKey={guideKey as any} />
        <article className={`prose prose-slate prose-lg sm:prose-xl dark:prose-invert ${articleHeadingWeightClass} prose-headings:tracking-tight prose-headings:text-brand-heading dark:prose-headings:text-brand-surface prose-p:text-left prose-p:leading-relaxed prose-li:leading-relaxed prose-strong:font-semibold prose-strong:text-brand-heading prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-6 prose-ol:pl-6 prose-li:my-1 prose-li:marker:text-brand-primary/70 space-y-10`}>
          {shouldShowEditorialPanel && manifestEntry ? (
            <GuideEditorialPanel
              manifest={manifestEntry}
              status={resolvedStatus}
              isDraftRoute={isDraftRoute}
              dashboardUrl={`/${lang}/draft`}
              {...(editUrl ? { editUrl } : {})}
              {...(checklistSnapshot ? { checklist: checklistSnapshot as ChecklistSnapshot } : {})}
              {...(draftUrl ? { draftUrl } : {})}
            />
          ) : null}
          <ArticleHeader
            displayTitle={resolvedDisplayTitle}
            subtitle={subtitleText}
            lastUpdated={lastUpdated}
            locale={lang}
            debug={articleHeaderDebug}
          />
          {/* When routes prefer manual handling for unlocalized locales and a
              structured fallback exists, render a minimal ToC + sections from
              the fallback directly at the template level. This ensures pages
              like the Amalfi town guide surface curated fallback content even
              when translators provide compact guidesFallback objects. */}
          {manualStructuredFallbackNode}
          {isOffSeasonLongStayGuide(guideKey) ? null : (
            <StructuredTocBlock
              itemsBase={structuredTocItems as any}
              context={context}
              tGuides={tGuides as any}
              guideKey={guideKey as any}
              sections={sections as any}
              faqs={faqs as any}
              {...(typeof buildTocItems === "function" ? { buildTocItems } : {})}
              // Treat GenericContent as active only when the page lacks localized
              // structured content. This ensures routes with localized arrays
              // render their own structured content (and tests that mock
              // GenericContent still see the localized intro/sections).
              renderGenericContent={shouldRenderGenericContentForLocale}
              genericContentOptions={effectiveGenericOptions as any}
              hasLocalizedContent={hasLocalizedForRendering}
              showTocWhenUnlocalized={showTocWhenUnlocalized}
              suppressTocTitle={suppressTocTitle}
              fallbackStructured={fallbackStructured as any}
              preferManualWhenUnlocalized={preferManualWhenUnlocalized}
              suppressUnlocalizedFallback={suppressUnlocalizedFallback}
              fallbackToEnTocTitle={fallbackToEnTocTitle}
            />
          )}
          {articleLeadNode}

          {shouldRenderGenericOrFallback ? (
            <GenericOrFallbackContent
              lang={lang as any}
              requestedLang={requestedLang ?? lang}
              guideKey={guideKey as any}
              translations={translations as any}
              t={t as any}
              hookI18n={hookI18n as any}
              context={context}
              {...(articleDescriptionForGeneric
                ? { articleDescription: articleDescriptionForGeneric }
                : {})}
              renderGenericContent={shouldRenderGenericContent}
              renderWhenEmpty={Boolean(renderGenericWhenEmpty)}
              suppressUnlocalizedFallback={suppressUnlocalizedFallback}
              hasLocalizedContent={hasLocalizedForRendering}
              genericContentOptions={effectiveGenericOptions as any}
              structuredTocItems={structuredTocItems as any}
              customTocProvided={typeof buildTocItems === "function"}
              preferManualWhenUnlocalized={preferManualWhenUnlocalized}
              preferGenericWhenFallback={preferGenericWhenFallback}
              showTocWhenUnlocalized={showTocWhenUnlocalized}
              suppressTocTitle={suppressTocTitle}
              fallbackStructured={fallbackStructured as any}
              manualStructuredFallbackRendered={manualStructuredFallbackRendered}
            />
          ) : null}

          {articleExtrasNode}
        </article>
      </Section>
      <Section as="div" padding="none" className="max-w-4xl space-y-12 px-4 pb-16 sm:px-6 md:px-8 lg:px-10">
        {afterArticleNode}
        <FooterWidgets
          lang={lang as any}
          guideKey={guideKey as any}
          showTagChips={showTagChips}
          showPlanChoice={showPlanChoice}
          showTransportNotice={showTransportNotice}
          relatedGuides={relatedGuides as any}
          tGuides={tGuides as any}
        />
      </Section>
    </>
  );
}
