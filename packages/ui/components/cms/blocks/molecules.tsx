"use client";

import type { Locale } from "@/i18n/locales";
import type { CategoryCollectionTemplateProps } from "../../templates/CategoryCollectionTemplate";
import { CategoryCollectionTemplate } from "../../templates/CategoryCollectionTemplate";

export function NewsletterForm({
  action = "#",
  method = "post",
  placeholder = {},
  submitLabel = {},
  locale = "en",
}: {
  action?: string;
  method?: string;
  placeholder?: string | Record<Locale, string>;
  submitLabel?: string | Record<Locale, string>;
  locale?: Locale;
}) {
  const ph =
    typeof placeholder === "string"
      ? placeholder
      : (placeholder?.[locale] ?? "");
  const label =
    typeof submitLabel === "string"
      ? submitLabel
      : (submitLabel?.[locale] ?? "");
  return (
    <form action={action} method={method} className="flex gap-2">
      <input
        type="email"
        name="email"
        placeholder={ph}
        className="flex-1 rounded border p-2"
      />
      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-white"
      >
        {label}
      </button>
    </form>
  );
}

export function PromoBanner({
  text = {},
  href,
  buttonLabel = {},
  locale = "en",
}: {
  text?: string | Record<Locale, string>;
  href?: string;
  buttonLabel?: string | Record<Locale, string>;
  locale?: Locale;
}) {
  const txt = typeof text === "string" ? text : (text?.[locale] ?? "");
  const label =
    typeof buttonLabel === "string"
      ? buttonLabel
      : (buttonLabel?.[locale] ?? "");
  return (
    <div className="flex items-center justify-between bg-gray-900 p-4 text-white">
      <span>{txt}</span>{" "}
      {href && (
        <a href={href} className="rounded bg-white px-3 py-1 text-gray-900">
          {label}
        </a>
      )}
    </div>
  );
}

export function CategoryList({
  categories = [],
  columns = 3,
}: CategoryCollectionTemplateProps) {
  if (!categories.length) return null;
  return (
    <CategoryCollectionTemplate categories={categories} columns={columns} />
  );
}

export const moleculeRegistry = {
  NewsletterForm,
  PromoBanner,
  CategoryList,
} as const;
export type MoleculeBlockType = keyof typeof moleculeRegistry;
