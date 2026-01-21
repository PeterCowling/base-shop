import { nowIso } from "@acme/date-utils";

import { setupMocks } from "./analyticsTestUtils";

jest.mock("@acme/zod-utils/initZod", () => ({}));

describe("syncCampaignAnalytics", () => {
  it("fetches stats and forwards them to analytics", async () => {
    const { trackEvent } = setupMocks();
    process.env.EMAIL_PROVIDER = "sendgrid";
    const stats = { delivered: 1, opened: 2, clicked: 3, unsubscribed: 4, bounced: 5 };
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
    const { trackEvent } = setupMocks();
    process.env.EMAIL_PROVIDER = "sendgrid";
    const stats = { delivered: 1, opened: 2, clicked: 3, unsubscribed: 4, bounced: 5 };
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
    const { trackEvent } = setupMocks();
    process.env.EMAIL_PROVIDER = "resend";
    const stats = { delivered: 1, opened: 2, clicked: 3, unsubscribed: 4, bounced: 5 };
    const getCampaignStats = jest.fn().mockResolvedValue(stats);
    jest.doMock("../providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
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
    const { trackEvent } = setupMocks();
    process.env.EMAIL_PROVIDER = "sendgrid";
    const getCampaignStats = jest.fn(() => {
      throw new Error("fail");
    });
    jest.doMock("../providers/sendgrid", () => ({
      SendgridProvider: jest
        .fn()
        .mockImplementation(() => ({ getCampaignStats })),
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
      const { trackEvent } = setupMocks();
      if (provider === undefined) delete process.env.EMAIL_PROVIDER;
      else process.env.EMAIL_PROVIDER = provider;

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

  it("tracks stats for campaigns across multiple shops", async () => {
    const { trackEvent } = setupMocks();
    process.env.EMAIL_PROVIDER = "sendgrid";
    const stats = { delivered: 1, opened: 2, clicked: 3, unsubscribed: 4, bounced: 5 };
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
    const { trackEvent } = setupMocks();
    process.env.EMAIL_PROVIDER = "sendgrid";
    const error = new Error("track fail");
    trackEvent.mockRejectedValue(error);
    const stats = { delivered: 1, opened: 2, clicked: 3, unsubscribed: 4, bounced: 5 };
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

  it("ignores unsupported email provider", async () => {
    const { trackEvent } = setupMocks();
    process.env.EMAIL_PROVIDER = "unsupported";
    const getCampaignStore = jest.fn(() => {
      throw new Error("getCampaignStore should not be called");
    });
    jest.doMock("../storage", () => ({ __esModule: true, getCampaignStore }));
    jest.doMock("../providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../providers/resend", () => ({ ResendProvider: jest.fn() }));
    const { syncCampaignAnalytics } = await import("../analytics");
    await expect(syncCampaignAnalytics()).resolves.toBeUndefined();
    expect(trackEvent).not.toHaveBeenCalled();
    expect(getCampaignStore).not.toHaveBeenCalled();
  });
});
