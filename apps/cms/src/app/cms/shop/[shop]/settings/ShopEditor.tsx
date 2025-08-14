// apps/cms/src/app/cms/shop/[shop]/settings/ShopEditor.tsx

"use client";
import { Button, Input } from "@/components/atoms/shadcn";
import { updateShop } from "@cms/actions/shops.server";
import { shopSchema } from "@cms/actions/schemas";
import type { Shop } from "@acme/types";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import GeneralSettings from "./GeneralSettings";
import ThemeTokenSettings from "./ThemeTokenSettings";
import SEOSettings from "./SEOSettings";
import { createJsonChangeHandler } from "../utils/formValidators";

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

  const handleFilters = (e: ChangeEvent<HTMLInputElement>) => {
    setInfo((prev) => ({
      ...prev,
      catalogFilters: e.target.value.split(/,\s*/),
    }));
  };

  const handleMappings = createJsonChangeHandler(
    "filterMappings",
    setInfo,
    setErrors,
  );
  const handlePriceOverrides = createJsonChangeHandler(
    "priceOverrides",
    setInfo,
    setErrors,
  );
  const handleLocaleOverrides = createJsonChangeHandler(
    "localeOverrides",
    setInfo,
    setErrors,
  );

  const handleTracking = (e: ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
    setTrackingProviders(selected);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries()) as Record<string, string>;
    const parsed = shopSchema.safeParse({
      ...data,
      trackingProviders: fd.getAll("trackingProviders"),
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
        errors={errors}
        handleChange={handleChange}
        handleFilters={handleFilters}
        handleTracking={handleTracking}
        trackingProviders={trackingProviders}
        setInfo={setInfo}
      />
      <ThemeTokenSettings
        shop={shop}
        tokenRows={tokenRows}
        info={info}
        errors={errors}
      />
      <SEOSettings
        info={info}
        errors={errors}
        handleMappings={handleMappings}
        handlePriceOverrides={handlePriceOverrides}
        handleLocaleOverrides={handleLocaleOverrides}
      />
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
