import { fillLocales } from "../string";
import { LOCALES } from "@i18n/locales";

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
});

