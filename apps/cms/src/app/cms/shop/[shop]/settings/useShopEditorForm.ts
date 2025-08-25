// apps/cms/src/app/cms/shop/[shop]/settings/useShopEditorForm.ts
"use client";

import { useMemo, useState, ChangeEvent, FormEvent } from "react";
import { providersByType } from "@acme/configurator/providers";
import type { Shop } from "@acme/types";
import { shopSchema } from "@cms/actions/schemas";
import { updateShop } from "@cms/actions/shops.server";

interface MappingRow {
  key: string;
  value: string;
}

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
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [filterMappings, setFilterMappings] = useState<MappingRow[]>(
    Object.entries(initial.filterMappings ?? {}).map(([key, value]) => ({
      key,
      value: String(value),
    })),
  );
  const [priceOverrides, setPriceOverrides] = useState<MappingRow[]>(
    Object.entries(initial.priceOverrides ?? {}).map(([key, value]) => ({
      key,
      value: String(value),
    })),
  );
  const [localeOverrides, setLocaleOverrides] = useState<MappingRow[]>(
    Object.entries(initial.localeOverrides ?? {}).map(([key, value]) => ({
      key,
      value: String(value),
    })),
  );

  const shippingProviders = providersByType("shipping");

  const tokenRows = useMemo(() => {
    const defaults = info.themeDefaults ?? {};
    const overrides = info.themeOverrides ?? {};
    const tokens = Array.from(
      new Set([...Object.keys(defaults), ...Object.keys(overrides)]),
    );
    return tokens.map((token) => ({
      token,
      defaultValue: defaults[token],
      overrideValue: overrides[token],
    }));
  }, [info.themeDefaults, info.themeOverrides]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInfo((prev) => ({ ...prev, [name]: value }));
  };

  // Filter mappings
  const addFilterMapping = () =>
    setFilterMappings((prev) => [...prev, { key: "", value: "" }]);
  const updateFilterMapping = (
    index: number,
    field: "key" | "value",
    value: string,
  ) =>
    setFilterMappings((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  const removeFilterMapping = (index: number) =>
    setFilterMappings((prev) => prev.filter((_, i) => i !== index));

  // Price overrides
  const addPriceOverride = () =>
    setPriceOverrides((prev) => [...prev, { key: "", value: "" }]);
  const updatePriceOverride = (
    index: number,
    field: "key" | "value",
    value: string,
  ) =>
    setPriceOverrides((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  const removePriceOverride = (index: number) =>
    setPriceOverrides((prev) => prev.filter((_, i) => i !== index));

  // Locale overrides
  const addLocaleOverride = () =>
    setLocaleOverrides((prev) => [...prev, { key: "", value: "" }]);
  const updateLocaleOverride = (
    index: number,
    field: "key" | "value",
    value: string,
  ) =>
    setLocaleOverrides((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  const removeLocaleOverride = (index: number) =>
    setLocaleOverrides((prev) => prev.filter((_, i) => i !== index));

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const validationErrors: Record<string, string[]> = {};
    const allowedLocales = ["en", "de", "it"];
    if (filterMappings.some(({ key, value }) => !key.trim() || !value.trim())) {
      validationErrors.filterMappings = [
        "All filter mappings must have key and value",
      ];
    }
    if (
      priceOverrides.some(
        ({ key, value }) => !key.trim() || value === "" || isNaN(Number(value)),
      )
    ) {
      validationErrors.priceOverrides = [
        "All price overrides require locale and numeric value",
      ];
    }
    if (
      localeOverrides.some(
        ({ key, value }) => !key.trim() || !allowedLocales.includes(value),
      )
    ) {
      validationErrors.localeOverrides = [
        "All locale overrides require key and valid locale",
      ];
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSaving(false);
      return;
    }

    const filterMappingsObj = Object.fromEntries(
      filterMappings
        .map(({ key, value }) => [key.trim(), value.trim()])
        .filter(([k, v]) => k && v),
    );
    const priceOverridesObj = Object.fromEntries(
      priceOverrides
        .map(({ key, value }) => [key.trim(), Number(value)])
        .filter(([k, v]) => k && !Number.isNaN(v)),
    );
    const localeOverridesObj = Object.fromEntries(
      localeOverrides
        .map(({ key, value }) => [key.trim(), value])
        .filter(([k, v]) => k && v),
    );

    const entries = Array.from(
      (fd as unknown as Iterable<[string, string]>),
    ).filter(([k]) =>
      ![
        "filterMappingsKey",
        "filterMappingsValue",
        "priceOverridesKey",
        "priceOverridesValue",
        "localeOverridesKey",
        "localeOverridesValue",
      ].includes(k),
    );
    const data = Object.fromEntries(entries) as Record<string, string>;
    const parsed = shopSchema.safeParse({
      ...data,
      trackingProviders: fd.getAll("trackingProviders"),
      filterMappings: JSON.stringify(filterMappingsObj),
      priceOverrides: JSON.stringify(priceOverridesObj),
      localeOverrides: JSON.stringify(localeOverridesObj),
    });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      setSaving(false);
      return;
    }
    const result = await updateShop(shop, fd);
    if (result.errors) {
      setErrors(result.errors);
    } else if (result.shop) {
      setInfo(result.shop);
      setTrackingProviders(fd.getAll("trackingProviders") as string[]);
      setFilterMappings(
        Object.entries(result.shop.filterMappings ?? {}).map(([key, value]) => ({
          key,
          value: String(value),
        })),
      );
      setPriceOverrides(
        Object.entries(result.shop.priceOverrides ?? {}).map(([key, value]) => ({
          key,
          value: String(value),
        })),
      );
      setLocaleOverrides(
        Object.entries(result.shop.localeOverrides ?? {}).map(([key, value]) => ({
          key,
          value: String(value),
        })),
      );
      setErrors({});
    }
    setSaving(false);
  };

  return {
    info,
    setInfo,
    trackingProviders,
    setTrackingProviders,
    saving,
    errors,
    filterMappings,
    addFilterMapping,
    updateFilterMapping,
    removeFilterMapping,
    priceOverrides,
    addPriceOverride,
    updatePriceOverride,
    removePriceOverride,
    localeOverrides,
    addLocaleOverride,
    updateLocaleOverride,
    removeLocaleOverride,
    handleChange,
    tokenRows,
    shippingProviders,
    onSubmit,
  } as const;
}

