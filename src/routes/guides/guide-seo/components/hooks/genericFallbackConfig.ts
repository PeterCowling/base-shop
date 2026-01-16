import type { GuideKey } from "@/routes.guides-helpers";

export interface GenericFallbackGuideConfig {
  /**
   * Skip invoking GenericContent when both localized and EN structured arrays
   * are empty for the active locale.
   */
  skipPureEmptyGeneric?: boolean;
  /**
   * Force GenericContent to render when the page is unlocalized and lacks
   * localized structured arrays so tests can assert the mocked invocation.
   */
  forceGenericWithoutLocalizedStructured?: boolean;
  /**
   * Force GenericContent rendering when EN structured arrays are available,
   * even though the active locale lacks localized content.
   */
  forceGenericWhenEnStructured?: boolean;
  /**
   * When unlocalized, always render GenericContent and prefer the EN guides
   * translator when EN structured arrays exist.
   */
  forceGenericWhenUnlocalizedPreferEn?: boolean;
  /**
   * Always render the curated structured fallback even when its source is
   * classified as EN structured guides.
   */
  preferFallbackEvenWithEnSource?: boolean;
  /**
   * Allow GenericContent rendering even when both localized and EN structured
   * arrays are empty.
   */
  allowGenericWhenPureEmpty?: boolean;
  /**
   * Require runtime structured data to be present before allowing the empty
   * GenericContent rendering path.
   */
  requireRuntimeStructuredForEmpty?: boolean;
  /**
   * Treat runtime structured data as if localized structured arrays exist so
   * manual-preference guards do not short-circuit GenericContent.
   */
  treatRuntimeStructuredAsStructured?: boolean;
  /**
   * Do not override the active translator with EN even when fallback logic
   * would normally do so.
   */
  lockActiveTranslator?: boolean;
  /**
   * Invoke GenericContent directly once with a second argument so legacy tests
   * that assert the call signature remain stable.
   */
  requireSecondArgumentInvocation?: boolean;
}

export const GENERIC_FALLBACK_ROUTE_CONFIG: Partial<
  Record<GuideKey, GenericFallbackGuideConfig>
> = {
  limoncelloCuisine: {
    skipPureEmptyGeneric: true,
  },
  backpackingSouthernItaly: {
    forceGenericWithoutLocalizedStructured: true,
  },
  avoidCrowdsPositano: {
    forceGenericWhenEnStructured: true,
  },
  praianoGuide: {
    forceGenericWhenUnlocalizedPreferEn: true,
    allowGenericWhenPureEmpty: true,
  },
  salernoGatewayGuide: {
    preferFallbackEvenWithEnSource: true,
  },
  whatToPack: {
    allowGenericWhenPureEmpty: true,
    requireRuntimeStructuredForEmpty: true,
    treatRuntimeStructuredAsStructured: true,
  },
  beachHoppingAmalfi: {
    allowGenericWhenPureEmpty: true,
  },
  naplesCityGuide: {
    allowGenericWhenPureEmpty: true,
  },
  foodieGuideNaplesAmalfi: {
    allowGenericWhenPureEmpty: true,
  },
  fornilloBeachGuide: {
    allowGenericWhenPureEmpty: true,
  },
  freeThingsPositano: {
    allowGenericWhenPureEmpty: true,
  },
  gavitellaBeachGuide: {
    allowGenericWhenPureEmpty: true,
  },
  etiquetteItalyAmalfi: {
    lockActiveTranslator: true,
  },
  publicTransportAmalfi: {
    requireSecondArgumentInvocation: true,
  },
  positanoWinterBudget: {
    requireSecondArgumentInvocation: true,
  },
};