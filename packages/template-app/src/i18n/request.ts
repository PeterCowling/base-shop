import { getRequestConfig } from "next-intl/server";
import { resolveLocale, type Locale } from "@acme/i18n";
import en from "@i18n/en.json";

// Provide messages for requests. Currently we ship English; other locales fall back to English.
export default getRequestConfig(async ({ requestLocale }) => {
  const locale = resolveLocale(typeof requestLocale === "string" ? requestLocale : "en");

  // Map of locale -> messages; extend as additional locale files are added
  const messagesByLocale: Partial<Record<Locale, Record<string, string>>> = {
    en: en as Record<string, string>,
  };

  const messages = messagesByLocale[locale] ?? messagesByLocale.en!;

  return {
    locale,
    messages,
  } as const;
});

