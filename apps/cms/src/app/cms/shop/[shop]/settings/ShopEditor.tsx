// apps/cms/src/app/cms/shop/[shop]/settings/ShopEditor.tsx

"use client";
import { updateShop } from "@cms/actions/shops";
import type { Shop } from "@types";
import { Textarea } from "@ui/components/ui/textarea";
import { ChangeEvent, FormEvent, useState } from "react";

interface Props {
  shop: string;
  initial: Shop;
}

export default function ShopEditor({ shop, initial }: Props) {
  const [info, setInfo] = useState<Shop>(initial);
  const [saving, setSaving] = useState(false);

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
    const updated = await updateShop(shop, fd);
    setInfo(updated);
    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="grid max-w-md gap-4">
      <input type="hidden" name="id" value={info.id} />
      <label className="flex flex-col gap-1">
        <span>Name</span>
        <input
          className="border p-2"
          name="name"
          value={info.name}
          onChange={handleChange}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Theme</span>
        <input
          className="border p-2"
          name="themeId"
          value={info.themeId}
          onChange={handleChange}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Catalog Filters (comma separated)</span>
        <input
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
      <button
        className="bg-primary rounded px-4 py-2 text-sm text-white"
        disabled={saving}
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
