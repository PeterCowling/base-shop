type FormatNumberInput = number | bigint | string | null | undefined;
/**
 * Format a numeric value using {@link Intl.NumberFormat}.
 *
 * Supports `number`, `bigint`, and string inputs as well as nullable values.
 * Strings are trimmed before conversion; empty strings are treated as `NaN`.
 *
 * The second argument may be either a locale string or an `Intl.NumberFormat`
 * options object. When a locale string is provided, options can be supplied as
 * the third argument.
 */
export declare function formatNumber(value: FormatNumberInput, options?: Intl.NumberFormatOptions, locale?: string): string;
export declare function formatNumber(value: FormatNumberInput, locale?: string, options?: Intl.NumberFormatOptions): string;
export {};
//# sourceMappingURL=formatNumber.d.ts.map