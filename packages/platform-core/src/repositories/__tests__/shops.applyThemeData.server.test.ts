import { shopSchema } from "@acme/types";

import { loadThemeTokens } from "../../themeTokens/index";
import * as shops from "../shops.server";

jest.mock("../shop.server", () => ({
  getShopById: jest.fn(),
  updateShopInRepo: jest.fn(async (_shop: string, patch: any) => patch),
}));

jest.mock("../../themeTokens/index", () => ({
  baseTokens: { base: "base" },
  loadThemeTokens: jest.fn(async () => ({ theme: "theme" })),
}));

const { applyThemeData } = shops;

describe("shops.repository — applyThemeData", () => {
  const loadTokens = loadThemeTokens as jest.Mock;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("loads tokens when defaults are empty", async () => {
    const data = shopSchema.parse({
      id: "shop-theme",
      name: "Theme Shop",
      catalogFilters: [],
      themeId: "base",
      filterMappings: {},
      themeDefaults: {},
      themeOverrides: {},
    });

    const result = await applyThemeData(data);

    expect(loadTokens).toHaveBeenCalledWith("base");
    expect(result.themeDefaults).toEqual({ base: "base", theme: "theme" });
    expect(result.themeTokens).toEqual({ base: "base", theme: "theme" });
  });
});

