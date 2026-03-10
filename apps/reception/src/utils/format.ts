export type FormatEuroOptions = {
  style?: "prefix" | "locale";
  signDisplay?: "auto" | "always";
};

const italyEuroFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export function formatEuro(value: number, options?: FormatEuroOptions): string {
  const signDisplay = options?.signDisplay ?? "auto";

  if (options?.style === "locale") {
    const formatted = italyEuroFormatter.format(value);
    if (signDisplay === "always" && value >= 0) {
      return `+${formatted}`;
    }
    return formatted;
  }

  const signPrefix = signDisplay === "always" && value >= 0 ? "+" : "";
  return `€${signPrefix}${value.toFixed(2)}`;
}
