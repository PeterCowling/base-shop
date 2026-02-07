import type {
  GuideSeoTemplateContext,
  NormalisedFaq,
  NormalisedSection,
  TocItem,
  Translator,
} from "../../types";
import type { FallbackTranslator, StructuredFallback } from "../../utils/fallbacks";
import { logStructuredToc } from "../../utils/logging";
import { computeStructuredTocItems } from "../../utils/toc";
import StructuredToc from "../StructuredToc";

import { type getStructuredTocOverride, resolveEnTitleFallback } from "./index";

export function LocalizedToc({
  items,
  sections,
  suppressTocTitle,
  tocTitleProp,
  guideKey,
  policy,
}: {
  items: TocItem[];
  sections: NormalisedSection[];
  suppressTocTitle?: boolean;
  tocTitleProp: string | undefined;
  guideKey: string;
  policy: ReturnType<typeof getStructuredTocOverride>;
}) {
  const props: { items: TocItem[]; sectionsPresent?: boolean; title?: string } = {
    items: items,
    sectionsPresent: Array.isArray(sections) && sections.length > 0,
  };

  if (!suppressTocTitle && typeof tocTitleProp === "string" && tocTitleProp.trim().length > 0) {
    props.title = tocTitleProp;
  } else if (policy.forceEnTocTitleFallback) {
    const enTitle = resolveEnTitleFallback(guideKey);
    if (enTitle) props.title = enTitle;
  }

  return <StructuredToc {...props} />;
}

export function MinimalUnlocalizedToc({
  hasLocalizedContent,
  showTocWhenUnlocalized,
  preferManualWhenUnlocalized,
  fallbackStructured,
  policy,
  items,
  sections,
  suppressTocTitle,
  tocTitleProp,
  guideKey,
  buildTocItems,
  context,
  faqs,
  tGuides,
  fallbackTranslator,
}: {
  hasLocalizedContent: boolean;
  showTocWhenUnlocalized: boolean;
  preferManualWhenUnlocalized?: boolean;
  fallbackStructured?: StructuredFallback | null;
  policy: ReturnType<typeof getStructuredTocOverride>;
  items: TocItem[];
  sections: NormalisedSection[];
  suppressTocTitle?: boolean;
  tocTitleProp: string | undefined;
  guideKey: string;
  buildTocItems?: (ctx: GuideSeoTemplateContext) => TocItem[] | null | undefined;
  context: GuideSeoTemplateContext;
  faqs: NormalisedFaq[];
  tGuides: Translator;
  fallbackTranslator: FallbackTranslator | undefined;
}) {
  if (hasLocalizedContent) return null;
  if (!showTocWhenUnlocalized) return null;
  if (preferManualWhenUnlocalized) return null;
  if (policy.suppressMinimalUnlocalizedToc) return null;
  if (fallbackStructured) return null;

  const props: { items: TocItem[]; sectionsPresent?: boolean; title?: string } = {
    items: items,
    sectionsPresent: Array.isArray(sections) && sections.length > 0,
  };

  if (!suppressTocTitle && typeof tocTitleProp === "string" && tocTitleProp.trim().length > 0) {
    props.title = tocTitleProp;
  } else if (policy.forceEnTocTitleFallback) {
    const enTitle = resolveEnTitleFallback(guideKey);
    if (enTitle) props.title = enTitle;
  }

  let itemsEff = items;
  if (typeof buildTocItems === "function" && itemsEff.length === 0) {
    itemsEff = computeStructuredTocItems({
      guideKey,
      tGuides,
      baseToc: [],
      contextToc: [],
      sections,
      faqs,
      hasLocalizedContent: false,
      suppressUnlocalizedFallback: false,
      customProvided: false,
      translateGuides: context.translateGuides,
      translateGuidesEn: context.translateGuidesEn,
      fallbackTranslator,
    });
  }

  if (itemsEff.length === 0) return null;

  logStructuredToc("[StructuredTocBlock:minimal-toc]", guideKey, { items: itemsEff.length });
  return <StructuredToc {...props} items={itemsEff} />;
}
