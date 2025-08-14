// apps/cms/src/app/cms/shop/[shop]/settings/ShopEditor.tsx

"use client";
import { Button, Input, Textarea, Checkbox } from "@/components/atoms/shadcn";
import { updateShop } from "@cms/actions/shops.server";
import { shopSchema } from "@cms/actions/schemas";
import type { Shop } from "@acme/types";
import { ChangeEvent, FormEvent, useState } from "react";

interface Props {
  shop: string;
  initial: Shop;
  initialTrackingProviders: string[];
}

export default function ShopEditor({ shop, initial, initialTrackingProviders }: Props) {
  const [info, setInfo] = useState<Shop>(initial);
  const [trackingProviders, setTrackingProviders] = useState<string[]>(
    initialTrackingProviders,
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilters = (e: ChangeEvent<HTMLInputElement>) => {
    setInfo((prev) => ({
      ...prev,
      catalogFilters: e.target.value.split(/,\s*/),
    }));
  };

  const handleMappings = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    try {
      const parsed = JSON.parse(value);
      setInfo((prev) => ({ ...prev, filterMappings: parsed }));
      setErrors((prev) => {
        const { filterMappings, ...rest } = prev;
        return rest;
      });
    } catch {
      setErrors((prev) => ({ ...prev, filterMappings: ["Invalid JSON"] }));
    }
  };

  const handlePriceOverrides = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    try {
      const parsed = JSON.parse(value);
      setInfo((prev) => ({ ...prev, priceOverrides: parsed }));
      setErrors((prev) => {
        const { priceOverrides, ...rest } = prev;
        return rest;
      });
    } catch {
      setErrors((prev) => ({ ...prev, priceOverrides: ["Invalid JSON"] }));
    }
  };

  const handleLocaleOverrides = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    try {
      const parsed = JSON.parse(value);
      setInfo((prev) => ({ ...prev, localeOverrides: parsed }));
      setErrors((prev) => {
        const { localeOverrides, ...rest } = prev;
        return rest;
      });
    } catch {
      setErrors((prev) => ({ ...prev, localeOverrides: ["Invalid JSON"] }));
    }
  };

  const handleTracking = (e: ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
    setTrackingProviders(selected);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries()) as Record<string, string>;
    const parsed = shopSchema.safeParse({
      ...data,
      trackingProviders: fd.getAll("trackingProviders"),
    });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      setSaving(false);
      return;
    }
    const result = await updateShop(shop, fd);
    if (result.errors) {
      setErrors(result.errors);
    } else if (result.shop) {
      setInfo(result.shop);
      setTrackingProviders(fd.getAll("trackingProviders") as string[]);
      setErrors({});
    }
    setSaving(false);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="@container grid max-w-md gap-4 @sm:grid-cols-2"
    >
      <Input type="hidden" name="id" value={info.id} />
      <label className="flex flex-col gap-1">
        <span>Name</span>
        <Input
          className="border p-2"
          name="name"
          value={info.name}
          onChange={handleChange}
        />
        {errors.name && (
          <span className="text-sm text-red-600">{errors.name.join("; ")}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Theme</span>
        <Input
          className="border p-2"
          name="themeId"
          value={info.themeId}
          onChange={handleChange}
        />
        {errors.themeId && (
          <span className="text-sm text-red-600">
            {errors.themeId.join("; ")}
          </span>
        )}
      </label>
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2">
          <Checkbox
            name="enableEditorial"
            checked={info.enableEditorial ?? false}
            onCheckedChange={(v) =>
              setInfo((prev) => ({ ...prev, enableEditorial: Boolean(v) }))
            }
          />
          <span>Enable blog</span>
        </label>
        {errors.enableEditorial && (
          <span className="text-sm text-red-600">
            {errors.enableEditorial.join("; ")}
          </span>
        )}
      </div>
      <fieldset className="col-span-2 flex flex-col gap-1">
        <legend className="text-sm font-medium">Luxury features</legend>
        <div className="mt-2 grid gap-2">
          <label className="flex items-center gap-2">
            <Checkbox
              name="contentMerchandising"
              checked={info.luxuryFeatures.contentMerchandising}
              onCheckedChange={(v) =>
                setInfo((prev) => ({
                  ...prev,
                  luxuryFeatures: {
                    ...prev.luxuryFeatures,
                    contentMerchandising: Boolean(v),
                  },
                }))
              }
            />
            <span>Content merchandising</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              name="raTicketing"
              checked={info.luxuryFeatures.raTicketing}
              onCheckedChange={(v) =>
                setInfo((prev) => ({
                  ...prev,
                  luxuryFeatures: {
                    ...prev.luxuryFeatures,
                    raTicketing: Boolean(v),
                  },
                }))
              }
            />
            <span>RA ticketing</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              name="fraudReview"
              checked={info.luxuryFeatures.fraudReview}
              onCheckedChange={(v) =>
                setInfo((prev) => ({
                  ...prev,
                  luxuryFeatures: {
                    ...prev.luxuryFeatures,
                    fraudReview: Boolean(v),
                  },
                }))
              }
            />
            <span>Fraud review</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              name="strictReturnConditions"
              checked={info.luxuryFeatures.strictReturnConditions}
              onCheckedChange={(v) =>
                setInfo((prev) => ({
                  ...prev,
                  luxuryFeatures: {
                    ...prev.luxuryFeatures,
                    strictReturnConditions: Boolean(v),
                  },
                }))
              }
            />
            <span>Strict return conditions</span>
          </label>
        </div>
      </fieldset>
      <label className="flex flex-col gap-1">
        <span>Catalog Filters (comma separated)</span>
        <Input
          className="border p-2"
          name="catalogFilters"
          value={info.catalogFilters.join(",")}
          onChange={handleFilters}
        />
        {errors.catalogFilters && (
          <span className="text-sm text-red-600">
            {errors.catalogFilters.join("; ")}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Tracking Providers</span>
        <select
          multiple
          name="trackingProviders"
          value={trackingProviders}
          onChange={handleTracking}
          className="border p-2"
        >
          <option value="ups">UPS</option>
          <option value="dhl">DHL</option>
        </select>
        {errors.trackingProviders && (
          <span className="text-sm text-red-600">
            {errors.trackingProviders.join("; ")}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Theme Defaults (JSON)</span>
        <Textarea
          name="themeDefaults"
          defaultValue={JSON.stringify(info.themeDefaults ?? {}, null, 2)}
          readOnly
          rows={4}
        />
        {errors.themeDefaults && (
          <span className="text-sm text-red-600">
            {errors.themeDefaults.join("; ")}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Theme Overrides (JSON)</span>
        <Textarea
          name="themeOverrides"
          defaultValue={JSON.stringify(info.themeOverrides ?? {}, null, 2)}
          readOnly
          rows={4}
        />
        {errors.themeOverrides && (
          <span className="text-sm text-red-600">
            {errors.themeOverrides.join("; ")}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Filter Mappings (JSON)</span>
        <Textarea
          name="filterMappings"
          defaultValue={JSON.stringify(info.filterMappings, null, 2)}
          onChange={handleMappings}
          rows={4}
        />
        {errors.filterMappings && (
          <span className="text-sm text-red-600">
            {errors.filterMappings.join("; ")}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Price Overrides (JSON)</span>
        <Textarea
          name="priceOverrides"
          defaultValue={JSON.stringify(info.priceOverrides ?? {}, null, 2)}
          onChange={handlePriceOverrides}
          rows={4}
        />
        {errors.priceOverrides && (
          <span className="text-sm text-red-600">
            {errors.priceOverrides.join("; ")}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Locale Overrides (JSON)</span>
        <Textarea
          name="localeOverrides"
          defaultValue={JSON.stringify(info.localeOverrides ?? {}, null, 2)}
          onChange={handleLocaleOverrides}
          rows={4}
        />
        {errors.localeOverrides && (
          <span className="text-sm text-red-600">
            {errors.localeOverrides.join("; ")}
          </span>
        )}
      </label>
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
