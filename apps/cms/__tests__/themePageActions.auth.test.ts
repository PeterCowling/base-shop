// apps/cms/__tests__/themePageActions.auth.test.ts
// Auth guard tests for savePreset and deletePreset server actions.

const mockEnsureAuthorized = jest.fn();
const mockSaveThemePreset = jest.fn();
const mockDeleteThemePreset = jest.fn();

jest.mock("../src/actions/common/auth", () => ({
  ensureAuthorized: () => mockEnsureAuthorized(),
}));

jest.mock("@acme/platform-core/repositories/themePresets.server", () => ({
  saveThemePreset: (...args: any[]) => mockSaveThemePreset(...args),
  deleteThemePreset: (...args: any[]) => mockDeleteThemePreset(...args),
  getThemePresets: jest.fn().mockResolvedValue({}),
}));

// Stub remaining imports used by the page module so it can be loaded.
jest.mock("@acme/platform-core/createShop", () => ({
  listThemes: jest.fn().mockReturnValue([]),
}));
jest.mock("@acme/platform-core/repositories/shops.server", () => ({
  readShop: jest.fn().mockResolvedValue({ themeId: "base", themeOverrides: {} }),
}));
jest.mock("@acme/platform-core/themeTokens", () => ({
  baseTokens: {},
  loadThemeTokens: jest.fn().mockResolvedValue({}),
}));
jest.mock("../src/app/cms/shop/[shop]/themes/ThemeEditor", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));

describe("themes page server actions — auth guard", () => {
  beforeEach(() => {
    jest.resetModules();
    mockEnsureAuthorized.mockReset();
    mockSaveThemePreset.mockReset();
    mockDeleteThemePreset.mockReset();
  });

  describe("savePreset", () => {
    it("throws Forbidden when unauthenticated", async () => {
      mockEnsureAuthorized.mockRejectedValue(new Error("Forbidden"));

      const { savePreset } = await import(
        "../src/app/cms/shop/[shop]/themes/page"
      );

      await expect(
        savePreset("myshop", "dark", { "--color-bg": "#000" })
      ).rejects.toThrow("Forbidden");
    });

    it("calls saveThemePreset when authorized", async () => {
      mockEnsureAuthorized.mockResolvedValue({ user: { role: "admin" } });
      mockSaveThemePreset.mockResolvedValue(undefined);

      const { savePreset } = await import(
        "../src/app/cms/shop/[shop]/themes/page"
      );

      await savePreset("myshop", "dark", { "--color-bg": "#000" });

      expect(mockEnsureAuthorized).toHaveBeenCalledTimes(1);
      expect(mockSaveThemePreset).toHaveBeenCalledWith("myshop", "dark", {
        "--color-bg": "#000",
      });
    });

    it("does not call saveThemePreset when auth fails", async () => {
      mockEnsureAuthorized.mockRejectedValue(new Error("Forbidden"));

      const { savePreset } = await import(
        "../src/app/cms/shop/[shop]/themes/page"
      );

      await expect(
        savePreset("myshop", "dark", { "--color-bg": "#000" })
      ).rejects.toThrow("Forbidden");

      expect(mockSaveThemePreset).not.toHaveBeenCalled();
    });
  });

  describe("deletePreset", () => {
    it("throws Forbidden when unauthenticated", async () => {
      mockEnsureAuthorized.mockRejectedValue(new Error("Forbidden"));

      const { deletePreset } = await import(
        "../src/app/cms/shop/[shop]/themes/page"
      );

      await expect(deletePreset("myshop", "dark")).rejects.toThrow("Forbidden");
    });

    it("calls deleteThemePreset when authorized", async () => {
      mockEnsureAuthorized.mockResolvedValue({ user: { role: "admin" } });
      mockDeleteThemePreset.mockResolvedValue(undefined);

      const { deletePreset } = await import(
        "../src/app/cms/shop/[shop]/themes/page"
      );

      await deletePreset("myshop", "dark");

      expect(mockEnsureAuthorized).toHaveBeenCalledTimes(1);
      expect(mockDeleteThemePreset).toHaveBeenCalledWith("myshop", "dark");
    });

    it("does not call deleteThemePreset when auth fails", async () => {
      mockEnsureAuthorized.mockRejectedValue(new Error("Forbidden"));

      const { deletePreset } = await import(
        "../src/app/cms/shop/[shop]/themes/page"
      );

      await expect(deletePreset("myshop", "dark")).rejects.toThrow("Forbidden");

      expect(mockDeleteThemePreset).not.toHaveBeenCalled();
    });
  });
});
