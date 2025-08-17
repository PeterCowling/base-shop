// packages/shared-utils/src/formatPrice.ts
/**
 * Format a major-unit amount (e.g. dollars) as a localized currency string.
 *
 * @param amount   Amount in major currency units
 * @param currency ISO 4217 currency code (default: "USD")
 * @param locale   Optional BCP 47 locale tag
 */
export function formatPrice(amount, currency = "USD", locale) {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
    }).format(amount);
}
