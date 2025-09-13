import { assertLocales, resolveLocale, LOCALES, locales } from "../locales";

describe("assertLocales", () => {
  it("throws when provided an empty array or non-array", () => {
    for (const value of [[], "nope"]) {
      expect(() => assertLocales(value as any)).toThrow(
        "LOCALES must be a non-empty array"
      );
    }
  });

  it("throws when provided null or undefined", () => {
    for (const value of [null, undefined]) {
      expect(() => assertLocales(value as any)).toThrow(
        "LOCALES must be a non-empty array"
      );
    }
  });

  it("does not throw for non-empty arrays", () => {
    expect(() => assertLocales(["en"] as any)).not.toThrow();
  });
});

describe("resolveLocale", () => {
  it("returns the provided locale when valid", () => {
    expect(resolveLocale("de")).toBe("de");
  });

  it("defaults to 'en' when locale is undefined", () => {
    expect(resolveLocale(undefined)).toBe("en");
  });

  it("returns 'en' for mixed-case inputs or values not in LOCALES", () => {
    expect(resolveLocale("eN" as any)).toBe("en");
    expect(resolveLocale("fr" as any)).toBe("en");
  });
});

describe("locale constants", () => {
  it("exports supported locales", () => {
    expect(LOCALES).toEqual(["en", "de", "it"]);
    expect(locales).toBe(LOCALES);
  });
});
