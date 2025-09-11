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
    const result = parse({ en: "Hi", fr: "Salut" }, LOCALES);
    expect(result).toEqual({ en: "Hi" });
  });

  it("drops empty strings", () => {
    const result = parse({ en: "", de: " Hallo " }, LOCALES);
    expect(result).toEqual({ de: "Hallo" });
  });
});
