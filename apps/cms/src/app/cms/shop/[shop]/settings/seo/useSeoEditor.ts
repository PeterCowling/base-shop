"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { useTranslations } from "@acme/i18n/Translations";
import en from "@acme/i18n/en.json";

import {
  generateSeo as runGenerateSeo,
  setFreezeTranslations,
  updateSeo,
} from "@cms/actions/shops.server";
import type { Locale } from "@acme/types";

export interface SeoData {
  title?: string;
  description?: string;
  image?: string;
  alt?: string;
  canonicalBase?: string;
  ogUrl?: string;
  twitterCard?: string;
  // Structured data helpers captured as JSON strings
  brand?: string;
  offers?: string;
  aggregateRating?: string;
  structuredData?: string;
}

export interface UseSeoEditorProps {
  shop: string;
  languages: readonly Locale[];
  initialSeo: Partial<Record<string, SeoData>>;
  initialFreeze?: boolean;
}

type SharedField =
  | "title"
  | "description"
  | "image"
  | "alt"
  | "ogUrl"
  | "twitterCard";

const SHARED_FIELDS: readonly SharedField[] = [
  "title",
  "description",
  "image",
  "alt",
  "ogUrl",
  "twitterCard",
];

const SHARED_SET = new Set<SharedField>(SHARED_FIELDS);

const EMPTY_DRAFT: SeoData = {
  title: "",
  description: "",
  image: "",
  alt: "",
  canonicalBase: "",
  ogUrl: "",
  twitterCard: "",
  brand: "",
  offers: "",
  aggregateRating: "",
  structuredData: "",
};

const pickShared = (data: SeoData | undefined) => ({
  title: data?.title ?? "",
  description: data?.description ?? "",
  image: data?.image ?? "",
  alt: data?.alt ?? "",
  ogUrl: data?.ogUrl ?? "",
  twitterCard: data?.twitterCard ?? "",
});

const buildDraft = (
  locale: Locale,
  initial: Partial<Record<string, SeoData>>,
): SeoData => ({
  ...EMPTY_DRAFT,
  ...initial[locale],
});

type SubmitResult = {
  status: "error" | "success" | "warning";
  message: string;
  warnings?: string[];
};

type GenerateResult = {
  status: "error" | "success";
  message: string;
};

