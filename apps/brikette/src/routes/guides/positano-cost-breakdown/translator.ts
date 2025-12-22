import appI18n from "@/i18n";
import type { TFunction } from "i18next";

export function getGuidesTranslator(locale: string): TFunction<"guides"> {
  return appI18n.getFixedT(locale, "guides") as TFunction<"guides">;
}
