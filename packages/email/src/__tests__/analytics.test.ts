import { nowIso } from "@date-utils";
// Stub the Zod initializer so tests don't attempt to execute the real module
// during import, which can cause transform issues in Jest.
jest.mock("@acme/zod-utils/initZod", () => ({}));

process.env.CART_COOKIE_SECRET = "secret";

describe("analytics mapping", () => {
  it.each([
    ["delivered", "email_delivered"],
    ["open", "email_open"],
    ["click", "email_click"],
    ["unsubscribe", "email_unsubscribe"],
    ["bounce", "email_bounce"],
  ])("maps SendGrid %s events", async (event, type) => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    jest.doMock("@platform-core/analytics", () => ({ __esModule: true, trackEvent: jest.fn() }));
    jest.doMock("../providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));
    const { mapSendGridEvent } = await import("../analytics");
    const ev = {
      event,
      sg_message_id: "msg",
      email: "user@example.com",
    };
    expect(mapSendGridEvent(ev)).toEqual({
      type,
      messageId: "msg",
      recipient: "user@example.com",
    });
  });

  it.each([
    ["email.delivered", "email_delivered"],
    ["email.opened", "email_open"],
    ["email.clicked", "email_click"],
    ["email.unsubscribed", "email_unsubscribe"],
    ["email.bounced", "email_bounce"],
  ])("maps Resend %s events", async (evType, type) => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    jest.doMock("@platform-core/analytics", () => ({ __esModule: true, trackEvent: jest.fn() }));
    jest.doMock("../providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));
    const { mapResendEvent } = await import("../analytics");
    const ev = {
      type: evType,
      data: {
        message_id: "m1",
        email: "user@example.com",
      },
    };
    expect(mapResendEvent(ev)).toEqual({
      type,
      campaign: undefined,
      messageId: "m1",
      recipient: "user@example.com",
    });
  });
  it("normalizes SendGrid webhook events with multi-value array category", async () => {
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
      category: ["a", "b"],
    };
    expect(mapSendGridEvent(ev)).toEqual({
      type: "email_open",
      campaign: "a",
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

  it("handles SendGrid events without sg_message_id", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    jest.doMock("@platform-core/analytics", () => ({ __esModule: true, trackEvent: jest.fn() }));
    jest.doMock("../providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));
    const { mapSendGridEvent } = await import("../analytics");
    const ev = {
      event: "open",
      email: "user@example.com",
    };
    expect(mapSendGridEvent(ev)).toEqual({
      type: "email_open",
      messageId: undefined,
      recipient: "user@example.com",
    });
  });

  it("handles SendGrid events without email", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    jest.doMock("@platform-core/analytics", () => ({ __esModule: true, trackEvent: jest.fn() }));
    jest.doMock("../providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));
    const { mapSendGridEvent } = await import("../analytics");
    const ev = {
      event: "open",
      sg_message_id: "msg-4",
    };
    expect(mapSendGridEvent(ev)).toEqual({
      type: "email_open",
      messageId: "msg-4",
      recipient: undefined,
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

  it("uses email when both email and recipient are provided", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    jest.doMock("@platform-core/analytics", () => ({ __esModule: true, trackEvent: jest.fn() }));
    jest.doMock("../providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));
    const { mapResendEvent } = await import("../analytics");
    const ev = {
      type: "email.opened",
      data: {
        email: "user@example.com",
        recipient: "other@example.com",
        message_id: "m5",
      },
    };
    expect(mapResendEvent(ev)).toEqual({
      type: "email_open",
      campaign: undefined,
      messageId: "m5",
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

  it("skips campaigns without sentAt", async () => {
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
      SendgridProvider: jest.fn().mockImplementation(() => ({ getCampaignStats })),
    }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));

    const memoryStore = {
      async listShops() {
        return ["shop1"];
      },
      async readCampaigns() {
        const common = {
          recipients: [],
          subject: "s",
          body: "b",
          sendAt: nowIso(),
        };
        return [
          { id: "c1", ...common, sentAt: nowIso() },
          { id: "c2", ...common },
        ];
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

  it("uses Resend provider when configured", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    process.env.EMAIL_PROVIDER = "resend";

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
      SendgridProvider: jest.fn(),
    }));
    jest.doMock("../providers/resend", () => ({
      ResendProvider: jest.fn().mockImplementation(() => ({ getCampaignStats })),
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

    const getCampaignStats = jest.fn(() => {
      throw new Error("fail");
    });
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

  it.each([undefined, "unknown"])(
    "exits without tracking when EMAIL_PROVIDER is %p",
    async (provider) => {
      jest.resetModules();
      process.env.CART_COOKIE_SECRET = "secret";
      if (provider === undefined) delete process.env.EMAIL_PROVIDER;
      else process.env.EMAIL_PROVIDER = provider;

      const trackEvent = jest.fn();
      jest.doMock("@platform-core/analytics", () => ({
        __esModule: true,
        trackEvent,
      }));
      jest.doMock("../providers/sendgrid", () => ({
        SendgridProvider: jest.fn(),
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

      expect(trackEvent).not.toHaveBeenCalled();
    }
  );

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

  it("tracks stats for campaigns across multiple shops", async () => {
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
      async listShops() {
        return ["shop1", "shop2"];
      },
      async readCampaigns(shop: string) {
        const common = {
          recipients: [],
          subject: "s",
          body: "b",
          sendAt: nowIso(),
          sentAt: nowIso(),
        };
        if (shop === "shop1") {
          return [
            { id: "c1", ...common },
            { id: "c2", ...common },
          ];
        }
        return [
          { id: "c3", ...common },
          { id: "c4", ...common },
        ];
      },
    };
    const getCampaignStore = jest.fn().mockReturnValue(memoryStore);
    jest.doMock("../storage", () => ({ __esModule: true, getCampaignStore }));

    const { syncCampaignAnalytics } = await import("../analytics");
    await syncCampaignAnalytics();

    expect(getCampaignStats).toHaveBeenCalledTimes(4);
    expect(getCampaignStats).toHaveBeenNthCalledWith(1, "c1");
    expect(getCampaignStats).toHaveBeenNthCalledWith(2, "c2");
    expect(getCampaignStats).toHaveBeenNthCalledWith(3, "c3");
    expect(getCampaignStats).toHaveBeenNthCalledWith(4, "c4");
    expect(trackEvent).toHaveBeenCalledTimes(4);
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
    expect(trackEvent).toHaveBeenNthCalledWith(3, "shop2", {
      type: "email_campaign_stats",
      campaign: "c3",
      ...stats,
    });
    expect(trackEvent).toHaveBeenNthCalledWith(4, "shop2", {
      type: "email_campaign_stats",
      campaign: "c4",
      ...stats,
    });
  });

  it("rejects when trackEvent fails", async () => {
    jest.resetModules();
    process.env.CART_COOKIE_SECRET = "secret";
    process.env.EMAIL_PROVIDER = "sendgrid";

    const error = new Error("track fail");
    const trackEvent = jest.fn().mockRejectedValue(error);
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
      SendgridProvider: jest
        .fn()
        .mockImplementation(() => ({ getCampaignStats })),
    }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));

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
    const getCampaignStore = jest.fn().mockReturnValue(memoryStore);
    jest.doMock("../storage", () => ({ __esModule: true, getCampaignStore }));

    const { syncCampaignAnalytics } = await import("../analytics");

    await expect(syncCampaignAnalytics()).rejects.toBe(error);
  });
});
