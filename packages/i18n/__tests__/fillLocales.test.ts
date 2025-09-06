import { fillLocales, LOCALES } from "@acme/i18n";

describe("fillLocales", () => {
  it("fills missing locales using the fallback and keeps provided values", () => {
    const result = fillLocales({ en: "Hello" }, "Hi");

    expect(Object.keys(result)).toEqual([...LOCALES]);
    expect(result).toEqual({ en: "Hello", de: "Hi", it: "Hi" });
  });

  it("uses the fallback when no values are provided", () => {
    const result = fillLocales(undefined, "Hi");

    expect(Object.keys(result)).toEqual([...LOCALES]);
    for (const locale of LOCALES) {
      expect(result[locale]).toBe("Hi");
    }
  });
});
