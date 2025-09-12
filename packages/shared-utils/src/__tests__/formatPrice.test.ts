import { formatPrice } from "../formatPrice.ts";

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

  it.each(["BAD", "US", ""])(
    "throws RangeError for invalid currency %s",
    (currency) => {
      expect(() => formatPrice(1, currency as any)).toThrow(RangeError);
    }
  );

  it.each([123.456, 1.005])(
    "rounds fractional amount %p correctly",
    (amount) => {
      const expected = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
      }).format(amount);
      expect(formatPrice(amount)).toBe(expected);
    }
  );

  it("rounds values below one cent", () => {
    const expected = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(0.01);
    expect(formatPrice(0.005, "USD")).toBe(expected);
  });

  it.each([-1, -123.45])("formats negative amount %p", (amount) => {
    const expected = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(amount);
    expect(formatPrice(amount)).toBe(expected);
  });

  it.each(["de-DE", "ja-JP"])(
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

  it("applies thousands separators in en-US locale", () => {
    expect(formatPrice(1234567.89, "USD", "en-US")).toBe("$1,234,567.89");
  });

  it("formats when Intl.supportedValuesOf includes the currency", () => {
    const original = (Intl as any).supportedValuesOf;
    (Intl as any).supportedValuesOf = () => ["USD", "EUR"];
    const amount = 12.34;
    try {
      const formatted = formatPrice(amount, "USD", "en-GB");
      const expected = new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      expect(formatted).toBe(expected);
    } finally {
      if (original) {
        (Intl as any).supportedValuesOf = original;
      } else {
        delete (Intl as any).supportedValuesOf;
      }
    }
  });

  it("throws RangeError when currency is missing from Intl.supportedValuesOf", () => {
    const original = (Intl as any).supportedValuesOf;
    (Intl as any).supportedValuesOf = () => ["EUR"];
    try {
      expect(() => formatPrice(10, "USD")).toThrow(RangeError);
    } finally {
      if (original) {
        (Intl as any).supportedValuesOf = original;
      } else {
        delete (Intl as any).supportedValuesOf;
      }
    }
  });

  it("formats when Intl.supportedValuesOf is undefined", () => {
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

  it("formats a zero amount", () => {
    const expected = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(0);
    expect(formatPrice(0)).toBe(expected);
  });

  it.each([null, undefined])("formats %p as NaN", (value) => {
    const expected = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(NaN);
    expect(formatPrice(value as any)).toBe(expected);
  });

  it("handles currencies with zero fraction digits like JPY", () => {
    const amount = 123;
    const expected = new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
    expect(formatPrice(amount, "JPY", "ja-JP")).toBe(expected);
  });
});
