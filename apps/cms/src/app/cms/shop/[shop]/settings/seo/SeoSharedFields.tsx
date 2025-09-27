"use client";

import { Input, Textarea } from "@/components/atoms/shadcn";
import { useTranslations } from "@acme/i18n";

import type { SeoData } from "./useSeoEditor";

interface SeoSharedFieldsProps {
  draft: SeoData;
  updateField(field: keyof SeoData, value: string): void;
  errorFor(field: keyof SeoData): string;
}

export function SeoSharedFields({ draft, updateField, errorFor }: SeoSharedFieldsProps) {
  const t = useTranslations();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("cms.seo.title")}</span>
        <Input
          value={draft.title}
          onChange={(event) => updateField("title", event.target.value)}
        />
        {errorFor("title") && (
          <span className="text-xs text-destructive">{errorFor("title")}</span>
        )}
      </label>
      <label className="flex flex-col gap-2 sm:col-span-2">
        <span className="text-sm font-medium">{t("cms.seo.description")}</span>
        <Textarea
          rows={3}
          value={draft.description}
          onChange={(event) => updateField("description", event.target.value)}
        />
        {errorFor("description") && (
          <span className="text-xs text-destructive">{errorFor("description")}</span>
        )}
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("cms.seo.imageUrl")}</span>
        <Input
          value={draft.image}
          onChange={(event) => updateField("image", event.target.value)}
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("cms.seo.imageAltText")}</span>
        <Input
          value={draft.alt}
          onChange={(event) => updateField("alt", event.target.value)}
        />
      </label>
    </div>
  );
}
