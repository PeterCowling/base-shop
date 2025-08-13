import { resetThemeOverride } from "../src/actions/shops.server";

const ensureAuthorized = jest.fn();
const getShopById = jest.fn();
const updateShopInRepo = jest.fn();

jest.mock("../src/actions/common/auth", () => ({ ensureAuthorized: () => ensureAuthorized() }));
jest.mock("@platform-core/src/repositories/shop.server", () => ({
  getShopById: (...args: any[]) => getShopById(...args),
  updateShopInRepo: (...args: any[]) => updateShopInRepo(...args),
}));
jest.mock("@platform-core/src/createShop", () => ({
  syncTheme: jest.fn(),
  loadTokens: jest.fn(),
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

describe("resetThemeOverride", () => {
  it("recomputes theme tokens from remaining overrides", async () => {
    getShopById.mockResolvedValue({
      id: "1",
      themeDefaults: { "--color-bg": "white", "--color-primary": "blue" },
      themeOverrides: { "--color-bg": "black", "--color-primary": "green" },
    });

    await resetThemeOverride("shop1", "--color-bg");

    expect(updateShopInRepo).toHaveBeenCalledWith("shop1", {
      id: "1",
      themeOverrides: { "--color-primary": "green" },
      themeTokens: { "--color-bg": "white", "--color-primary": "green" },
    });
  });
});
