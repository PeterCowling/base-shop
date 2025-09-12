import {
  setupTest,
  teardown,
  shop,
  listEvents,
  sendCampaignEmail,
  validateShopName,
} from "./testUtils";
import { sendDueCampaigns } from "../scheduler";

describe("sendDueCampaigns", () => {
  let ctx: ReturnType<typeof setupTest>;

  beforeEach(() => {
    ctx = setupTest();
  });

  afterEach(() => {
    teardown();
  });

  test("filterUnsubscribed skips unsubscribed recipients", async () => {
    const past = new Date(ctx.now.getTime() - 1000).toISOString();
    ctx.memory[shop] = [
      {
        id: "c1",
        recipients: ["a@example.com", "b@example.com"],
        subject: "Hi",
        body: "<p>Hi %%UNSUBSCRIBE%%</p>",
        segment: null,
        sendAt: past,
        templateId: null,
      },
    ];
    (listEvents as jest.Mock).mockResolvedValue([
      { type: "page_view" },
      { type: "email_unsubscribe", email: "b@example.com" },
      { type: "email_unsubscribe", email: 123 as any },
      { type: "signup", email: "c@example.com" },
    ]);
    await sendDueCampaigns();
    expect(listEvents).toHaveBeenCalledWith(shop);
    expect(sendCampaignEmail).toHaveBeenCalledTimes(1);
    const { to, html } = (sendCampaignEmail as jest.Mock).mock.calls[0][0];
    expect(to).toBe("a@example.com");
    expect(html).toContain("Unsubscribe");
    expect(html).not.toContain("%%UNSUBSCRIBE%%");
  });

  test("filterUnsubscribed returns original list on error", async () => {
    const past = new Date(ctx.now.getTime() - 1000).toISOString();
    ctx.memory[shop] = [
      {
        id: "c1",
        recipients: ["a@example.com", "b@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
        segment: null,
        sendAt: past,
        templateId: null,
      },
    ];
    (listEvents as jest.Mock).mockRejectedValue(new Error("fail"));
    await sendDueCampaigns();
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
    expect((sendCampaignEmail as jest.Mock).mock.calls.map((c) => c[0].to)).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });

  test("filterUnsubscribed keeps recipients when event email is not a string", async () => {
    const past = new Date(ctx.now.getTime() - 1000).toISOString();
    ctx.memory[shop] = [
      {
        id: "c1",
        recipients: ["a@example.com", "b@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
        segment: null,
        sendAt: past,
        templateId: null,
      },
    ];
    (listEvents as jest.Mock).mockResolvedValue([
      { type: "email_unsubscribe", email: 123 as any },
    ]);
    await sendDueCampaigns();
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
    expect((sendCampaignEmail as jest.Mock).mock.calls.map((c) => c[0].to)).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });

  test("executes campaign after advancing time", async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    ctx.memory[shop] = [
      {
        id: "c2",
        recipients: ["a@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
        segment: null,
        sendAt: future,
        templateId: null,
      },
    ];

    await sendDueCampaigns();
    expect(sendCampaignEmail).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(60_000);
    await sendDueCampaigns();
    expect(sendCampaignEmail).toHaveBeenCalledTimes(1);
  });

  test(
    "sendDueCampaigns marks campaign sent when all recipients unsubscribed",
    async () => {
      const past = new Date(ctx.now.getTime() - 1000).toISOString();
      ctx.memory[shop] = [
        {
          id: "c2",
          recipients: ["a@example.com"],
          subject: "Hi",
          body: "<p>Hi %%UNSUBSCRIBE%%</p>",
          segment: null,
          sendAt: past,
          templateId: null,
        },
      ];
      (listEvents as jest.Mock).mockResolvedValue([
        { type: "email_unsubscribe", email: "a@example.com" },
      ]);
      await sendDueCampaigns();
      expect(sendCampaignEmail).not.toHaveBeenCalled();
      expect(ctx.memory[shop][0].sentAt).toBeDefined();
    },
  );

  test("deliverCampaign rejects invalid shop names", async () => {
    (validateShopName as jest.Mock).mockImplementation((s: string) => {
      if (s === "bad*shop") throw new Error("invalid");
      return s;
    });
    const past = new Date(ctx.now.getTime() - 1000).toISOString();
    ctx.memory["bad*shop"] = [
      {
        id: "bad",
        recipients: ["a@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
        segment: null,
        sendAt: past,
        templateId: null,
      },
    ];
    await expect(sendDueCampaigns()).rejects.toThrow("invalid");
    expect(sendCampaignEmail).not.toHaveBeenCalled();
  });

  test("sendDueCampaigns aggregates campaign errors", async () => {
    const past = new Date(ctx.now.getTime() - 1000).toISOString();
    ctx.memory[shop] = [
      {
        id: "c1",
        recipients: ["a@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
        segment: null,
        sendAt: past,
        templateId: null,
      },
      {
        id: "c2",
        recipients: ["b@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
        segment: null,
        sendAt: past,
        templateId: null,
      },
    ];
    (sendCampaignEmail as jest.Mock)
      .mockRejectedValueOnce(new Error("fail1"))
      .mockRejectedValueOnce(new Error("fail2"));
    try {
      await sendDueCampaigns();
      throw new Error("should throw");
    } catch (err) {
      expect(err).toBeInstanceOf(AggregateError);
      expect((err as AggregateError).errors).toHaveLength(2);
      expect((err as Error).message).toBe("Failed campaigns: c1, c2");
    }
  });

  test("sendDueCampaigns exits early when no shops are returned", async () => {
    ctx.memory[shop] = [
      {
        id: "c1",
        recipients: ["a@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
        segment: null,
        sendAt: new Date(ctx.now.getTime() - 1000).toISOString(),
        templateId: null,
      },
    ];
    ctx.listShops.mockResolvedValue([]);
    await sendDueCampaigns();
    expect(ctx.listShops).toHaveBeenCalled();
    expect(ctx.readCampaigns).not.toHaveBeenCalled();
    expect(ctx.writeCampaigns).not.toHaveBeenCalled();
    expect(sendCampaignEmail).not.toHaveBeenCalled();
  });

  test("sendDueCampaigns writes campaigns only when sending due items", async () => {
    const past = new Date(ctx.now.getTime() - 1000).toISOString();
    const future = new Date(ctx.now.getTime() + 60000).toISOString();
    ctx.memory[shop] = [
      {
        id: "c1",
        recipients: ["a@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
        segment: null,
        sendAt: past,
        templateId: null,
      },
      {
        id: "c2",
        recipients: ["b@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
        segment: null,
        sendAt: future,
        templateId: null,
      },
    ];
    await sendDueCampaigns();
    expect(ctx.writeCampaigns).toHaveBeenCalledTimes(1);
    expect(ctx.writeCampaigns).toHaveBeenCalledWith(shop, ctx.memory[shop]);
  });

  test("sendDueCampaigns does nothing with empty campaign store", async () => {
    await sendDueCampaigns();
    expect(sendCampaignEmail).not.toHaveBeenCalled();
    expect(ctx.writeCampaigns).not.toHaveBeenCalled();
  });

  test("sendDueCampaigns does nothing when there are no shops", async () => {
    ctx.listShops.mockResolvedValue([]);
    await sendDueCampaigns();
    expect(sendCampaignEmail).not.toHaveBeenCalled();
    expect(ctx.writeCampaigns).not.toHaveBeenCalled();
  });

  test("sendDueCampaigns delivers due campaigns per shop", async () => {
    const past = new Date(ctx.now.getTime() - 1000).toISOString();
    const future = new Date(ctx.now.getTime() + 60000).toISOString();
    ctx.memory["shopA"] = [
      {
        id: "a1",
        recipients: ["a1@example.com"],
        subject: "A1",
        body: "<p>Hi %%UNSUBSCRIBE%%</p>",
        segment: null,
        sendAt: past,
        templateId: null,
      },
      {
        id: "a2",
        recipients: ["a2@example.com"],
        subject: "A2",
        body: "<p>Hi %%UNSUBSCRIBE%%</p>",
        segment: null,
        sendAt: future,
        templateId: null,
      },
    ];
    ctx.memory["shopB"] = [
      {
        id: "b1",
        recipients: ["b1@example.com"],
        subject: "B1",
        body: "<p>Hi %%UNSUBSCRIBE%%</p>",
        segment: null,
        sendAt: past,
        templateId: null,
      },
    ];
    await sendDueCampaigns();
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
    expect(ctx.writeCampaigns).toHaveBeenCalledTimes(2);
    expect(ctx.writeCampaigns).toHaveBeenCalledWith("shopA", ctx.memory["shopA"]);
    expect(ctx.writeCampaigns).toHaveBeenCalledWith("shopB", ctx.memory["shopB"]);
    expect(ctx.memory["shopA"][0].sentAt).toBeDefined();
    expect(ctx.memory["shopA"][1].sentAt).toBeUndefined();
    expect(ctx.memory["shopB"][0].sentAt).toBeDefined();
  });

  test("sendDueCampaigns skips campaigns already sent", async () => {
    const past = new Date(ctx.now.getTime() - 1000).toISOString();
    ctx.memory[shop] = [
      {
        id: "s1",
        recipients: ["s1@example.com"],
        subject: "S1",
        body: "<p>Hi</p>",
        segment: null,
        sendAt: past,
        sentAt: past,
        templateId: null,
      },
    ];
    await sendDueCampaigns();
    expect(sendCampaignEmail).not.toHaveBeenCalled();
    expect(ctx.writeCampaigns).not.toHaveBeenCalled();
  });

  test(
    "deliverCampaign batches recipients and adds unsubscribe link",
    async () => {
      process.env.EMAIL_BATCH_SIZE = "2";
      process.env.EMAIL_BATCH_DELAY_MS = "1000";
      process.env.NEXT_PUBLIC_BASE_URL = "https://base.test";
      const past = new Date(ctx.now.getTime() - 1000).toISOString();
      ctx.memory[shop] = [
        {
          id: "c1",
          recipients: ["a@example.com", "b@example.com", "c@example.com"],
          subject: "Hi",
          body: "<p>Hi</p>",
          segment: null,
          sendAt: past,
          templateId: null,
        },
      ];
      const p = sendDueCampaigns();
      await jest.advanceTimersByTimeAsync(0);
      expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
      const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0].html;
      expect(html).toContain("Unsubscribe");
      expect(html).toContain(
        "https://base.test/api/marketing/email/unsubscribe?shop=test-shop&campaign=c1&email=a%40example.com",
      );
      await jest.advanceTimersByTimeAsync(1000);
      await p;
      expect(sendCampaignEmail).toHaveBeenCalledTimes(3);
      expect(ctx.memory[shop][0].sentAt).toBeDefined();
    },
  );

  test("deliverCampaign encodes tracking URLs with base URL", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://base.example.com";
    const s = "shop/ü? ";
    const campaignId = "camp &aign/?";
    const recipient = "user+tag@example.com";
    const past = new Date(ctx.now.getTime() - 1000).toISOString();
    ctx.memory[s] = [
      {
        id: campaignId,
        recipients: [recipient],
        subject: "Hi",
        body: '<a href="https://example.com/a?b=1&c=2">A</a>%%UNSUBSCRIBE%%',
        segment: null,
        sendAt: past,
        templateId: null,
      },
    ];
    await sendDueCampaigns();
    const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0].html as string;
    const encodedShop = encodeURIComponent(s);
    const encodedId = encodeURIComponent(campaignId);
    const encodedEmail = encodeURIComponent(recipient);
    const encodedUrl = encodeURIComponent("https://example.com/a?b=1&c=2");
    expect(html).toContain(
      `https://base.example.com/api/marketing/email/open?shop=${encodedShop}&campaign=${encodedId}`,
    );
    expect(html).toContain(
      `https://base.example.com/api/marketing/email/click?shop=${encodedShop}&campaign=${encodedId}&url=${encodedUrl}`,
    );
    expect(html).toContain(
      `https://base.example.com/api/marketing/email/unsubscribe?shop=${encodedShop}&campaign=${encodedId}&email=${encodedEmail}`,
    );
  });

  test("deliverCampaign encodes tracking URLs without base URL", async () => {
    const s = "shop/ü? ";
    const campaignId = "camp &aign/?";
    const recipient = "user+tag@example.com";
    const past = new Date(ctx.now.getTime() - 1000).toISOString();
    ctx.memory[s] = [
      {
        id: campaignId,
        recipients: [recipient],
        subject: "Hi",
        body: '<a href="https://example.com/a?b=1&c=2">A</a>%%UNSUBSCRIBE%%',
        segment: null,
        sendAt: past,
        templateId: null,
      },
    ];
    await sendDueCampaigns();
    const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0].html as string;
    const encodedShop = encodeURIComponent(s);
    const encodedId = encodeURIComponent(campaignId);
    const encodedEmail = encodeURIComponent(recipient);
    const encodedUrl = encodeURIComponent("https://example.com/a?b=1&c=2");
    expect(html).toContain(
      `/api/marketing/email/open?shop=${encodedShop}&campaign=${encodedId}`,
    );
    expect(html).toContain(
      `/api/marketing/email/click?shop=${encodedShop}&campaign=${encodedId}&url=${encodedUrl}`,
    );
    expect(html).toContain(
      `/api/marketing/email/unsubscribe?shop=${encodedShop}&campaign=${encodedId}&email=${encodedEmail}`,
    );
  });
});
