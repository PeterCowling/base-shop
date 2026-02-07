import type { ContentLocale, Locale, TranslatableText } from "@acme/types";

import { contentFallbackChain, fallbackChain } from "./fallbackChain.js";

type TFunc = (key: string, params?: Record<string, unknown>) => string;

/**
 * Resolve a translatable value for the given ContentLocale.
 * - Legacy string → treat as inline { en: legacy }.
 * - KeyRef → t(key, params).
 * - Inline → try value[locale], else walk fallback chain, else "".
 *
 * In development, logs a warning when falling back or missing.
 */
export function resolveContentText(
  value: TranslatableText,
  locale: ContentLocale,
  t: TFunc
): string {
  // Legacy: if value is a plain string, treat as inline with English default
  if (typeof value === "string") {
    if (process.env.NODE_ENV === "development") {
      // i18n-exempt -- INTL-203: developer-only log message
      console.warn(
        "resolveContentText: legacy string used; treating as inline.en"
      );
    }
    return value;
  }

  if (value?.type === "key") {
    return t(value.key, value.params);
  }

  if (value?.type === "inline") {
    const chain = contentFallbackChain(locale);
    for (const loc of chain) {
      const v = value.value?.[loc];
      if (typeof v === "string" && v.length > 0) return v;
    }
    if (process.env.NODE_ENV === "development") {
      // i18n-exempt -- INTL-203: developer-only log message
      console.warn(
        "resolveContentText: missing inline value across fallbacks",
        {
          locale,
          chain,
        }
      );
    }
    return "";
  }

  if (process.env.NODE_ENV === "development") {
    // i18n-exempt -- INTL-203: developer-only log message
    console.warn(
      "resolveContentText: unknown value shape; returning empty string",
      value
    );
  }
  return "";
}

/**
 * @deprecated Use resolveContentText instead.
 * Resolve a translatable value for the given locale.
 * - Legacy string → treat as inline { en: legacy }.
 * - KeyRef → t(key, params).
 * - Inline → try value[locale], else walk fallback chain, else "".
 *
 * In development, logs a warning when falling back or missing.
 */
export function resolveText(
  value: TranslatableText,
  locale: Locale,
  t: TFunc
): string {
  // Legacy: if value is a plain string, treat as inline with English default
  if (typeof value === "string") {
    if (process.env.NODE_ENV === "development") {
      // i18n-exempt -- INTL-203: developer-only log message
      console.warn("resolveText: legacy string used; treating as inline.en");
    }
    return value;
  }

  if (value?.type === "key") {
    return t(value.key, value.params);
  }

  if (value?.type === "inline") {
    const chain = fallbackChain(locale);
    for (const loc of chain) {
      // Cast needed because LocalizedString now uses ContentLocale
      const v = value.value?.[loc as ContentLocale];
      if (typeof v === "string" && v.length > 0) return v;
    }
    if (process.env.NODE_ENV === "development") {
      // i18n-exempt -- INTL-203: developer-only log message
      console.warn("resolveText: missing inline value across fallbacks", {
        locale,
        chain,
      });
    }
    return "";
  }

  if (process.env.NODE_ENV === "development") {
    // i18n-exempt -- INTL-203: developer-only log message
    console.warn(
      "resolveText: unknown value shape; returning empty string",
      value
    );
  }
  return "";
}
