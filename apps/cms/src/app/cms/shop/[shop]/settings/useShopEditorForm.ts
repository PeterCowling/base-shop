// apps/cms/src/app/cms/shop/[shop]/settings/useShopEditorForm.ts
"use client";

import { useMemo, useState, ChangeEvent } from "react";
import { providersByType } from "@acme/configurator/providers";
import { LOCALES, type Shop } from "@acme/types";
import useMappingRows from "@/hooks/useMappingRows";
import useShopEditorSubmit, {
  type IdentityField,
  type LuxuryCheckboxKey,
  type LuxuryFeatureKey,
  type SelectOption,
  type ShopEditorIdentitySection,
  type ShopEditorLocalizationSection,
  type ShopEditorOverridesSection,
  type ShopEditorProvidersSection,
} from "./useShopEditorSubmit";
import { mapThemeTokenRows } from "./lib/pageSections";

interface HookArgs {
  shop: string;
  initial: Shop;
  initialTrackingProviders: string[];
}

export function useShopEditorForm({
  shop,
  initial,
  initialTrackingProviders,
}: HookArgs) {
  const [info, setInfo] = useState<Shop>(initial);
  const [trackingProviders, setTrackingProviders] = useState<string[]>(
    initialTrackingProviders,
  );

  const filterMappings = useMappingRows(initial.filterMappings);
  const priceOverrides = useMappingRows(initial.priceOverrides);
  const localeOverrides = useMappingRows(initial.localeOverrides);

  const shippingProviders = useMemo(
    () => providersByType("shipping"),
    [],
  );

  const shippingProviderOptions = useMemo<ReadonlyArray<SelectOption>>(
    () =>
      shippingProviders.map((provider) => ({
        label: provider.name,
        value: provider.id,
      })),
    [shippingProviders],
  );

  const supportedLocales = useMemo<ReadonlyArray<string>>(
    () => [...LOCALES],
    [],
  );

  const localeOptions = useMemo<ReadonlyArray<SelectOption>>(
    () =>
      supportedLocales.map((locale) => ({
        label: locale,
        value: locale,
      })),
    [supportedLocales],
  );

  const mappingControllers = {
    filterMappings,
    priceOverrides,
    localeOverrides,
  } as const;

  const isIdentityField = (field: string): field is IdentityField =>
    field === "name" || field === "themeId";

  const handleTextChange = (field: IdentityField, value: string) => {
    setInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleLuxuryFeatureChange = <K extends LuxuryFeatureKey>(
    feature: K,
    value: Shop["luxuryFeatures"][K],
  ) => {
    setInfo((prev) => ({
      ...prev,
      luxuryFeatures: {
        ...prev.luxuryFeatures,
        [feature]: value,
      },
    }));
  };

  const handleCheckboxChange = <K extends LuxuryCheckboxKey>(
    feature: K,
    checked: boolean,
  ) => {
    handleLuxuryFeatureChange(feature, checked as Shop["luxuryFeatures"][K]);
  };

  const handleCatalogFiltersChange = (filters: string[]) => {
    setInfo((prev) => ({
      ...prev,
      catalogFilters: filters,
    }));
  };

  const tokenRows = useMemo(
    () => mapThemeTokenRows(info.themeDefaults ?? {}, info.themeOverrides ?? {}),
    [info.themeDefaults, info.themeOverrides],
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (isIdentityField(name)) {
      handleTextChange(name, value);
    }
  };

  const handleMappingChange = (
    type: keyof typeof mappingControllers,
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    mappingControllers[type].update(index, field, value);
  };

  const identity: ShopEditorIdentitySection = {
    info,
    setInfo,
    handleChange,
    handleTextChange,
    handleCheckboxChange,
    handleLuxuryFeatureChange,
  };

  const seo = {
    catalogFilters: info.catalogFilters,
    setCatalogFilters: handleCatalogFiltersChange,
  } as const;

  const localization: ShopEditorLocalizationSection = {
    priceOverrides,
    localeOverrides,
    localeOptions,
    supportedLocales,
  };

  const providersState: ShopEditorProvidersSection = {
    shippingProviders,
    shippingProviderOptions,
    trackingProviders,
    setTrackingProviders,
  };

  const overrides: ShopEditorOverridesSection = {
    filterMappings,
    tokenRows,
  };

  const { saving, errors, toast, closeToast, onSubmit } = useShopEditorSubmit({
    shop,
    identity,
    localization,
    providers: providersState,
    overrides,
  });

  return {
    info,
    setInfo,
    trackingProviders,
    setTrackingProviders,
    saving,
    errors,
    toast,
    closeToast,
    filterMappings: filterMappings.rows,
    addFilterMapping: filterMappings.add,
    updateFilterMapping: filterMappings.update,
    removeFilterMapping: filterMappings.remove,
    priceOverrides: priceOverrides.rows,
    addPriceOverride: priceOverrides.add,
    updatePriceOverride: priceOverrides.update,
    removePriceOverride: priceOverrides.remove,
    localeOverrides: localeOverrides.rows,
    addLocaleOverride: localeOverrides.add,
    updateLocaleOverride: localeOverrides.update,
    removeLocaleOverride: localeOverrides.remove,
    handleChange,
    handleTextChange,
    handleCheckboxChange,
    handleLuxuryFeatureChange,
    handleMappingChange,
    tokenRows,
    shippingProviders,
    shippingProviderOptions,
    supportedLocales,
    localeOptions,
    identity,
    localization,
    providers: providersState,
    overrides,
    seo,
    onSubmit,
  } as const;
}

export default useShopEditorForm;
