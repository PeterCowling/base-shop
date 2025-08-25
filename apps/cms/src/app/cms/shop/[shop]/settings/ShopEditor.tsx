// apps/cms/src/app/cms/shop/[shop]/settings/ShopEditor.tsx

"use client";
import { Button, Input } from "@/components/atoms/shadcn";
import type { Shop } from "@acme/types";
import GeneralSettings from "./GeneralSettings";
import SEOSettings from "./SEOSettings";
import ThemeTokens from "./ThemeTokens";
import FilterMappings from "./FilterMappings";
import PriceOverrides from "./PriceOverrides";
import ProviderSelect from "./ProviderSelect";
import LocaleOverrides from "./LocaleOverrides";
import { useShopEditorForm } from "./useShopEditorForm";

export { default as GeneralSettings } from "./GeneralSettings";
export { default as SEOSettings } from "./SEOSettings";
export { default as ThemeTokens } from "./ThemeTokens";

interface Props {
  shop: string;
  initial: Shop;
  initialTrackingProviders: string[];
}

export default function ShopEditor({ shop, initial, initialTrackingProviders }: Props) {
  const form = useShopEditorForm({ shop, initial, initialTrackingProviders });
  const {
    info,
    setInfo,
    trackingProviders,
    setTrackingProviders,
    errors,
    tokenRows,
    saving,
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
    shippingProviders,
    onSubmit,
  } = form;

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
      <SEOSettings info={info} setInfo={setInfo} errors={errors} />
      <ProviderSelect
        trackingProviders={trackingProviders}
        setTrackingProviders={setTrackingProviders}
        errors={errors}
        shippingProviders={shippingProviders}
      />
      <ThemeTokens shop={shop} tokenRows={tokenRows} info={info} errors={errors} />
      <FilterMappings
        mappings={filterMappings}
        addMapping={addFilterMapping}
        updateMapping={updateFilterMapping}
        removeMapping={removeFilterMapping}
        errors={errors}
      />
      <PriceOverrides
        overrides={priceOverrides}
        addOverride={addPriceOverride}
        updateOverride={updatePriceOverride}
        removeOverride={removePriceOverride}
        errors={errors}
      />
      <LocaleOverrides
        overrides={localeOverrides}
        addOverride={addLocaleOverride}
        updateOverride={updateLocaleOverride}
        removeOverride={removeLocaleOverride}
        errors={errors}
      />
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

