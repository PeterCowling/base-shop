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
});
