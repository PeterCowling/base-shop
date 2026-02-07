
const addResourceBundle = jest.fn();
const hasResourceBundle = jest.fn(() => false);
const getGuidesBundle = jest.fn(() => undefined as unknown);
const loadGuidesNamespaceFromFs = jest.fn(async () => undefined as unknown);

jest.mock("@/i18n", () => ({
  __esModule: true,
  default: { addResourceBundle, hasResourceBundle },
}));

jest.mock("@/locales/guides", () => ({
  __esModule: true,
  getGuidesBundle,
}));

jest.mock("@/locales/_guides/node-loader", () => ({
  __esModule: true,
  loadGuidesNamespaceFromFs,
}));

const ORIGINAL_ENV = { ...import.meta.env };

beforeEach(() => {
  jest.resetModules();
  addResourceBundle.mockClear();
  hasResourceBundle.mockClear();
  getGuidesBundle.mockReset();
  loadGuidesNamespaceFromFs.mockReset();
});

afterEach(() => {
  Object.assign(import.meta.env, ORIGINAL_ENV);
});

describe("loadI18nNs client branch", () => {
  it("dynamically imports JSON and adds bundle when SSR=false", async () => {
    Object.assign(import.meta.env, { SSR: false, DEV: false });

    const { loadI18nNs } = await import("@/utils/loadI18nNs");

    await loadI18nNs("en", "aboutPage");

    expect(addResourceBundle).toHaveBeenCalledTimes(1);
    expect(addResourceBundle.mock.calls[0][0]).toBe("en");
    expect(addResourceBundle.mock.calls[0][1]).toBe("aboutPage");
    expect(addResourceBundle.mock.calls[0][2]).toBeTypeOf("object");
  });

  it("returns early when bundle already present", async () => {
    Object.assign(import.meta.env, { SSR: false, DEV: false });
    hasResourceBundle.mockReturnValueOnce(true);

    const { loadI18nNs } = await import("@/utils/loadI18nNs");
    await loadI18nNs("en", "aboutPage");
    expect(addResourceBundle).not.toHaveBeenCalled();
  });

  it("hydrates guides namespaces from the prebuilt bundle", async () => {
    Object.assign(import.meta.env, { SSR: false, DEV: false });
    const guidesBundle = { intro: "text" };
    getGuidesBundle.mockReturnValueOnce(guidesBundle);

    const { loadI18nNs } = await import("@/utils/loadI18nNs");
    await loadI18nNs("en", "guides");

    expect(addResourceBundle).toHaveBeenCalledWith("en", "guides", guidesBundle, true, true);
    expect(loadGuidesNamespaceFromFs).not.toHaveBeenCalled();
  });
});

describe("preloadI18nNamespaces optional handling", () => {
  it("swallows missing bundle errors when optional=true", async () => {
    Object.assign(import.meta.env, { SSR: true, DEV: false });

    const { preloadI18nNamespaces } = await import("@/utils/loadI18nNs");
    await expect(
      preloadI18nNamespaces("en", ["aboutPage", "__does_not_exist__"], { optional: true }),
    ).resolves.toBeUndefined();

    expect(addResourceBundle).toHaveBeenCalled();
  });

  it("propagates errors when optional=false", async () => {
    Object.assign(import.meta.env, { SSR: true, DEV: false });

    const { preloadI18nNamespaces } = await import("@/utils/loadI18nNs");
    await expect(
      preloadI18nNamespaces("en", ["__does_not_exist__"], { optional: false }),
    ).rejects.toBeTruthy();
  });
});

describe("loadI18nNs guides server branch", () => {
  it("falls back to filesystem loader when runtime bundle missing", async () => {
    Object.assign(import.meta.env, { SSR: true, DEV: false });
    const fsBundle = { intro: "offline" };
    loadGuidesNamespaceFromFs.mockResolvedValueOnce(fsBundle);

    const { loadI18nNs } = await import("@/utils/loadI18nNs");
    await loadI18nNs("it", "guides");

    expect(getGuidesBundle).toHaveBeenCalledWith("it");
    expect(loadGuidesNamespaceFromFs).toHaveBeenCalledWith("it");
    expect(addResourceBundle).toHaveBeenCalledWith("it", "guides", fsBundle, true, true);

    await loadI18nNs("it", "guides");
    expect(loadGuidesNamespaceFromFs).toHaveBeenCalledTimes(1);
  });
});