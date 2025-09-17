// apps/cms/src/app/cms/shop/[shop]/settings/ShopEditor.tsx

"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  CardContent,
  Input,
} from "@/components/atoms/shadcn";
import { Toast } from "@/components/atoms";
import type { Shop } from "@acme/types";
import { type ReactNode } from "react";

import SEOSettings from "./SEOSettings";
import ThemeTokens from "./ThemeTokens";
import { useShopEditorForm } from "./useShopEditorForm";
import IdentitySection, {
  type IdentitySectionErrors,
} from "./sections/IdentitySection";
import ProvidersSection, {
  type ProvidersSectionErrors,
} from "./sections/ProvidersSection";
import OverridesSection, {
  type OverridesSectionErrors,
} from "./sections/OverridesSection";
import LocalizationSection, {
  type LocalizationSectionErrors,
} from "./sections/LocalizationSection";

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
    shippingProviders,
    onSubmit,
    toast,
    toastClassName,
    closeToast,
  } = form;

  const identityValues = {
    name: info.name,
    themeId: info.themeId,
    luxuryFeatures: info.luxuryFeatures,
  };

  const handleIdentityFieldChange = (field: "name" | "themeId", value: string) => {
    setInfo((current) => ({ ...current, [field]: value }));
  };

  const handleLuxuryFeatureChange = <K extends keyof Shop["luxuryFeatures"]>(
    feature: K,
    value: Shop["luxuryFeatures"][K],
  ) => {
    setInfo((current) => ({
      ...current,
      luxuryFeatures: {
        ...current.luxuryFeatures,
        [feature]: value,
      },
    }));
  };

  const identityErrors = mapIdentityErrors(errors);
  const providersErrors = mapProvidersErrors(errors);
  const overridesErrors = mapOverridesErrors(errors);
  const localizationErrors = mapLocalizationErrors(errors);

  const sections: SectionConfig[] = [
    {
      key: "identity",
      title: "Identity",
      description: "Update the shop name, theme, and luxury feature toggles.",
      wrapInCard: false,
      render: () => (
        <IdentitySection
          values={identityValues}
          errors={identityErrors}
          onFieldChange={handleIdentityFieldChange}
          onLuxuryFeatureChange={handleLuxuryFeatureChange}
        />
      ),
    },
    {
      key: "seo",
      title: "SEO",
      description: "Configure catalog filters for storefront metadata.",
      render: () => (
        <Card className="border border-border/60">
          <CardContent className="space-y-6 p-6">
            <SEOSettings info={info} setInfo={setInfo} errors={errors} />
          </CardContent>
        </Card>
      ),
    },
    {
      key: "providers",
      title: "Tracking providers",
      description: "Manage analytics and fulfillment tracking integrations.",
      wrapInCard: false,
      render: () => (
        <ProvidersSection
          values={trackingProviders}
          providers={shippingProviders}
          errors={providersErrors}
          onChange={setTrackingProviders}
        />
      ),
    },
    {
      key: "theme",
      title: "Theme tokens",
      description: "Compare overrides with defaults and reset individual tokens.",
      render: () => (
        <Card className="border border-border/60">
          <CardContent className="space-y-6 p-6">
            <ThemeTokens
              shop={shop}
              tokenRows={tokenRows}
              info={info}
              errors={errors}
            />
          </CardContent>
        </Card>
      ),
    },
    {
      key: "overrides",
      title: "Overrides",
      description: "Fine-tune storefront mappings and localized pricing.",
      wrapInCard: false,
      render: () => (
        <OverridesSection
          filterMappings={filterMappings}
          priceOverrides={priceOverrides}
          errors={overridesErrors}
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
      key: "localization",
      title: "Localization overrides",
      description: "Redirect locale content to custom destinations.",
      wrapInCard: false,
      render: () => (
        <LocalizationSection
          values={localeOverrides}
          errors={localizationErrors}
          onAdd={addLocaleOverride}
          onUpdate={updateLocaleOverride}
          onRemove={removeLocaleOverride}
        />
      ),
    },
  ];

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-6">
        <Input type="hidden" name="id" value={info.id} />
        <Accordion type="multiple" className="space-y-4">
          {sections.map(({ key, title, description, render, wrapInCard = true }) => (
            <AccordionItem
              key={key}
              value={key}
              className={wrapInCard ? "border-none p-0" : "bg-card"}
            >
              <AccordionTrigger className="px-4 py-3 text-left text-sm font-semibold">
                <SectionHeader title={title} description={description} />
              </AccordionTrigger>
              <AccordionContent className="border-t border-border/60 p-0">
                {wrapInCard ? (
                  <SectionCard dataSectionKey={key}>{render()}</SectionCard>
                ) : (
                  render()
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
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
      <Toast
        open={toast.open}
        message={toast.message}
        onClose={closeToast}
        className={toastClassName}
        role="status"
      />
    </>
  );
}

interface SectionConfig {
  key: string;
  title: string;
  description?: string;
  render: () => ReactNode;
  wrapInCard?: boolean;
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

const LUXURY_TOGGLE_FIELDS = [
  "blog",
  "contentMerchandising",
  "raTicketing",
  "requireStrongCustomerAuth",
  "strictReturnConditions",
  "trackingDashboard",
  "premierDelivery",
] as const;

type ErrorMap = Record<string, string[]>;

function mapIdentityErrors(errors: ErrorMap | undefined): IdentitySectionErrors | undefined {
  if (!errors) return undefined;
  const result: IdentitySectionErrors = {};

  if (errors.name) result.name = errors.name;
  if (errors.themeId) result.themeId = errors.themeId;
  if (errors.luxuryFeatures) result.luxuryFeatures = errors.luxuryFeatures;

  for (const key of LUXURY_TOGGLE_FIELDS) {
    const messages = errors[`luxuryFeatures.${key}`] ?? errors[key];
    if (messages) {
      result[`luxuryFeatures.${key}` as const] = messages;
    }
  }

  const fraudMessages =
    errors["luxuryFeatures.fraudReviewThreshold"] ?? errors.fraudReviewThreshold;
  if (fraudMessages) {
    result.fraudReviewThreshold = fraudMessages;
    result["luxuryFeatures.fraudReviewThreshold"] = fraudMessages;
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function mapProvidersErrors(errors: ErrorMap | undefined): ProvidersSectionErrors | undefined {
  if (!errors?.trackingProviders) return undefined;
  return { trackingProviders: errors.trackingProviders };
}

function mapOverridesErrors(errors: ErrorMap | undefined): OverridesSectionErrors | undefined {
  if (!errors) return undefined;
  const result: OverridesSectionErrors = {};
  if (errors.filterMappings) result.filterMappings = errors.filterMappings;
  if (errors.priceOverrides) result.priceOverrides = errors.priceOverrides;
  return Object.keys(result).length > 0 ? result : undefined;
}

function mapLocalizationErrors(
  errors: ErrorMap | undefined,
): LocalizationSectionErrors | undefined {
  if (!errors?.localeOverrides) return undefined;
  return { localeOverrides: errors.localeOverrides };
}
