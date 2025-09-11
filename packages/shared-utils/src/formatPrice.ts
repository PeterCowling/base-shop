// packages/shared-utils/src/formatPrice.ts

/**
 * Format a major-unit amount (e.g. dollars) as a localized currency string.
 *
 * @param amount   Amount in major currency units
 * @param currency ISO 4217 currency code (default: "USD")
 * @param locale   Optional BCP 47 locale tag
 */
export function formatPrice(
  amount: number,
  currency = "USD",
  locale?: string
): string {
  if (typeof Intl.supportedValuesOf === "function") {
    const supported = Intl.supportedValuesOf("currency");
    if (!supported.includes(currency)) {
      throw new RangeError(`Unsupported currency code: ${currency}`);
    }
  }

  const normalizedAmount = (amount as unknown) == null ? NaN : amount;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(normalizedAmount);
}
