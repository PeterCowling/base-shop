import { nowIso } from "@acme/date-utils";

process.env.CART_COOKIE_SECRET = "secret";

describe("analytics mapping", () => {
  it("normalizes SendGrid webhook events", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    jest.doMock("@platform-core/analytics", () => ({ __esModule: true, trackEvent: jest.fn() }));
    jest.doMock("../providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));
    const { mapSendGridEvent } = await import("../analytics");
    const ev = {
      event: "open",
      sg_message_id: "msg-1",
      email: "user@example.com",
      category: ["camp1"],
    };
    expect(mapSendGridEvent(ev)).toEqual({
      type: "email_open",
      campaign: "camp1",
      messageId: "msg-1",
      recipient: "user@example.com",
    });
  });

  it("normalizes Resend webhook events", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    jest.doMock("@platform-core/analytics", () => ({ __esModule: true, trackEvent: jest.fn() }));
    jest.doMock("../providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));
    const { mapResendEvent } = await import("../analytics");
    const ev = {
      type: "email.opened",
      data: {
        message_id: "m2",
        email: "user@example.com",
        campaign_id: "camp1",
      },
    };
    expect(mapResendEvent(ev)).toEqual({
      type: "email_open",
      campaign: "camp1",
      messageId: "m2",
      recipient: "user@example.com",
    });
  });

  it("maps SendGrid stats", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    jest.doMock("@platform-core/analytics", () => ({ __esModule: true, trackEvent: jest.fn() }));
    jest.doMock("../providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));
    const { mapSendGridStats } = await import("../analytics");
    const stats = {
      delivered: 1,
      opens: 2,
      clicks: 3,
      unsubscribes: 4,
      bounces: 5,
    };
    expect(mapSendGridStats(stats)).toEqual({
      delivered: 1,
      opened: 2,
      clicked: 3,
      unsubscribed: 4,
      bounced: 5,
    });
  });

  it("maps Resend stats", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    jest.doMock("@platform-core/analytics", () => ({ __esModule: true, trackEvent: jest.fn() }));
    jest.doMock("../providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));
    const { mapResendStats } = await import("../analytics");
    const stats = {
      delivered_count: 1,
      opened_count: 2,
      clicked_count: 3,
      unsubscribed_count: 4,
      bounced_count: 5,
    };
    expect(mapResendStats(stats)).toEqual({
      delivered: 1,
      opened: 2,
      clicked: 3,
      unsubscribed: 4,
      bounced: 5,
    });
  });
});

describe("syncCampaignAnalytics", () => {
  it("fetches stats and forwards them to analytics", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    process.env.EMAIL_PROVIDER = "sendgrid";

    const trackEvent = jest.fn().mockResolvedValue(undefined);
    jest.doMock("@platform-core/analytics", () => ({
      __esModule: true,
      trackEvent,
    }));
    const stats = {
      delivered: 1,
      opened: 2,
      clicked: 3,
      unsubscribed: 4,
      bounced: 5,
    };
    const getCampaignStats = jest.fn().mockResolvedValue(stats);
    jest.doMock("../providers/sendgrid", () => ({
      SendgridProvider: jest.fn().mockImplementation(() => ({
        getCampaignStats,
      })),
    }));
    jest.doMock("../providers/resend", () => ({
      ResendProvider: jest.fn(),
    }));

    const { setCampaignStore } = await import("../storage");
    const memoryStore = {
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
      async writeCampaigns() {},
      async listShops() {
        return ["shop1"];
      },
    };
    setCampaignStore(memoryStore as any);

    const { syncCampaignAnalytics } = await import("../analytics");
    await syncCampaignAnalytics();

    expect(getCampaignStats).toHaveBeenCalledWith("c1");
    expect(trackEvent).toHaveBeenCalledWith("shop1", {
      type: "email_campaign_stats",
      campaign: "c1",
      ...stats,
    });
  });
});
