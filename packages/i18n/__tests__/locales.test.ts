import { assertLocales, resolveLocale } from "@acme/i18n";

describe("assertLocales", () => {
  it("throws on non-array values", () => {
    expect.assertions(1);
    try {
      assertLocales("nope" as any);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
    }
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
  it("returns supported locales", () => {
    expect(resolveLocale("de")).toBe("de");
  });

  it("falls back to 'en' for unsupported locales", () => {
    expect(resolveLocale("fr" as any)).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
  });
});
