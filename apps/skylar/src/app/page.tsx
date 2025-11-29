'use client';

import { useEffect } from "react";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/locales";
import { getTranslatorForLocale } from "@/lib/messages";
import styles from "./page.module.css";

const SUPPORTED_LOCALES = new Set<Locale>(LOCALES);
const translate = getTranslatorForLocale(DEFAULT_LOCALE);
const REDIRECT_COPY = {
  notice: translate("redirect.notice"),
  instructions: translate("redirect.instructions"),
  cta: translate("redirect.cta"),
};

function normalizeLocaleTag(tag: string | undefined): Locale | null {
  if (!tag) {
    return null;
  }

  const lowered = tag.toLowerCase();
  if (SUPPORTED_LOCALES.has(lowered as Locale)) {
    return lowered as Locale;
  }

  const base = lowered.split("-")[0] as Locale;
  return SUPPORTED_LOCALES.has(base) ? base : null;
}

function detectBrowserLocale(): Locale {
  if (typeof window === "undefined" || typeof window.navigator === "undefined") {
    return DEFAULT_LOCALE;
  }

  const languages: Array<string | undefined> = Array.isArray(window.navigator.languages)
    ? window.navigator.languages
    : [window.navigator.language];

  for (const tag of languages) {
    const locale = normalizeLocaleTag(tag);
    if (locale) {
      return locale;
    }
  }

  return DEFAULT_LOCALE;
}

export default function RootRedirectPage() {
  useEffect(() => {
    const locale = detectBrowserLocale();
    window.location.replace(`/${locale}`);
  }, []);

  const fallbackHref = `/${DEFAULT_LOCALE}`;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg text-fg">
      <p className={`text-xs uppercase ${styles["redirectTagline"]}`}>{REDIRECT_COPY.notice}</p>
      <p className="mt-4 text-center text-sm">
        <span>{REDIRECT_COPY.instructions} </span>
        <a className={`${styles["redirectLink"]} underline decoration-2 underline-offset-4`} href={fallbackHref}>
          {REDIRECT_COPY.cta}
        </a>
        <span>.</span>
      </p>
      <noscript>
        <meta httpEquiv="refresh" content={`0;url=${fallbackHref}`} />
      </noscript>
    </main>
  );
}
