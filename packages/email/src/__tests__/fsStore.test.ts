import { promises as fs } from "node:fs";
import { fsCampaignStore } from "../storage/fsStore";

jest.mock("@acme/lib", () => ({
  __esModule: true,
  validateShopName: (s: string) => s,
}));

describe("fsCampaignStore invalid JSON", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns [] when fs.readFile returns invalid JSON", async () => {
    jest.spyOn(fs, "readFile").mockResolvedValue("{");
    await expect(fsCampaignStore.readCampaigns("shop"))
      .resolves.toEqual([]);
  });
});
