// apps/skylar/src/lib/__tests__/locales.test.ts
import {
  DEFAULT_LOCALE,
  getLocaleFromParams,
  resolveLocale,
  type LangRouteParams,
} from "../locales";

describe("resolveLocale", () => {
  it("returns the provided locale string", () => {
    expect(resolveLocale("it")).toBe("it");
  });

  it("uses the first entry when the value is an array", () => {
    expect(resolveLocale(["zh", "en"])).toBe("zh");
  });

  it("falls back to the default locale when parsing fails", () => {
    expect(resolveLocale("de")).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
  });
});

describe("getLocaleFromParams", () => {
  it("returns the lang param when it is valid", () => {
    expect(getLocaleFromParams({ lang: "zh" })).toBe("zh");
  });

  it("supports Next array params by using the first value", () => {
    const params = { lang: ["it", "en"] } as unknown as LangRouteParams;
    expect(getLocaleFromParams(params)).toBe("it");
  });

  it("falls back to the default locale for invalid params", () => {
    expect(getLocaleFromParams({ lang: "jp" } as LangRouteParams)).toBe(
      DEFAULT_LOCALE,
    );
    expect(getLocaleFromParams(undefined)).toBe(DEFAULT_LOCALE);
  });
});

