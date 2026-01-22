/**
 * Suppression checks for StructuredTocBlock.
 *
 * Consolidates early-return logic for ToC rendering decisions.
 */
import type { GuideSeoTemplateContext, NormalisedSection, Translator } from "../../types";
import type { StructuredFallback } from "../../utils/fallbacks";

import type { StructuredTocOverride } from "./policies";

interface SuppressionParams {
  guideKey: GuideSeoTemplateContext["guideKey"];
  hasLocalizedContent: boolean;
  preferManualWhenUnlocalized?: boolean;
  sections: NormalisedSection[];
  tGuides: Translator;
  fallbackStructured?: StructuredFallback | null;
  suppressUnlocalizedFallback?: boolean;
  buildTocItems?: unknown;
  context: GuideSeoTemplateContext;
  renderGenericContent: boolean;
  showTocWhenUnlocalized: boolean;
  faqs: unknown[];
  baseItems: unknown[];
  policy: StructuredTocOverride;
}

/**
 * Check if the ToC should be suppressed based on policies and state.
 * Returns true if the component should return null early.
 */
export function shouldSuppressToc({
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
}: SuppressionParams): boolean {
  // 1. Routes that prefer manual handling when unlocalized
  if (!hasLocalizedContent && preferManualWhenUnlocalized) return true;
  if (policy.suppressTemplateTocWhenPreferManual && preferManualWhenUnlocalized) return true;

  // 2. Routes that unconditionally suppress the template ToC
  if (policy.suppressTemplateToc) return true;

  // 3. Conditional suppression based on localization state
  if (policy.suppressTemplateTocWhenUnlocalized && !hasLocalizedContent) return true;
  if (policy.suppressTemplateTocWhenLocalized && hasLocalizedContent) return true;

  // 4. Conditional suppression when sections are empty
  if (policy.suppressTemplateTocWhenSectionsEmpty && (!Array.isArray(sections) || sections.length === 0)) {
    return true;
  }

  // 5. Dynamic gateway content probe
  if (policy.suppressTemplateTocWhenGatewayContentKey) {
    try {
      const gatewayKey = policy.suppressTemplateTocWhenGatewayContentKey;
      const intro = tGuides(`content.${gatewayKey}.intro`, { returnObjects: true }) as unknown;
      const gatewaySections = tGuides(`content.${gatewayKey}.sections`, {
        returnObjects: true,
      }) as unknown;
      const hasIntro = Array.isArray(intro) && (intro as unknown[]).length > 0;
      const hasGatewaySections =
        Array.isArray(gatewaySections) && (gatewaySections as unknown[]).length > 0;
      if (hasIntro || hasGatewaySections) return true;
    } catch {
      /* noop */
    }
  }

  // 6. Fallback structured object check
  if (!hasLocalizedContent && fallbackStructured && !suppressUnlocalizedFallback) return true;

  // 7. Custom builder check
  if (
    typeof buildTocItems === "function" &&
    (!Array.isArray(context.toc) || context.toc.length === 0)
  ) {
    return true;
  }

  // 8. GenericContent active check
  if (renderGenericContent) {
    const hasCustomItems =
      typeof buildTocItems === "function" && Array.isArray(context?.toc) && context.toc.length > 0;
    const hasStructured = (() => {
      const hasSections =
        Array.isArray(sections) && sections.some((s) => Array.isArray(s?.body) && s.body.length > 0);
      const hasTips = (() => {
        try {
          const raw = tGuides(`content.${guideKey}.tips`, { returnObjects: true }) as unknown;
          return Array.isArray(raw) && raw.length > 0;
        } catch {
          return false;
        }
      })();
      const hasFaqs = Array.isArray(faqs) && faqs.length > 0;
      const hasBase = Array.isArray(baseItems) && baseItems.length > 0;
      return hasSections || hasTips || hasFaqs || hasBase;
    })();
    const allowWithGenericForRoute = Boolean(policy.allowTocWithGenericContent && hasStructured);
    if (!hasCustomItems && !allowWithGenericForRoute) return true;
  }

  // 9. Unlocalized ToC visibility
  if (!hasLocalizedContent && !showTocWhenUnlocalized) return true;

  return false;
}
