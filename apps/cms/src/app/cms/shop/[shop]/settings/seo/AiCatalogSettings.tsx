"use client";

import { useState, type FormEvent } from "react";
import { Button, Checkbox, Input } from "@/components/atoms/shadcn";
import { updateAiCatalog } from "@cms/actions/shops.server";
import { formatTimestamp } from "@acme/date-utils";
import type { AiCatalogField } from "@acme/types";

const ALL_FIELDS: AiCatalogField[] = [
  "id",
  "title",
  "description",
  "price",
  "media",
];

interface Props {
  shop: string;
  initial: { enabled: boolean; fields: AiCatalogField[]; pageSize: number; lastCrawl?: string };
}

export default function AiCatalogSettings({ shop, initial }: Props) {
  const [state, setState] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const toggleField = (field: AiCatalogField) => {
    setState((s) => ({
      ...s,
      fields: s.fields.includes(field)
        ? s.fields.filter((f) => f !== field)
        : [...s.fields, field],
    }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const result = await updateAiCatalog(shop, fd);
    if (result.errors) {
      setErrors(result.errors);
    } else if (result.settings?.seo?.aiCatalog) {
      setState((s) => ({
        ...s,
        enabled: result.settings!.seo!.aiCatalog!.enabled,
        fields: result.settings!.seo!.aiCatalog!.fields,
        pageSize: result.settings!.seo!.aiCatalog!.pageSize,
      }));
      setErrors({});
    }
    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="grid max-w-md gap-4">
      <label className="flex items-center gap-2">
        <Checkbox
          name="enabled"
          checked={state.enabled}
          onCheckedChange={(v) => setState((s) => ({ ...s, enabled: Boolean(v) }))}
        />
        <span>Enable AI catalog feed</span>
      </label>
      <div className="flex flex-col gap-2">
        <span>Fields</span>
        {ALL_FIELDS.map((f) => (
          <label key={f} className="flex items-center gap-2">
            <Checkbox
              name="fields"
              value={f}
              checked={state.fields.includes(f)}
              onCheckedChange={() => toggleField(f)}
            />
            <span>{f}</span>
          </label>
        ))}
        {errors.fields && (
          <span className="text-sm text-red-600">{errors.fields.join("; ")}</span>
        )}
      </div>
      <label className="flex flex-col gap-1">
        <span>Page size</span>
        <Input
          type="number"
          name="pageSize"
          value={state.pageSize}
          onChange={(e) =>
            setState((s) => ({ ...s, pageSize: Number(e.target.value) }))
          }
        />
        {errors.pageSize && (
          <span className="text-sm text-red-600">
            {errors.pageSize.join("; ")}
          </span>
        )}
      </label>
      {state.lastCrawl && (
        <p className="text-sm text-gray-600">
          Last crawl: {formatTimestamp(state.lastCrawl)}
        </p>
      )}
      <Button className="bg-primary text-white" type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
