import { fillLocales, LOCALES } from "@acme/i18n";

describe("fillLocales", () => {
  it("populates all locales and falls back when missing", () => {
    const result = fillLocales({ en: "Hello" }, "Hi");
    expect(Object.keys(result)).toEqual([...LOCALES]);
    for (const locale of LOCALES) {
      if (locale === "en") {
        expect(result[locale]).toBe("Hello");
      } else {
        expect(result[locale]).toBe("Hi");
      }
    }
  });

  it("uses fallback for undefined values", () => {
    const result = fillLocales(undefined, "Hi");
    expect(Object.keys(result)).toEqual([...LOCALES]);
    for (const locale of LOCALES) {
      expect(result[locale]).toBe("Hi");
    }
  });
});
