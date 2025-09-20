import { setupTest, teardown, shop, sendCampaignEmail } from "./testUtils";
import { sendDueCampaigns } from "../scheduler";

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
});

