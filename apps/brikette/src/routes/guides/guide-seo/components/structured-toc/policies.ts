/**
 * Policy configuration for StructuredTocBlock.
 *
 * Consolidates guide-specific rendering decisions for ToC and minimal content blocks.
 */
import type { GuideSeoTemplateContext } from "../../types";

export type StructuredTocOverride = {
  suppressTemplateToc?: boolean;
  suppressTemplateTocWhenUnlocalized?: boolean;
  suppressTemplateTocWhenLocalized?: boolean;
  suppressTemplateTocWhenSectionsEmpty?: boolean;
  suppressTemplateTocWhenPreferManual?: boolean;
  suppressTemplateTocWhenGatewayContentKey?: string;
  allowTocWithGenericContent?: boolean;
  allowMinimalWithGenericContent?: boolean;
  suppressMinimalLocalizedContent?: boolean;
  suppressMinimalUnlocalizedToc?: boolean;
  suppressMinimalUnlocalizedIntro?: boolean;
  suppressMinimalUnlocalizedSections?: boolean;
  allowOnThisPageTitle?: boolean;
  forceEnTocTitleFallback?: boolean;
  sectionIdFilterPattern?: RegExp;
};

export const STRUCTURED_TOC_OVERRIDES: Partial<
  Record<GuideSeoTemplateContext["guideKey"], StructuredTocOverride>
> = {
  ecoFriendlyAmalfi: { suppressTemplateTocWhenPreferManual: true },
  capriDayTrip: { suppressTemplateToc: true },
  walkingTourAudio: { suppressTemplateToc: true },
  offSeasonLongStay: { suppressTemplateToc: true },
  luggageStorage: { suppressTemplateToc: true },
  itinerariesPillar: {
    suppressTemplateToc: true,
    suppressMinimalUnlocalizedToc: true,
    suppressMinimalLocalizedContent: true,
  },
  chiesaNuovaArrivals: { suppressTemplateToc: true },
  chiesaNuovaDepartures: { suppressTemplateToc: true },
  workCafes: { suppressTemplateTocWhenSectionsEmpty: true },
  sorrentoGuide: { suppressTemplateTocWhenGatewayContentKey: "sorrentoGatewayGuide" },
  positanoTravelGuide: {
    suppressTemplateTocWhenUnlocalized: true,
    suppressMinimalLocalizedContent: true,
    suppressMinimalUnlocalizedSections: true,
  },
  photographyGuidePositano: { suppressTemplateTocWhenLocalized: true },
  etiquetteItalyAmalfi: {
    suppressTemplateTocWhenUnlocalized: true,
    allowTocWithGenericContent: true,
    allowMinimalWithGenericContent: true,
    suppressMinimalUnlocalizedToc: true,
    forceEnTocTitleFallback: true,
  },
  workExchangeItaly: {
    allowTocWithGenericContent: true,
    allowMinimalWithGenericContent: true,
  },
  weekend48Positano: {
    allowMinimalWithGenericContent: true,
    allowOnThisPageTitle: true,
  },
  sevenDayNoCar: { allowMinimalWithGenericContent: true },
  soloTravelPositano: { sectionIdFilterPattern: /^section-\d+$/u },
  transportMoneySaving: { suppressMinimalLocalizedContent: true },
  safetyAmalfi: { suppressMinimalLocalizedContent: true },
  cheapEats: { suppressMinimalLocalizedContent: true },
  positanoBeaches: {
    suppressMinimalLocalizedContent: true,
    suppressMinimalUnlocalizedSections: true,
  },
  simsAtms: {
    suppressMinimalLocalizedContent: true,
    suppressMinimalUnlocalizedIntro: true,
  },
};

export function getStructuredTocOverride(
  guideKey: GuideSeoTemplateContext["guideKey"],
): StructuredTocOverride {
  return STRUCTURED_TOC_OVERRIDES[guideKey] ?? {};
}
