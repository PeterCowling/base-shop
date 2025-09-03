import { fillLocales } from "../fillLocales";
import { resolveLocale } from "../locales";

describe("locale utilities", () => {
  it("returns provided locale mappings unchanged", () => {
    const values = { en: "Hello", de: "Hallo", it: "Ciao" };

    expect(fillLocales(values, "Hi")).toEqual(values);
  });

  it("fills missing locales using the fallback", () => {
    const values = { en: "Hello" };

    expect(fillLocales(values, "Hi")).toEqual({
      en: "Hello",
      de: "Hi",
      it: "Hi",
    });
  });

  it("defaults unknown locale codes to 'en'", () => {
    expect(resolveLocale("fr" as any)).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
  });
});
