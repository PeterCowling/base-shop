// packages/shared-utils/src/formatNumber.ts

type FormatNumberInput = number | bigint | string | null | undefined;

function normalizeInput(value: FormatNumberInput): number | bigint {
  if (value === null || value === undefined) {
    return Number.NaN;
  }

  if (typeof value === "bigint" || typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return Number.NaN;
    }

    return Number(trimmed);
  }

  return Number.NaN;
}

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
export function formatNumber(
  value: FormatNumberInput,
  options?: Intl.NumberFormatOptions,
  locale?: string
): string;
export function formatNumber(
  value: FormatNumberInput,
  locale?: string,
  options?: Intl.NumberFormatOptions
): string;
export function formatNumber(
  value: FormatNumberInput,
  optionsOrLocale?: Intl.NumberFormatOptions | string,
  localeOrOptions?: string | Intl.NumberFormatOptions
): string {
  let resolvedLocale: string | undefined;
  let resolvedOptions: Intl.NumberFormatOptions | undefined;

  if (typeof optionsOrLocale === "string") {
    resolvedLocale = optionsOrLocale;
    if (localeOrOptions && typeof localeOrOptions !== "string") {
      resolvedOptions = localeOrOptions;
    }
  } else {
    resolvedOptions = optionsOrLocale;
    if (typeof localeOrOptions === "string") {
      resolvedLocale = localeOrOptions;
    } else if (localeOrOptions && typeof localeOrOptions !== "string") {
      resolvedOptions = localeOrOptions;
    }
  }

  const normalized = normalizeInput(value);

  return new Intl.NumberFormat(resolvedLocale, resolvedOptions).format(
    normalized
  );
}

