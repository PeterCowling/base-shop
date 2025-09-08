jest.mock("../../dataRoot", () => ({
  DATA_ROOT: "/data/root",
}));

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    rename: jest.fn(),
  },
}));

jest.mock("../../themeTokens/index", () => ({
  baseTokens: { base: "base" },
  loadThemeTokens: jest.fn(async () => ({ theme: "theme" })),
}));

jest.mock("../shop.json.server", () => ({
  updateShopInRepo: jest.fn(async (_shop: string, patch: any) => patch),
}));

import { promises as fs } from "fs";
import { loadThemeTokens } from "../../themeTokens/index";
import { readShop, writeShop } from "../shops.json.server";
import { updateShopInRepo } from "../shop.json.server";

describe("shops.json.server", () => {
  const readFile = fs.readFile as jest.Mock;
  const mkdir = fs.mkdir as jest.Mock;
  const writeFile = fs.writeFile as jest.Mock;
  const rename = fs.rename as jest.Mock;
  const updateRepo = updateShopInRepo as jest.Mock;
  const loadTokens = loadThemeTokens as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reads shop from the filesystem", async () => {
    const fileData = {
      id: "shop1",
      name: "FS Shop",
      catalogFilters: [],
      themeId: "base",
      filterMappings: {},
      themeDefaults: { color: "red" },
      themeOverrides: { color: "blue" },
    };
    readFile.mockResolvedValue(JSON.stringify(fileData));

    const result = await readShop("shop1");

    expect(result.name).toBe("FS Shop");
    expect(loadTokens).not.toHaveBeenCalled();
  });

  it("returns default shop when file is missing", async () => {
    readFile.mockRejectedValue(new Error("missing"));

    const result = await readShop("missing");

    expect(result.id).toBe("missing");
    expect(loadTokens).toHaveBeenCalled();
  });

  it("writes shop via updateShopInRepo", async () => {
    readFile.mockResolvedValue(
      JSON.stringify({
        id: "shop1",
        name: "Shop",
        catalogFilters: [],
        themeId: "base",
        filterMappings: {},
        themeDefaults: {},
        themeOverrides: {},
      }),
    );

    const result = await writeShop("shop1", { id: "shop1", name: "Updated" });

    expect(updateRepo).toHaveBeenCalled();
    expect(result.name).toBe("Updated");
  });
});

