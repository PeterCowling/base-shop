import { fillLocales } from "../fillLocales";
import { LOCALES } from "../locales";

describe("fillLocales edge cases", () => {
  it("fills all locales when provided an empty object", () => {
    const result = fillLocales({}, "Hi");

    for (const locale of LOCALES) {
      expect(result[locale]).toBe("Hi");
    }
  });

  it("fills missing locales when default locale is absent", () => {
    const values = { it: "Ciao" };
    const result = fillLocales(values, "Hi");

    expect(result).toEqual({ en: "Hi", de: "Hi", it: "Ciao" });
    expect(result.it).toBe(values.it);
  });

  it("preserves references for nested objects and arrays", () => {
    const nested = { msg: "Hi" };
    const arr = ["Hi"];

    const resultObj = fillLocales({ en: nested } as any, "Hi" as any);
    const resultArr = fillLocales({ en: arr } as any, "Hi" as any);

    expect(resultObj.en).toBe(nested);
    expect(resultArr.en).toBe(arr);
  });
});
