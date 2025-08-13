jest.mock("@platform-core/analytics", () => ({ trackEvent: jest.fn() }));

import { trackEvent } from "@platform-core/analytics";
import { syncCampaignStats } from "../analytics";
import type { CampaignProvider } from "../providers/types";

describe("syncCampaignStats", () => {
  it("forwards stats to analytics provider", async () => {
    const provider: CampaignProvider = {
      send: jest.fn(),
      getCampaignStats: jest.fn().mockResolvedValue([
        { id: "cmp1", delivered: 10, opened: 5 },
      ]),
    };

    await syncCampaignStats("shop1", provider);

    expect(provider.getCampaignStats).toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith("shop1", {
      type: "email_campaign_stats",
      campaign: "cmp1",
      delivered: 10,
      opened: 5,
    });
  });
});
