// Mock i18n to avoid dynamic import issues (Jest hoists this above imports)
import { createCampaign } from "../scheduler";

import {
  listEvents,
  resolveSegment,
  sendCampaignEmail,
  setupTest,
  shop,
  teardown,
} from "./testUtils";

jest.mock("@acme/i18n/useTranslations.server", () => ({
  useTranslations: jest.fn(() =>
    Promise.resolve((key: string) => key === "email.unsubscribe" ? "Unsubscribe" : key)
  ),
}));

describe("createCampaign – recipients resolution and filtering", () => {
  let ctx: ReturnType<typeof setupTest>;

  beforeEach(() => {
    ctx = setupTest();
  });

  afterEach(() => {
    teardown();
  });

  test("createCampaign filters unsubscribed recipients using analytics events", async () => {
    (listEvents as jest.Mock).mockResolvedValueOnce([
      { type: "email_unsubscribe", email: "b@example.com" },
    ]);
    await createCampaign({
      shop,
      recipients: ["a@example.com", "b@example.com"],
      subject: "Hi",
      body: "<p>Hi %%UNSUBSCRIBE%%</p>",
    });
    expect(listEvents).toHaveBeenCalledWith(shop);
    expect(sendCampaignEmail).toHaveBeenCalledTimes(1);
    expect(sendCampaignEmail).toHaveBeenCalledWith({
      to: "a@example.com",
      subject: "Hi",
      html: expect.any(String),
    });
  });

  test("createCampaign resolves recipients from segment without explicit recipients", async () => {
    (resolveSegment as jest.Mock).mockResolvedValue(["seg@example.com"]);
    const id = await createCampaign({
      shop,
      segment: "test",
      subject: "Hi",
      body: "<p>Hi</p>",
    });
    expect(resolveSegment).toHaveBeenCalledWith(shop, "test");
    expect(sendCampaignEmail).toHaveBeenCalledWith({
      to: "seg@example.com",
      subject: "Hi",
      html: expect.any(String),
    });
    expect(typeof id).toBe("string");
    const campaign = ctx.memory[shop].find((c) => c.id === id)!;
    expect(campaign.recipients).toEqual(["seg@example.com"]);
  });

  test("deliverCampaign resolves segment once and updates recipients", async () => {
    (resolveSegment as jest.Mock).mockResolvedValue([
      "s1@example.com",
      "s2@example.com",
    ]);
    await createCampaign({
      shop,
      recipients: ["initial@example.com"],
      segment: "vip",
      subject: "Hi",
      body: "<p>Hi %%UNSUBSCRIBE%%</p>",
    });
    expect(resolveSegment).toHaveBeenCalledTimes(1);
    expect(resolveSegment).toHaveBeenCalledWith(shop, "vip");
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
    const sentTo = (sendCampaignEmail as jest.Mock).mock.calls.map((c) => c[0].to);
    expect(sentTo).toEqual(["s1@example.com", "s2@example.com"]);
    const campaign = ctx.memory[shop][0];
    expect(campaign.recipients).toEqual(["s1@example.com", "s2@example.com"]);
  });

  test("createCampaign falls back to original recipients when analytics fails", async () => {
    (listEvents as jest.Mock).mockRejectedValueOnce(new Error("oops"));
    await createCampaign({
      shop,
      recipients: ["a@example.com", "b@example.com"],
      subject: "Hi",
      body: "<p>Hi %%UNSUBSCRIBE%%</p>",
    });
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
    const sentTo = (sendCampaignEmail as jest.Mock).mock.calls.map((c) => c[0].to);
    expect(sentTo).toEqual(["a@example.com", "b@example.com"]);
  });
});
