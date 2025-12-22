import type { CurrencyCode } from "@/types/product";

export function formatPrice(
  amount: number,
  currency: CurrencyCode,
  locale: string
): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  });
  return formatter.format(amount / 100);
}
