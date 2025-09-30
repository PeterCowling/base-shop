import type { ComponentType } from "react";
import type { Shop } from "@acme/types";

import {
  ShopIdentitySection,
  ShopLocalizationSection,
  ShopOverridesSection,
  ShopProvidersSection,
  ShopSeoSection,
  ShopThemeSection,
  type ShopIdentitySectionErrors,
  type ShopLocalizationSectionErrors,
  type ShopOverridesSectionErrors,
  type ShopProvidersSectionErrors,
  type ShopSeoSectionErrors,
  type ShopThemeSectionErrors,
} from "./sections";
import type {
  ShopEditorIdentitySection,
  ShopEditorLocalizationSection,
  ShopEditorOverridesSection,
  ShopEditorProvidersSection,
} from "./useShopEditorSubmit";
import type { ShopEditorErrorBags } from "./useShopEditorErrors";

interface ShopEditorSeoState {
  readonly catalogFilters: readonly string[];
  readonly setCatalogFilters: (filters: string[]) => void;
}

export interface EditorSectionConfig<Props = unknown> {
  readonly key: string;
  readonly title: string;
  readonly description?: string;
  readonly wrapWithCard?: boolean;
  readonly component: ComponentType<Props>;
  readonly props: Props;
}

interface CreateShopEditorSectionsArgs {
  readonly shop: string;
  readonly info: Shop;
  readonly identity: ShopEditorIdentitySection;
  readonly providers: ShopEditorProvidersSection;
  readonly overrides: ShopEditorOverridesSection;
  readonly localization: ShopEditorLocalizationSection;
  readonly seo: ShopEditorSeoState;
  readonly errors: ShopEditorErrorBags;
}

interface IdentitySectionWrapperProps {
  readonly identity: ShopEditorIdentitySection;
  readonly errors?: ShopIdentitySectionErrors;
}

function IdentitySectionWrapper({ identity, errors }: IdentitySectionWrapperProps) {
  return (
    <ShopIdentitySection
      info={identity.info}
      errors={errors}
      onInfoChange={identity.handleTextChange}
      onLuxuryFeatureChange={identity.handleLuxuryFeatureChange}
    />
  );
}

interface SeoSectionWrapperProps {
  readonly seo: ShopEditorSeoState;
  readonly errors?: ShopSeoSectionErrors;
}

function SeoSectionWrapper({ seo, errors }: SeoSectionWrapperProps) {
  return (
    <ShopSeoSection
      catalogFilters={seo.catalogFilters}
      onCatalogFiltersChange={seo.setCatalogFilters}
      errors={errors}
    />
  );
}

interface ProvidersSectionWrapperProps {
  readonly providers: ShopEditorProvidersSection;
  readonly errors?: ShopProvidersSectionErrors;
}

function ProvidersSectionWrapper({ providers, errors }: ProvidersSectionWrapperProps) {
  return (
    <ShopProvidersSection
      trackingProviders={providers.trackingProviders}
      shippingProviders={providers.shippingProviders}
      errors={errors}
      onTrackingChange={providers.setTrackingProviders}
    />
  );
}

interface ThemeSectionWrapperProps {
  readonly shop: string;
  readonly tokenRows: ShopEditorOverridesSection["tokenRows"];
  readonly themeDefaults?: Shop["themeDefaults"];
  readonly themeOverrides?: Shop["themeOverrides"];
  readonly errors?: ShopThemeSectionErrors;
}

function ThemeSectionWrapper({
  shop,
  tokenRows,
  themeDefaults,
  themeOverrides,
  errors,
}: ThemeSectionWrapperProps) {
  return (
    <ShopThemeSection
      shop={shop}
      tokenRows={tokenRows}
      themeDefaults={themeDefaults}
      themeOverrides={themeOverrides}
      errors={errors}
    />
  );
}

interface OverridesSectionWrapperProps {
  readonly overrides: ShopEditorOverridesSection;
  readonly priceOverrides: ShopEditorLocalizationSection["priceOverrides"];
  readonly errors?: ShopOverridesSectionErrors;
}

function OverridesSectionWrapper({
  overrides,
  priceOverrides,
  errors,
}: OverridesSectionWrapperProps) {
  return (
    <ShopOverridesSection
      filterMappings={overrides.filterMappings}
      priceOverrides={priceOverrides}
      errors={errors}
    />
  );
}

interface LocalizationSectionWrapperProps {
  readonly localization: ShopEditorLocalizationSection;
  readonly errors?: ShopLocalizationSectionErrors;
}

function LocalizationSectionWrapper({
  localization,
  errors,
}: LocalizationSectionWrapperProps) {
  return (
    <ShopLocalizationSection
      localeOverrides={localization.localeOverrides}
      availableLocales={localization.supportedLocales}
      errors={errors}
    />
  );
}

export function createShopEditorSections({
  shop,
  info,
  identity,
  providers,
  overrides,
  localization,
  seo,
  errors,
}: CreateShopEditorSectionsArgs): Array<
  | EditorSectionConfig<IdentitySectionWrapperProps>
  | EditorSectionConfig<SeoSectionWrapperProps>
  | EditorSectionConfig<ProvidersSectionWrapperProps>
  | EditorSectionConfig<ThemeSectionWrapperProps>
  | EditorSectionConfig<OverridesSectionWrapperProps>
  | EditorSectionConfig<LocalizationSectionWrapperProps>
> {
  return [
    {
      key: "identity",
      title: "Identity",
      description: "Update the shop name, theme, and luxury feature toggles.",
      wrapWithCard: false,
      component: IdentitySectionWrapper,
      props: { identity, errors: errors.identity },
    },
    {
      key: "seo",
      title: "SEO",
      description: "Configure catalog filters for storefront metadata.",
      wrapWithCard: false,
      component: SeoSectionWrapper,
      props: { seo, errors: errors.seo },
    },
    {
      key: "providers",
      title: "Tracking providers",
      description: "Manage analytics and fulfillment tracking integrations.",
      wrapWithCard: false,
      component: ProvidersSectionWrapper,
      props: { providers, errors: errors.providers },
    },
    {
      key: "theme",
      title: "Theme tokens",
      description: "Compare overrides with defaults and reset individual tokens.",
      component: ThemeSectionWrapper,
      props: {
        shop,
        tokenRows: overrides.tokenRows,
        themeDefaults: info.themeDefaults,
        themeOverrides: info.themeOverrides,
        errors: errors.theme,
      },
    },
    {
      key: "overrides",
      title: "Overrides",
      description: "Fine-tune filter mappings and price localization.",
      wrapWithCard: false,
      component: OverridesSectionWrapper,
      props: {
        overrides,
        priceOverrides: localization.priceOverrides,
        errors: errors.overrides,
      },
    },
    {
      key: "localization",
      title: "Localization overrides",
      description: "Redirect locale content to custom destinations.",
      wrapWithCard: false,
      component: LocalizationSectionWrapper,
      props: { localization, errors: errors.localization },
    },
  ];
}

export default createShopEditorSections;
