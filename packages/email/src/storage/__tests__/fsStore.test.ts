import { promises as fs } from "node:fs";
import path from "node:path";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { fsCampaignStore } from "../fsStore";

jest.mock("@acme/lib", () => ({
  __esModule: true,
  validateShopName: (s: string) => s,
}));

describe("fsCampaignStore error handling", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns [] when readFile throws", async () => {
    jest.spyOn(fs, "readFile").mockRejectedValue(new Error("fail"));
    await expect(fsCampaignStore.readCampaigns("shop"))
      .resolves.toEqual([]);
  });

  it("returns [] when readdir throws", async () => {
    jest.spyOn(fs, "readdir").mockRejectedValue(new Error("fail"));
    await expect(fsCampaignStore.listShops())
      .resolves.toEqual([]);
  });
});

describe("fsCampaignStore persistence", () => {
  const shop = "fsstore";
  const shopDir = path.join(DATA_ROOT, shop);

  beforeEach(async () => {
    await fs.rm(shopDir, { recursive: true, force: true });
  });

  afterAll(async () => {
    await fs.rm(shopDir, { recursive: true, force: true });
  });

  it("persists campaigns to disk", async () => {
    const campaigns = [
      {
        id: "c1",
        recipients: [],
        subject: "Test",
        body: "<p>test</p>",
        sendAt: new Date().toISOString(),
      },
    ];

    await fsCampaignStore.writeCampaigns(shop, campaigns);
    const read = await fsCampaignStore.readCampaigns(shop);
    expect(read).toEqual(campaigns);
  });
});

