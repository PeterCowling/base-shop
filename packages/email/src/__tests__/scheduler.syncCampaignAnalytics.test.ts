import { setupTest, teardown, fetchCampaignAnalytics } from "./testUtils";
import { syncCampaignAnalytics } from "../scheduler";

describe("syncCampaignAnalytics", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardown();
  });

  test("delegates to analytics module", async () => {
    await syncCampaignAnalytics();
    expect(fetchCampaignAnalytics).toHaveBeenCalled();
  });

  test("handles analytics failures gracefully", async () => {
    (fetchCampaignAnalytics as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    await expect(syncCampaignAnalytics()).resolves.toBeUndefined();
    expect(fetchCampaignAnalytics).toHaveBeenCalled();
  });

  test("resolves when analytics module throws", async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock('../analytics', () => ({
        __esModule: true,
        syncCampaignAnalytics: jest.fn(() => { throw new Error('fail'); }),
      }));
      const { syncCampaignAnalytics } = await import('../scheduler');
      await expect(syncCampaignAnalytics()).resolves.toBeUndefined();
    });
  });
});
