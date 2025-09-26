"use client";

import { Tooltip } from "@/components/atoms";
import { Input, Textarea } from "@/components/atoms/shadcn";
import type { Locale } from "@acme/types";
import { cn } from "@ui/utils/style";
import type { ChangeEvent } from "react";
import type { SeoRecord } from "./useSeoForm";

interface Props {
  languages: readonly Locale[];
  locale: Locale;
  onLocaleChange(locale: Locale): void;
  seo: Record<string, SeoRecord>;
  onFieldChange(field: keyof SeoRecord, value: string): void;
  titleLimit: number;
  descLimit: number;
  baseLocale?: Locale;
}

export default function SeoLanguageTabs({
  languages,
  locale,
  onLocaleChange,
  seo,
  onFieldChange,
  titleLimit,
  descLimit,
  baseLocale,
}: Props) {
  const base = baseLocale ?? languages[0];
  const current = seo[locale];
  return (
    <div className="space-y-4">
      {languages.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {languages.map((l) => {
            const isSelected = l === locale;
            const inherited = l !== base && !seo[l];
            return (
              <button
                key={l}
                type="button"
                onClick={() => onLocaleChange(l)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs font-medium",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-fg hover:bg-muted/80",
                  inherited && "opacity-50"
                )}
              >
                {l.toUpperCase()}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Meta ------------------------------------------------------- */}
        <section className="flex flex-col gap-3">
          <h3 className="font-medium">Meta</h3>
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1">
              Title
              <Tooltip text="Recommended ≤ 70 characters">?</Tooltip>
              <span className="text-muted-foreground ms-auto text-xs">
                {current.title.length}/{titleLimit}
              </span>
            </span>
            <Input
              value={current.title}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onFieldChange("title", e.target.value)
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1">
              Description
              <Tooltip text="Recommended ≤ 160 characters">?</Tooltip>
              <span className="text-muted-foreground ms-auto text-xs">
                {current.description.length}/{descLimit}
              </span>
            </span>
            <Textarea
              rows={3}
              value={current.description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                onFieldChange("description", e.target.value)
              }
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
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onFieldChange("title", e.target.value)
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Description</span>
            <Textarea
              rows={3}
              value={current.description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                onFieldChange("description", e.target.value)
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Image URL</span>
            <Input
              value={current.image}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onFieldChange("image", e.target.value)
              }
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
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onFieldChange("title", e.target.value)
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Description</span>
            <Textarea
              rows={3}
              value={current.description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                onFieldChange("description", e.target.value)
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Image URL</span>
            <Input
              value={current.image}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onFieldChange("image", e.target.value)
              }
            />
          </label>
        </section>

        {/* Structured Data -------------------------------------------- */}
        <section className="flex flex-col gap-3">
          <h3 className="font-medium">Structured Data</h3>
          <label className="flex flex-col gap-1">
            <span>Brand</span>
            <Input
              value={current.brand}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onFieldChange("brand", e.target.value)
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Offers (JSON)</span>
            <Textarea
              rows={3}
              value={current.offers}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                onFieldChange("offers", e.target.value)
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Aggregate Rating (JSON)</span>
            <Textarea
              rows={3}
              value={current.aggregateRating}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                onFieldChange("aggregateRating", e.target.value)
              }
            />
          </label>
        </section>
      </div>
    </div>
  );
}
