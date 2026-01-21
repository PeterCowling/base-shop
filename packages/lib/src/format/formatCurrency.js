/**
 * Format a minor-unit amount (e.g. cents) as a localized currency string.
 *
 * @param amount   Amount in minor currency units
 * @param currency ISO 4217 currency code (default: "USD")
 * @param locale   Optional BCP 47 locale tag
 */
export function formatCurrency(amount, currency = "USD", locale) {
    if (!/^[A-Z]{3}$/.test(currency)) {
        throw new RangeError(`Invalid currency code: ${currency}`);
    }
    const supported = Intl.supportedValuesOf?.("currency");
    if (supported && !supported.includes(currency)) {
        throw new RangeError(`Invalid currency code: ${currency}`);
    }
    const value = amount ?? NaN;
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
    }).format(value / 100);
}
