"use client";

import { type FormEvent, useCallback, useState } from "react";
import { updateSeo } from "@cms/actions/shops.server";

import type { Locale } from "@acme/types";

export interface SeoRecord {
  title: string;
  description: string;
  image: string;
  brand: string;
  offers: string;
  aggregateRating: string;
  structuredData: string;
}

interface Options {
  shop: string;
  languages: readonly Locale[];
  initialSeo: Record<string, Partial<SeoRecord>>;
  baseLocale?: Locale;
}

export interface SeoFormState {
  locale: Locale;
  setLocale: (l: Locale) => void;
  seo: Record<string, SeoRecord>;
  baseLocale: Locale;
  handleChange: (field: keyof SeoRecord, value: string) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  saving: boolean;
  errors: Record<string, string[]>;
  warnings: string[];
}

export function useSeoForm({
  shop,
  languages,
  initialSeo,
  baseLocale,
}: Options): SeoFormState {
  const base = baseLocale ?? languages[0];
  const [locale, setLocale] = useState<Locale>(languages[0]);
  const [seo, setSeo] = useState<Record<string, SeoRecord>>(() => {
    const records: Record<string, SeoRecord> = {};
    languages.forEach((l) => {
      records[l] = {
        title: initialSeo[l]?.title ?? "",
        description: initialSeo[l]?.description ?? "",
        image: initialSeo[l]?.image ?? "",
        brand: initialSeo[l]?.brand ?? "",
        offers: initialSeo[l]?.offers ?? "",
        aggregateRating: initialSeo[l]?.aggregateRating ?? "",
        structuredData: initialSeo[l]?.structuredData ?? "",
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

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSaving(true);
      const data = seo[locale];
      const fd = new FormData();
      fd.append("locale", locale);
      fd.append("title", data.title);
      fd.append("description", data.description);
      fd.append("image", data.image);
      fd.append("brand", data.brand);
      fd.append("offers", data.offers);
      fd.append("aggregateRating", data.aggregateRating);
      fd.append("structuredData", data.structuredData);
      const result = await updateSeo(shop, fd);
      if (result.errors) {
        setErrors(result.errors);
      } else {
        setErrors({});
        setWarnings(result.warnings ?? []);
      }
      setSaving(false);
    },
    [seo, locale, shop]
  );

  return {
    locale,
    setLocale,
    seo,
    baseLocale: base,
    handleChange,
    handleSubmit,
    saving,
    errors,
    warnings,
  };
}

export default useSeoForm;
