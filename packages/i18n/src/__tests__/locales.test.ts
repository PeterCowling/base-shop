import {
  assertLocales,
  LOCALES,
  locales,
  normalizeUiLocale,
  resolveLocale,
} from "../locales";

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

describe("normalizeUiLocale", () => {
  it("TC-N1 normalizes 'it' to 'it'", () => {
    expect(normalizeUiLocale("it")).toBe("it");
  });

  it("TC-N2 normalizes 'en' to 'en'", () => {
    expect(normalizeUiLocale("en")).toBe("en");
  });

  it("TC-N3 strips the region subtag from 'it-IT'", () => {
    expect(normalizeUiLocale("it-IT")).toBe("it");
  });

  it("TC-N4 strips region subtags from English variants", () => {
    expect(normalizeUiLocale("en-US")).toBe("en");
    expect(normalizeUiLocale("en-GB")).toBe("en");
  });

  it("TC-N5 falls back for unsupported bare locales", () => {
    expect(normalizeUiLocale("de")).toBe("en");
    expect(normalizeUiLocale("fr")).toBe("en");
    expect(normalizeUiLocale("ja")).toBe("en");
  });

  it("TC-N6 falls back for undefined, null, and empty string", () => {
    expect(normalizeUiLocale(undefined)).toBe("en");
    expect(normalizeUiLocale(null)).toBe("en");
    expect(normalizeUiLocale("")).toBe("en");
  });

  it("TC-N7 falls back for unsupported localized/script variants", () => {
    expect(normalizeUiLocale("zh-Hans")).toBe("en");
    expect(normalizeUiLocale("de-AT")).toBe("en");
  });

  it("lowercases the base tag before checking", () => {
    expect(normalizeUiLocale("IT")).toBe("it");
  });
});
