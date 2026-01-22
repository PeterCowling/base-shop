// Mock i18n to avoid dynamic import issues (Jest hoists this above imports)
import { sendDueCampaigns } from "../scheduler";

import {
  listEvents,
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

describe("sendDueCampaigns – filterUnsubscribed", () => {
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
});

