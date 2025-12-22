// src/routes/guides/amalfi-coast-cuisine-guide.translators.ts
import type { TFunction } from "i18next";

import appI18n from "@/i18n";

export function getGuidesTranslator(locale: string): TFunction<"guides"> {
  return appI18n.getFixedT(locale, "guides") as TFunction<"guides">;
}
