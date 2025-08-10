// packages/platform-core/src/utils/string.ts
import { LOCALES } from "@i18n/locales";
import type { Locale } from "@types";
import { randomBytes } from "crypto";

/** Convert a string into a URL-friendly slug. */
export function slugify(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Generate a random secret represented as a hexadecimal string. */
export function genSecret(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Ensure all locales have a value, filling in missing entries with a fallback.
 */
export function fillLocales(
  values: Partial<Record<Locale, string>> | undefined,
  fallback: string
): Record<Locale, string> {
  return LOCALES.reduce<Record<Locale, string>>(
    (acc, locale: Locale) => {
      acc[locale] = values?.[locale] ?? fallback;
      return acc;
    },
    {} as Record<Locale, string>
  );
}

