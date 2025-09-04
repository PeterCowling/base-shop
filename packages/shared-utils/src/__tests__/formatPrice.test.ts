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

  it.each(["BAD", "US", ""]) (
    "throws RangeError for invalid currency %s",
    (currency) => {
      expect(() => formatPrice(1, currency as any)).toThrow(RangeError);
    }
  );

  it.each([123.456, 1.005]) (
    "rounds fractional amount %p correctly",
    (amount) => {
      const expected = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
      }).format(amount);
      expect(formatPrice(amount)).toBe(expected);
    }
  );

  it.each([-1, -123.45]) ("formats negative amount %p", (amount) => {
    const expected = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(amount);
    expect(formatPrice(amount)).toBe(expected);
  });

  it.each(["de-DE", "ja-JP"]) (
    "uses explicit locale %s over default locale",
    (locale) => {
      const amount = 1234.56;
      const expected = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "USD",
      }).format(amount);
      const formatted = formatPrice(amount, "USD", locale);
      expect(formatted).toBe(expected);
      const defaultFormatted = formatPrice(amount, "USD");
      if (expected !== defaultFormatted) {
        expect(formatted).not.toBe(defaultFormatted);
      }
    }
  );

  it("throws when Intl.supportedValuesOf excludes the currency", () => {
    const original = (Intl as any).supportedValuesOf;
    (Intl as any).supportedValuesOf = () => ["USD", "EUR"];
    try {
      expect(() => formatPrice(10, "BTC")).toThrow(RangeError);
    } finally {
      if (original) {
        (Intl as any).supportedValuesOf = original;
      } else {
        delete (Intl as any).supportedValuesOf;
      }
    }
  });

  it("formats when Intl.supportedValuesOf is not available", () => {
    const original = (Intl as any).supportedValuesOf;
    delete (Intl as any).supportedValuesOf;
    const amount = 12.34;
    const expected = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
    expect(formatPrice(amount, "USD", "en-US")).toBe(expected);
    if (original) {
      (Intl as any).supportedValuesOf = original;
    } else {
      delete (Intl as any).supportedValuesOf;
    }
  });
});
