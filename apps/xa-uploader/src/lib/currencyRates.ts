export type CurrencyRates = { EUR: number; GBP: number; AUD: number };

export const MAX_CURRENCY_RATE_VALUE = 1000.0;
export const DEFAULT_CURRENCY_RATES: CurrencyRates = { EUR: 1, GBP: 1, AUD: 1 };

export function validateCurrencyRatesInput(
  value: unknown,
): { ok: true; rates: CurrencyRates } | { ok: false; reason: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, reason: "rates_must_be_object" };
  }

  const record = value as Record<string, unknown>;
  const candidate = {
    EUR: record.EUR,
    GBP: record.GBP,
    AUD: record.AUD,
  };

  for (const [code, rawValue] of Object.entries(candidate)) {
    if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
      return { ok: false, reason: `${code}_must_be_finite_number` };
    }
    if (rawValue <= 0) {
      return { ok: false, reason: `${code}_must_be_gt_zero` };
    }
    if (rawValue > MAX_CURRENCY_RATE_VALUE) {
      return { ok: false, reason: `${code}_must_be_lte_${MAX_CURRENCY_RATE_VALUE}` };
    }
  }

  return {
    ok: true,
    rates: {
      EUR: candidate.EUR as number,
      GBP: candidate.GBP as number,
      AUD: candidate.AUD as number,
    },
  };
}

export function parseCurrencyRatesOrNull(value: unknown): CurrencyRates | null {
  const validated = validateCurrencyRatesInput(value);
  return validated.ok ? validated.rates : null;
}

export function serializeCurrencyRates(rates: CurrencyRates): string {
  return `${JSON.stringify(rates, null, 2)}\n`;
}
