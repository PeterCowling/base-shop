// apps/cms/src/app/cms/shop/[shop]/settings/useShopEditorForm.ts
"use client";

import { useMemo, useState, ChangeEvent } from "react";
import { providersByType } from "@acme/configurator/providers";
import type { Shop } from "@acme/types";
import useMappingRows from "@/hooks/useMappingRows";
import useShopEditorSubmit, {
  type MappingRowsController,
} from "./useShopEditorSubmit";
import { mapThemeTokenRows } from "./tableMappers";

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

  const { saving, errors, onSubmit, toast, toastClassName, closeToast } =
    useShopEditorSubmit({
      shop,
      filterMappings: filterMappings as MappingRowsController,
      priceOverrides: priceOverrides as MappingRowsController,
      localeOverrides: localeOverrides as MappingRowsController,
      setInfo,
      setTrackingProviders,
    });

  const shippingProviders = providersByType("shipping");

  const tokenRows = useMemo(
    () => mapThemeTokenRows(info.themeDefaults ?? {}, info.themeOverrides ?? {}),
    [info.themeDefaults, info.themeOverrides],
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInfo((prev) => ({ ...prev, [name]: value }));
  };

  return {
    info,
    setInfo,
    trackingProviders,
    setTrackingProviders,
    saving,
    errors,
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
    tokenRows,
    shippingProviders,
    onSubmit,
    toast,
    toastClassName,
    closeToast,
  } as const;
}

export default useShopEditorForm;
