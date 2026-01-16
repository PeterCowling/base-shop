const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

const currencyFractionDigitsCache = new Map<string, number>();

function resolveCurrencyFractionDigits(currency: string): number {
  const cached = currencyFractionDigitsCache.get(currency);
  if (typeof cached === "number") return cached;

  const resolved = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).resolvedOptions();

  const digits = resolved.maximumFractionDigits ?? resolved.minimumFractionDigits ?? 2;
  currencyFractionDigitsCache.set(currency, digits);
  return digits;
}

function bigintPow10(exp: number): bigint {
  if (!Number.isInteger(exp) || exp < 0) {
    throw new RangeError(`Invalid power of ten exponent: ${exp}`);
  }
  let out = 1n;
  for (let i = 0; i < exp; i += 1) out *= 10n;
  return out;
}

export function normalizeCurrencyCode(currency: string): string {
  const normalized = currency.trim().toUpperCase();
  if (!CURRENCY_CODE_PATTERN.test(normalized)) {
    throw new RangeError(`Invalid currency code: ${currency}`);
  }

  const supported = (
    Intl as typeof Intl & {
      supportedValuesOf?(category: "currency"): string[];
    }
  ).supportedValuesOf?.("currency");
  if (supported && !supported.includes(normalized)) {
    throw new RangeError(`Invalid currency code: ${currency}`);
  }

  return normalized;
}

export function getCurrencyFractionDigits(currency: string): number {
  const normalized = normalizeCurrencyCode(currency);
  return resolveCurrencyFractionDigits(normalized);
}

export function assertMinorInt(value: unknown): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw new TypeError("Expected an integer minor-unit amount");
  }
  if (!Number.isSafeInteger(value)) {
    throw new RangeError("Minor-unit amount exceeds safe integer range");
  }
}

export function toMinor(inputMajor: string | number, currency: string): number {
  const normalizedCurrency = normalizeCurrencyCode(currency);
  const fractionDigits = resolveCurrencyFractionDigits(normalizedCurrency);
  const scale = bigintPow10(fractionDigits);

  let str: string;
  if (typeof inputMajor === "number") {
    if (!Number.isFinite(inputMajor)) {
      throw new TypeError("Expected a finite number");
    }
    str = inputMajor.toFixed(fractionDigits);
  } else {
    str = inputMajor.trim();
  }

  // eslint-disable-next-line security/detect-unsafe-regex -- bounded decimal parser for currency input
  const match = /^([+-])?(\d+)(?:\.(\d+))?$/.exec(str);
  if (!match) {
    throw new TypeError("Expected a numeric string");
  }

  const sign = match[1] === "-" ? -1n : 1n;
  const integerPart = match[2] ?? "0";
  const fractionRaw = match[3] ?? "";
  const fractionKept = fractionRaw.slice(0, fractionDigits).padEnd(fractionDigits, "0");
  const remainder = fractionRaw.slice(fractionDigits);

  let minor = BigInt(integerPart) * scale;
  if (fractionDigits) minor += BigInt(fractionKept || "0");

  const shouldRoundUp = remainder.length > 0 && remainder[0] >= "5";
  if (shouldRoundUp) minor += 1n;

  const asNumber = Number(sign * minor);
  assertMinorInt(asNumber);
  return asNumber;
}

export function fromMinor(minor: number, currency: string): string {
  assertMinorInt(minor);
  const normalizedCurrency = normalizeCurrencyCode(currency);
  const fractionDigits = resolveCurrencyFractionDigits(normalizedCurrency);
  const scale = bigintPow10(fractionDigits);

  const sign = minor < 0 ? "-" : "";
  const abs = BigInt(minor < 0 ? -minor : minor);

  if (fractionDigits === 0) return `${sign}${abs.toString()}`;

  const integerPart = abs / scale;
  const fractionPart = abs % scale;
  const fractionStr = fractionPart.toString().padStart(fractionDigits, "0");
  return `${sign}${integerPart.toString()}.${fractionStr}`;
}

export function formatMinor(
  minor: number,
  currency: string,
  locale?: string,
): string {
  assertMinorInt(minor);
  const normalizedCurrency = normalizeCurrencyCode(currency);
  const fractionDigits = resolveCurrencyFractionDigits(normalizedCurrency);
  const scale = Number(bigintPow10(fractionDigits));
  const major = minor / scale;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: normalizedCurrency,
  }).format(major);
}
