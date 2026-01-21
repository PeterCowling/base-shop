// src/routes/guides/cheapEatsInPositano/useCheapEatsTranslationContext.ts
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import type { TFunction } from "i18next";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import type { AppLanguage } from "@/i18n.config";

import { normalizeText } from "./normalizeText";

export type CheapEatsTranslationContext = {
  lang: AppLanguage;
  pathname: string;
  t: TFunction<"guides">;
  englishT: TFunction<"guides">;
  normalizeEnglish: (key: string) => string | undefined;
  englishDefaults: {
    whereToEatHeading: string;
    faqsHeading: string;
    photoGallery: string;
  };
  getGuideResource: <T>(path: string) => T | undefined;
  getEnglishGuideResource: <T>(path: string) => T | undefined;
  title: string;
  description: string;
};

export function useCheapEatsTranslationContext(): CheapEatsTranslationContext {
  const lang = useCurrentLanguage();
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation("guides", { lng: lang });

  const englishT = useMemo(() => i18n.getFixedT("en", "guides"), [i18n]);

  const normalizeEnglish = useMemo(
    () =>
      (key: string): string | undefined => {
        const value = englishT(key, { defaultValue: "" });
        return normalizeText(typeof value === "string" ? value : String(value ?? ""), key);
      },
    [englishT],
  );

  const englishDefaults = useMemo(() => {
    const ensureEnglish = (key: string): string =>
      normalizeText(englishT(key, { defaultValue: key }), key) ?? key;

    return {
      whereToEatHeading: ensureEnglish("labels.whereToEatHeading"),
      faqsHeading: ensureEnglish("labels.faqsHeading"),
      photoGallery: ensureEnglish("labels.photoGallery"),
    } as const;
  }, [englishT]);

  const getGuideResource = <T,>(path: string): T | undefined => {
    const maybeGetResource = (i18n as { getResource?: typeof i18n.getResource }).getResource;
    if (typeof maybeGetResource === "function") {
      return maybeGetResource(lang, "guides", path) as T | undefined;
    }
    const fallback = t(path, { returnObjects: true, defaultValue: undefined });
    return (fallback as T | undefined) ?? undefined;
  };

  const getEnglishGuideResource = <T,>(path: string): T | undefined => {
    const result = englishT(path, { returnObjects: true, defaultValue: undefined });
    return (result as T | undefined) ?? undefined;
  };

  const title = t("content.cheapEats.seo.title") as string;
  const description = t("content.cheapEats.seo.description") as string;

  return {
    lang,
    pathname,
    t,
    englishT,
    normalizeEnglish,
    englishDefaults,
    getGuideResource,
    getEnglishGuideResource,
    title,
    description,
  };
}
