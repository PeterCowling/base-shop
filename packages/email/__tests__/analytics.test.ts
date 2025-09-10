import type { EmailAnalyticsEvent } from "../src/analytics";

// Helper to reset modules and set up mocks before each test
const setupMocks = () => {
  jest.resetModules();
  const trackEvent = jest.fn();
  jest.doMock("@platform-core/analytics", () => ({
    __esModule: true,
    trackEvent,
  }));
  jest.doMock("../src/providers/sendgrid", () => ({
    SendgridProvider: jest.fn(),
  }));
  jest.doMock("../src/providers/resend", () => ({
    ResendProvider: jest.fn(),
  }));
  return { trackEvent };
};

describe("mapSendGridEvent", () => {
  it.each([
    ["delivered", "email_delivered"],
    ["open", "email_open"],
    ["click", "email_click"],
    ["unsubscribe", "email_unsubscribe"],
    ["bounce", "email_bounce"],
  ])("maps %s events", async (event, type) => {
    setupMocks();
    const { mapSendGridEvent } = await import("../src/analytics");
    const ev = {
      event,
      sg_message_id: "m1",
      email: "user@example.com",
    } as const;
    expect(mapSendGridEvent(ev)).toEqual<EmailAnalyticsEvent>({
      type,
      messageId: "m1",
      recipient: "user@example.com",
    });
  });

  it("returns null for unknown events", async () => {
    setupMocks();
    const { mapSendGridEvent } = await import("../src/analytics");
    expect(mapSendGridEvent({ event: "processed" })).toBeNull();
  });

  it("maps category strings to campaigns", async () => {
    setupMocks();
    const { mapSendGridEvent } = await import("../src/analytics");
    const ev = {
      event: "open",
      category: "camp1",
      sg_message_id: "m1",
      email: "user@example.com",
    } as const;
    expect(mapSendGridEvent(ev)).toEqual<EmailAnalyticsEvent>({
      type: "email_open",
      campaign: "camp1",
      messageId: "m1",
      recipient: "user@example.com",
    });
  });

  it("uses the first value from category arrays", async () => {
    setupMocks();
    const { mapSendGridEvent } = await import("../src/analytics");
    const ev = {
      event: "open",
      sg_message_id: "m2",
      email: "user@example.com",
      category: ["camp1", "camp2"],
    } as const;
    expect(mapSendGridEvent(ev)).toEqual<EmailAnalyticsEvent>({
      type: "email_open",
      campaign: "camp1",
      messageId: "m2",
      recipient: "user@example.com",
    });
  });
});

describe("mapResendEvent", () => {
  it.each([
    ["email.delivered", "email_delivered"],
    ["email.opened", "email_open"],
    ["email.clicked", "email_click"],
    ["email.unsubscribed", "email_unsubscribe"],
    ["email.bounced", "email_bounce"],
  ])("maps %s events", async (evType, type) => {
    setupMocks();
    const { mapResendEvent } = await import("../src/analytics");
    const ev = {
      type: evType,
      data: {
        message_id: "r1",
        email: "user@example.com",
      },
    } as const;
    expect(mapResendEvent(ev)).toEqual<EmailAnalyticsEvent>({
      type,
      campaign: undefined,
      messageId: "r1",
      recipient: "user@example.com",
    });
  });

  it("uses recipient if email is missing", async () => {
    setupMocks();
    const { mapResendEvent } = await import("../src/analytics");
    const ev = {
      type: "email.delivered",
      data: {
        message_id: "r2",
        recipient: "alt@example.com",
      },
    } as const;
    expect(mapResendEvent(ev)).toEqual<EmailAnalyticsEvent>({
      type: "email_delivered",
      campaign: undefined,
      messageId: "r2",
      recipient: "alt@example.com",
    });
  });

  it("handles events with only campaign_id", async () => {
    setupMocks();
    const { mapResendEvent } = await import("../src/analytics");
    const ev = {
      type: "email.delivered",
      data: {
        campaign_id: "camp-1",
      },
    } as const;
    expect(mapResendEvent(ev)).toEqual<EmailAnalyticsEvent>({
      type: "email_delivered",
      campaign: "camp-1",
      messageId: undefined,
      recipient: undefined,
    });
  });

  it("handles events without data", async () => {
    setupMocks();
    const { mapResendEvent } = await import("../src/analytics");
    const ev = { type: "email.delivered" } as const;
    expect(mapResendEvent(ev)).toEqual<EmailAnalyticsEvent>({
      type: "email_delivered",
      campaign: undefined,
      messageId: undefined,
      recipient: undefined,
    });
  });

  it("returns null for unknown types", async () => {
    setupMocks();
    const { mapResendEvent } = await import("../src/analytics");
    expect(mapResendEvent({ type: "email.unknown" })).toBeNull();
  });
});

describe("syncCampaignAnalytics", () => {
  afterEach(() => {
    delete process.env.EMAIL_PROVIDER;
  });

  it("returns early when EMAIL_PROVIDER is unset", async () => {
    jest.resetModules();
    const trackEvent = jest.fn();
    jest.doMock("@platform-core/analytics", () => ({
      __esModule: true,
      trackEvent,
    }));
    jest.doMock("../src/providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../src/providers/resend", () => ({ ResendProvider: jest.fn() }));
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
    const trackEvent = jest.fn();
    jest.doMock("@platform-core/analytics", () => ({
      __esModule: true,
      trackEvent,
    }));
    jest.doMock("../src/providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../src/providers/resend", () => ({ ResendProvider: jest.fn() }));
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
    const trackEvent = jest.fn();
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
    const getCampaignStats = jest
      .fn()
      .mockResolvedValueOnce(stats)
      .mockRejectedValueOnce(new Error("boom"));
    jest.doMock("../src/providers/sendgrid", () => ({
      SendgridProvider: jest.fn().mockImplementation(() => ({ getCampaignStats })),
    }));
    jest.doMock("../src/providers/resend", () => ({ ResendProvider: jest.fn() }));

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
    const trackEvent = jest.fn();
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
    jest.doMock("../src/providers/resend", () => ({
      ResendProvider: jest.fn().mockImplementation(() => ({ getCampaignStats })),
    }));
    jest.doMock("../src/providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));

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
});

