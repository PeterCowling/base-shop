"use client";

import { Tooltip } from "@/components/atoms";
import { Button, Input, Textarea } from "@/components/atoms-shim";
import { updateSeo } from "@cms/actions/shops";
import type { Locale } from "@types";
import { FormEvent, useCallback, useState } from "react";
import SeoLanguageTabs from "./SeoLanguageTabs";

interface SeoRecord {
  title: string;
  description: string;
  image: string;
}

interface Props {
  shop: string;
  languages: readonly Locale[];
  initialSeo: Record<string, Partial<SeoRecord>>;
  baseLocale?: Locale;
}

const TITLE_LIMIT = 70;
const DESC_LIMIT = 160;

export default function SeoForm({
  shop,
  languages,
  initialSeo,
  baseLocale,
}: Props) {
  const base = baseLocale ?? languages[0];
  const [locale, setLocale] = useState<Locale>(languages[0]);
  const [seo, setSeo] = useState<Record<string, SeoRecord>>(() => {
    const records: Record<string, SeoRecord> = {};
    languages.forEach((l) => {
      records[l] = {
        title: initialSeo[l]?.title ?? "",
        description: initialSeo[l]?.description ?? "",
        image: initialSeo[l]?.image ?? "",
      };
    });
    return records;
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleChange = useCallback(
    (field: keyof SeoRecord, value: string) => {
      setSeo((prev) => ({
        ...prev,
        [locale]: {
          ...prev[locale],
          [field]: value,
        },
      }));
    },
    [locale]
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const data = seo[locale];
    const fd = new FormData();
    fd.append("locale", locale);
    fd.append("title", data.title);
    fd.append("description", data.description);
    fd.append("image", data.image);
    const result = await updateSeo(shop, fd);
    if (result.errors) {
      setErrors(result.errors);
    } else {
      setErrors({});
      setWarnings(result.warnings ?? []);
    }
    setSaving(false);
  };

  const current = seo[locale];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <SeoLanguageTabs
        languages={languages}
        value={locale}
        onChange={setLocale}
        seo={seo}
        baseLocale={base}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Meta ------------------------------------------------------- */}
        <section className="flex flex-col gap-3">
          <h3 className="font-medium">Meta</h3>
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1">
              Title
              <Tooltip text="Recommended ≤ 70 characters">?</Tooltip>
              <span className="text-muted-foreground ml-auto text-xs">
                {current.title.length}/{TITLE_LIMIT}
              </span>
            </span>
            <Input
              value={current.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1">
              Description
              <Tooltip text="Recommended ≤ 160 characters">?</Tooltip>
              <span className="text-muted-foreground ml-auto text-xs">
                {current.description.length}/{DESC_LIMIT}
              </span>
            </span>
            <Textarea
              rows={3}
              value={current.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </label>
        </section>

        {/* Open Graph ------------------------------------------------- */}
        <section className="flex flex-col gap-3">
          <h3 className="font-medium">Open Graph</h3>
          <label className="flex flex-col gap-1">
            <span>Title</span>
            <Input
              value={current.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Description</span>
            <Textarea
              rows={3}
              value={current.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Image URL</span>
            <Input
              value={current.image}
              onChange={(e) => handleChange("image", e.target.value)}
            />
          </label>
        </section>

        {/* Twitter ---------------------------------------------------- */}
        <section className="flex flex-col gap-3">
          <h3 className="font-medium">Twitter</h3>
          <label className="flex flex-col gap-1">
            <span>Title</span>
            <Input
              value={current.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Description</span>
            <Textarea
              rows={3}
              value={current.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Image URL</span>
            <Input
              value={current.image}
              onChange={(e) => handleChange("image", e.target.value)}
            />
          </label>
        </section>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="text-sm text-red-600">
          {Object.entries(errors).map(([k, v]) => (
            <p key={k}>{v.join("; ")}</p>
          ))}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="text-sm text-yellow-700">
          {warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}

      <Button type="submit" disabled={saving} className="w-fit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
