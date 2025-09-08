jest.mock("../../dataRoot", () => ({
  DATA_ROOT: "/data/root",
}));

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    rename: jest.fn(),
  },
}));

import { promises as fs } from "fs";
import * as path from "path";
import { shopSchema } from "@acme/types";
import { getShopById, updateShopInRepo } from "../shop.json.server";

describe("shop.json.server", () => {
  const readFile = fs.readFile as jest.Mock;
  const mkdir = fs.mkdir as jest.Mock;
  const writeFile = fs.writeFile as jest.Mock;
  const rename = fs.rename as jest.Mock;

  const rawShopData = {
    id: "shop1",
    name: "Shop",
    catalogFilters: [],
    themeId: "theme",
    filterMappings: {},
  };
  const shopData = shopSchema.parse(rawShopData);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reads shop data from the filesystem", async () => {
    readFile.mockResolvedValue(JSON.stringify(rawShopData));
    await expect(getShopById("shop1")).resolves.toEqual(shopData);
    expect(readFile).toHaveBeenCalledWith(
      path.join("/data/root", "shop1", "shop.json"),
      "utf8",
    );
  });

  it("writes shop data to the filesystem", async () => {
    readFile.mockResolvedValue(JSON.stringify(rawShopData));
    const now = 123456;
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(now);

    await updateShopInRepo("shop1", { id: "shop1", name: "Updated" });

    const file = path.join("/data/root", "shop1", "shop.json");
    const tmp = `${file}.${now}.tmp`;

    expect(mkdir).toHaveBeenCalledWith(path.join("/data/root", "shop1"), {
      recursive: true,
    });
    expect(writeFile).toHaveBeenCalledWith(
      tmp,
      JSON.stringify({ ...shopData, name: "Updated" }, null, 2),
      "utf8",
    );
    expect(rename).toHaveBeenCalledWith(tmp, file);

    nowSpy.mockRestore();
  });
});

