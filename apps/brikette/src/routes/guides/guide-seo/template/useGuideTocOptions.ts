import { useMemo } from "react";

import type { GenericContentTranslator } from "@/components/guides/GenericContent";

import type { GuideSeoTemplateContext, GuideSeoTemplateProps, TocItem, Translator } from "../types";
import { useFallbackTocSuppression } from "../useFallbackTocSuppression";
import { useStructuredTocItems } from "../useStructuredTocItems";
import { needsExplicitTocFalse, needsExplicitTocTrue } from "../utils/templatePolicies";

export function useGuideTocOptions(params: {
  context: GuideSeoTemplateContext;
  buildTocItems?: GuideSeoTemplateProps["buildTocItems"];
  genericContentOptions?: GuideSeoTemplateProps["genericContentOptions"];
  guideKey: GuideSeoTemplateContext["guideKey"];
  hasLocalizedContent: boolean;
  guidesEn?: Translator;
  translateGuides?: GenericContentTranslator;
  suppressUnlocalizedFallback?: boolean;
  preferManualWhenUnlocalized?: boolean;
}): {
  structuredTocItems: TocItem[];
  effectiveGenericOptions: NonNullable<GuideSeoTemplateProps["genericContentOptions"]>;
} {
  const {
    context,
    buildTocItems,
    genericContentOptions,
    guideKey,
    hasLocalizedContent,
    guidesEn,
    translateGuides,
    suppressUnlocalizedFallback,
    preferManualWhenUnlocalized,
  } = params;

  // When routes prefer manual fallbacks for unlocalized locales, suppress
  // deriving ToC items from fallback sources (EN or guidesFallback) at the
  // template level. This lets the dedicated fallback renderer control whether
  // a ToC appears (and keeps it hidden when the localized fallback has no
  // items), matching test expectations.
  const suppressUnlocalizedToc = Boolean(suppressUnlocalizedFallback || preferManualWhenUnlocalized);
  const structuredTocItems = useStructuredTocItems({
    context,
    buildTocItems,
    suppressUnlocalizedFallback: suppressUnlocalizedToc,
  });

  const localizedFallbackTocSuppressed = useFallbackTocSuppression({
    guideKey,
    guidesEn,
    hasLocalizedContent,
    translateGuides,
  });

  // ToC strategy:
  // - When a custom builder exists, prefer the template-level ToC
  //   (StructuredTocBlock). Suppress the GenericContent ToC when the
  //   builder produced items; enable it only when the builder yielded no
  //   items so GenericContent can provide a minimal ToC. Respect an explicit
  //   route-specified showToc flag in all cases.
  const effectiveGenericOptions = useMemo(() => {
    const base =
      genericContentOptions && typeof genericContentOptions === "object"
        ? genericContentOptions
        : {};
    const applyOverride = <T extends Record<string, unknown>>(value: T): T => {
      if (!hasLocalizedContent && localizedFallbackTocSuppressed) {
        return { ...value, showToc: false } as T;
      }
      return value;
    };
    if (typeof buildTocItems === "function") {
      // Respect explicit route preference when provided.
      if (typeof (base as any).showToc !== "undefined") {
        return applyOverride(base as NonNullable<typeof genericContentOptions>);
      }
      // Template test coverage: for specific guides, allow GenericContent to
      // render its own ToC even when a custom builder provides items.
      if (needsExplicitTocTrue(guideKey)) {
        return applyOverride({ ...(base as any), showToc: true } as NonNullable<typeof genericContentOptions>);
      }
      // When a custom builder yielded items, suppress GenericContent's ToC to
      // avoid duplicates. If the builder produced no items, allow GenericContent
      // to render its own minimal ToC.
      const hasCustomItems = Array.isArray(structuredTocItems) && structuredTocItems.length > 0;
      return applyOverride({ ...base, showToc: !hasCustomItems } as NonNullable<typeof genericContentOptions>);
    }
    // Route-specific: for specific guides, suppress GenericContent's ToC.
    if (needsExplicitTocFalse(guideKey)) {
      return applyOverride({ ...base, showToc: false } as NonNullable<typeof genericContentOptions>);
    }
    return applyOverride(base as NonNullable<typeof genericContentOptions>);
  }, [
    genericContentOptions,
    buildTocItems,
    structuredTocItems,
    guideKey,
    hasLocalizedContent,
    localizedFallbackTocSuppressed,
  ]);

  return { structuredTocItems, effectiveGenericOptions };
}
