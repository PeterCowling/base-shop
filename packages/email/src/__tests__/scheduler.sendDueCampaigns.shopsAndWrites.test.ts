// Mock i18n to avoid dynamic import issues (Jest hoists this above imports)
jest.mock("@acme/i18n/useTranslations.server", () => ({
  __esModule: true,
  useTranslations: jest.fn(() =>
    Promise.resolve((key: string) => key === "email.unsubscribe" ? "Unsubscribe" : key)
  ),
}));
jest.mock("@acme/lib", () => ({
  validateShopName: jest.fn((s: string) => s),
}));
jest.mock("@acme/platform-core/repositories/analytics.server", () => ({
  listEvents: jest.fn().mockResolvedValue([]),
}));

// eslint-disable-next-line import/first
import { sendDueCampaigns } from "../scheduler";

// eslint-disable-next-line import/first
import { sendCampaignEmail, setupTest, shop, teardown } from "./testUtils";

describe("sendDueCampaigns – shops and writes", () => {
  let ctx: ReturnType<typeof setupTest>;

  beforeEach(() => {
    ctx = setupTest();
  });

  afterEach(() => {
    teardown();
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
    ctx.memory["shop-a"] = [
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
    ctx.memory["shop-b"] = [
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
    expect(ctx.writeCampaigns).toHaveBeenCalledWith("shop-a", ctx.memory["shop-a"]);
    expect(ctx.writeCampaigns).toHaveBeenCalledWith("shop-b", ctx.memory["shop-b"]);
    expect(ctx.memory["shop-a"][0].sentAt).toBeDefined();
    expect(ctx.memory["shop-a"][1].sentAt).toBeUndefined();
    expect(ctx.memory["shop-b"][0].sentAt).toBeDefined();
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
});

