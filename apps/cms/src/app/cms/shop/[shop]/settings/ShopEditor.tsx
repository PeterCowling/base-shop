// apps/cms/src/app/cms/shop/[shop]/settings/ShopEditor.tsx

"use client";
import { Button, Input, Textarea } from "@/components/atoms-shadcn";
import { updateShop } from "@cms/actions/shops.server";
import { shopSchema } from "@cms/actions/schemas";
import type { Shop } from "@types";
import { ChangeEvent, FormEvent, useState } from "react";

interface Props {
  shop: string;
  initial: Shop;
}

export default function ShopEditor({ shop, initial }: Props) {
  const [info, setInfo] = useState<Shop>(initial);
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

  const handleTokens = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    try {
      const parsed = JSON.parse(value);
      setInfo((prev) => ({ ...prev, themeTokens: parsed }));
      setErrors((prev) => {
        const { themeTokens, ...rest } = prev;
        return rest;
      });
    } catch {
      setErrors((prev) => ({ ...prev, themeTokens: ["Invalid JSON"] }));
    }
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

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries()) as Record<string, string>;
    const parsed = shopSchema.safeParse(data);
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
        <span>Theme Tokens (JSON)</span>
        <Textarea
          name="themeTokens"
          defaultValue={JSON.stringify(info.themeTokens, null, 2)}
          onChange={handleTokens}
          rows={4}
        />
        {errors.themeTokens && (
          <span className="text-sm text-red-600">
            {errors.themeTokens.join("; ")}
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
