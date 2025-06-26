// apps/cms/src/app/cms/shop/[shop]/settings/ShopEditor.tsx

"use client";
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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("id", info.id);
    fd.append("name", info.name);
    fd.append("themeId", info.themeId);
    fd.append("catalogFilters", info.catalogFilters.join(","));
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
      <button
        className="bg-primary rounded px-4 py-2 text-sm text-white"
        disabled={saving}
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
