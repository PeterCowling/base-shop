// apps/cms/src/app/cms/shop/[shop]/settings/ShopEditor.tsx

"use client";
import { Button, Input } from "@/components/atoms/shadcn";
import { updateShop } from "@cms/actions/shops.server";
import { shopSchema } from "@cms/actions/schemas";
import type { Shop } from "@acme/types";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import GeneralSettings from "./GeneralSettings";
import SEOSettings from "./SEOSettings";
import ThemeTokens from "./ThemeTokens";
import { providersByType } from "@acme/configurator/providers";

export { default as GeneralSettings } from "./GeneralSettings";
export { default as SEOSettings } from "./SEOSettings";
export { default as ThemeTokens } from "./ThemeTokens";

interface Props {
  shop: string;
  initial: Shop;
  initialTrackingProviders: string[];
}

export default function ShopEditor({ shop, initial, initialTrackingProviders }: Props) {
  const [info, setInfo] = useState<Shop>(initial);
  const [trackingProviders, setTrackingProviders] = useState<string[]>(
    initialTrackingProviders,
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [filterMappings, setFilterMappings] = useState<{ key: string; value: string }[]>(
    Object.entries(initial.filterMappings ?? {}).map(([key, value]) => ({
      key,
      value: String(value),
    })),
  );
  const [priceOverrides, setPriceOverrides] = useState<{ key: string; value: string }[]>(
    Object.entries(initial.priceOverrides ?? {}).map(([key, value]) => ({
      key,
      value: String(value),
    })),
  );
  const [localeOverrides, setLocaleOverrides] = useState<{ key: string; value: string }[]>(
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
    // note: depends on info to update when tokens change
  }, [info.themeDefaults, info.themeOverrides]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInfo((prev) => ({ ...prev, [name]: value }));
  };

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

    const entries = Array.from(fd.entries()).filter(
      ([k]) =>
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

  return (
    <form
      onSubmit={onSubmit}
      className="@container grid max-w-md gap-4 @sm:grid-cols-2"
    >
      <Input type="hidden" name="id" value={info.id} />
      <GeneralSettings
        info={info}
        setInfo={setInfo}
        errors={errors}
        handleChange={handleChange}
      />
      <SEOSettings
        info={info}
        setInfo={setInfo}
        trackingProviders={trackingProviders}
        setTrackingProviders={setTrackingProviders}
        errors={errors}
        shippingProviders={shippingProviders}
      />
      <ThemeTokens
        shop={shop}
        tokenRows={tokenRows}
        info={info}
        errors={errors}
      />
      <div className="flex flex-col gap-1">
        <span>Filter Mappings</span>
        {filterMappings.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input
              name="filterMappingsKey"
              value={row.key}
              placeholder="Filter"
              onChange={(e) => updateFilterMapping(idx, "key", e.target.value)}
            />
            <Input
              name="filterMappingsValue"
              value={row.value}
              placeholder="Mapping"
              onChange={(e) => updateFilterMapping(idx, "value", e.target.value)}
            />
            <Button type="button" onClick={() => removeFilterMapping(idx)}>
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" onClick={addFilterMapping}>
          Add Mapping
        </Button>
        {errors.filterMappings && (
          <span className="text-sm text-red-600">
            {errors.filterMappings.join("; ")}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span>Price Overrides</span>
        {priceOverrides.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input
              name="priceOverridesKey"
              value={row.key}
              placeholder="Locale"
              onChange={(e) => updatePriceOverride(idx, "key", e.target.value)}
            />
            <Input
              type="number"
              name="priceOverridesValue"
              value={row.value}
              placeholder="Price"
              onChange={(e) => updatePriceOverride(idx, "value", e.target.value)}
            />
            <Button type="button" onClick={() => removePriceOverride(idx)}>
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" onClick={addPriceOverride}>
          Add Override
        </Button>
        {errors.priceOverrides && (
          <span className="text-sm text-red-600">
            {errors.priceOverrides.join("; ")}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span>Locale Overrides</span>
        {localeOverrides.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input
              name="localeOverridesKey"
              value={row.key}
              placeholder="Field"
              onChange={(e) => updateLocaleOverride(idx, "key", e.target.value)}
            />
            <select
              name="localeOverridesValue"
              value={row.value}
              onChange={(e) => updateLocaleOverride(idx, "value", e.target.value)}
              className="border p-2"
            >
              <option value="">Select locale</option>
              <option value="en">en</option>
              <option value="de">de</option>
              <option value="it">it</option>
            </select>
            <Button type="button" onClick={() => removeLocaleOverride(idx)}>
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" onClick={addLocaleOverride}>
          Add Override
        </Button>
        {errors.localeOverrides && (
          <span className="text-sm text-red-600">
            {errors.localeOverrides.join("; ")}
          </span>
        )}
      </div>
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
