// src/routes/assistance/use-lang.ts
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import type { AppLanguage } from "@/i18n.config";
import { isSupportedLanguage } from "./utils";

export function useAssistanceLang(loaderLang: unknown): AppLanguage {
  const routerLang = useCurrentLanguage();
  return isSupportedLanguage(loaderLang) ? (loaderLang as AppLanguage) : routerLang;
}

