import type { TFunction } from "i18next";

import appI18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";

export function getGuidesTranslator(locale: AppLanguage): TFunction<"guides"> {
  return appI18n.getFixedT(locale, "guides") as TFunction<"guides">;
}
