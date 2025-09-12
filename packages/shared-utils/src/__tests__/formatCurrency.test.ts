import { formatCurrency } from "../formatCurrency.ts";

describe("formatCurrency", () => {
  it("rejects malformed currency codes", () => {
    expect(() => formatCurrency(100, "US" as any)).toThrow(RangeError);
    expect(() => formatCurrency(100, "usd" as any)).toThrow(RangeError);
    expect(() => formatCurrency(100, "US1" as any)).toThrow(RangeError);
  });

  it("throws for unsupported currencies when Intl.supportedValuesOf exists", () => {
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

  it("formats using a valid currency and locale", () => {
    const minor = 12345; // €123.45
    const expected = new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(123.45);
    expect(formatCurrency(minor, "EUR", "de-DE")).toBe(expected);
  });
  it("formats NaN when amount is undefined", () => {
    const expected = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(NaN);
    expect(formatCurrency(undefined as any)).toBe(expected);
  });

  it("formats NaN when amount is null", () => {
    const expected = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(NaN);
    expect(formatCurrency(null as any)).toBe(expected);
  });

  it("formats NaN when amount is NaN", () => {
    const expected = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(NaN);
    expect(formatCurrency(NaN as any)).toBe(expected);
  });

  it("defaults to USD when currency is omitted", () => {
    const amount = 12345; // $123.45
    expect(formatCurrency(amount)).toBe(
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
      }).format(123.45)
    );
  });

  it("falls back to USD when currency is undefined", () => {
    const expected = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(1);
    // explicitly pass undefined to exercise default parameter
    expect(formatCurrency(100, undefined as unknown as string)).toBe(expected);
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

  it.each(["BAD", "US", "", "usd"]) (
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

  it("throws RangeError for lowercase currency codes", () => {
    expect(() => formatCurrency(100, "usd" as any)).toThrow(RangeError);
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

  it("formats when Intl.supportedValuesOf is absent", () => {
    const original = (Intl as any).supportedValuesOf;
    delete (Intl as any).supportedValuesOf;
    try {
      const expected = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
      }).format(1);
      expect(formatCurrency(100)).toBe(expected);
    } finally {
      if (original) {
        (Intl as any).supportedValuesOf = original;
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

  it("formats a zero value without decimals", () => {
    const expected = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(0);
    expect(formatCurrency(0)).toBe(expected);
  });

  it("supports currencies with no minor units like JPY", () => {
    const minor = 12300; // represents ¥123
    const expected = new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(123);
    expect(formatCurrency(minor, "JPY", "ja-JP")).toBe(expected);
  });

  it("places currency symbol after amount in fr-FR", () => {
    const minor = 123456; // 1 234,56 €
    expect(formatCurrency(minor, "EUR", "fr-FR")).toBe("1\u202f234,56\u00a0€");
  });

  it("places currency symbol before amount in ja-JP", () => {
    const minor = 12345600; // ￥123,456
    expect(formatCurrency(minor, "JPY", "ja-JP")).toBe("￥123,456");
  });
});
