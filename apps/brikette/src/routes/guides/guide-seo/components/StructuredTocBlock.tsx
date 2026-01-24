import type {
  GuideSeoTemplateContext,
  NormalisedFaq,
  NormalisedSection,
  TocItem,
  Translator,
} from "../types";
import type { StructuredFallback } from "../utils/fallbacks";
import { normalizeTocForDisplay, resolveFaqTitle } from "../utils/toc";
import {
  getStructuredTocOverride,
  resolveTocTitleText,
  resolveTocTitleProp,
  shouldSuppressToc,
} from "./structured-toc";
import {
  LocalizedToc,
  MinimalUnlocalizedToc,
} from "./structured-toc/StructuredTocBlocks";
import {
  MinimalLocalizedContent,
  MinimalUnlocalizedIntro,
  MinimalUnlocalizedSections,
} from "./structured-toc/StructuredTocSections";
import { debugGuide } from "@/utils/debug";
import { logStructuredToc } from "../utils/logging";

interface StructuredTocBlockProps {
  itemsBase: TocItem[] | null | undefined;
  context: GuideSeoTemplateContext;
  tGuides: Translator;
  guideKey: GuideSeoTemplateContext["guideKey"];
  sections: NormalisedSection[];
  faqs: NormalisedFaq[];
  buildTocItems?: (ctx: GuideSeoTemplateContext) => TocItem[] | null | undefined;
  renderGenericContent: boolean;
  genericContentOptions?: { showToc?: boolean };
  hasLocalizedContent: boolean;
  showTocWhenUnlocalized: boolean;
  suppressTocTitle?: boolean;
  fallbackStructured?: StructuredFallback | null;
  preferManualWhenUnlocalized?: boolean;
  suppressUnlocalizedFallback?: boolean;
  fallbackToEnTocTitle?: boolean;
}

export default function StructuredTocBlock({
  itemsBase,
  context,
  tGuides,
  guideKey,
  sections,
  faqs,
  buildTocItems,
  renderGenericContent,
  genericContentOptions: _genericContentOptions,
  hasLocalizedContent,
  showTocWhenUnlocalized,
  suppressTocTitle,
  fallbackStructured,
  preferManualWhenUnlocalized,
  suppressUnlocalizedFallback,
  fallbackToEnTocTitle = true,
}: StructuredTocBlockProps): JSX.Element | null {
  const policy = getStructuredTocOverride(guideKey);
  const baseItems = Array.isArray(itemsBase) ? itemsBase : [];
  const fallbackTranslator =
    fallbackStructured && typeof fallbackStructured === "object"
      ? fallbackStructured.translator
      : undefined;

  // Consolidated suppression checks
  if (
    shouldSuppressToc({
      guideKey,
      hasLocalizedContent,
      preferManualWhenUnlocalized,
      sections,
      tGuides,
      fallbackStructured,
      suppressUnlocalizedFallback,
      buildTocItems,
      context,
      renderGenericContent,
      showTocWhenUnlocalized,
      faqs,
      baseItems,
      policy,
    })
  ) {
    return null;
  }

  const titleText = resolveTocTitleText({
    guideKey,
    tGuides,
    fallbackTranslator,
    fallbackToEnTocTitle,
    policy,
  });

  const tocTitleProp = resolveTocTitleProp(titleText, suppressTocTitle, policy);

  const items = normalizeTocForDisplay(baseItems, {
    guideKey,
    tGuides,
    faqs,
    tipsRaw: tGuides(`content.${guideKey}.tips`, { returnObjects: true }) as unknown,
    buildTocItems,
    translateGuides: context.translateGuides,
    translateGuidesEn: context.translateGuidesEn,
    fallbackTranslator,
  });

  const faqTitleResolved = resolveFaqTitle({
    guideKey,
    tGuides,
    translateGuides: context.translateGuides,
    translateGuidesEn: context.translateGuidesEn,
    fallbackTranslator,
  });

  try {
    debugGuide("Render structured ToC", { guideKey, titleText, itemsCount: items?.length, items });
    if (!hasLocalizedContent) {
      logStructuredToc("[StructuredTocBlock]", guideKey, {
        base: baseItems?.length ?? 0,
        items: items?.length ?? 0,
      });
    }
  } catch {
    /* noop: debug only */
  }

  // Only short-circuit when localized content exists but no items resolved.
  if (hasLocalizedContent && (!items || items.length === 0)) return null;

  return (
    <>
      {/* Localized ToC */}
      {hasLocalizedContent ? (
        <LocalizedToc
          items={items}
          sections={sections}
          suppressTocTitle={suppressTocTitle}
          tocTitleProp={tocTitleProp}
          guideKey={guideKey}
          policy={policy}
        />
      ) : null}

      {/* Minimal unlocalized ToC */}
      <MinimalUnlocalizedToc
        hasLocalizedContent={hasLocalizedContent}
        showTocWhenUnlocalized={showTocWhenUnlocalized}
        preferManualWhenUnlocalized={preferManualWhenUnlocalized}
        fallbackStructured={fallbackStructured}
        policy={policy}
        items={items}
        sections={sections}
        suppressTocTitle={suppressTocTitle}
        tocTitleProp={tocTitleProp}
        guideKey={guideKey}
        buildTocItems={buildTocItems}
        context={context}
        faqs={faqs}
        tGuides={tGuides}
        fallbackTranslator={fallbackTranslator}
      />

      {/* Minimal localized content */}
      <MinimalLocalizedContent
        hasLocalizedContent={hasLocalizedContent}
        renderGenericContent={renderGenericContent}
        policy={policy}
        buildTocItems={buildTocItems}
        context={context}
        sections={sections}
        guideKey={guideKey}
        tGuides={tGuides}
        faqs={faqs}
        faqTitleResolved={faqTitleResolved}
      />

      {/* Minimal unlocalized intro */}
      <MinimalUnlocalizedIntro
        hasLocalizedContent={hasLocalizedContent}
        fallbackStructured={fallbackStructured}
        preferManualWhenUnlocalized={preferManualWhenUnlocalized}
        policy={policy}
        guideKey={guideKey}
      />

      {/* Minimal unlocalized sections */}
      <MinimalUnlocalizedSections
        hasLocalizedContent={hasLocalizedContent}
        showTocWhenUnlocalized={showTocWhenUnlocalized}
        preferManualWhenUnlocalized={preferManualWhenUnlocalized}
        fallbackStructured={fallbackStructured}
        buildTocItems={buildTocItems}
        context={context}
        policy={policy}
        sections={sections}
        guideKey={guideKey}
      />
    </>
  );
}
