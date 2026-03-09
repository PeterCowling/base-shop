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
  // Always start with the fallback so server and client initial render match,
  // then apply the stored locale after hydration to avoid React #418.
  const [locale, setLocaleState] = React.useState<UploaderLocale>(fallbackLocale);
  React.useEffect(() => {
    const stored = normalizeStoredLocale(window.localStorage.getItem(STORAGE_KEY));
    if (stored) setLocaleState(stored);
  }, []);

  const setLocale = React.useCallback((nextLocale: UploaderLocale) => {
    setLocaleState(nextLocale);
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale === "zh" ? "zh" : "en";
  }, [locale]);

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
