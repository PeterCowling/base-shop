// Re-derive from the shared constant to avoid Jest haste map conflicts with
// @acme/types (apps/xa/.open-next duplicates the package). Keep in sync with
// packages/types/src/constants.ts → UI_LOCALES.
const SUPPORTED_LOCALES = ['en', 'it'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const DEFAULT_LOCALE: SupportedLocale = 'en';

const supportedSet = new Set<string>(SUPPORTED_LOCALES);

/**
 * Normalize an incoming locale tag to a supported UI locale.
 *
 * - Exact match (e.g. 'it') → returned as-is.
 * - Regional variant (e.g. 'it-IT') → stripped to base language, matched.
 * - Unsupported / null / undefined / empty → falls back to 'en'.
 */
export function normalizeLocale(
  locale: string | null | undefined,
): SupportedLocale {
  if (!locale) return DEFAULT_LOCALE;

  // Exact match
  if (supportedSet.has(locale)) return locale as SupportedLocale;

  // Strip region subtag (e.g. 'it-IT' → 'it', 'en-GB' → 'en')
  const base = locale.split('-')[0].toLowerCase();
  if (supportedSet.has(base)) return base as SupportedLocale;

  return DEFAULT_LOCALE;
}
