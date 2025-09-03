import { nowIso } from "@date-utils";
// Stub the Zod initializer so tests don't attempt to execute the real module
// during import, which can cause transform issues in Jest.
jest.mock("@acme/zod-utils/initZod", () => ({}));

process.env.CART_COOKIE_SECRET = "secret";

describe("analytics mapping", () => {
  it("normalizes SendGrid webhook events with array category", async () => {
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

  it("normalizes SendGrid webhook events with string category", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    jest.doMock("@platform-core/analytics", () => ({ __esModule: true, trackEvent: jest.fn() }));
    jest.doMock("../providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));
    const { mapSendGridEvent } = await import("../analytics");
    const ev = {
      event: "open",
      sg_message_id: "msg-2",
      email: "user@example.com",
      category: "camp2",
    };
    expect(mapSendGridEvent(ev)).toEqual({
      type: "email_open",
      campaign: "camp2",
      messageId: "msg-2",
      recipient: "user@example.com",
    });
  });

  it("normalizes SendGrid webhook events without category", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    jest.doMock("@platform-core/analytics", () => ({ __esModule: true, trackEvent: jest.fn() }));
    jest.doMock("../providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));
    const { mapSendGridEvent } = await import("../analytics");
    const ev = {
      event: "open",
      sg_message_id: "msg-3",
      email: "user@example.com",
      category: undefined,
    } as const;
    expect(mapSendGridEvent(ev)).toEqual({
      type: "email_open",
      messageId: "msg-3",
      recipient: "user@example.com",
    });
  });

  it("normalizes Resend webhook events with campaign_id", async () => {
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

  it("normalizes Resend webhook events with campaign", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    jest.doMock("@platform-core/analytics", () => ({ __esModule: true, trackEvent: jest.fn() }));
    jest.doMock("../providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));
    const { mapResendEvent } = await import("../analytics");
    const ev = {
      type: "email.opened",
      data: {
        message_id: "m4",
        email: "user@example.com",
        campaign: "camp2",
      },
    };
    expect(mapResendEvent(ev)).toEqual({
      type: "email_open",
      campaign: "camp2",
      messageId: "m4",
      recipient: "user@example.com",
    });
  });

  it("normalizes Resend webhook events with missing data", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    jest.doMock("@platform-core/analytics", () => ({ __esModule: true, trackEvent: jest.fn() }));
    jest.doMock("../providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));
    const { mapResendEvent } = await import("../analytics");
    const ev = {
      type: "email.opened",
    };
    expect(mapResendEvent(ev)).toEqual({
      type: "email_open",
      campaign: undefined,
      messageId: undefined,
      recipient: undefined,
    });
  });

  it("uses recipient when email is missing", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    jest.doMock("@platform-core/analytics", () => ({ __esModule: true, trackEvent: jest.fn() }));
    jest.doMock("../providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));
    const { mapResendEvent } = await import("../analytics");
    const ev = {
      type: "email.opened",
      data: {
        recipient: "user@example.com",
      },
    };
    expect(mapResendEvent(ev)).toEqual({
      type: "email_open",
      campaign: undefined,
      messageId: undefined,
      recipient: "user@example.com",
    });
  });

  it("returns null for unknown SendGrid events", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    jest.doMock("@platform-core/analytics", () => ({ __esModule: true, trackEvent: jest.fn() }));
    jest.doMock("../providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));
    const { mapSendGridEvent } = await import("../analytics");
    expect(mapSendGridEvent({ event: "other" })).toBeNull();
  });

  it("returns null for unknown Resend types", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    jest.doMock("@platform-core/analytics", () => ({ __esModule: true, trackEvent: jest.fn() }));
    jest.doMock("../providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));
    const { mapResendEvent } = await import("../analytics");
    expect(mapResendEvent({ type: "email.unknown" })).toBeNull();
  });

  it("resolves campaign from data.campaign", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    jest.doMock("@platform-core/analytics", () => ({ __esModule: true, trackEvent: jest.fn() }));
    jest.doMock("../providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));
    const { mapResendEvent } = await import("../analytics");
    const ev = {
      type: "email.opened",
      data: {
        message_id: "m3",
        email: "user@example.com",
        campaign: "campX",
        campaign_id: "campY",
      },
    };
    expect(mapResendEvent(ev)).toEqual({
      type: "email_open",
      campaign: "campX",
      messageId: "m3",
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
      async listShops() {
        return ["shop1"];
      },
    };
    const getCampaignStore = jest.fn().mockReturnValue(memoryStore);
    jest.doMock("../storage", () => ({ __esModule: true, getCampaignStore }));

    const { syncCampaignAnalytics } = await import("../analytics");
    await syncCampaignAnalytics();

    expect(getCampaignStats).toHaveBeenCalledWith("c1");
    expect(trackEvent).toHaveBeenCalledWith("shop1", {
      type: "email_campaign_stats",
      campaign: "c1",
      ...stats,
    });
  });

  it("tracks empty stats when provider throws", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    process.env.EMAIL_PROVIDER = "sendgrid";

    const trackEvent = jest.fn().mockResolvedValue(undefined);
    jest.doMock("@platform-core/analytics", () => ({
      __esModule: true,
      trackEvent,
    }));

    const getCampaignStats = jest
      .fn()
      .mockRejectedValue(new Error("fail"));
    jest.doMock("../providers/sendgrid", () => ({
      SendgridProvider: jest.fn().mockImplementation(() => ({
        getCampaignStats,
      })),
    }));
    jest.doMock("../providers/resend", () => ({
      ResendProvider: jest.fn(),
    }));

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
      async listShops() {
        return ["shop1"];
      },
    };
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

  it("skips when provider is missing", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    process.env.EMAIL_PROVIDER = "unknown";

    const trackEvent = jest.fn();
    jest.doMock("@platform-core/analytics", () => ({ __esModule: true, trackEvent }));
    const getCampaignStats = jest.fn();
    jest.doMock("../providers/sendgrid", () => ({
      SendgridProvider: jest.fn().mockImplementation(() => ({ getCampaignStats })),
    }));
    jest.doMock("../providers/resend", () => ({
      ResendProvider: jest.fn().mockImplementation(() => ({ getCampaignStats })),
    }));
    const getCampaignStore = jest.fn();
    jest.doMock("../storage", () => ({ __esModule: true, getCampaignStore }));

    const { syncCampaignAnalytics } = await import("../analytics");
    await syncCampaignAnalytics();

    expect(getCampaignStore).not.toHaveBeenCalled();
    expect(getCampaignStats).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("skips campaigns without sentAt", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    process.env.EMAIL_PROVIDER = "sendgrid";

    const trackEvent = jest.fn().mockResolvedValue(undefined);
    jest.doMock("@platform-core/analytics", () => ({ __esModule: true, trackEvent }));
    const stats = {
      delivered: 1,
      opened: 2,
      clicked: 3,
      unsubscribed: 4,
      bounced: 5,
    };
    const getCampaignStats = jest.fn().mockResolvedValue(stats);
    jest.doMock("../providers/sendgrid", () => ({
      SendgridProvider: jest.fn().mockImplementation(() => ({ getCampaignStats })),
    }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));

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
          {
            id: "c2",
            recipients: [],
            subject: "s2",
            body: "b2",
            sendAt: nowIso(),
            sentAt: undefined,
          },
        ];
      },
      async listShops() {
        return ["shop1"];
      },
    };
    const getCampaignStore = jest.fn().mockReturnValue(memoryStore);
    jest.doMock("../storage", () => ({ __esModule: true, getCampaignStore }));

    const { syncCampaignAnalytics } = await import("../analytics");
    await syncCampaignAnalytics();

    expect(getCampaignStats).toHaveBeenCalledTimes(1);
    expect(getCampaignStats).toHaveBeenCalledWith("c1");
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("shop1", {
      type: "email_campaign_stats",
      campaign: "c1",
      ...stats,
    });
  });
});
