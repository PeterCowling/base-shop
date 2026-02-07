import type { Campaign,CampaignStore } from "..";
import { fsCampaignStore, getCampaignStore, setCampaignStore } from "..";

describe("campaign store selection", () => {
  afterEach(() => {
    // reset to default store after each test
    setCampaignStore(fsCampaignStore);
  });

  it("returns fsCampaignStore by default", () => {
    expect(getCampaignStore()).toBe(fsCampaignStore);
  });

  it("returns the updated store after calling setCampaignStore", () => {
    const mockStore: CampaignStore = {
      readCampaigns: jest.fn(),
      writeCampaigns: jest.fn(),
      listShops: jest.fn(),
    };

    setCampaignStore(mockStore);
    expect(getCampaignStore()).toBe(mockStore);
  });
});

// Ensure type re-exports are accessible
const _typeCheck: Campaign | undefined = undefined;
