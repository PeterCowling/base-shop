// src/molecules/index.tsx
"use client";

import { memo, useState } from "react";

import { useTranslations } from "@acme/i18n";
import type { Locale } from "@acme/i18n/locales";

import { Inline } from "../../atoms/primitives";
import type { CategoryCollectionTemplateProps } from "../../templates/CategoryCollectionTemplate";
import { CategoryCollectionTemplate } from "../../templates/CategoryCollectionTemplate";

import type { BlockRegistryEntry } from "./types";

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
  action = "/api/leads",
  method = "post",
  placeholder = "",
  submitLabel = "",
  locale = "en",
}: NewsletterFormProps) {
  const t = useTranslations();
  const ph = typeof placeholder === "string" ? placeholder : (placeholder[locale] ?? "");

  const label =
    typeof submitLabel === "string" ? submitLabel : (submitLabel[locale] ?? "");

  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      if (!value) {
        setMessage(String(t("newsletter.submit.error")));
        return;
      }
      const res = await fetch(action, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "newsletter", email: value, locale, source: "footer" }),
      });
      if (res.ok) {
        setMessage(String(t("newsletter.submit.success")));
        setValue("");
      } else {
        setMessage(String(t("newsletter.submit.error")));
      }
    } catch {
      setMessage(String(t("newsletter.submit.error")));
    }
  }

  return (
    <form
      action={action}
      method={method}
      className=""
      onSubmit={handleSubmit}
    >
      <Inline gap={2}>
        <input
          type="email"
          name="email"
          placeholder={ph}
          // i18n-exempt: CSS utility classes, not user copy
          className="flex-1 rounded border p-2"
          data-token="--color-bg"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          type="submit"
          // i18n-exempt: CSS utility classes, not user copy
          className="rounded bg-primary px-4 py-2 text-primary-fg min-h-10 min-w-10"
          data-token={"--color-primary" /* i18n-exempt: token name */}
        >
          <span data-token={"--color-primary-fg" /* i18n-exempt: token name */}>{label}</span>
        </button>
      </Inline>
      {message && <p role="status">{message}</p>}
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
    <div className="bg-fg p-4 text-bg">
      <Inline alignY="center" className="justify-between">
      <span>{txt}</span>
      {href && (
        <a href={href} className="rounded bg-bg px-3 py-1 text-fg min-h-10 min-w-10">
          {label}
        </a>
      )}
      </Inline>
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

type MoleculeRegistry = {
  -readonly [K in keyof typeof moleculeEntries]: BlockRegistryEntry<unknown>;
};

export const moleculeRegistry: MoleculeRegistry = Object.entries(
  moleculeEntries,
).reduce((acc, [k, v]) => {
  const entry = v as unknown as BlockRegistryEntry<unknown>;
  acc[k as keyof typeof moleculeEntries] = {
    previewImage: defaultPreview,
    ...entry,
  };
  return acc;
}, {} as MoleculeRegistry);

export type MoleculeBlockType = keyof typeof moleculeEntries;
