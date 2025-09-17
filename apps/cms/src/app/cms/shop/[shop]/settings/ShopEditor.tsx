// apps/cms/src/app/cms/shop/[shop]/settings/ShopEditor.tsx

"use client";
import {
  Accordion,
  type AccordionItem,
  Button,
  Card,
  CardContent,
  Input,
} from "@/components/atoms/shadcn";
import type { Shop } from "@acme/types";
import { type ReactNode } from "react";

import SEOSettings from "./SEOSettings";
import ThemeTokens from "./ThemeTokens";
import { useShopEditorForm } from "./useShopEditorForm";
import {
  ShopIdentitySection,
  ShopLocalizationSection,
  ShopOverridesSection,
  ShopProvidersSection,
} from "./sections";

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

  const handleLuxuryFeatureChange = <K extends keyof Shop["luxuryFeatures"]>(
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

  const sections: SectionConfig[] = [
    {
      key: "identity",
      title: "Identity",
      description: "Update the shop name, theme, and luxury feature toggles.",
      render: () => (
        <ShopIdentitySection
          info={info}
          errors={errors}
          onInfoChange={handleChange}
          onLuxuryFeatureChange={handleLuxuryFeatureChange}
        />
      ),
    },
    {
      key: "localization",
      title: "Localization",
      description: "Redirect key storefront entry points to locale-specific experiences.",
      render: () => (
        <ShopLocalizationSection
          overrides={localeOverrides}
          errors={errors}
          onAddOverride={addLocaleOverride}
          onUpdateOverride={updateLocaleOverride}
          onRemoveOverride={removeLocaleOverride}
        />
      ),
    },
    {
      key: "providers",
      title: "Logistics providers",
      description: "Manage analytics and fulfillment tracking integrations.",
      render: () => (
        <ShopProvidersSection
          selected={trackingProviders}
          providers={shippingProviders}
          errors={errors}
          onChange={setTrackingProviders}
        />
      ),
    },
    {
      key: "overrides",
      title: "Overrides",
      description: "Fine-tune how storefront filters and pricing map to catalog data.",
      render: () => (
        <ShopOverridesSection
          filterMappings={filterMappings}
          priceOverrides={priceOverrides}
          errors={errors}
          onAddFilterMapping={addFilterMapping}
          onUpdateFilterMapping={updateFilterMapping}
          onRemoveFilterMapping={removeFilterMapping}
          onAddPriceOverride={addPriceOverride}
          onUpdatePriceOverride={updatePriceOverride}
          onRemovePriceOverride={removePriceOverride}
        />
      ),
    },
    {
      key: "seo",
      title: "SEO",
      description: "Configure catalog filters for storefront metadata.",
      render: () => <SEOSettings info={info} setInfo={setInfo} errors={errors} />,
    },
    {
      key: "theme",
      title: "Theme tokens",
      description: "Compare overrides with defaults and reset individual tokens.",
      render: () => (
        <ThemeTokens shop={shop} tokenRows={tokenRows} info={info} errors={errors} />
      ),
    },
  ];

  const accordionItems: AccordionItem[] = sections.map(
    ({ title, description, render, key }) => ({
      title: <SectionHeader title={title} description={description} />,
      content: (
        <SectionCard dataSectionKey={key}>
          {render()}
        </SectionCard>
      ),
    }),
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Input type="hidden" name="id" value={info.id} />
      <Accordion items={accordionItems} />
      <div className="flex justify-end">
        <Button
          className="h-10 px-6 text-sm font-semibold"
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

interface SectionConfig {
  key: string;
  title: string;
  description?: string;
  render: () => ReactNode;
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-semibold">{title}</span>
      {description ? (
        <span className="text-xs text-muted-foreground">{description}</span>
      ) : null}
    </div>
  );
}

function SectionCard({
  children,
  dataSectionKey,
}: {
  children: ReactNode;
  dataSectionKey?: string;
}) {
  return (
    <Card className="border border-border/60" data-section={dataSectionKey}>
      <CardContent className="space-y-6 p-6">{children}</CardContent>
    </Card>
  );
}

