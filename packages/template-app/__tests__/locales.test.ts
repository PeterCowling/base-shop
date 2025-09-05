import { assertLocales, resolveLocale } from "@i18n/locales";

describe("locales", () => {
  it("resolves supported locales and falls back to 'en'", () => {
    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale("de")).toBe("de");
    expect(resolveLocale("fr")).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
  });

  it("assertLocales rejects empty arrays", () => {
    expect(() => assertLocales([] as any)).toThrow("LOCALES must be a non-empty array");
    expect(() => assertLocales(undefined as any)).toThrow(
      "LOCALES must be a non-empty array"
    );
    expect(() => assertLocales(["en"])).not.toThrow();
  });
});

