import { formatCurrency } from "../src/formatCurrency";

describe("formatCurrency", () => {
  it("formats minor-unit amounts using Intl.NumberFormat", () => {
    const amount = 12345; // $123.45
    expect(formatCurrency(amount, "USD", "en-US")).toBe(
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(123.45)
    );
  });
});
