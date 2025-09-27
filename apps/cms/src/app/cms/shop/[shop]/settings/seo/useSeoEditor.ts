"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { useTranslations } from "@i18n/Translations";
import en from "@i18n/en.json";

import { setFreezeTranslations, updateSeo } from "@cms/actions/shops.server";
import type { Locale } from "@acme/types";

export interface SeoData {
  title?: string;
  description?: string;
  image?: string;
  alt?: string;
  canonicalBase?: string;
  ogUrl?: string;
  twitterCard?: string;
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
  const t = (key: string) => {
    const out = tFromContext(key) as unknown as string;
    return out === key ? (en as Record<string, string>)[key] ?? key : out;
  };
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
          ? { status: "warning", message: String(t("cms.seo.save.warning")) }
          : { status: "success", message: String(t("cms.seo.save.success")) };
      } catch {
        return { status: "error", message: String(t("cms.seo.save.error")) };
      } finally {
        setSaving(false);
      }
    },
    [currentDraft, locale, shop],
  );

  const generate = useCallback(async (): Promise<GenerateResult> => {
    setGenerating(true);
    try {
      const res = await fetch("/api/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop,
          id: `${shop}-${locale}`,
          title: currentDraft.title,
          description: currentDraft.description,
        }),
      });

      if (!res.ok) {
        return { status: "error", message: String(t("cms.seo.generate.error")) };
      }

      const data = (await res.json()) as {
        title: string;
        description: string;
        alt: string;
        image: string;
      };

      updateField("title", data.title);
      updateField("description", data.description);
      updateField("alt", data.alt);
      updateField("image", data.image);
      return { status: "success", message: String(t("cms.seo.generate.success")) };
    } catch {
      return { status: "error", message: String(t("cms.seo.generate.error")) };
    } finally {
      setGenerating(false);
    }
  }, [currentDraft.description, currentDraft.title, locale, shop, updateField]);

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
