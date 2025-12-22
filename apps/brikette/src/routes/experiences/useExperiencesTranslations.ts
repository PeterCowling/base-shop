import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";

export const EXPERIENCES_NAMESPACE = "experiencesPage" as const;

export type ExperiencesTranslator = (
  key: string,
  options?: Record<string, unknown>,
) => string;

export function useExperiencesTranslations(lang: AppLanguage) {
  const { t: rawT, ready } = useTranslation(EXPERIENCES_NAMESPACE, { lng: lang });
  const { t: rawTokens, ready: tokensReady } = useTranslation("_tokens", { lng: lang });

  const wrapTranslator = (translator: ExperiencesTranslator) =>
    ((key: string, options?: Record<string, unknown>) =>
      options ? translator(key, options) : translator(key)) as ExperiencesTranslator;

  const t = useMemo(() => {
    if (!ready) {
      return wrapTranslator(((key: string) => key) as ExperiencesTranslator);
    }
    return wrapTranslator(rawT as ExperiencesTranslator);
  }, [rawT, ready]);
  const tTokens = useMemo(() => {
    if (!tokensReady) {
      return wrapTranslator(((key: string) => key) as ExperiencesTranslator);
    }
    return wrapTranslator(rawTokens as ExperiencesTranslator);
  }, [rawTokens, tokensReady]);

  const experiencesEnT = useMemo<ExperiencesTranslator>(() => {
    return wrapTranslator(i18n.getFixedT("en", EXPERIENCES_NAMESPACE) as ExperiencesTranslator);
  }, []);

  return { t, tTokens, experiencesEnT };
}
