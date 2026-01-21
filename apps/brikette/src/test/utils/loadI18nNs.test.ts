
const addResourceBundle = jest.fn();
const hasResourceBundle = jest.fn(() => false);
const getGuidesBundle = jest.fn(() => undefined);

jest.mock("@/i18n", () => ({
  __esModule: true,
  default: { addResourceBundle, hasResourceBundle },
}));

jest.mock("@/locales/guides", () => ({
  __esModule: true,
  getGuidesBundle,
}));

const ORIGINAL_ENV = { ...import.meta.env };

beforeEach(() => {
  jest.resetModules();
  addResourceBundle.mockClear();
  hasResourceBundle.mockClear();
  getGuidesBundle.mockClear();
  Object.assign(import.meta.env, { SSR: true });
});

afterEach(() => {
  Object.assign(import.meta.env, ORIGINAL_ENV);
});

describe("loadI18nNs", () => {
  it("loads a namespace only once on the server", async () => {
    const { loadI18nNs } = await import("@/utils/loadI18nNs");

    await loadI18nNs("en", "aboutPage");
    await loadI18nNs("en", "aboutPage");

    expect(addResourceBundle).toHaveBeenCalledTimes(1);
    expect(hasResourceBundle).toHaveBeenCalledTimes(2);
  });
});

describe("preloadNamespacesWithFallback", () => {
  it("preloads both the active locale and fallback locale", async () => {
    const mod = await import("@/utils/loadI18nNs");
    const preload = jest.fn().mockResolvedValue(undefined);

    await mod.preloadNamespacesWithFallback("it", ["guides"], { preload });

    expect(preload).toHaveBeenNthCalledWith(1, "it", ["guides"], { optional: false });
    expect(preload).toHaveBeenNthCalledWith(2, "en", ["guides"], { optional: false });
  });

  it("skips fallback preloading when the active locale matches", async () => {
    const mod = await import("@/utils/loadI18nNs");
    const preload = jest.fn().mockResolvedValue(undefined);

    await mod.preloadNamespacesWithFallback("en", ["guides"], { preload });

    expect(preload).toHaveBeenCalledTimes(1);
    expect(preload).toHaveBeenCalledWith("en", ["guides"], { optional: false });
  });

  it("honors the fallbackOptional override", async () => {
    const mod = await import("@/utils/loadI18nNs");
    const preload = jest.fn().mockResolvedValue(undefined);

    await mod.preloadNamespacesWithFallback("pt", ["guides"], {
      preload,
      optional: true,
      fallbackOptional: false,
      fallbackLang: "es",
    });

    expect(preload).toHaveBeenNthCalledWith(1, "pt", ["guides"], { optional: true });
    expect(preload).toHaveBeenNthCalledWith(2, "es", ["guides"], { optional: false });
  });
});