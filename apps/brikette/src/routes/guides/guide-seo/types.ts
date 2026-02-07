import type { ComponentProps, ReactNode } from "react";
import type { TFunction } from "i18next";

import type { BuildCfImageOptions } from "@acme/ui/lib/buildCfImageUrl";

import type { GenericContentTranslator } from "@/components/guides/GenericContent";
import type RelatedGuides from "@/components/guides/RelatedGuides";
import type { RelatedItem } from "@/components/guides/RelatedGuides";
import type { BreadcrumbList } from "@/components/seo/BreadcrumbStructuredData";
import type GuideFaqJsonLd from "@/components/seo/GuideFaqJsonLd";
import type { GuideSection } from "@/data/guides.index";
import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";

import type { ManifestOverrides } from "../guide-manifest-overrides";

export type GuideSeoGenericContentOptions = Record<string, unknown> & {
  showToc?: boolean;
  sectionTopExtras?: Record<string, ReactNode>;
  sectionBottomExtras?: Record<string, ReactNode>;
  /** Optional override for the FAQs section heading level. */
  faqHeadingLevel?: 2 | 3;
  /** When true, suppress GenericContent intro text. */
  suppressIntro?: boolean;
};

export interface OgImageConfig {
  path: string;
  width: number;
  height: number;
  transform?: BuildCfImageOptions;
}

export interface RelatedGuidesConfig
  extends Partial<Omit<ComponentProps<typeof RelatedGuides>, "items" | "lang">> {
  items: readonly RelatedItem[];
}

export interface AlsoHelpfulConfig {
  tags: string[];
  excludeGuide?: GuideKey | GuideKey[];
  includeRooms?: boolean;
  titleKey?: { ns: string; key: string } | string;
  section?: GuideSection;
}

export type TocItem = { href: string; label: string };
export type GuideSectionImage = {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
};
export type NormalisedSection = { id: string; title: string; body: string[]; images?: GuideSectionImage[] };
export type NormalisedFaq = { q: string; a: string[] };
export type HowToStep = { name: string; text?: string };
export type HowToObjectPayload = {
  steps?: readonly HowToStep[] | null;
  extras?: Record<string, unknown> | null | undefined;
};

export type HowToPayload = readonly HowToStep[] | HowToObjectPayload;

export type Translator = TFunction<string, unknown>;

export interface GuideSeoTemplateContext {
  lang: AppLanguage;
  guideKey: GuideKey;
  metaKey: string;
  hasLocalizedContent: boolean;
  translator: GenericContentTranslator;
  translateGuides: GenericContentTranslator;
  translateGuidesEn?: GenericContentTranslator;
  sections: NormalisedSection[];
  intro: string[];
  faqs: NormalisedFaq[];
  toc: TocItem[];
  renderGenericContent?: boolean;
  ogImage: { url: string; width: number; height: number };
  article: { title: string; description: string };
  canonicalUrl: string;
}

export interface GuideSeoTemplateProps {
  guideKey: GuideKey;
  metaKey: string;
  ogImage?: OgImageConfig;
  /** Override the fallback og:type applied in tests when route meta isn't wired. Defaults to "article". */
  ogType?: string;
  includeHowToStructuredData?: boolean;
  relatedGuides?: RelatedGuidesConfig;
  alsoHelpful?: AlsoHelpfulConfig;
  buildExtras?: (context: GuideSeoTemplateContext) => unknown;
  articleLead?: (context: GuideSeoTemplateContext) => ReactNode;
  articleExtras?: (context: GuideSeoTemplateContext) => ReactNode;
  afterArticle?: (context: GuideSeoTemplateContext) => ReactNode;
  additionalScripts?: (context: GuideSeoTemplateContext) => ReactNode;
  guideFaqFallback?: ComponentProps<typeof GuideFaqJsonLd>["fallback"];
  /** Force exposing a fallback function to GuideFaqJsonLd even when local FAQs exist. */
  alwaysProvideFaqFallback?: boolean;
  /** When true, skip GenericContent if localized arrays are missing and rely on the manual fallback block. */
  preferManualWhenUnlocalized?: boolean;
  /**
   * When true, render GenericContent even if only fallback/manual content
   * is available for the active locale.
   */
  preferGenericWhenFallback?: boolean;
  /** When true, do not render a title prop to the ToC component. */
  suppressTocTitle?: boolean;
  /** When true, suppress unlocalized/manual fallback blocks entirely. */
  suppressUnlocalizedFallback?: boolean;
  /** When true, omit FAQ JSON-LD when the active locale lacks structured content. */
  suppressFaqWhenUnlocalized?: boolean;
  buildBreadcrumb?: (context: GuideSeoTemplateContext) => BreadcrumbList;
  showPlanChoice?: boolean;
  showTransportNotice?: boolean;
  showTagChips?: boolean;
  /** When true, allow ToC/minimal content when locale lacks structured content. */
  showTocWhenUnlocalized?: boolean;
  /** When false, hide RelatedGuides when localized structured content exists. */
  showRelatedWhenLocalized?: boolean;
  twitterCardKey?: string;
  twitterCardDefault?: string;
  buildHowToSteps?: (context: GuideSeoTemplateContext) => HowToPayload | null | undefined;
  buildTocItems?: (context: GuideSeoTemplateContext) => TocItem[] | null | undefined;
  genericContentOptions?: GuideSeoGenericContentOptions;
  /** When true (default), allow StructuredTocBlock to fall back to EN ToC title when localized title is blank. */
  fallbackToEnTocTitle?: boolean;
  renderGenericContent?: boolean;
  /**
   * When true, still render GenericContent even when no localized/EN structured
   * arrays or curated fallbacks are present. Useful for routes that want to
   * display the generic shell (header/meta/widgets) with translator-driven copy
   * only. Defaults to false.
   */
  renderGenericWhenEmpty?: boolean;
  /**
   * When true, prefer localized `content.*.seo.title` strings for the H1 even if
   * the meta namespace already provides a title. Useful for dual-source routes
   * that need the H1 to reflect whichever content block is active.
   */
  preferLocalizedSeoTitle?: boolean;
  /**
   * Server-loaded manifest overrides (includes SEO audit results).
   * When provided, these are used as the initial state for client-side overrides,
   * ensuring audit scores are available immediately on first render.
   */
  serverOverrides?: ManifestOverrides;
}
