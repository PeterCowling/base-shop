import { assertLocales, resolveLocale } from "../locales";

describe("assertLocales", () => {
  it("throws on non-array values", () => {
    expect(() => assertLocales(undefined as any)).toThrow(
      "LOCALES must be a non-empty array"
    );
  });

  it("throws on empty arrays", () => {
    expect(() => assertLocales([] as any)).toThrow(
      "LOCALES must be a non-empty array"
    );
  });

  it("does not throw on non-empty arrays", () => {
    expect(() => assertLocales(["en"])).not.toThrow();
  });
});

describe("resolveLocale", () => {
  it("returns supported locales and falls back to 'en'", () => {
    expect(resolveLocale("de")).toBe("de");
    expect(resolveLocale("fr" as any)).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
  });
});
