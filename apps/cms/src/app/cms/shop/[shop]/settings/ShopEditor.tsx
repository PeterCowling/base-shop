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

import FilterMappings from "./FilterMappings";
import LocaleOverrides from "./LocaleOverrides";
import PriceOverrides from "./PriceOverrides";
import ProviderSelect from "./ProviderSelect";
import SEOSettings from "./SEOSettings";
import ThemeTokens from "./ThemeTokens";
import GeneralSettings from "./GeneralSettings";
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

  const sections: SectionConfig[] = [
    {
      key: "general",
      title: "General",
      description: "Update the shop name, theme, and luxury feature toggles.",
      render: () => (
        <div className="grid gap-4 md:grid-cols-2">
          <GeneralSettings
            info={info}
            setInfo={setInfo}
            errors={errors}
            handleChange={handleChange}
          />
        </div>
      ),
    },
    {
      key: "seo",
      title: "SEO",
      description: "Configure catalog filters for storefront metadata.",
      render: () => <SEOSettings info={info} setInfo={setInfo} errors={errors} />,
    },
    {
      key: "providers",
      title: "Tracking providers",
      description: "Manage analytics and fulfillment tracking integrations.",
      render: () => (
        <ProviderSelect
          trackingProviders={trackingProviders}
          setTrackingProviders={setTrackingProviders}
          errors={errors}
          shippingProviders={shippingProviders}
        />
      ),
    },
    {
      key: "theme",
      title: "Theme tokens",
      description: "Compare overrides with defaults and reset individual tokens.",
      render: () => (
        <ThemeTokens shop={shop} tokenRows={tokenRows} info={info} errors={errors} />
      ),
    },
    {
      key: "filter-mappings",
      title: "Filter mappings",
      description: "Link storefront filters to upstream data keys.",
      render: () => (
        <FilterMappings
          mappings={filterMappings}
          addMapping={addFilterMapping}
          updateMapping={updateFilterMapping}
          removeMapping={removeFilterMapping}
          errors={errors}
        />
      ),
    },
    {
      key: "price-overrides",
      title: "Price overrides",
      description: "Adjust localized pricing for specific catalog entries.",
      render: () => (
        <PriceOverrides
          overrides={priceOverrides}
          addOverride={addPriceOverride}
          updateOverride={updatePriceOverride}
          removeOverride={removePriceOverride}
          errors={errors}
        />
      ),
    },
    {
      key: "locale-overrides",
      title: "Locale overrides",
      description: "Redirect locale content to custom destinations.",
      render: () => (
        <LocaleOverrides
          overrides={localeOverrides}
          addOverride={addLocaleOverride}
          updateOverride={updateLocaleOverride}
          removeOverride={removeLocaleOverride}
          errors={errors}
        />
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

