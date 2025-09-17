// apps/cms/src/app/cms/shop/[shop]/settings/useShopEditorForm.ts
"use client";

import { useMemo, useState, type FormEvent } from "react";
import { providersByType } from "@acme/configurator/providers";
import type { Shop } from "@acme/types";
import useMappingRows from "@/hooks/useMappingRows";
import useShopEditorSubmit, {
  SUPPORTED_LOCALES,
  type MappingRowsController,
} from "./useShopEditorSubmit";
import type { IdentitySectionProps } from "./sections/IdentitySection";
import type { LocalizationSectionProps } from "./sections/LocalizationSection";
import type { ProvidersSectionProps } from "./sections/ProvidersSection";
import type {
  OverridesSectionProps,
  ThemeTokenRow,
} from "./sections/OverridesSection";

interface HookArgs {
  shop: string;
  initial: Shop;
  initialTrackingProviders: string[];
}

export interface ShopEditorSections {
  identity: IdentitySectionProps;
  localization: LocalizationSectionProps;
  providers: ProvidersSectionProps;
  overrides: OverridesSectionProps;
  form: {
    id: string;
    saving: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> | void;
  };
}

export function useShopEditorForm({
  shop,
  initial,
  initialTrackingProviders,
}: HookArgs): ShopEditorSections {
  const [info, setInfo] = useState<Shop>(initial);
  const [trackingProviders, setTrackingProviders] = useState<string[]>(
    initialTrackingProviders,
  );

  const filterMappings = useMappingRows(initial.filterMappings);
  const priceOverrides = useMappingRows(initial.priceOverrides);
  const localeOverrides = useMappingRows(initial.localeOverrides);

  const { saving, errors, onSubmit } = useShopEditorSubmit({
    shop,
    filterMappings: filterMappings as MappingRowsController,
    priceOverrides: priceOverrides as MappingRowsController,
    localeOverrides: localeOverrides as MappingRowsController,
    setInfo,
    setTrackingProviders,
  });

  const shippingProviders = providersByType("shipping");

  const tokenRows: ThemeTokenRow[] = useMemo(() => {
    const defaults = info.themeDefaults ?? {};
    const overrides = info.themeOverrides ?? {};
    const tokens = Array.from(
      new Set([...Object.keys(defaults), ...Object.keys(overrides)]),
    ).sort();
    return tokens.map((token) => ({
      token,
      defaultValue: defaults[token],
      overrideValue: overrides[token],
    }));
  }, [info.themeDefaults, info.themeOverrides]);

  const identity: IdentitySectionProps = {
    values: {
      name: info.name,
      themeId: info.themeId,
      luxuryFeatures: {
        blog: info.luxuryFeatures.blog,
        contentMerchandising: info.luxuryFeatures.contentMerchandising,
        raTicketing: info.luxuryFeatures.raTicketing,
        fraudReviewThreshold: info.luxuryFeatures.fraudReviewThreshold,
        requireStrongCustomerAuth:
          info.luxuryFeatures.requireStrongCustomerAuth,
        strictReturnConditions: info.luxuryFeatures.strictReturnConditions,
        trackingDashboard: info.luxuryFeatures.trackingDashboard,
      },
    },
    errors: {
      name: errors.name,
      themeId: errors.themeId,
    },
    onNameChange: (value) =>
      setInfo((prev) => ({
        ...prev,
        name: value,
      })),
    onThemeIdChange: (value) =>
      setInfo((prev) => ({
        ...prev,
        themeId: value,
      })),
    onLuxuryFeatureChange: (feature, value) =>
      setInfo((prev) => ({
        ...prev,
        luxuryFeatures: {
          ...prev.luxuryFeatures,
          [feature]: value,
        },
      })),
  };

  const localization: LocalizationSectionProps = {
    catalogFilters: {
      value: info.catalogFilters.join(", "),
      error: errors.catalogFilters,
      onChange: (value) =>
        setInfo((prev) => ({
          ...prev,
          catalogFilters: value
            .split(/,\s*/)
            .map((v) => v.trim())
            .filter(Boolean),
        })),
    },
    filterMappings: {
      rows: filterMappings.rows,
      onAdd: filterMappings.add,
      onUpdate: filterMappings.update,
      onRemove: filterMappings.remove,
      error: errors.filterMappings,
    },
    localeOverrides: {
      rows: localeOverrides.rows,
      onAdd: localeOverrides.add,
      onUpdate: localeOverrides.update,
      onRemove: localeOverrides.remove,
      error: errors.localeOverrides,
      availableLocales: Array.from(SUPPORTED_LOCALES),
    },
  };

  const providers: ProvidersSectionProps = {
    providers: shippingProviders,
    selected: trackingProviders,
    error: errors.trackingProviders,
    onToggle: (providerId, checked) =>
      setTrackingProviders((prev) => {
        if (checked) {
          return prev.includes(providerId) ? prev : [...prev, providerId];
        }
        return prev.filter((id) => id !== providerId);
      }),
  };

  const overrides: OverridesSectionProps = {
    shop,
    priceOverrides: {
      rows: priceOverrides.rows,
      onAdd: priceOverrides.add,
      onUpdate: priceOverrides.update,
      onRemove: priceOverrides.remove,
      error: errors.priceOverrides,
    },
    theme: {
      rows: tokenRows,
      defaults: info.themeDefaults ?? {},
      overrides: info.themeOverrides ?? {},
      errors: {
        themeDefaults: errors.themeDefaults,
        themeOverrides: errors.themeOverrides,
      },
    },
  };

  return {
    identity,
    localization,
    providers,
    overrides,
    form: {
      id: info.id,
      saving,
      onSubmit,
    },
  };
}

export default useShopEditorForm;
