import { fillLocales } from "../fillLocales";
import { LOCALES } from "../locales";

describe("fillLocales", () => {
  it("fills all locales with the fallback when no values are provided", () => {
    const result = fillLocales(undefined, "Hi");

    for (const locale of LOCALES) {
      expect(result[locale]).toBe("Hi");
    }
  });

  it("populates missing locales with the fallback", () => {
    const result = fillLocales({ en: "Hello" }, "Hi");

    expect(result).toEqual({ en: "Hello", de: "Hi", it: "Hi" });
  });

  it("leaves existing locales unchanged", () => {
    const values = { en: "Hello", de: "Hallo", it: "Ciao" };
    const result = fillLocales(values, "Hi");

    expect(result).toEqual(values);
  });
});

