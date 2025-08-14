export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale?: string
): string {
  const value = amount / 100;
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}
