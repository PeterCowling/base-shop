import { LOCALES } from "@acme/i18n";

export default {
  // Supported locales for next-intl
  locales: LOCALES as unknown as string[],
  defaultLocale: "en",
  // Only prefix non-default locales (keeps URLs clean for English)
  localePrefix: "as-needed" as const,
};

