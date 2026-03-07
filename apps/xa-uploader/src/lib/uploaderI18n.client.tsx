"use client";

import * as React from "react";

import {
  getUploaderMessage,
  UPLOADER_DEFAULT_LOCALE,
  type UploaderLocale,
  type UploaderMessageKey,
} from "./uploaderI18n";

type UploaderI18nContextValue = {
  locale: UploaderLocale;
  setLocale: (locale: UploaderLocale) => void;
};

const STORAGE_KEY = "xa_uploader_locale";

const UploaderI18nContext = React.createContext<UploaderI18nContextValue | null>(null);

function normalizeStoredLocale(value: string | null): UploaderLocale | null {
  if (value === "en" || value === "zh") return value;
  if (value === "EN") return "en";
  if (value === "ZH" || value === "xe") return "zh";
  return null;
}

export function UploaderI18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: UploaderLocale;
}) {
  const fallbackLocale = initialLocale ?? UPLOADER_DEFAULT_LOCALE;
  const [locale, setLocaleState] = React.useState<UploaderLocale>(fallbackLocale);

  const setLocale = React.useCallback((nextLocale: UploaderLocale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
    document.documentElement.lang = nextLocale === "zh" ? "zh" : "en";
  }, []);

  React.useEffect(() => {
    const normalized = normalizeStoredLocale(window.localStorage.getItem(STORAGE_KEY));
    const nextLocale = normalized ?? fallbackLocale;
    setLocaleState(nextLocale);
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
    document.documentElement.lang = nextLocale === "zh" ? "zh" : "en";
  }, [fallbackLocale]);

  const value = React.useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

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
