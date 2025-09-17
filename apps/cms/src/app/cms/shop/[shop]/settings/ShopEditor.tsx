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
import IdentitySection, {
  type IdentitySectionErrors,
} from "./sections/IdentitySection";
import LocalizationSection, {
  type LocalizationSectionErrors,
} from "./sections/LocalizationSection";
import OverridesSection, {
  type OverridesSectionErrors,
} from "./sections/OverridesSection";
import ProvidersSection, {
  type ProvidersSectionErrors,
} from "./sections/ProvidersSection";
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
    errors,
    tokenRows,
    saving,
    identity,
    providers,
    overrides,
    localization,
    toast,
    closeToast,
    onSubmit,
  } = form;

  const luxuryFeatureErrorKeys = [
    "blog",
    "contentMerchandising",
    "raTicketing",
    "requireStrongCustomerAuth",
    "strictReturnConditions",
    "trackingDashboard",
    "premierDelivery",
  ] as const;

  const identityErrors: IdentitySectionErrors = {};
  if (errors.name) {
    identityErrors.name = errors.name;
  }
  if (errors.themeId) {
    identityErrors.themeId = errors.themeId;
  }
  if (errors.fraudReviewThreshold) {
    identityErrors.fraudReviewThreshold = errors.fraudReviewThreshold;
  }
  if (errors.luxuryFeatures) {
    identityErrors.luxuryFeatures = errors.luxuryFeatures;
  }
  for (const feature of luxuryFeatureErrorKeys) {
    const messages = errors[feature];
    if (messages) {
      const field = `luxuryFeatures.${feature}` as const;
      identityErrors[field] = messages;
    }
  }

  const providersErrors: ProvidersSectionErrors | undefined =
    errors.trackingProviders
      ? { trackingProviders: errors.trackingProviders }
      : undefined;

  const overridesErrors: OverridesSectionErrors = {};
  if (errors.filterMappings) {
    overridesErrors.filterMappings = errors.filterMappings;
  }
  if (errors.priceOverrides) {
    overridesErrors.priceOverrides = errors.priceOverrides;
  }
  const overridesSectionErrors =
    Object.keys(overridesErrors).length > 0 ? overridesErrors : undefined;

  const localizationErrors: LocalizationSectionErrors | undefined =
    errors.localeOverrides
      ? { localeOverrides: errors.localeOverrides }
      : undefined;

  const toastClassName =
    toast.status === "error"
      ? "bg-destructive text-destructive-foreground"
      : "bg-success text-success-fg";

  const sections: SectionConfig[] = [
    {
      key: "identity",
      title: "Identity",
      description: "Update the shop name, theme, and luxury feature toggles.",
      render: () => (
        <IdentitySection
          values={identity.info}
          errors={identityErrors}
          onFieldChange={identity.handleTextChange}
          onLuxuryFeatureChange={identity.handleLuxuryFeatureChange}
        />
      ),
      wrapWithCard: false,
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
        <ProvidersSection
          values={providers.trackingProviders}
          providers={providers.shippingProviders}
          errors={providersErrors}
          onChange={providers.setTrackingProviders}
        />
      ),
      wrapWithCard: false,
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
      key: "overrides",
      title: "Overrides",
      description: "Fine-tune filter mappings and price localization.",
      render: () => (
        <OverridesSection
          filterMappings={overrides.filterMappings.rows}
          priceOverrides={localization.priceOverrides.rows}
          errors={overridesSectionErrors}
          onAddFilterMapping={overrides.filterMappings.add}
          onUpdateFilterMapping={overrides.filterMappings.update}
          onRemoveFilterMapping={overrides.filterMappings.remove}
          onAddPriceOverride={localization.priceOverrides.add}
          onUpdatePriceOverride={localization.priceOverrides.update}
          onRemovePriceOverride={localization.priceOverrides.remove}
        />
      ),
      wrapWithCard: false,
    },
    {
      key: "localization",
      title: "Localization overrides",
      description: "Redirect locale content to custom destinations.",
      render: () => (
        <LocalizationSection
          values={localization.localeOverrides.rows}
          errors={localizationErrors}
          onAdd={localization.localeOverrides.add}
          onUpdate={localization.localeOverrides.update}
          onRemove={localization.localeOverrides.remove}
          availableLocales={localization.supportedLocales}
        />
      ),
      wrapWithCard: false,
    },
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Input type="hidden" name="id" value={info.id} />
      <Accordion
        type="multiple"
        defaultValue={sections.map((section) => section.key)}
        className="space-y-3"
      >
        {sections.map(({ key, title, description, render, wrapWithCard }) => (
          <AccordionItem key={key} value={key} data-section={key} className="border-none">
            <AccordionTrigger className="rounded-md border border-border/60 bg-muted/40 px-4 py-3 text-left text-sm font-semibold">
              <SectionHeader title={title} description={description} />
            </AccordionTrigger>
            <AccordionContent className="pt-3">
              <SectionCard dataSectionKey={key} wrapWithCard={wrapWithCard}>
                {render()}
              </SectionCard>
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
      <Toast
        open={toast.open}
        message={toast.message}
        onClose={closeToast}
        className={toastClassName}
        role="status"
      />
    </form>
  );
}

interface SectionConfig {
  key: string;
  title: string;
  description?: string;
  render: () => ReactNode;
  wrapWithCard?: boolean;
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
  wrapWithCard = true,
}: {
  children: ReactNode;
  dataSectionKey?: string;
  wrapWithCard?: boolean;
}) {
  if (!wrapWithCard) {
    return <div data-section={dataSectionKey}>{children}</div>;
  }

  return (
    <Card className="border border-border/60" data-section={dataSectionKey}>
      <CardContent className="space-y-6 p-6">{children}</CardContent>
    </Card>
  );
}

