import { FormEvent, useState } from "react";
import type { ChangeEvent } from "react";
import type { Provider } from "@acme/configurator/providers";
import type { Shop } from "@acme/types";
import { shopSchema } from "@cms/actions/schemas";
import { updateShop } from "@cms/actions/shops.server";
import type { MappingRow } from "@/hooks/useMappingRows";
import type { ThemeTokenRow } from "./lib/pageSections";

export interface MappingRowsController {
  readonly rows: MappingRow[];
  readonly setRows: React.Dispatch<React.SetStateAction<MappingRow[]>>;
  readonly add: () => void;
  readonly update: (index: number, field: "key" | "value", value: string) => void;
  readonly remove: (index: number) => void;
}

export interface SelectOption {
  readonly label: string;
  readonly value: string;
}

export type IdentityField = "name" | "themeId";

export type LuxuryFeatureKey = keyof Shop["luxuryFeatures"];

export type LuxuryCheckboxKey = {
  [K in LuxuryFeatureKey]: Shop["luxuryFeatures"][K] extends boolean ? K : never;
}[LuxuryFeatureKey];

export interface ShopEditorIdentitySection {
  readonly info: Shop;
  readonly setInfo: React.Dispatch<React.SetStateAction<Shop>>;
  readonly handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly handleTextChange: (field: IdentityField, value: string) => void;
  readonly handleCheckboxChange: (
    feature: LuxuryCheckboxKey,
    checked: boolean,
  ) => void;
  readonly handleLuxuryFeatureChange: <K extends LuxuryFeatureKey>(
    feature: K,
    value: Shop["luxuryFeatures"][K],
  ) => void;
}

export interface ShopEditorLocalizationSection {
  readonly priceOverrides: MappingRowsController;
  readonly localeOverrides: MappingRowsController;
  readonly localeOptions: readonly SelectOption[];
  readonly supportedLocales: readonly string[];
}

export interface ShopEditorProvidersSection {
  readonly shippingProviders: readonly Provider[];
  readonly shippingProviderOptions: readonly SelectOption[];
  readonly trackingProviders: string[];
  readonly setTrackingProviders: React.Dispatch<React.SetStateAction<string[]>>;
}

export interface ShopEditorOverridesSection {
  readonly filterMappings: MappingRowsController;
  readonly tokenRows: ThemeTokenRow[];
}

type ToastStatus = "success" | "error";

interface ToastState {
  readonly open: boolean;
  readonly status: ToastStatus;
  readonly message: string;
}

export const buildStringMapping = (rows: MappingRow[]): Record<string, string> =>
  Object.fromEntries(
    rows
      .map(({ key, value }) => [key.trim(), value.trim()])
      .filter(([k, v]) => k && v),
  );

export const buildNumberMapping = (rows: MappingRow[]): Record<string, number> =>
  Object.fromEntries(
    rows
      .map(({ key, value }) => [key.trim(), Number(value)])
      .filter(([k, v]) => k && !Number.isNaN(v)),
  );

interface Args {
  shop: string;
  identity: ShopEditorIdentitySection;
  localization: ShopEditorLocalizationSection;
  providers: ShopEditorProvidersSection;
  overrides: ShopEditorOverridesSection;
}

export function useShopEditorSubmit({
  shop,
  identity,
  localization,
  providers,
  overrides,
}: Args) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [toast, setToast] = useState<ToastState>({
    open: false,
    status: "success",
    message: "",
  });

  const closeToast = () => {
    setToast((previous) => ({ ...previous, open: false }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const validationErrors: Record<string, string[]> = {};
    const allowedLocales = ["en", "de", "it"];
    if (
      overrides.filterMappings.rows.some(
        ({ key, value }) => !key.trim() || !value.trim(),
      )
    ) {
      validationErrors.filterMappings = [
        "All filter mappings must have key and value",
      ];
    }
    if (
      localization.priceOverrides.rows.some(
        ({ key, value }) => !key.trim() || value === "" || isNaN(Number(value)),
      )
    ) {
      validationErrors.priceOverrides = [
        "All price overrides require locale and numeric value",
      ];
    }
    if (
      localization.localeOverrides.rows.some(
        ({ key, value }) => !key.trim() || !allowedLocales.includes(value),
      )
    ) {
      validationErrors.localeOverrides = [
        "All locale overrides require key and valid locale",
      ];
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setToast({
        open: true,
        status: "error",
        message: "Please resolve the highlighted validation issues.",
      });
      setSaving(false);
      return;
    }

    const fd = new FormData(e.currentTarget);

    const filterMappingsObj = buildStringMapping(overrides.filterMappings.rows);
    const priceOverridesObj = buildNumberMapping(localization.priceOverrides.rows);
    const localeOverridesObj = buildStringMapping(localization.localeOverrides.rows);

    const entries = Array.from(
      (fd as unknown as Iterable<[string, string]>),
    ).filter(([k]) =>
      ![
        "filterMappingsKey",
        "filterMappingsValue",
        "priceOverridesKey",
        "priceOverridesValue",
        "localeOverridesKey",
        "localeOverridesValue",
      ].includes(k),
    );
    const data = Object.fromEntries(entries) as Record<string, string>;
    const parsed = shopSchema.safeParse({
      ...data,
      trackingProviders: fd.getAll("trackingProviders"),
      filterMappings: JSON.stringify(filterMappingsObj),
      priceOverrides: JSON.stringify(priceOverridesObj),
      localeOverrides: JSON.stringify(localeOverridesObj),
    });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      setToast({
        open: true,
        status: "error",
        message: "Please resolve the highlighted validation issues.",
      });
      setSaving(false);
      return;
    }
    try {
      const result = await updateShop(shop, fd);
      if (result.errors) {
        setErrors(result.errors);
        setToast({
          open: true,
          status: "error",
          message:
            "We couldn't save your changes. Please review the errors and try again.",
        });
      } else if (result.shop) {
        identity.setInfo(result.shop);
        providers.setTrackingProviders(
          fd.getAll("trackingProviders") as string[],
        );
        overrides.filterMappings.setRows(
          Object.entries(result.shop.filterMappings ?? {}).map(
            ([key, value]) => ({
              key,
              value: String(value),
            }),
          ),
        );
        localization.priceOverrides.setRows(
          Object.entries(result.shop.priceOverrides ?? {}).map(
            ([key, value]) => ({
              key,
              value: String(value),
            }),
          ),
        );
        localization.localeOverrides.setRows(
          Object.entries(result.shop.localeOverrides ?? {}).map(
            ([key, value]) => ({
              key,
              value: String(value),
            }),
          ),
        );
        setErrors({});
        setToast({
          open: true,
          status: "success",
          message: "Shop settings saved successfully.",
        });
      }
    } catch (error) {
      console.error(error);
      setToast({
        open: true,
        status: "error",
        message:
          "Something went wrong while saving your changes. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return { saving, errors, toast, closeToast, onSubmit } as const;
}

export default useShopEditorSubmit;
