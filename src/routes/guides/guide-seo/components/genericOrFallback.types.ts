import type { TFunction } from "i18next";

import type { GuideSeoTemplateContext, TocItem } from "../types";
import type { GuideTranslationSuite } from "../translations";
import type { StructuredFallback } from "../utils/fallbacks";

export interface GenericOrFallbackContentProps {
  lang: string;
  guideKey: string;
  translations: GuideTranslationSuite;
  t: TFunction;
  hookI18n: GuideTranslationSuite["i18n"];
  context: GuideSeoTemplateContext;
  articleDescription?: string;
  renderGenericContent: boolean;
  /** Allow forcing GenericContent even when no arrays/fallbacks are present. */
  renderWhenEmpty?: boolean;
  suppressUnlocalizedFallback?: boolean;
  hasLocalizedContent: boolean;
  genericContentOptions?: { showToc?: boolean } | undefined;
  structuredTocItems?: TocItem[] | null | undefined;
  /** True when the route provided a custom ToC builder. */
  customTocProvided?: boolean;
  preferManualWhenUnlocalized?: boolean;
  preferGenericWhenFallback?: boolean;
  showTocWhenUnlocalized: boolean;
  suppressTocTitle?: boolean;
  fallbackStructured: StructuredFallback | null;
}