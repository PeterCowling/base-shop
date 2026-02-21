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

// eslint-disable-next-line import/first
import { setupTest, shop, teardown } from "./testUtils";

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
