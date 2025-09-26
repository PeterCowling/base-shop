import { setupMocks } from "../src/__tests__/analyticsTestUtils";

describe("syncCampaignAnalytics", () => {
  afterEach(() => {
    delete process.env.EMAIL_PROVIDER;
  });

  it("returns early when EMAIL_PROVIDER is unset", async () => {
    jest.resetModules();
    const { trackEvent } = setupMocks();
    const getCampaignStore = jest.fn();
    jest.doMock("../src/storage", () => ({ __esModule: true, getCampaignStore }));

    delete process.env.EMAIL_PROVIDER;
    const { syncCampaignAnalytics } = await import("../src/analytics");
    await syncCampaignAnalytics();

    expect(getCampaignStore).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("returns early when EMAIL_PROVIDER is smtp", async () => {
    jest.resetModules();
    const { trackEvent } = setupMocks();
    const getCampaignStore = jest.fn();
    jest.doMock("../src/storage", () => ({ __esModule: true, getCampaignStore }));

    process.env.EMAIL_PROVIDER = "smtp";
    const { syncCampaignAnalytics } = await import("../src/analytics");
    await syncCampaignAnalytics();

    expect(getCampaignStore).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("sends stats for sent campaigns and falls back to empty stats on failure", async () => {
    jest.resetModules();
    const { trackEvent } = setupMocks();

    const stats = {
      delivered: 1,
      opened: 2,
      clicked: 3,
      unsubscribed: 4,
      bounced: 5,
    };
    const getCampaignStats = jest
      .fn()
      .mockResolvedValueOnce(stats)
      .mockRejectedValueOnce(new Error("boom"));
    jest.doMock("../src/providers/sendgrid", () => ({
      SendgridProvider: jest.fn().mockImplementation(() => ({ getCampaignStats })),
    }));

    const campaigns = [
      { id: "c1", recipients: [], subject: "s1", body: "b1", sendAt: "t1", sentAt: "t1" },
      { id: "c2", recipients: [], subject: "s2", body: "b2", sendAt: "t2", sentAt: "t2" },
      { id: "c3", recipients: [], subject: "s3", body: "b3", sendAt: "t3", sentAt: undefined },
    ];
    const store = {
      async listShops() {
        return ["shop1"];
      },
      async readCampaigns() {
        return campaigns;
      },
    };
    const getCampaignStore = jest.fn().mockReturnValue(store);
    jest.doMock("../src/storage", () => ({ __esModule: true, getCampaignStore }));

    process.env.EMAIL_PROVIDER = "sendgrid";
    const { syncCampaignAnalytics, emptyStats } = await import("../src/analytics");
    await syncCampaignAnalytics();

    expect(getCampaignStats).toHaveBeenCalledTimes(2);
    expect(trackEvent).toHaveBeenCalledTimes(2);
    expect(trackEvent).toHaveBeenNthCalledWith(1, "shop1", {
      type: "email_campaign_stats",
      campaign: "c1",
      ...stats,
    });
    expect(trackEvent).toHaveBeenNthCalledWith(2, "shop1", {
      type: "email_campaign_stats",
      campaign: "c2",
      ...emptyStats,
    });
  });

  it("sends stats for sent campaigns when using the Resend provider", async () => {
    jest.resetModules();
    const { trackEvent } = setupMocks();

    const stats = {
      delivered: 1,
      opened: 2,
      clicked: 3,
      unsubscribed: 4,
      bounced: 5,
    };
    const getCampaignStats = jest.fn().mockResolvedValue(stats);
    jest.doMock("../src/providers/resend", () => ({
      ResendProvider: jest.fn().mockImplementation(() => ({ getCampaignStats })),
    }));

    const campaigns = [
      { id: "c1", recipients: [], subject: "s1", body: "b1", sendAt: "t1", sentAt: "t1" },
      { id: "c2", recipients: [], subject: "s2", body: "b2", sendAt: "t2", sentAt: "t2" },
      { id: "c3", recipients: [], subject: "s3", body: "b3", sendAt: "t3", sentAt: undefined },
    ];
    const store = {
      async listShops() {
        return ["shop1"];
      },
      async readCampaigns() {
        return campaigns;
      },
    };
    const getCampaignStore = jest.fn().mockReturnValue(store);
    jest.doMock("../src/storage", () => ({ __esModule: true, getCampaignStore }));

    process.env.EMAIL_PROVIDER = "resend";
    const { syncCampaignAnalytics } = await import("../src/analytics");
    await syncCampaignAnalytics();

    expect(getCampaignStats).toHaveBeenCalledTimes(2);
    expect(trackEvent).toHaveBeenCalledTimes(2);
    expect(trackEvent).toHaveBeenNthCalledWith(1, "shop1", {
      type: "email_campaign_stats",
      campaign: "c1",
      ...stats,
    });
    expect(trackEvent).toHaveBeenNthCalledWith(2, "shop1", {
      type: "email_campaign_stats",
      campaign: "c2",
      ...stats,
    });
  });

  it("falls back to empty stats when Resend getCampaignStats throws", async () => {
    jest.resetModules();
    const { trackEvent } = setupMocks();

    const getCampaignStats = jest.fn().mockRejectedValue(new Error("boom"));
    jest.doMock("../src/providers/resend", () => ({
      ResendProvider: jest.fn().mockImplementation(() => ({ getCampaignStats })),
    }));

    const campaigns = [
      { id: "c1", recipients: [], subject: "s1", body: "b1", sendAt: "t1", sentAt: "t1" },
    ];
    const store = {
      async listShops() {
        return ["shop1"];
      },
      async readCampaigns() {
        return campaigns;
      },
    };
    const getCampaignStore = jest.fn().mockReturnValue(store);
    jest.doMock("../src/storage", () => ({ __esModule: true, getCampaignStore }));

    process.env.EMAIL_PROVIDER = "resend";
    const { syncCampaignAnalytics, emptyStats } = await import("../src/analytics");
    await syncCampaignAnalytics();

    expect(getCampaignStats).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("shop1", {
      type: "email_campaign_stats",
      campaign: "c1",
      ...emptyStats,
    });
  });
});

