// =============================================================================
// LOCALE SYSTEM (I18N-PIPE-00)
// =============================================================================
//
// The locale system distinguishes between:
// - UiLocale: Locales with full UI translation bundles (buttons, labels, etc.)
// - ContentLocale: Locales where user content can be translated (products, pages)
//
// ContentLocale is a superset of UiLocale. A shop can have content in "de" even
// if the UI chrome falls back to "en".

/**
 * UI_LOCALES: Locales with full UI translation bundles.
 * Adding a locale here requires creating translation files in packages/i18n.
 */
export const UI_LOCALES = ["en", "it"] as const;
export type UiLocale = (typeof UI_LOCALES)[number];

/**
 * CONTENT_LOCALES: All locales where content translation is supported.
 * This is the full set of locales available for TranslatableText values.
 * Includes all Brikette-supported locales plus script variants.
 */
export const CONTENT_LOCALES = [
  // Core locales (also UI locales)
  "en",
  "it",
  // Extended content locales
  "de",
  "es",
  "fr",
  "pt",
  "ja",
  "ko",
  "ru",
  "ar",
  "hi",
  "vi",
  "pl",
  "sv",
  "da",
  "hu",
  "nb", // Norwegian Bokmål (canonical for "no" filesystem directories)
  // Script variants (required for Chinese)
  "zh-Hans", // Simplified Chinese
  "zh-Hant", // Traditional Chinese
] as const;
export type ContentLocale = (typeof CONTENT_LOCALES)[number];

/**
 * @deprecated Use UI_LOCALES or CONTENT_LOCALES instead.
 * Kept for backward compatibility during migration.
 */
export const LOCALES = ["en", "de", "it"] as const;

/**
 * @deprecated Use UiLocale or ContentLocale instead.
 * Kept for backward compatibility during migration.
 */
export type Locale = (typeof LOCALES)[number];

/**
 * Check if a string is a valid ContentLocale.
 */
export function isContentLocale(value: string): value is ContentLocale {
  return (CONTENT_LOCALES as readonly string[]).includes(value);
}

/**
 * Check if a string is a valid UiLocale.
 */
export function isUiLocale(value: string): value is UiLocale {
  return (UI_LOCALES as readonly string[]).includes(value);
}

/**
 * Normalize a locale string to canonical ContentLocale form.
 * Handles common aliases and case normalization.
 * Returns undefined if the locale is not recognized.
 */
export function normalizeContentLocale(
  value: string
): ContentLocale | undefined {
  // Lowercase the base language tag for comparison
  const lower = value.toLowerCase();

  // Handle known aliases
  const aliases: Record<string, ContentLocale> = {
    no: "nb", // Norwegian → Norwegian Bokmål
    zh: "zh-Hans", // Bare "zh" defaults to Simplified
    "zh-cn": "zh-Hans",
    "zh-tw": "zh-Hant",
    "zh-hk": "zh-Hant",
  };

  if (aliases[lower]) {
    return aliases[lower];
  }

  // Check if it's already a valid ContentLocale (case-insensitive for base tags)
  for (const locale of CONTENT_LOCALES) {
    if (locale.toLowerCase() === lower) {
      return locale;
    }
  }

  // Handle BCP47 with region (strip region, keep base)
  const base = lower.split("-")[0];
  if (base && isContentLocale(base)) {
    return base;
  }

  return undefined;
}

export const ROLES = [
  "admin",
  "viewer",
  "ShopAdmin",
  "CatalogManager",
  "ThemeEditor",
] as const;
export type Role = (typeof ROLES)[number];
