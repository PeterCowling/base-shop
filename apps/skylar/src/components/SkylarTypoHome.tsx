'use client';

import { useTranslations } from "@acme/i18n";
import type { Locale } from "@/lib/locales";
import { EnglishHome } from "./typo-home/EnglishHome";
import { InternationalHome } from "./typo-home/InternationalHome";

type Props = {
  lang: Locale;
};

export function SkylarTypoHome({ lang }: Props) {
  const translator = useTranslations();
  if (lang === "en") {
    return <EnglishHome lang={lang} translator={translator} />;
  }

  return <InternationalHome lang={lang} translator={translator} />;
}
