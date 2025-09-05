import { assertLocales, resolveLocale, LOCALES, locales } from "../locales";

describe("assertLocales", () => {
  it("throws when provided value is not an array", () => {
    expect(() => assertLocales("nope" as any)).toThrow(
      "LOCALES must be a non-empty array"
    );
  });

  it("throws when provided an empty array", () => {
    expect(() => assertLocales([])).toThrow(
      "LOCALES must be a non-empty array"
    );
  });

  it("does not throw for non-empty arrays", () => {
    expect(() => assertLocales(["en"] as any)).not.toThrow();
  });
});

describe("resolveLocale", () => {
  it("returns the provided locale when valid", () => {
    expect(resolveLocale("de")).toBe("de");
  });

  it("defaults to 'en' for invalid or undefined locales", () => {
    expect(resolveLocale("fr" as any)).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
  });

  it("falls back to 'en' for unsupported locales", () => {
    expect(resolveLocale("jp" as any)).toBe("en");
  });
});

describe("locale constants", () => {
  it("exports supported locales", () => {
    expect(LOCALES).toEqual(["en", "de", "it"]);
    expect(locales).toBe(LOCALES);
  });
});
