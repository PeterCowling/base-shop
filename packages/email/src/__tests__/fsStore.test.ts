import { promises as fs } from "node:fs";
import { fsCampaignStore } from "../storage/fsStore";

jest.mock("@acme/lib", () => ({
  __esModule: true,
  validateShopName: (s: string) => s,
}));

describe("fsCampaignStore listShops error handling", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("resolves to [] when fs.readdir rejects", async () => {
    jest.spyOn(fs, "readdir").mockRejectedValue(new Error("fail"));
    await expect(fsCampaignStore.listShops()).resolves.toEqual([]);
  });
});
