import { setupTest, teardown, shop, sendCampaignEmail, validateShopName } from "./testUtils";
import { sendDueCampaigns } from "../scheduler";

describe("sendDueCampaigns – errors and validation", () => {
  let ctx: ReturnType<typeof setupTest>;

  beforeEach(() => {
    ctx = setupTest();
  });

  afterEach(() => {
    teardown();
  });

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
});

