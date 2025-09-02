import { formatPrice } from "../formatPrice";

describe("formatPrice", () => {
  it("defaults to USD when currency is omitted", () => {
    const amount = 123.45;
    expect(formatPrice(amount)).toBe(
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
      }).format(amount)
    );
  });

  it("formats using provided currency code", () => {
    const amount = 123.45;
    expect(formatPrice(amount, "EUR", "de-DE")).toBe(
      new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
      }).format(amount)
    );
  });
});
