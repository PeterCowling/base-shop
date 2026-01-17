import { promises as fs, type Dirent } from "node:fs";
import path from "node:path";
import { DATA_ROOT } from "@acme/platform-core/dataRoot";
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

  it("returns [] when campaigns file missing", async () => {
    const shop = "missing-file";
    await fs.rm(path.join(DATA_ROOT, shop), { recursive: true, force: true });
    await expect(fsCampaignStore.readCampaigns(shop)).resolves.toEqual([]);
  });

  it("returns [] when readdir throws", async () => {
    jest.spyOn(fs, "readdir").mockRejectedValue(new Error("fail"));
    await expect(fsCampaignStore.listShops())
      .resolves.toEqual([]);
  });

  it("returns only directories when listing shops", async () => {
    const dir = path.join(DATA_ROOT, "shopDir");
    const file = path.join(DATA_ROOT, "file.txt");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(file, "", "utf8");
    const dirent = (name: string, isDir: boolean): Dirent => ({
      name,
      isDirectory: () => isDir,
    } as Dirent);
    jest
      .spyOn(fs, "readdir")
      .mockResolvedValue([dirent("shopDir", true), dirent("file.txt", false)]);
    await expect(fsCampaignStore.listShops()).resolves.toEqual(["shopDir"]);
    await fs.rm(dir, { recursive: true, force: true });
    await fs.rm(file, { force: true });
  });

  it("propagates writeFile errors", async () => {
    jest.spyOn(fs, "writeFile").mockRejectedValue(new Error("fail"));
    await expect(
      fsCampaignStore.writeCampaigns("shop", []),
    ).rejects.toThrow("fail");
  });

  it("writes campaigns when directory exists", async () => {
    const shop = "existing-dir";
    const dir = path.join(DATA_ROOT, shop);
    await fs.mkdir(dir, { recursive: true });
    await expect(fsCampaignStore.writeCampaigns(shop, [])).resolves.toBeUndefined();
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("returns [] when campaigns.json has invalid JSON", async () => {
    const shop = "invalid-json";
    const file = path.join(DATA_ROOT, shop, "campaigns.json");
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, "{", "utf8");
    await expect(fsCampaignStore.readCampaigns(shop))
      .resolves.toEqual([]);
    await fs.rm(path.join(DATA_ROOT, shop), { recursive: true, force: true });
  });

  it("returns [] when campaigns.json contains a non-array", async () => {
    const shop = "object-json";
    const file = path.join(DATA_ROOT, shop, "campaigns.json");
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, "{}", "utf8");
    await expect(fsCampaignStore.readCampaigns(shop))
      .resolves.toEqual([]);
    await fs.rm(path.join(DATA_ROOT, shop), { recursive: true, force: true });
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

