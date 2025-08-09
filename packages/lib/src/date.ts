// packages/lib/src/date.ts

/**
 * Format an ISO timestamp using the provided locale or the runtime's default.
 *
 * @param ts - ISO timestamp string to format
 * @param locale - Optional BCP 47 locale string overriding the default locale
 * @returns Localized date/time string
 */
export function formatTimestamp(ts: string, locale?: string): string {
  return new Date(ts).toLocaleString(locale);
}

