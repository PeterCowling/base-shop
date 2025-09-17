// apps/cms/src/app/cms/shop/[shop]/settings/useShopEditorForm.ts
"use client";

import { useCallback, useMemo, useState, type ChangeEvent } from "react";
import { providersByType } from "@acme/configurator/providers";
import { LOCALES, type Shop } from "@acme/types";
import useMappingRows from "@/hooks/useMappingRows";
import useShopEditorSubmit, {
  type MappingRowsController,
} from "./useShopEditorSubmit";
import { mapThemeTokenRows } from "./tableMappers";

export interface SelectOption {
  label: string;
  value: string;
}

export type MappingControllerKey =
  | "filterMappings"
  | "priceOverrides"
  | "localeOverrides";

const setValueAtPath = <T extends Record<string, unknown>>(
  source: T,
  [head, ...rest]: string[],
  value: unknown,
): T => {
  if (!head) {
    return source;
  }

  if (rest.length === 0) {
    return {
      ...source,
      [head]: value,
    } as T;
  }

  const current = source[head];
  const nextSource =
    current && typeof current === "object" ? (current as Record<string, unknown>) : {};

  return {
    ...source,
    [head]: setValueAtPath(nextSource, rest, value),
  } as T;
};

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

  const { saving, errors, onSubmit } = useShopEditorSubmit({
    shop,
    filterMappings: filterMappings as MappingRowsController,
    priceOverrides: priceOverrides as MappingRowsController,
    localeOverrides: localeOverrides as MappingRowsController,
    setInfo,
    setTrackingProviders,
  });

  const shippingProviders = useMemo(
    () => providersByType("shipping"),
    [],
  );

  const shippingProviderOptions = useMemo<SelectOption[]>(
    () =>
      shippingProviders.map((provider) => ({
        label: provider.name,
        value: provider.id,
      })),
    [shippingProviders],
  );

  const localeOptions = useMemo<SelectOption[]>(
    () =>
      LOCALES.map((locale) => ({
        label: locale.toUpperCase(),
        value: locale,
      })),
    [],
  );

  const tokenRows = useMemo(
    () => mapThemeTokenRows(info.themeDefaults ?? {}, info.themeOverrides ?? {}),
    [info.themeDefaults, info.themeOverrides],
  );

  const updateInfoField = useCallback(
    (path: string, value: unknown) => {
      const segments = path.split(".");
      setInfo((prev) => setValueAtPath(prev, segments, value));
    },
    [],
  );

  const handleTextChange = useCallback(
    (name: string, value: string) => {
      updateInfoField(name, value);
    },
    [updateInfoField],
  );

  const handleCheckboxChange = useCallback(
    (name: string, checked: boolean | "indeterminate") => {
      updateInfoField(name, Boolean(checked));
    },
    [updateInfoField],
  );

  const handleMappingChange = useCallback(
    (
      controller: MappingControllerKey,
      index: number,
      field: "key" | "value",
      value: string,
    ) => {
      if (controller === "filterMappings") {
        filterMappings.update(index, field, value);
        return;
      }
      if (controller === "priceOverrides") {
        priceOverrides.update(index, field, value);
        return;
      }
      localeOverrides.update(index, field, value);
    },
    [filterMappings, priceOverrides, localeOverrides],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      if (type === "checkbox") {
        handleCheckboxChange(name, checked);
      } else {
        handleTextChange(name, value);
      }
    },
    [handleCheckboxChange, handleTextChange],
  );

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
    handleTextChange,
    handleCheckboxChange,
    handleMappingChange,
    tokenRows,
    shippingProviders,
    shippingProviderOptions,
    localeOptions,
    onSubmit,
  } as const;
}

export default useShopEditorForm;
