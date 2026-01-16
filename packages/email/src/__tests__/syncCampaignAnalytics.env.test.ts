import { nowIso } from "@acme/date-utils";
jest.mock("@acme/zod-utils/initZod", () => ({}));

describe("syncCampaignAnalytics provider handling", () => {
  const memoryStore = {
    async listShops() {
      return ["shop1"];
    },
    async readCampaigns() {
      return [
        {
          id: "c1",
          recipients: [],
          subject: "s",
          body: "b",
          sendAt: nowIso(),
          sentAt: nowIso(),
        },
      ];
    },
  };

  beforeEach(() => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
  });

  it("returns early for unrecognized provider", async () => {
    process.env.EMAIL_PROVIDER = "unknown";
    const trackEvent = jest.fn();
    jest.doMock("@acme/platform-core/analytics", () => ({ __esModule: true, trackEvent }));
    const getCampaignStats = jest.fn();
    jest.doMock("../providers/sendgrid", () => ({
      SendgridProvider: jest.fn().mockImplementation(() => ({ getCampaignStats })),
    }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));
    const getCampaignStore = jest.fn().mockReturnValue(memoryStore);
    jest.doMock("../storage", () => ({ __esModule: true, getCampaignStore }));

    const { syncCampaignAnalytics } = await import("../analytics");
    await syncCampaignAnalytics();

    expect(getCampaignStore).not.toHaveBeenCalled();
    expect(getCampaignStats).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("sends empty stats when provider throws", async () => {
    process.env.EMAIL_PROVIDER = "sendgrid";
    const trackEvent = jest.fn();
    jest.doMock("@acme/platform-core/analytics", () => ({ __esModule: true, trackEvent }));
    const getCampaignStats = jest.fn().mockRejectedValue(new Error("fail"));
    jest.doMock("../providers/sendgrid", () => ({
      SendgridProvider: jest.fn().mockImplementation(() => ({ getCampaignStats })),
    }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));
    const getCampaignStore = jest.fn().mockReturnValue(memoryStore);
    jest.doMock("../storage", () => ({ __esModule: true, getCampaignStore }));

    const { syncCampaignAnalytics, emptyStats } = await import("../analytics");
    await syncCampaignAnalytics();

    expect(getCampaignStats).toHaveBeenCalledWith("c1");
    expect(trackEvent).toHaveBeenCalledWith("shop1", {
      type: "email_campaign_stats",
      campaign: "c1",
      ...emptyStats,
    });
  });
});
