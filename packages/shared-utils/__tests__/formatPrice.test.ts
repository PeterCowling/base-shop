import { formatPrice } from "../src/formatPrice";

describe("formatPrice", () => {
  it("formats major-unit amounts using Intl.NumberFormat", () => {
    const amount = 123.45;
    expect(formatPrice(amount, "USD", "en-US")).toBe(
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
    );
  });
});
