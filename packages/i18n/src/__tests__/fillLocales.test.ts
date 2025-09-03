import { fillLocales } from "../fillLocales";
import { LOCALES } from "../locales";

describe("fillLocales", () => {
  it("fills missing locales with the fallback and keeps provided values", () => {
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
