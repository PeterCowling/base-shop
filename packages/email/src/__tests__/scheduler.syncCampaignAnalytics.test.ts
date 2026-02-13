// Mocks must be hoisted before scheduler imports @acme/lib and analytics.server
jest.mock("@acme/i18n/useTranslations.server", () => ({
  __esModule: true,
  useTranslations: jest.fn(() =>
    Promise.resolve((key: string) => key === "email.unsubscribe" ? "Unsubscribe" : key)
  ),
}));
jest.mock("@acme/lib", () => ({
  validateShopName: jest.fn((s: string) => s),
}));
jest.mock("@acme/platform-core/repositories/analytics.server", () => ({
  listEvents: jest.fn().mockResolvedValue([]),
}));
jest.mock("../analytics", () => ({
  __esModule: true,
  syncCampaignAnalytics: jest.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line import/first
import { syncCampaignAnalytics } from "../scheduler";

// eslint-disable-next-line import/first
import { fetchCampaignAnalytics, setupTest, teardown } from "./testUtils";

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