export function useSeoEditor({
  shop,
  languages,
  initialSeo,
  initialFreeze = false,
}: UseSeoEditorProps) {
  const tFromContext = useTranslations();
  // Ensure readable strings in tests even without a provider
  const t = useCallback((key: string) => {
    const out = tFromContext(key) as unknown as string;
    return out === key ? (en as Record<string, string>)[key] ?? key : out;
  }, [tFromContext]);
  const initialDrafts = useMemo(
    () =>
      languages.reduce((acc, lang) => {
        acc[lang] = buildDraft(lang, initialSeo);
        return acc;
      }, {} as Record<Locale, SeoData>),
    [initialSeo, languages],
  );

  const [locale, setLocale] = useState<Locale>(languages[0]);
  const [drafts, setDrafts] = useState<Record<Locale, SeoData>>(
    () => initialDrafts,
  );
  const [shared, setShared] = useState(() => pickShared(initialDrafts[languages[0]]));
  const [freeze, setFreeze] = useState(initialFreeze);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [warnings, setWarnings] = useState<string[]>([]);

  const currentDraft = drafts[locale] ?? buildDraft(locale, initialSeo);

  const updateField = useCallback(
    (field: keyof SeoData, value: string) => {
      setDrafts((prev) => {
        const next = { ...prev };
        if (freeze && SHARED_SET.has(field as SharedField)) {
          languages.forEach((lang) => {
            const base = next[lang] ?? buildDraft(lang, initialSeo);
            next[lang] = { ...base, [field]: value };
          });
        } else {
          const base = next[locale] ?? buildDraft(locale, initialSeo);
          next[locale] = { ...base, [field]: value };
        }
        return next;
      });
      if (SHARED_SET.has(field as SharedField)) {
        setShared((prev) => ({ ...prev, [field]: value }));
      }
    },
    [freeze, initialSeo, languages, locale],
  );

  const handleLocaleChange = useCallback(
    (nextLocale: Locale) => {
      setLocale(nextLocale);
      if (freeze) {
        setDrafts((prev) => {
          const next = { ...prev };
          const base = next[nextLocale] ?? buildDraft(nextLocale, initialSeo);
          next[nextLocale] = { ...base, ...shared };
          return next;
        });
      }
      setErrors({});
      setWarnings([]);
    },
    [freeze, initialSeo, shared],
  );

  const handleFreezeChange = useCallback(
    async (checked: boolean) => {
      setFreeze(checked);
      await setFreezeTranslations(shop, checked);
      if (checked) {
        const sharedValues = pickShared(currentDraft);
        setShared(sharedValues);
        setDrafts((prev) => {
          const next = { ...prev };
          languages.forEach((lang) => {
            const base = next[lang] ?? buildDraft(lang, initialSeo);
            next[lang] = { ...base, ...sharedValues };
          });
          return next;
        });
      }
    },
    [currentDraft, initialSeo, languages, shop],
  );

  const submit = useCallback(
    async (event?: FormEvent<HTMLFormElement>): Promise<SubmitResult> => {
      event?.preventDefault();
      // Client-side JSON sanity check for structured data to avoid bad saves.
      if (currentDraft.structuredData) {
        try {
          JSON.parse(currentDraft.structuredData);
        } catch {
          setErrors({ structuredData: ["Structured data must be valid JSON"] });
          return { status: "error", message: String(t("cms.seo.save.error")) };
        }
      }
      setSaving(true);
      const fd = new FormData();
      fd.append("locale", locale);
      fd.append("title", currentDraft.title ?? "");
      fd.append("description", currentDraft.description ?? "");
      fd.append("image", currentDraft.image ?? "");
      fd.append("alt", currentDraft.alt ?? "");
      fd.append("canonicalBase", currentDraft.canonicalBase ?? "");
      fd.append("ogUrl", currentDraft.ogUrl ?? "");
      fd.append("twitterCard", currentDraft.twitterCard ?? "");
      fd.append("brand", currentDraft.brand ?? "");
      fd.append("offers", currentDraft.offers ?? "");
      fd.append("aggregateRating", currentDraft.aggregateRating ?? "");
      fd.append("structuredData", currentDraft.structuredData ?? "");

      try {
        const result = await updateSeo(shop, fd);
        if (result.errors) {
          setErrors(result.errors);
          setWarnings([]);
          return { status: "error", message: String(t("cms.seo.save.error")) };
        }

        setErrors({});
        const warningList = result.warnings ?? [];
        setWarnings(warningList);
        return warningList.length > 0
          ? {
              status: "warning",
              message: String(t("cms.seo.save.warning")),
              warnings: warningList,
            }
          : {
              status: "success",
              message: String(t("cms.seo.save.success")),
              warnings: [],
            };
      } catch {
        return { status: "error", message: String(t("cms.seo.save.error")), warnings: [] };
      } finally {
        setSaving(false);
      }
    },
    [currentDraft, locale, shop, t],
  );

  const generate = useCallback(async (): Promise<GenerateResult> => {
    setGenerating(true);
    try {
      const fd = new FormData();
      fd.append("id", `${shop}-${locale}`);
      fd.append("locale", locale);
      fd.append("title", currentDraft.title ?? "");
      fd.append("description", currentDraft.description ?? "");
      const res = await runGenerateSeo(shop, fd);
      if (res.errors || !res.generated) {
        return { status: "error", message: String(t("cms.seo.generate.error")) };
      }

      updateField("title", res.generated.title);
      updateField("description", res.generated.description);
      if (res.generated.image) {
        updateField("image", res.generated.image);
      }
      return { status: "success", message: String(t("cms.seo.generate.success")) };
    } catch {
      return { status: "error", message: String(t("cms.seo.generate.error")) };
    } finally {
      setGenerating(false);
    }
  }, [currentDraft.description, currentDraft.title, locale, shop, t, updateField]);

  const errorFor = useCallback(
    (field: keyof SeoData) => errors[field]?.join("; ") ?? "",
    [errors],
  );

  return {
    locale,
    freeze,
    saving,
    generating,
    warnings,
    errors,
    currentDraft,
    updateField,
    handleLocaleChange,
    handleFreezeChange,
    submit,
    generate,
    errorFor,
  };
}
