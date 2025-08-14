// packages/shared-utils/src/formatCurrency.ts

/**
 * Format a minor-unit amount (e.g. cents) as a localized currency string.
 *
 * @param amount   Amount in minor currency units
 * @param currency ISO 4217 currency code (default: "USD")
 * @param locale   Optional BCP 47 locale tag
 */
export function formatCurrency(
  amount: number,
  currency = "USD",
  locale?: string
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount / 100);
}
