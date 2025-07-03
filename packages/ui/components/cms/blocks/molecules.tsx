"use client";

import type { CategoryCollectionTemplateProps } from "../../templates/CategoryCollectionTemplate";
import { CategoryCollectionTemplate } from "../../templates/CategoryCollectionTemplate";

export function NewsletterForm({
  action = "#",
  method = "post",
  placeholder = "Email address",
  submitLabel = "Subscribe",
}: {
  action?: string;
  method?: string;
  placeholder?: string;
  submitLabel?: string;
}) {
  return (
    <form action={action} method={method} className="flex gap-2">
      <input
        type="email"
        name="email"
        placeholder={placeholder}
        className="flex-1 rounded border p-2"
      />
      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-white"
      >
        {submitLabel}
      </button>
    </form>
  );
}

export function PromoBanner({
  text = "",
  href,
  buttonLabel = "Shop now",
}: {
  text?: string;
  href?: string;
  buttonLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between bg-gray-900 p-4 text-white">
      <span>{text}</span>
      {href && (
        <a href={href} className="rounded bg-white px-3 py-1 text-gray-900">
          {buttonLabel}
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
