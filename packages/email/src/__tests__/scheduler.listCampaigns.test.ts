import { setupTest, teardown, shop } from "./testUtils";

describe("listCampaigns", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardown();
  });

  test("forwards arguments to the campaign store", async () => {
    const data: any[] = [];
    const readCampaigns = jest.fn().mockResolvedValue(data);
    const getCampaignStore = jest.fn().mockReturnValue({ readCampaigns });
    await jest.isolateModulesAsync(async () => {
      jest.doMock("../storage", () => ({ __esModule: true, getCampaignStore }));
      const { listCampaigns } = await import("../scheduler");
      await expect(listCampaigns(shop)).resolves.toBe(data);
      expect(readCampaigns).toHaveBeenCalledWith(shop);
    });
  });
});
