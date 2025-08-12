"use client";

import { Button, Input } from "@/components/atoms/shadcn";
import { formatTimestamp } from "@acme/date-utils";
import { updateAiCatalog } from "@cms/actions/shops.server";
import { FormEvent, useState } from "react";

const ALL_FIELDS = ["id", "title", "description", "price", "images"] as const;

interface Props {
  shop: string;
  initialFields: string[];
  initialPageSize: number;
  lastCrawl?: string;
}

export default function AiCatalogForm({
  shop,
  initialFields,
  initialPageSize,
  lastCrawl,
}: Props) {
  const [fields, setFields] = useState<string[]>(initialFields);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [saving, setSaving] = useState(false);

  const toggle = (f: string) => {
    setFields((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("fields", fields.join(","));
    fd.append("pageSize", String(pageSize));
    await updateAiCatalog(shop, fd);
    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h3 className="text-lg font-medium">AI Catalog Feed</h3>
      <p className="text-sm text-muted-foreground">
        Last crawl: {lastCrawl ? formatTimestamp(lastCrawl) : "Never"}
      </p>
      <div className="space-y-2">
        {ALL_FIELDS.map((f) => (
          <label key={f} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={fields.includes(f)}
              onChange={() => toggle(f)}
            />
            <span>{f}</span>
          </label>
        ))}
      </div>
      <label className="flex flex-col gap-1">
        <span>Page Size</span>
        <Input
          type="number"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        />
      </label>
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
