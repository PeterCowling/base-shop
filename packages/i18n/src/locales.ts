// packages/i18n/src/locales.ts
// Supported locales
// Source of truth comes from @acme/types/constants to keep packages consistent.
import {
  CONTENT_LOCALES as BASE_CONTENT_LOCALES,
  type ContentLocale as BaseContentLocale,
  isContentLocale as baseIsContentLocale,
  isUiLocale as baseIsUiLocale,
  type Locale as BaseLocale,
  LOCALES as BASE_LOCALES,
  normalizeContentLocale as baseNormalizeContentLocale,
  UI_LOCALES as BASE_UI_LOCALES,
  type UiLocale as BaseUiLocale,
} from "@acme/types/constants";

// =============================================================================
// NEW LOCALE SYSTEM (I18N-PIPE-00)
// =============================================================================

export const UI_LOCALES = BASE_UI_LOCALES;
export type UiLocale = BaseUiLocale;

export const CONTENT_LOCALES = BASE_CONTENT_LOCALES;
export type ContentLocale = BaseContentLocale;

export const isContentLocale = baseIsContentLocale;
export const isUiLocale = baseIsUiLocale;
export const normalizeContentLocale = baseNormalizeContentLocale;

/**
 * Resolve a string to a valid ContentLocale.
 * Returns "en" if the value is not a recognized locale.
 */
export function resolveContentLocale(value: string | undefined): ContentLocale {
  if (!value) return "en";
  const normalized = normalizeContentLocale(value);
  return normalized ?? "en";
}

/**
 * Resolve a string to a valid UiLocale.
 * Returns "en" if the value is not a recognized UI locale.
 */
export function resolveUiLocale(value: string | undefined): UiLocale {
  if (!value) return "en";
  return isUiLocale(value) ? value : "en";
}

// =============================================================================
// LEGACY LOCALE SYSTEM (deprecated, for backward compatibility)
// =============================================================================

/** @deprecated Use CONTENT_LOCALES or UI_LOCALES instead. */
export const LOCALES = BASE_LOCALES;
/** @deprecated Use ContentLocale or UiLocale instead. */
export type Locale = BaseLocale;

/** @deprecated Use isContentLocale instead. */
export function assertLocales(
  value: unknown
): asserts value is readonly Locale[] {
  if (!Array.isArray(value) || value.length === 0) {
    // i18n-exempt: Developer-facing error message for invalid configuration, not shown to end users
    throw new Error("LOCALES must be a non-empty array");
  }
}

assertLocales(LOCALES);

/** @deprecated Use resolveContentLocale instead. */
export const locales = LOCALES;
/** @deprecated Use resolveContentLocale instead. */
export function resolveLocale(value: string | undefined): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : "en";
}
