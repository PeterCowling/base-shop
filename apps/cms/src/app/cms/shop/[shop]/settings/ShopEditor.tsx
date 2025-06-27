// apps/cms/src/app/cms/shop/[shop]/settings/ShopEditor.tsx

"use client";
import { Button, Input, Textarea } from "@/components/atoms-shim";
import { updateShop } from "@cms/actions/shops";
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
    try {
      const parsed = JSON.parse(e.target.value);
      setInfo((prev) => ({ ...prev, themeTokens: parsed }));
    } catch {
      // ignore invalid JSON
    }
  };

  const handleMappings = (e: ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const parsed = JSON.parse(e.target.value);
      setInfo((prev) => ({ ...prev, filterMappings: parsed }));
    } catch {
      // ignore invalid JSON
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("id", info.id);
    fd.append("name", info.name);
    fd.append("themeId", info.themeId);
    fd.append("catalogFilters", info.catalogFilters.join(","));
    fd.append("themeTokens", JSON.stringify(info.themeTokens));
    fd.append("filterMappings", JSON.stringify(info.filterMappings));
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
      {Object.keys(errors).length > 0 && (
        <div className="text-sm text-red-600">
          {Object.entries(errors).map(([k, v]) => (
            <p key={k}>{v.join("; ")}</p>
          ))}
        </div>
      )}
      <Input type="hidden" name="id" value={info.id} />
      <Input type="hidden" name="id" value={info.id} />
      <label className="flex flex-col gap-1">
        <span>Name</span>
        <Input
          className="border p-2"
          name="name"
          value={info.name}
          onChange={handleChange}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Theme</span>
        <Input
          className="border p-2"
          name="themeId"
          value={info.themeId}
          onChange={handleChange}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Catalog Filters (comma separated)</span>
        <Input
          className="border p-2"
          name="catalogFilters"
          value={info.catalogFilters.join(",")}
          onChange={handleFilters}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Theme Tokens (JSON)</span>
        <Textarea
          name="themeTokens"
          defaultValue={JSON.stringify(info.themeTokens, null, 2)}
          onChange={handleTokens}
          rows={4}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Filter Mappings (JSON)</span>
        <Textarea
          name="filterMappings"
          defaultValue={JSON.stringify(info.filterMappings, null, 2)}
          onChange={handleMappings}
          rows={4}
        />
      </label>
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
