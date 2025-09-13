import { fillLocales } from "../fillLocales";
import { LOCALES } from "../locales";

describe("fillLocales", () => {
  it("uses the fallback for all locales when values is undefined", () => {
    const result = fillLocales(undefined, "Hi");

    for (const locale of LOCALES) {
      expect(result[locale]).toBe("Hi");
    }
  });

  it("uses the fallback for all locales when provided values are undefined", () => {
    const result = fillLocales(
      { en: undefined, de: undefined, it: undefined } as any,
      "Hi"
    );

    expect(result).toEqual({ en: "Hi", de: "Hi", it: "Hi" });
  });

  it("mixes provided values with fallbacks for missing locales", () => {
    const result = fillLocales({ en: "Hello" }, "Hi");

    expect(result).toEqual({ en: "Hello", de: "Hi", it: "Hi" });
  });

  it("replaces nullish locale values with the fallback", () => {
    const values = { en: null, de: undefined } as any;
    const result = fillLocales(values, "Hi");

    expect(result).toEqual({ en: "Hi", de: "Hi", it: "Hi" });
  });

  it("does not replace empty strings with the fallback", () => {
    const values = { en: "" } as any;
    const result = fillLocales(values, "Hi");

    expect(result).toEqual({ en: "", de: "Hi", it: "Hi" });
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

  it("returns a new object instance", () => {
    const values = { en: "Hello" } as any;
    const result = fillLocales(values, "Hi");

    expect(result).toEqual({ en: "Hello", de: "Hi", it: "Hi" });
    expect(result).not.toBe(values);
  });

  it("ignores keys outside LOCALES", () => {
    const result = fillLocales(
      { en: "Hello", fr: "Bonjour", es: "Hola" } as any,
      "Hi"
    );

    expect(result).toEqual({ en: "Hello", de: "Hi", it: "Hi" });
    expect(result).not.toHaveProperty("fr");
    expect(result).not.toHaveProperty("es");
  });
});

