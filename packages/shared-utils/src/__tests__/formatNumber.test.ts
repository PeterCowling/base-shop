import { formatNumber } from "../formatNumber.ts";

describe("formatNumber", () => {
  it("formats using the default locale when none is provided", () => {
    const value = 12345.6789;
    expect(formatNumber(value)).toBe(new Intl.NumberFormat().format(value));
  });

  it("respects Intl.NumberFormat options", () => {
    const value = 1234.5678;
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    expect(formatNumber(value, options)).toBe(
      new Intl.NumberFormat(undefined, options).format(value)
    );
  });

  it("accepts a locale string as the second argument", () => {
    const value = 9876.54321;
    const locale = "de-DE";

    expect(formatNumber(value, locale)).toBe(
      new Intl.NumberFormat(locale).format(value)
    );
  });

  it("accepts a locale and options together", () => {
    const value = 0.256;
    const locale = "en-US";
    const options: Intl.NumberFormatOptions = {
      style: "percent",
      minimumFractionDigits: 1,
    };

    expect(formatNumber(value, locale, options)).toBe(
      new Intl.NumberFormat(locale, options).format(value)
    );
  });

  it("accepts options followed by a locale", () => {
    const value = 1234.5;
    const options: Intl.NumberFormatOptions = { minimumFractionDigits: 1 };
    const locale = "fr-FR";

    expect(formatNumber(value, options, locale)).toBe(
      new Intl.NumberFormat(locale, options).format(value)
    );
  });

  it("accepts options in the third position when locale is omitted", () => {
    const value = 0.125;
    const options: Intl.NumberFormatOptions = { style: "percent" };

    expect(formatNumber(value, undefined, options)).toBe(
      new Intl.NumberFormat(undefined, options).format(value)
    );
  });

  it.each([
    ["42", 42],
    [" 3.14 ", 3.14],
    ["", Number.NaN],
    ["abc", Number.NaN],
  ])("coerces string input %p", (input, numericValue) => {
    const expected = new Intl.NumberFormat().format(numericValue);
    expect(formatNumber(input)).toBe(expected);
  });

  it.each([null, undefined])("treats %p as NaN", (input) => {
    const expected = new Intl.NumberFormat().format(Number.NaN);
    expect(formatNumber(input)).toBe(expected);
  });

  it("treats unsupported types as NaN", () => {
    const expected = new Intl.NumberFormat().format(Number.NaN);
    expect(formatNumber(true as unknown as number)).toBe(expected);
  });

  it("formats bigint values", () => {
    const value = 1234567890123456789n;
    const locale = "en-US";
    const expected = new Intl.NumberFormat(locale).format(value);

    expect(formatNumber(value, locale)).toBe(expected);
  });
});

