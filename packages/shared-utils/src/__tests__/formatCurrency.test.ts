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

  it.each(["BAD", "US", ""]) (
    "throws RangeError for invalid currency %s",
    (currency) => {
      expect(() => formatCurrency(100, currency as any)).toThrow(RangeError);
    }
  );

  it.each([12345, 12345.6]) (
    "converts and rounds minor units %p correctly",
    (minor) => {
      const expected = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
      }).format(minor / 100);
      expect(formatCurrency(minor)).toBe(expected);
    }
  );

  it.each([-12345, -12345.6]) (
    "formats negative minor-unit amount %p",
    (minor) => {
      const expected = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
      }).format(minor / 100);
      expect(formatCurrency(minor)).toBe(expected);
    }
  );

  it.each(["de-DE", "fr-FR"]) (
    "uses explicit locale %s over default locale",
    (locale) => {
      const minor = 123456; // $1234.56
      const expected = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "USD",
      }).format(minor / 100);
      expect(formatCurrency(minor, "USD", locale)).toBe(expected);
      expect(formatCurrency(minor, "USD", locale)).not.toBe(
        formatCurrency(minor, "USD")
      );
    }
  );

  it("formats lowercase currency codes", () => {
    const amount = 100; // $1.00
    const expected = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(1);
    expect(formatCurrency(amount, "usd")).toBe(expected);
  });

  it("throws RangeError for invalid currency pattern", () => {
    expect(() => formatCurrency(100, "EU" as any)).toThrow(RangeError);
  });

  it("throws RangeError when Intl.supportedValuesOf excludes the code", () => {
    const original = (Intl as any).supportedValuesOf;
    (Intl as any).supportedValuesOf = () => ["USD", "EUR"];
    try {
      expect(() => formatCurrency(100, "ABC")).toThrow(RangeError);
    } finally {
      if (original) {
        (Intl as any).supportedValuesOf = original;
      } else {
        delete (Intl as any).supportedValuesOf;
      }
    }
  });

  it("formats EUR in German locale", () => {
    const minor = 12345; // 123.45
    const expected = new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(123.45);
    expect(formatCurrency(minor, "EUR", "de-DE")).toBe(expected);
  });
});
