import type { Currency } from "@acme/platform-core/contexts/CurrencyContext";

export const XA_DEFAULT_CURRENCY: Currency = "USD";
export const XA_SUPPORTED_CURRENCIES: readonly Currency[] = [
  "USD",
  "AUD",
  "EUR",
  "GBP",
];
