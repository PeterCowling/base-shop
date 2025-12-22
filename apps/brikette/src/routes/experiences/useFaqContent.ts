import { useMemo } from "react";

import { BASE_URL } from "@/config/site";
import { faqEntriesToJsonLd, normalizeFaqEntries } from "@/utils/buildFaqJsonLd";

import type { AppLanguage } from "@/i18n.config";

type Translator = (key: string, options?: Record<string, unknown>) => unknown;

type Params = {
  lang: AppLanguage;
  pathname: string;
  t: Translator;
};

type FaqContent = {
  entries: ReturnType<typeof normalizeFaqEntries>;
  jsonLd: string;
  title: string;
};

export function useFaqContent({ lang, pathname, t }: Params): FaqContent {
  const entries = useMemo(
    () => normalizeFaqEntries(t("faq.items", { returnObjects: true }) as unknown),
    [t],
  );
  const hasEntries = entries.length > 0;

  const jsonLd = useMemo(() => {
    if (!hasEntries) {
      return "";
    }
    return faqEntriesToJsonLd(lang, `${BASE_URL}${pathname}`, entries);
  }, [entries, hasEntries, lang, pathname]);

  const title = useMemo(() => {
    const rawTitle = t("faq.title");
    if (rawTitle == null) {
      return "";
    }
    const normalized = typeof rawTitle === "string" ? rawTitle : String(rawTitle);
    return normalized.trim();
  }, [t]);

  return { entries, jsonLd, title };
}
