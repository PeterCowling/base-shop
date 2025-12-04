"use client";

import { Tooltip } from "@/components/atoms";
import { Input, Textarea } from "@/components/atoms/shadcn";
import { useTranslations } from "@acme/i18n";

import type { SeoData } from "./useSeoEditor";

interface SeoAdvancedSettingsProps {
  open: boolean;
  onToggle(): void;
  draft: SeoData;
  updateField(field: keyof SeoData, value: string): void;
}

export function SeoAdvancedSettings({
  open,
  onToggle,
  draft,
  updateField,
}: SeoAdvancedSettingsProps) {
  const t = useTranslations();
  let preview: Record<string, unknown> | unknown[] | undefined;
  let previewError: string | undefined;
  if (draft.structuredData) {
    try {
      preview = JSON.parse(draft.structuredData);
    } catch {
      previewError = t("Structured data is not valid JSON") as string;
    }
  } else if (draft.brand || draft.offers || draft.aggregateRating) {
    const obj: Record<string, unknown> = {};
    if (draft.brand) {
      try {
        obj.brand = JSON.parse(draft.brand);
      } catch {
        obj.brand = draft.brand;
      }
    }
    if (draft.offers) {
      try {
        obj.offers = JSON.parse(draft.offers);
      } catch {
        obj.offers = draft.offers;
      }
    }
    if (draft.aggregateRating) {
      try {
        obj.aggregateRating = JSON.parse(draft.aggregateRating);
      } catch {
        obj.aggregateRating = draft.aggregateRating;
      }
    }
    preview = obj;
  }
  return (
    <div className="space-y-3">
      <button
        type="button"
        className="inline-flex items-center min-h-10 min-w-10 px-2 text-sm font-medium text-link"
        aria-expanded={open}
        onClick={onToggle}
      >
        {open ? t("Hide advanced settings") : t("Show advanced settings")}
      </button>
      {open && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              {t("Canonical Base")}
              <Tooltip text={t("Base URL used to build canonical links.")}>?</Tooltip>
            </span>
            <Input
              value={draft.canonicalBase}
              onChange={(event) => updateField("canonicalBase", event.target.value)}
            />
          </label>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            {t("Structured data should be a Product or WebPage JSON-LD object with @context and @type.")}
          </p>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t("Open Graph URL")}</span>
            <Input
              value={draft.ogUrl}
              onChange={(event) => updateField("ogUrl", event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t("Twitter Card")}</span>
            <Input
              value={draft.twitterCard}
              onChange={(event) => updateField("twitterCard", event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t("Brand (JSON)")} </span>
            <Input
              value={draft.brand ?? ""}
              onChange={(event) => updateField("brand", event.target.value)}
              placeholder={t('e.g. {"@type":"Brand","name":"Acme"}') as string}
            />
          </label>
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-sm font-medium">{t("Offers JSON")}</span>
            <Textarea
              rows={2}
              value={draft.offers ?? ""}
              onChange={(event) => updateField("offers", event.target.value)}
              placeholder={t('{"@type":"Offer","price":10,"priceCurrency":"USD"}') as string}
            />
          </label>
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-sm font-medium">{t("Aggregate Rating JSON")}</span>
            <Textarea
              rows={2}
              value={draft.aggregateRating ?? ""}
              onChange={(event) => updateField("aggregateRating", event.target.value)}
              placeholder={t('{"@type":"AggregateRating","ratingValue":4.5,"reviewCount":120}') as string}
            />
          </label>
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-sm font-medium">
              {t("Structured Data (overrides JSON)")}
            </span>
            <Textarea
              rows={4}
              value={draft.structuredData ?? ""}
              onChange={(event) => updateField("structuredData", event.target.value)}
              placeholder={t("Paste full JSON-LD object to override") as string}
            />
          </label>
          {previewError && (
            <p className="text-xs text-destructive">{previewError}</p>
          )}
          {preview && !previewError && (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground mb-1">{t("Preview JSON-LD")}</p>
              <pre className="max-h-64 overflow-auto rounded bg-muted p-3 text-xs">
                {JSON.stringify(preview, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
