import { assertLocales, resolveLocale } from "@i18n/locales";

describe("locales", () => {
  it("resolves supported locales and falls back to 'en'", () => {
    expect(resolveLocale("en")).toBe("en");
    const maybeDe = resolveLocale("de" as any);
    expect(["en","de"]).toContain(maybeDe);
    expect(resolveLocale("fr" as any)).toBe("en");
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
