import type { Locale, TranslatableText } from "@acme/types";
type TFunc = (key: string, params?: Record<string, unknown>) => string;
/**
 * Resolve a translatable value for the given locale.
 * - Legacy string → treat as inline { en: legacy }.
 * - KeyRef → t(key, params).
 * - Inline → try value[locale], else walk fallback chain, else "".
 *
 * In development, logs a warning when falling back or missing.
 */
export declare function resolveText(value: TranslatableText, locale: Locale, t: TFunc): string;
export {};
