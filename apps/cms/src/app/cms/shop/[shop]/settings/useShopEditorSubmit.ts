import { FormEvent, useState } from "react";
import type { Shop } from "@acme/types";
import { shopSchema } from "@cms/actions/schemas";
import { updateShop } from "@cms/actions/shops.server";
import type { MappingRow } from "@/hooks/useMappingRows";

export interface MappingRowsController {
  rows: MappingRow[];
  setRows: React.Dispatch<React.SetStateAction<MappingRow[]>>;
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
  filterMappings: MappingRowsController;
  priceOverrides: MappingRowsController;
  localeOverrides: MappingRowsController;
  setInfo: React.Dispatch<React.SetStateAction<Shop>>;
  setTrackingProviders: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useShopEditorSubmit({
  shop,
  filterMappings,
  priceOverrides,
  localeOverrides,
  setInfo,
  setTrackingProviders,
}: Args) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [toast, setToast] = useState<{
    open: boolean;
    status: "success" | "error";
    message: string;
  }>({
    open: false,
    status: "success",
    message: "",
  });

  const closeToast = () =>
    setToast((prev) => ({
      ...prev,
      open: false,
    }));

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const validationErrors: Record<string, string[]> = {};
    const allowedLocales = ["en", "de", "it"];
    if (filterMappings.rows.some(({ key, value }) => !key.trim() || !value.trim())) {
      validationErrors.filterMappings = [
        "All filter mappings must have key and value",
      ];
    }
    if (
      priceOverrides.rows.some(
        ({ key, value }) => !key.trim() || value === "" || isNaN(Number(value)),
      )
    ) {
      validationErrors.priceOverrides = [
        "All price overrides require locale and numeric value",
      ];
    }
    if (
      localeOverrides.rows.some(
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
        message: "Please fix the highlighted errors before saving.",
      });
      setSaving(false);
      return;
    }

    const fd = new FormData(e.currentTarget);

    const filterMappingsObj = buildStringMapping(filterMappings.rows);
    const priceOverridesObj = buildNumberMapping(priceOverrides.rows);
    const localeOverridesObj = buildStringMapping(localeOverrides.rows);

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
        message: "Please check the form for errors and try again.",
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
          message: "Failed to save shop settings. Please review the errors and try again.",
        });
      } else if (result.shop) {
        setInfo(result.shop);
        setTrackingProviders(fd.getAll("trackingProviders") as string[]);
        filterMappings.setRows(
          Object.entries(result.shop.filterMappings ?? {}).map(([key, value]) => ({
            key,
            value: String(value),
          })),
        );
        priceOverrides.setRows(
          Object.entries(result.shop.priceOverrides ?? {}).map(([key, value]) => ({
            key,
            value: String(value),
          })),
        );
        localeOverrides.setRows(
          Object.entries(result.shop.localeOverrides ?? {}).map(([key, value]) => ({
            key,
            value: String(value),
          })),
        );
        setErrors({});
        setToast({
          open: true,
          status: "success",
          message: "Shop settings saved successfully.",
        });
      }
    } catch (error) {
      setToast({
        open: true,
        status: "error",
        message: "Something went wrong while saving. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return { saving, errors, onSubmit, toast, closeToast } as const;
}

export default useShopEditorSubmit;
