import parse from "../src/parseMultilingualInput";
import { LOCALES } from "../src/locales";

describe("parseMultilingualInput normalization", () => {
  it("trims whitespace for single-locale input", () => {
    expect(parse({ en: " Hello " }, LOCALES)).toEqual({ en: "Hello" });
  });

  it("coerces plain string to the default locale", () => {
    expect(parse(" Hello ", LOCALES)).toEqual({ [LOCALES[0]]: "Hello" });
  });

  it("handles multiple locales", () => {
    const result = parse({ en: "Hi", de: " Hallo " }, LOCALES);
    expect(result).toEqual({ en: "Hi", de: "Hallo" });
  });

  it("ignores invalid locale keys", () => {
    const input = { en: "Hi", fr: "Salut" };
    let result;
    expect(() => {
      result = parse(input, LOCALES);
    }).not.toThrow();
    expect(result).toEqual({ en: "Hi" });
    expect(result).not.toHaveProperty("fr");
  });

  it("drops empty strings", () => {
    const result = parse({ en: "", de: " Hallo " }, LOCALES);
    expect(result).toEqual({ de: "Hallo" });
  });

  it("retains translations for other locales when English is empty", () => {
    const result = parse({ en: "", it: "Ciao" }, LOCALES);
    expect(result).toEqual({ it: "Ciao" });
  });
});
