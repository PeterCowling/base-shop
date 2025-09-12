import parse from "../src/parseMultilingualInput";
import { LOCALES } from "../src/locales";

describe("parseMultilingualInput normalization", () => {
  it("normalizes single-locale input", () => {
    expect(parse({ en: " Hello " }, LOCALES)).toEqual({ en: "Hello" });
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
});
