// apps/cms/src/app/cms/shop/[shop]/settings/ShopEditor.tsx

"use client";
import { Button, Input } from "@/components/atoms/shadcn";
import type { Shop } from "@acme/types";
import SEOSettings from "./SEOSettings";
import ThemeTokens from "./ThemeTokens";
import {
  ShopIdentitySection,
  ShopLocalizationSection,
  ShopOverridesSection,
  ShopProvidersSection,
} from "./sections";
import { useShopEditorForm } from "./useShopEditorForm";

export { default as SEOSettings } from "./SEOSettings";
export { default as ThemeTokens } from "./ThemeTokens";

type LuxuryFeatureToggleKey = Exclude<
  keyof Shop["luxuryFeatures"],
  "fraudReviewThreshold"
>;

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

  const handleLuxuryFeatureToggle = (
    feature: LuxuryFeatureToggleKey,
    value: boolean,
  ) => {
    setInfo((prev) => ({
      ...prev,
      luxuryFeatures: {
        ...prev.luxuryFeatures,
        [feature]: value,
      },
    }));
  };

  const handleFraudReviewThresholdChange = (value: number) => {
    setInfo((prev) => ({
      ...prev,
      luxuryFeatures: {
        ...prev.luxuryFeatures,
        fraudReviewThreshold: value,
      },
    }));
  };

  const handleTrackingProvidersChange = (providers: string[]) => {
    setTrackingProviders(providers);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="@container grid max-w-md gap-4 @sm:grid-cols-2"
    >
      <Input type="hidden" name="id" value={info.id} />
      <ShopIdentitySection
        info={info}
        errors={errors}
        onInfoChange={handleChange}
        onLuxuryFeatureToggle={handleLuxuryFeatureToggle}
        onFraudReviewThresholdChange={handleFraudReviewThresholdChange}
      />
      <SEOSettings info={info} setInfo={setInfo} errors={errors} />
      <ShopProvidersSection
        trackingProviders={trackingProviders}
        shippingProviders={shippingProviders}
        errors={errors}
        onTrackingChange={handleTrackingProvidersChange}
      />
      <ThemeTokens shop={shop} tokenRows={tokenRows} info={info} errors={errors} />
      <ShopLocalizationSection
        mappings={filterMappings}
        onAddMapping={addFilterMapping}
        onUpdateMapping={updateFilterMapping}
        onRemoveMapping={removeFilterMapping}
        localeOverrides={localeOverrides}
        onAddLocaleOverride={addLocaleOverride}
        onUpdateLocaleOverride={updateLocaleOverride}
        onRemoveLocaleOverride={removeLocaleOverride}
        errors={errors}
      />
      <ShopOverridesSection
        overrides={priceOverrides}
        onAddOverride={addPriceOverride}
        onUpdateOverride={updatePriceOverride}
        onRemoveOverride={removePriceOverride}
        errors={errors}
      />
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

