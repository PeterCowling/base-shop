// packages/shared-utils/src/formatNumber.ts

/**
 * Format a numeric value using `Intl.NumberFormat`.
 *
 * Provides a thin wrapper so consumers can pass formatting options without
 * needing to instantiate `Intl.NumberFormat` directly.
 *
 * @param value    The numeric value to format.
 * @param options  Optional `Intl.NumberFormat` options.
 * @param locale   Optional BCP 47 locale tag.
 */
export function formatNumber(
  value: number | bigint,
  options?: Intl.NumberFormatOptions,
  locale?: string
): string {
  const numericValue = typeof value === "bigint" ? Number(value) : value;
  const formatter = new Intl.NumberFormat(locale, options);

  if (!Number.isFinite(numericValue)) {
    return formatter.format(NaN);
  }

  return formatter.format(numericValue);
}
