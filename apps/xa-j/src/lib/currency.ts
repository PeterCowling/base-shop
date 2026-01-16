import type { Currency } from "@platform-core/contexts/CurrencyContext";

export const XA_DEFAULT_CURRENCY: Currency = "AUD";
export const XA_SUPPORTED_CURRENCIES: readonly Currency[] = [
  "AUD",
  "USD",
  "EUR",
  "GBP",
];
