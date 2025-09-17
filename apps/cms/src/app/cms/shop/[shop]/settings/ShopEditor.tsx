// apps/cms/src/app/cms/shop/[shop]/settings/ShopEditor.tsx

"use client";
import { Button, Input } from "@/components/atoms/shadcn";
import type { Shop } from "@acme/types";
import {
  FilterMappingsSection,
  GeneralSection,
  LocaleOverridesSection,
  PriceOverridesSection,
  SEOSection,
  ThemeTokensSection,
  TrackingProvidersSection,
} from "./sections";
import { useShopEditorForm } from "./useShopEditorForm";

export {
  FilterMappingsSection,
  GeneralSection,
  LocaleOverridesSection,
  PriceOverridesSection,
  SEOSection,
  ThemeTokensSection,
  TrackingProvidersSection,
};

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
      <GeneralSection
        info={info}
        setInfo={setInfo}
        errors={errors}
        handleChange={handleChange}
      />
      <SEOSection info={info} setInfo={setInfo} errors={errors} />
      <TrackingProvidersSection
        trackingProviders={trackingProviders}
        setTrackingProviders={setTrackingProviders}
        errors={errors}
        shippingProviders={shippingProviders}
      />
      <ThemeTokensSection
        shop={shop}
        tokenRows={tokenRows}
        info={info}
        errors={errors}
      />
      <FilterMappingsSection
        mappings={filterMappings}
        addMapping={addFilterMapping}
        updateMapping={updateFilterMapping}
        removeMapping={removeFilterMapping}
        errors={errors}
      />
      <PriceOverridesSection
        overrides={priceOverrides}
        addOverride={addPriceOverride}
        updateOverride={updatePriceOverride}
        removeOverride={removePriceOverride}
        errors={errors}
      />
      <LocaleOverridesSection
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

