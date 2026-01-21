import { useMemo } from "react";

import type {
  MappingListFieldErrors,
  MappingListFieldRowErrors,
} from "./components/MappingListField";
import type {
  ShopIdentitySectionErrors,
  ShopLocalizationSectionErrors,
  ShopOverridesSectionErrors,
  ShopProvidersSectionErrors,
  ShopSeoSectionErrors,
  ShopThemeSectionErrors,
} from "./sections";

const LUXURY_FEATURE_ERROR_KEYS = [
  "blog",
  "contentMerchandising",
  "raTicketing",
  "requireStrongCustomerAuth",
  "strictReturnConditions",
  "trackingDashboard",
  "premierDelivery",
] as const;

type MappingListFieldName =
  | "filterMappings"
  | "priceOverrides"
  | "localeOverrides";

export interface ShopEditorErrorBags {
  readonly identity?: ShopIdentitySectionErrors;
  readonly providers?: ShopProvidersSectionErrors;
  readonly overrides?: ShopOverridesSectionErrors;
  readonly localization?: ShopLocalizationSectionErrors;
  readonly seo?: ShopSeoSectionErrors;
  readonly theme?: ShopThemeSectionErrors;
}

const DOT_PATTERNS: Record<MappingListFieldName, RegExp> = {
  filterMappings: /^filterMappings\.(\d+)(?:\.(key|value|general))?$/,
  priceOverrides: /^priceOverrides\.(\d+)(?:\.(key|value|general))?$/,
  localeOverrides: /^localeOverrides\.(\d+)(?:\.(key|value|general))?$/,
};

const BRACKET_PATTERNS: Record<MappingListFieldName, RegExp> = {
  filterMappings: /^filterMappings\[(\d+)](?:\.(key|value|general))?$/,
  priceOverrides: /^priceOverrides\[(\d+)](?:\.(key|value|general))?$/,
  localeOverrides: /^localeOverrides\[(\d+)](?:\.(key|value|general))?$/,
};

function buildMappingListErrors(
  errors: Readonly<Record<string, string[]>>,
  field: MappingListFieldName,
): MappingListFieldErrors | undefined {
  const general = errors[field];
  const rowEntries = new Map<number, MappingListFieldRowErrors>();

  const dotPattern = DOT_PATTERNS[field];
  const bracketPattern = BRACKET_PATTERNS[field];

  for (const [errorKey, messages] of Object.entries(errors)) {
    const dotMatch = errorKey.match(dotPattern);
    const bracketMatch = errorKey.match(bracketPattern);
    const match = dotMatch ?? bracketMatch;
    if (!match) {
      continue;
    }

    const index = Number(match[1]);
    if (Number.isNaN(index)) {
      continue;
    }

    const fieldName = (match[2] as "key" | "value" | "general" | undefined) ?? "general";
    const current = rowEntries.get(index) ?? {};

    if (fieldName === "general") {
      rowEntries.set(index, { ...current, general: messages });
    } else {
      rowEntries.set(index, { ...current, [fieldName]: messages });
    }
  }

  const rows =
    rowEntries.size > 0
      ? Array.from(rowEntries.entries())
          .sort(([left], [right]) => left - right)
          .map(([, value]) => value)
      : undefined;

  if (!general && !rows) {
    return undefined;
  }

  return { general, rows };
}

export function useShopEditorErrors(
  errors: Readonly<Record<string, string[]>>,
): ShopEditorErrorBags {
  return useMemo(() => {
    const identityErrors: ShopIdentitySectionErrors = {};
    if (errors.name) {
      identityErrors.name = errors.name;
    }
    if (errors.themeId) {
      identityErrors.themeId = errors.themeId;
    }
    if (errors.fraudReviewThreshold) {
      identityErrors.fraudReviewThreshold = errors.fraudReviewThreshold;
    }
    if (errors.luxuryFeatures) {
      identityErrors.luxuryFeatures = errors.luxuryFeatures;
    }

    for (const feature of LUXURY_FEATURE_ERROR_KEYS) {
      const messages = errors[feature];
      if (messages) {
        const field = `luxuryFeatures.${feature}` as const;
        identityErrors[field] = messages;
      }
    }

    const identityBag =
      Object.keys(identityErrors).length > 0 ? identityErrors : undefined;

    const providersBag = errors.trackingProviders
      ? { trackingProviders: errors.trackingProviders }
      : undefined;

    const filterMappingErrors = buildMappingListErrors(errors, "filterMappings");
    const priceOverrideErrors = buildMappingListErrors(errors, "priceOverrides");

    const overridesErrors: ShopOverridesSectionErrors = {};
    if (filterMappingErrors) {
      overridesErrors.filterMappings = filterMappingErrors;
    }
    if (priceOverrideErrors) {
      overridesErrors.priceOverrides = priceOverrideErrors;
    }
    const overridesBag =
      Object.keys(overridesErrors).length > 0 ? overridesErrors : undefined;

    const localizationBag = (() => {
      const localeOverrideErrors = buildMappingListErrors(errors, "localeOverrides");
      if (!localeOverrideErrors) {
        return undefined;
      }
      return { localeOverrides: localeOverrideErrors } satisfies ShopLocalizationSectionErrors;
    })();

    const seoBag = errors.catalogFilters
      ? ({ catalogFilters: errors.catalogFilters } satisfies ShopSeoSectionErrors)
      : undefined;

    const themeBag = (() => {
      const result: ShopThemeSectionErrors = {};
      if (errors.themeDefaults) {
        result.themeDefaults = errors.themeDefaults;
      }
      if (errors.themeOverrides) {
        result.themeOverrides = errors.themeOverrides;
      }
      return Object.keys(result).length > 0 ? result : undefined;
    })();

    return {
      identity: identityBag,
      providers: providersBag,
      overrides: overridesBag,
      localization: localizationBag,
      seo: seoBag,
      theme: themeBag,
    } satisfies ShopEditorErrorBags;
  }, [errors]);
}

export default useShopEditorErrors;
