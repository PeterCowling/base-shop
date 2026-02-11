import { UI_LOCALES, type UiLocale } from '@acme/types';

const DEFAULT_LOCALE: UiLocale = 'en';

const supportedSet = new Set<string>(UI_LOCALES);

/**
 * Normalize an incoming locale tag to a supported UI locale.
 *
 * - Exact match (e.g. 'it') → returned as-is.
 * - Regional variant (e.g. 'it-IT') → stripped to base language, matched.
 * - Unsupported / null / undefined / empty → falls back to 'en'.
 */
export function normalizeLocale(
  locale: string | null | undefined,
): UiLocale {
  if (!locale) return DEFAULT_LOCALE;

  // Exact match
  if (supportedSet.has(locale)) return locale as UiLocale;

  // Strip region subtag (e.g. 'it-IT' → 'it', 'en-GB' → 'en')
  const base = locale.split('-')[0].toLowerCase();
  if (supportedSet.has(base)) return base as UiLocale;

  return DEFAULT_LOCALE;
}
