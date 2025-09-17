// apps/cms/src/app/cms/shop/[shop]/settings/ShopEditor.tsx

"use client";
import { Toast } from "@/components/atoms";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Input,
} from "@/components/atoms/shadcn";
import type { Shop } from "@acme/types";
import SEOSettings from "./SEOSettings";
import ThemeTokens from "./ThemeTokens";
import {
  FilterMappingsSection,
  GeneralSettingsSection,
  OverridesSection,
  TrackingProvidersSection,
} from "./sections";
import { useShopEditorForm } from "./useShopEditorForm";

export { default as GeneralSettings } from "./GeneralSettings";
export { default as SEOSettings } from "./SEOSettings";
export { default as ThemeTokens } from "./ThemeTokens";

interface Props {
  shop: string;
  initial: Shop;
  initialTrackingProviders: string[];
}

const pickErrorMap = (
  source: Record<string, string[]>,
  keys: string[],
) =>
  keys.reduce<Record<string, string[]>>((acc, key) => {
    const value = source[key];
    if (value && value.length > 0) {
      acc[key] = value;
    }
    return acc;
  }, {});

const DEFAULT_ACCORDION_SECTIONS = [
  "general",
  "providers",
  "mappings",
  "overrides",
] as const;

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
    toast,
    toastClassName,
    closeToast,
  } = form;

  const generalErrors = pickErrorMap(errors, ["name", "themeId"]);
  const providerErrors = pickErrorMap(errors, ["trackingProviders"]);
  const mappingErrors = pickErrorMap(errors, ["filterMappings"]);
  const priceOverrideErrors = pickErrorMap(errors, ["priceOverrides"]);
  const localeOverrideErrors = pickErrorMap(errors, ["localeOverrides"]);

  return (
    <>
      <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
        <Input type="hidden" name="id" value={info.id} />
        <Accordion
          type="multiple"
          defaultValue={[...DEFAULT_ACCORDION_SECTIONS]}
          className="border border-border/60"
        >
          <AccordionItem value="general">
            <AccordionTrigger>General settings</AccordionTrigger>
            <AccordionContent>
              <GeneralSettingsSection
                info={info}
                setInfo={setInfo}
                handleChange={handleChange}
                errors={generalErrors}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="providers">
            <AccordionTrigger>Tracking providers</AccordionTrigger>
            <AccordionContent>
              <TrackingProvidersSection
                trackingProviders={trackingProviders}
                setTrackingProviders={setTrackingProviders}
                shippingProviders={shippingProviders}
                errors={providerErrors}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="mappings">
            <AccordionTrigger>Filter mappings</AccordionTrigger>
            <AccordionContent>
              <FilterMappingsSection
                mappings={filterMappings}
                addMapping={addFilterMapping}
                updateMapping={updateFilterMapping}
                removeMapping={removeFilterMapping}
                errors={mappingErrors}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="overrides">
            <AccordionTrigger>Overrides</AccordionTrigger>
            <AccordionContent>
              <OverridesSection
                priceOverrides={priceOverrides}
                addPriceOverride={addPriceOverride}
                updatePriceOverride={updatePriceOverride}
                removePriceOverride={removePriceOverride}
                priceErrors={priceOverrideErrors}
                localeOverrides={localeOverrides}
                addLocaleOverride={addLocaleOverride}
                updateLocaleOverride={updateLocaleOverride}
                removeLocaleOverride={removeLocaleOverride}
                localeErrors={localeOverrideErrors}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <SEOSettings info={info} setInfo={setInfo} errors={errors} />
        <ThemeTokens shop={shop} tokenRows={tokenRows} info={info} errors={errors} />

        <div className="flex justify-end">
          <Button className="bg-primary text-white" disabled={saving} type="submit">
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

