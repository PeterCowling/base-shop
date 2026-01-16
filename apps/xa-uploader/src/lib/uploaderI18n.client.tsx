"use client";

import * as React from "react";

import {
  UPLOADER_DEFAULT_LOCALE,
  getUploaderMessage,
  type UploaderLocale,
  type UploaderMessageKey,
} from "./uploaderI18n";

type UploaderI18nContextValue = {
  locale: UploaderLocale;
  setLocale: (locale: UploaderLocale) => void;
};

const STORAGE_KEY = "xa_uploader_locale";

const UploaderI18nContext = React.createContext<UploaderI18nContextValue | null>(null);

export function UploaderI18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = React.useState<UploaderLocale>(UPLOADER_DEFAULT_LOCALE);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "zh") {
      setLocale(stored);
    }
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale === "zh" ? "zh" : "en";
  }, [locale]);

  const value = React.useMemo(() => ({ locale, setLocale }), [locale]);

  return <UploaderI18nContext.Provider value={value}>{children}</UploaderI18nContext.Provider>;
}

export function useUploaderI18n() {
  const context = React.useContext(UploaderI18nContext);
  const locale = context?.locale ?? UPLOADER_DEFAULT_LOCALE;
  const setLocale = context?.setLocale ?? (() => undefined);

  const t = React.useCallback(
    (
      key: UploaderMessageKey,
      vars?: Record<string, string | number | boolean | null | undefined>,
    ) => {
      let message = getUploaderMessage(locale, key);
      if (!vars) return message;
      for (const [varName, value] of Object.entries(vars)) {
        message = message.replaceAll(`{${varName}}`, String(value ?? ""));
      }
      return message;
    },
    [locale],
  );

  return { locale, setLocale, t };
}
