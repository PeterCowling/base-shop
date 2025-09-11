import { fillLocales } from "../fillLocales";
import { LOCALES } from "../locales";

describe("fillLocales", () => {
  it("fills all locales with the fallback when no values are provided", () => {
    const result = fillLocales(undefined, "Hi");

    for (const locale of LOCALES) {
      expect(result[locale]).toBe("Hi");
    }
  });

  it("fills a single missing locale with the fallback", () => {
    const result = fillLocales({ en: "Hello", de: "Hallo" }, "Hi");

    expect(result).toEqual({ en: "Hello", de: "Hallo", it: "Hi" });
  });

  it("preserves original values when all locales are provided", () => {
    const values = { en: "Hello", de: "Hallo", it: "Ciao" };
    const result = fillLocales(values, "Hi");

    expect(result).toEqual(values);
  });

  it("creates a shallow copy of provided locale values", () => {
    const nested = { greeting: "Hello" };
    const values = { en: nested } as any;
    const result = fillLocales(values, "Hi") as any;

    nested.greeting = "Hola";

    expect(result.en).toBe(nested);
    expect(result.en.greeting).toBe("Hola");
  });

  it("skips unsupported locales", () => {
    const result = fillLocales(
      { en: "Hello", fr: "Bonjour" } as any,
      "Hi"
    );

    expect(result).toEqual({ en: "Hello", de: "Hi", it: "Hi" });
  });
});

