// src/molecules/index.tsx
"use client";

import type { Locale } from "@/i18n/locales";
import { memo } from "react";
import type { BlockRegistryEntry } from "./types";
import type { CategoryCollectionTemplateProps } from "../../templates/CategoryCollectionTemplate";
import { CategoryCollectionTemplate } from "../../templates/CategoryCollectionTemplate";

const defaultPreview = "/window.svg";

/* ──────────────────────────────────────────────────────────────────────────
 * NewsletterForm
 * --------------------------------------------------------------------------*/
export interface NewsletterFormProps {
  action?: string;
  method?: string;
  placeholder?: string | Record<Locale, string>;
  submitLabel?: string | Record<Locale, string>;
  locale?: Locale;
}

export const NewsletterForm = memo(function NewsletterForm({
  action = "#",
  method = "post",
  placeholder = "",
  submitLabel = "",
  locale = "en",
}: NewsletterFormProps) {
  const ph =
    typeof placeholder === "string" ? placeholder : (placeholder[locale] ?? "");

  const label =
    typeof submitLabel === "string" ? submitLabel : (submitLabel[locale] ?? "");

  return (
    <form action={action} method={method} className="flex gap-2">
      <input
        type="email"
        name="email"
        placeholder={ph}
        className="flex-1 rounded border p-2"
        data-token="--color-bg"
      />
      <button
        type="submit"
        className="rounded bg-primary px-4 py-2 text-primary-fg"
        data-token="--color-primary"
      >
        <span data-token="--color-primary-fg">{label}</span>
      </button>
    </form>
  );
});

/* ──────────────────────────────────────────────────────────────────────────
 * PromoBanner
 * --------------------------------------------------------------------------*/
export interface PromoBannerProps {
  text?: string | Record<Locale, string>;
  href?: string;
  buttonLabel?: string | Record<Locale, string>;
  locale?: Locale;
}

export const PromoBanner = memo(function PromoBanner({
  text = "",
  href,
  buttonLabel = "",
  locale = "en",
}: PromoBannerProps) {
  const txt = typeof text === "string" ? text : (text[locale] ?? "");

  const label =
    typeof buttonLabel === "string" ? buttonLabel : (buttonLabel[locale] ?? "");

  return (
    <div className="flex items-center justify-between bg-fg p-4 text-bg">
      <span>{txt}</span>
      {href && (
        <a href={href} className="rounded bg-bg px-3 py-1 text-fg">
          {label}
        </a>
      )}
    </div>
  );
});

/* ──────────────────────────────────────────────────────────────────────────
 * CategoryList
 * --------------------------------------------------------------------------*/
export const CategoryList = memo(function CategoryList({
  categories = [],
  columns = 3,
}: CategoryCollectionTemplateProps) {
  if (!categories.length) return null;
  return (
    <CategoryCollectionTemplate categories={categories} columns={columns} />
  );
});

/* ──────────────────────────────────────────────────────────────────────────
 * Molecule registry
 * --------------------------------------------------------------------------*/
const moleculeEntries = {
  NewsletterForm: { component: NewsletterForm },
  PromoBanner: { component: PromoBanner },
  CategoryList: { component: CategoryList },
} as const;

export const moleculeRegistry = Object.fromEntries(
  Object.entries(moleculeEntries).map(([k, v]) => [
    k,
    { previewImage: defaultPreview, ...v },
  ]),
) as typeof moleculeEntries satisfies Record<string, BlockRegistryEntry<any>>;

export type MoleculeBlockType = keyof typeof moleculeEntries;
