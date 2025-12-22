// src/routes/guides/how-to-get-to-positano.translators.ts
import appI18n from "@/i18n";

export function getGuidesTranslator(locale: string) {
  return appI18n.getFixedT(locale, "guides");
}

export function getHeaderTranslator(locale: string) {
  return appI18n.getFixedT(locale, "header");
}
