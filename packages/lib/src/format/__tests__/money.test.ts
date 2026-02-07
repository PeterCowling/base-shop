import {
  assertMinorInt,
  formatMinor,
  fromMinor,
  getCurrencyFractionDigits,
  normalizeCurrencyCode,
  toMinor,
} from "../money";

describe("money utilities", () => {
  test("normalizeCurrencyCode uppercases and validates", () => {
    expect(normalizeCurrencyCode("usd")).toBe("USD");
    expect(() => normalizeCurrencyCode("US" as any)).toThrow(RangeError);
  });

  test("getCurrencyFractionDigits matches Intl currency defaults", () => {
    expect(getCurrencyFractionDigits("USD")).toBe(
      new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).resolvedOptions()
        .maximumFractionDigits,
    );
    expect(getCurrencyFractionDigits("JPY")).toBe(
      new Intl.NumberFormat(undefined, { style: "currency", currency: "JPY" }).resolvedOptions()
        .maximumFractionDigits,
    );
  });

  test("assertMinorInt rejects non-integers", () => {
    expect(() => assertMinorInt(12.34)).toThrow(TypeError);
    expect(() => assertMinorInt("1234" as any)).toThrow(TypeError);
  });

  test("toMinor converts major units to minor units", () => {
    expect(toMinor("12.34", "USD")).toBe(1234);
    expect(toMinor(12.34, "USD")).toBe(1234);
    expect(toMinor("12", "USD")).toBe(1200);
  });

  test("toMinor rounds half-up at currency precision", () => {
    expect(toMinor("12.345", "USD")).toBe(1235);
    expect(toMinor("-12.345", "USD")).toBe(-1235);
  });

  test("toMinor respects zero-decimal currencies", () => {
    expect(toMinor("123", "JPY")).toBe(123);
    expect(toMinor("123.4", "JPY")).toBe(123);
    expect(toMinor("123.5", "JPY")).toBe(124);
  });

  test("fromMinor converts minor units to major string", () => {
    expect(fromMinor(1234, "USD")).toBe("12.34");
    expect(fromMinor(-1234, "USD")).toBe("-12.34");
    expect(fromMinor(123, "JPY")).toBe("123");
  });

  test("formatMinor formats currency with Intl", () => {
    expect(formatMinor(1234, "USD", "en-US")).toBe(
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(12.34),
    );
    expect(formatMinor(123, "JPY", "ja-JP")).toBe(
      new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(123),
    );
  });
});
