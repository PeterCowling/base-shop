import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import type { AppLanguage } from "@/i18n.config";
import { toAppLanguage } from "@/utils/lang";

import { resolveEnglishValue } from "./fallbacks";

interface AssistanceTranslationResult {
  resolvedLang: AppLanguage;
  resolveAssistanceString: (key: string) => string;
  tAssistance: TFunction<"assistance">;
  tAssistanceEn: TFunction<"assistance">;
}

export function useAssistanceTranslations(lang?: string): AssistanceTranslationResult {
  const resolvedLang = toAppLanguage(lang);
  const { t: tAssistance } = useTranslation("assistance", { lng: resolvedLang });
  const { t: tAssistanceEn } = useTranslation("assistance", { lng: "en" });

  const resolveAssistanceString = useCallback(
    (key: string) => {
      const raw = tAssistance(key);
      if (typeof raw === "string" && raw.trim().length > 0 && raw !== key) {
        return raw;
      }

      const fallback = tAssistanceEn(key);
      if (typeof fallback === "string" && fallback.trim().length > 0 && fallback !== key) {
        return fallback;
      }

      const englishFallback = resolveEnglishValue<string>(key);
      if (typeof englishFallback === "string" && englishFallback.trim().length > 0) {
        return englishFallback;
      }

      return typeof raw === "string" && raw.trim().length > 0 ? raw : key;
    },
    [tAssistance, tAssistanceEn],
  );

  return { resolvedLang, resolveAssistanceString, tAssistance, tAssistanceEn };
}
