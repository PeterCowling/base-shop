import { formatCurrency } from "../formatCurrency";

describe("formatCurrency", () => {
  it("defaults to USD when currency is omitted", () => {
    const amount = 12345; // $123.45
    expect(formatCurrency(amount)).toBe(
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
      }).format(123.45)
    );
  });

  it("formats using provided currency code", () => {
    const amount = 12345; // $123.45
    expect(formatCurrency(amount, "EUR", "de-DE")).toBe(
      new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
      }).format(123.45)
    );
  });
});
