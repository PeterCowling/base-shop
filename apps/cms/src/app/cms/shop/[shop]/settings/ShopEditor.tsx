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
import OverridesSettings from "./OverridesSettings";

export { default as GeneralSettings } from "./GeneralSettings";
export { default as SEOSettings } from "./SEOSettings";
export { default as ThemeTokens } from "./ThemeTokens";
export { default as OverridesSettings } from "./OverridesSettings";

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
        setErrors={setErrors}
      />
      <ThemeTokens
        shop={shop}
        tokenRows={tokenRows}
        info={info}
        errors={errors}
      />
      <OverridesSettings
        info={info}
        setInfo={setInfo}
        errors={errors}
        setErrors={setErrors}
      />
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
