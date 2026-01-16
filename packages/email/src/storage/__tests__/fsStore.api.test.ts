import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

describe("fsCampaignStore basic operations", () => {
  let tmpDir: string;
  let store: any;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "fs-store-test-"));
    jest.resetModules();
    jest.doMock("@acme/platform-core/dataRoot", () => ({ DATA_ROOT: tmpDir }));
    jest.doMock("@acme/lib", () => ({
      __esModule: true,
      validateShopName: (s: string) => s,
    }));
    ({ fsCampaignStore: store } = await import("../fsStore"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("saves and retrieves campaigns", async () => {
    const shop = "demo";
    const campaigns = [
      {
        id: "c1",
        recipients: [],
        subject: "Subject",
        body: "<p>Body</p>",
        sendAt: new Date().toISOString(),
      },
    ];

    await store.writeCampaigns(shop, campaigns);
    const file = path.join(tmpDir, shop, "campaigns.json");
    const disk = JSON.parse(await fs.readFile(file, "utf8"));
    expect(disk).toEqual(campaigns);

    const read = await store.readCampaigns(shop);
    expect(read).toEqual(campaigns);
  });

  it("returns empty array for missing shop", async () => {
    const read = await store.readCampaigns("missing");
    expect(read).toEqual([]);
  });

  it("lists shops", async () => {
    await store.writeCampaigns("a", []);
    await store.writeCampaigns("b", []);
    const shops = await store.listShops();
    expect(shops.sort()).toEqual(["a", "b"]);
  });

  it("throws when saving undefined campaigns", async () => {
    await expect(store.writeCampaigns("bad", undefined as any)).rejects.toThrow();
  });

  it("supports quick successive access", async () => {
    const shop = "rapid";
    const campaigns = [
      {
        id: "c2",
        recipients: [],
        subject: "Quick",
        body: "<p>Quick</p>",
        sendAt: new Date().toISOString(),
      },
    ];
    await Promise.all([
      store.writeCampaigns(shop, campaigns),
      store.readCampaigns(shop),
    ]);
    const read = await store.readCampaigns(shop);
    expect(read).toEqual(campaigns);
  });
});

