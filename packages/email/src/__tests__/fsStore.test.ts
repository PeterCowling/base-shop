import { promises as fs } from "node:fs";
import path from "node:path";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { fsCampaignStore } from "../storage/fsStore";

describe("fsCampaignStore.writeCampaigns", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("creates directory and writes campaigns.json", async () => {
    const mkdir = jest.spyOn(fs, "mkdir").mockResolvedValue(undefined as any);
    const writeFile = jest
      .spyOn(fs, "writeFile")
      .mockResolvedValue(undefined as any);

    const shop = "shop";
    const campaigns: any[] = [];

    await fsCampaignStore.writeCampaigns(shop, campaigns);

    expect(mkdir).toHaveBeenCalledWith(path.join(DATA_ROOT, shop), {
      recursive: true,
    });
    expect(writeFile).toHaveBeenCalledWith(
      path.join(DATA_ROOT, shop, "campaigns.json"),
      JSON.stringify(campaigns, null, 2),
      "utf8",
    );
  });

  it("throws when writeFile rejects", async () => {
    jest.spyOn(fs, "mkdir").mockResolvedValue(undefined as any);
    const error = new Error("write failed");
    jest.spyOn(fs, "writeFile").mockRejectedValue(error);

    await expect(fsCampaignStore.writeCampaigns("shop", [])).rejects.toThrow(
      error,
    );
  });
});

describe("fsCampaignStore.readCampaigns", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns an empty array when campaigns.json is missing", async () => {
    const enoent = Object.assign(new Error("not found"), { code: "ENOENT" });
    jest.spyOn(fs, "readFile").mockRejectedValue(enoent);

    await expect(fsCampaignStore.readCampaigns("shop"))
      .resolves.toEqual([]);
  });

  it("returns an empty array when campaigns.json contains malformed JSON", async () => {
    jest.spyOn(fs, "readFile").mockResolvedValue("{invalid json");

    await expect(fsCampaignStore.readCampaigns("shop"))
      .resolves.toEqual([]);
  });
});

describe("fsCampaignStore.listShops", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns directory names", async () => {
    jest.spyOn(fs, "readdir").mockResolvedValue([
      { name: "shop-a", isDirectory: () => true },
      { name: "file.txt", isDirectory: () => false },
      { name: "shop-b", isDirectory: () => true },
    ] as any);

    await expect(fsCampaignStore.listShops()).resolves.toEqual([
      "shop-a",
      "shop-b",
    ]);
  });

  it("returns an empty array when readdir fails", async () => {
    jest
      .spyOn(fs, "readdir")
      .mockRejectedValue(new Error("failed to read directory"));

    await expect(fsCampaignStore.listShops()).resolves.toEqual([]);
  });
});
